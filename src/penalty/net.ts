/*
 * The connection between two players' browsers. Everything travels as each
 * player's "presence": one small object describing their current state
 * (absolute values, never deltas), which the other side reads.
 *
 * A game joins every way of meeting that is available, all at once, and
 * merges what it hears, so two players find each other even when one route
 * is blocked or they ended up on different routes:
 *  - the claude.ai artifact `room` capability, when the page runs as an artifact;
 *  - direct peer-to-peer (WebRTC via Trystero), found through two independent
 *    public signalling networks: Nostr relays and WebTorrent trackers;
 *  - the same Nostr relays carrying the game messages themselves, and public
 *    MQTT brokers doing the same, for networks (school Wi-Fi, mobile data)
 *    where a direct browser-to-browser link fails;
 *  - BroadcastChannel, for two windows on the same device.
 * Each player tags their presence with a client id and a counter, so the same
 * player heard over two routes counts once, with the newest state winning.
 */

export type Presence = Record<string, unknown>;

export interface NetPeer {
  id: string;
  isMe: boolean;
  presence: Presence;
}

export interface NetRoom {
  readonly code: string;
  /** The routes in use, e.g. ["local", "nostr", "torrent"]. */
  readonly transports: string[];
  setPresence(patch: Presence): void;
  peers(): NetPeer[];
  onPeers(fn: (peers: NetPeer[]) => void): () => void;
  /** How many public signalling servers this browser can reach right now. */
  servers(): { up: number; total: number };
  /** Per route: servers reachable, and whether the other player is heard on it. */
  status(): { name: string; up: number; total: number; heard: boolean }[];
  leave(): void;
}

/** One route: sends our whole presence, reports everyone else's. */
interface Route {
  name: string;
  send(presence: Presence): void;
  others(): Presence[];
  onChange(fn: () => void): void;
  servers?(): { up: number; total: number };
  leave(): void;
}

/* ───────────────────────────── claude.ai room ───────────────────────────── */

interface ClaudePeer {
  peer: string;
  isMe: boolean;
  sameTab: boolean;
  presence: Record<string, unknown>;
}
interface ClaudeNamedRoom {
  presence(patch: Record<string, unknown>): Promise<void>;
  peers(): readonly ClaudePeer[];
  onPeers(fn: (c: { peers: readonly ClaudePeer[] }) => void, onError?: (e: { code: string }) => void): () => void;
  leave(): Promise<void>;
}
interface ClaudeRoom {
  join(name: string): Promise<ClaudeNamedRoom>;
}

let roomPromise: Promise<ClaudeRoom | null> | null = null;

/** The artifact room, or null where it cannot connect (GitHub Pages, signed out). */
function liveRoom(): Promise<ClaudeRoom | null> {
  if (!roomPromise) {
    const c = (window as unknown as { claude?: { use?: (n: string) => Promise<unknown> } }).claude;
    roomPromise = c?.use ? (c.use("room") as Promise<ClaudeRoom | null>).catch(() => null) : Promise.resolve(null);
  }
  return roomPromise;
}

async function claudeRoute(code: string): Promise<Route | null> {
  const room = await Promise.race([liveRoom(), new Promise<null>((r) => setTimeout(() => r(null), 4000))]);
  if (!room) return null;
  const named = await room.join(`pc-${code.toLowerCase()}`);
  let listener = () => {};
  named.onPeers(() => listener());
  return {
    name: "claude",
    send: (p) => void named.presence(p).catch(() => {}),
    others: () => named.peers().filter((p) => !(p.isMe && p.sameTab)).map((p) => p.presence ?? {}),
    onChange: (fn) => (listener = fn),
    leave: () => void named.leave().catch(() => {}),
  };
}

/* ───────────────────────────── Peer to peer ───────────────────────────── */

// Large, well-known Nostr relays (only used to introduce the two browsers)
const NOSTR_RELAYS = [
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.primal.net",
  "wss://relay.nostr.band",
  "wss://nostr.mom",
  "wss://relay.snort.social",
  "wss://offchain.pub",
  "wss://purplerelay.com",
  "wss://nostr.data.haus",
  "wss://nostr-01.yakihonne.com",
];
const TORRENT_TRACKERS = [
  "wss://tracker.webtorrent.dev",
  "wss://tracker.openwebtorrent.com",
  "wss://open.ftorrent.com",
];

type TrysteroRoom = {
  makeAction: <T>(name: string) => {
    send: (data: T, opts?: { target?: string }) => Promise<void>;
    onMessage: ((data: T, ctx: { peerId: string }) => void) | null;
  };
  onPeerJoin: ((id: string) => void) | null;
  onPeerLeave: ((id: string) => void) | null;
  leave: () => Promise<void>;
};
type Join = (config: Record<string, unknown>, roomId: string) => TrysteroRoom;

function trysteroRoute(name: string, join: Join, urls: string[], sockets: () => Record<string, WebSocket>, code: string): Route {
  const room = join({ appId: "onebridge-penalty-club", relayConfig: { urls, redundancy: urls.length } }, `pc-${code.toLowerCase()}`);
  const pres = room.makeAction<string>("pres");
  const others = new Map<string, Presence>();
  let mine: Presence = {};
  let listener = () => {};
  const send = (target?: string) => void pres.send(JSON.stringify(mine), target ? { target } : undefined).catch(() => {});
  pres.onMessage = (text, { peerId }) => {
    let data: unknown;
    try {
      data = JSON.parse(String(text));
    } catch {
      return;
    }
    if (!data || typeof data !== "object" || Array.isArray(data)) return;
    others.set(peerId, data as Presence);
    listener();
  };
  room.onPeerJoin = (peerId) => send(peerId);
  room.onPeerLeave = (peerId) => {
    others.delete(peerId);
    listener();
  };
  return {
    name,
    send(p) {
      mine = p;
      send();
    },
    others: () => [...others.values()],
    onChange: (fn) => (listener = fn),
    servers() {
      const list = Object.entries(sockets() ?? {}).filter(([url]) => urls.includes(url));
      return { up: list.filter(([, s]) => s?.readyState === 1).length, total: urls.length };
    },
    leave: () => void room.leave().catch(() => {}),
  };
}

async function p2pRoutes(code: string): Promise<Route[]> {
  if (typeof RTCPeerConnection === "undefined") return [];
  const out: Route[] = [];
  const [nostr, torrent] = await Promise.allSettled([import("@trystero-p2p/nostr"), import("@trystero-p2p/torrent")]);
  if (nostr.status === "fulfilled") {
    try {
      const m = nostr.value;
      out.push(trysteroRoute("nostr", m.joinRoom as unknown as Join, NOSTR_RELAYS, m.getRelaySockets as unknown as () => Record<string, WebSocket>, code));
    } catch {
      /* unavailable here */
    }
  }
  if (torrent.status === "fulfilled") {
    try {
      const m = torrent.value;
      out.push(trysteroRoute("torrent", m.joinRoom as unknown as Join, TORRENT_TRACKERS, m.getRelaySockets as unknown as () => Record<string, WebSocket>, code));
    } catch {
      /* unavailable here */
    }
  }
  return out;
}

/* ───────────────────────────── Through the relays ───────────────────────────── */

/*
 * Presence sent as short-lived ("ephemeral") Nostr events on a topic made from
 * the game code. Relays pass these on to subscribers without storing them.
 * Slower than a direct link, but it only needs the relays to be reachable.
 */
async function relayRoute(code: string, urls: string[]): Promise<Route> {
  const { schnorr } = await import("@noble/secp256k1");
  const { secretKey, publicKey } = schnorr.keygen();
  const hex = (b: Uint8Array) => [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  const sha = async (text: string) => new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
  const pubkey = hex(publicKey);
  const topic = hex(await sha(`onebridge-penalty-club:${code.toLowerCase()}`)).slice(0, 32);
  const kind = 20000 + (parseInt(topic.slice(0, 6), 16) % 10000);
  const subId = `pc${topic.slice(0, 10)}`;

  const others = new Map<string, { presence: Presence; seen: number }>();
  let listener = () => {};
  let mine: Presence = {};
  const sockets = new Map<string, WebSocket>();
  let closed = false;

  const onEvent = (ev: { pubkey?: string; content?: string; tags?: string[][] }) => {
    if (!ev || ev.pubkey === pubkey || !ev.tags?.some((t) => t[0] === "x" && t[1] === topic)) return;
    let data: unknown;
    try {
      data = JSON.parse(String(ev.content));
    } catch {
      return;
    }
    if (!data || typeof data !== "object" || Array.isArray(data)) return;
    const id = (data as Presence).cid;
    if (typeof id !== "string") return;
    const prev = others.get(id);
    if (prev && Number((data as Presence).seq) < Number(prev.presence.seq)) {
      prev.seen = Date.now();
      return;
    }
    others.set(id, { presence: data as Presence, seen: Date.now() });
    listener();
  };

  const connect = (url: string, delay = 0) => {
    window.setTimeout(() => {
      if (closed) return;
      let ws: WebSocket;
      try {
        ws = new WebSocket(url);
      } catch {
        return;
      }
      sockets.set(url, ws);
      ws.onopen = () => {
        ws.send(JSON.stringify(["REQ", subId, { kinds: [kind], "#x": [topic], since: Math.floor(Date.now() / 1000) - 30 }]));
        void publish();
      };
      ws.onmessage = (m) => {
        try {
          const msg = JSON.parse(String(m.data));
          if (msg[0] === "EVENT" && msg[1] === subId) onEvent(msg[2]);
        } catch {
          /* not for us */
        }
      };
      ws.onclose = () => {
        if (sockets.get(url) === ws) sockets.delete(url);
        if (!closed) connect(url, Math.min(30000, delay * 2 + 3000));
      };
      ws.onerror = () => ws.close();
    }, delay);
  };
  urls.forEach((u) => connect(u));

  // Send at most a few times a second, always the latest state
  let lastSent = 0;
  let queued = 0;
  const publish = async () => {
    const created_at = Math.floor(Date.now() / 1000);
    const tags = [["x", topic]];
    const content = JSON.stringify(mine);
    const id = await sha(JSON.stringify([0, pubkey, created_at, kind, tags, content]));
    const sig = await schnorr.signAsync(id, secretKey);
    const msg = JSON.stringify(["EVENT", { id: hex(id), pubkey, created_at, kind, tags, content, sig: hex(sig) }]);
    for (const ws of sockets.values()) if (ws.readyState === 1) ws.send(msg);
    lastSent = Date.now();
  };
  const schedule = () => {
    if (queued) return;
    const wait = Math.max(0, 250 - (Date.now() - lastSent));
    queued = window.setTimeout(() => {
      queued = 0;
      void publish();
    }, wait);
  };
  // Heartbeat, and forget players who went quiet
  const beat = window.setInterval(() => {
    schedule();
    const now = Date.now();
    let changed = false;
    for (const [id, o] of others)
      if (now - o.seen > 12000) {
        others.delete(id);
        changed = true;
      }
    if (changed) listener();
  }, 3000);

  return {
    name: "relay",
    send(p) {
      mine = p;
      schedule();
    },
    others: () => [...others.values()].map((o) => o.presence),
    onChange: (fn) => (listener = fn),
    servers: () => ({ up: [...sockets.values()].filter((w) => w.readyState === 1).length, total: urls.length }),
    leave() {
      closed = true;
      window.clearInterval(beat);
      window.clearTimeout(queued);
      for (const ws of sockets.values()) {
        try {
          ws.send(JSON.stringify(["CLOSE", subId]));
        } catch {
          /* already closed */
        }
        ws.close();
      }
    },
  };
}

/* ───────────────────────────── MQTT brokers ───────────────────────────── */

const MQTT_BROKERS = ["wss://broker.emqx.io:8084/mqtt", "wss://broker.hivemq.com:8884/mqtt", "wss://test.mosquitto.org:8081/mqtt", "wss://broker-cn.emqx.io:8084/mqtt"];

/*
 * A minimal MQTT 3.1.1 client over WebSocket (connect, subscribe, publish at
 * QoS 0, keep-alive): enough to pass presence through public brokers.
 */
const enc = new TextEncoder();
const dec = new TextDecoder();
function mqttLen(n: number) {
  const out: number[] = [];
  do {
    let b = n % 128;
    n = Math.floor(n / 128);
    if (n > 0) b |= 128;
    out.push(b);
  } while (n > 0);
  return out;
}
const mqttStr = (s: string) => {
  const b = enc.encode(s);
  return [b.length >> 8, b.length & 255, ...b];
};
const mqttPacket = (type: number, body: number[]) => new Uint8Array([type, ...mqttLen(body.length), ...body]);

function mqttRoute(code: string, urls: string[]): Route {
  const topic = `onebridge-penalty-club/v1/${code.toLowerCase()}`;
  const clientId = `pc${Math.random().toString(36).slice(2, 12)}`;
  const others = new Map<string, { presence: Presence; seen: number }>();
  let listener = () => {};
  let mine: Presence = {};
  const sockets = new Map<string, WebSocket>();
  const ready = new Set<WebSocket>();
  let closed = false;

  const onPublish = (payload: Uint8Array) => {
    let data: unknown;
    try {
      data = JSON.parse(dec.decode(payload));
    } catch {
      return;
    }
    if (!data || typeof data !== "object" || Array.isArray(data)) return;
    const id = (data as Presence).cid;
    if (typeof id !== "string" || id === mine.cid) return;
    const prev = others.get(id);
    if (prev && Number((data as Presence).seq) < Number(prev.presence.seq)) {
      prev.seen = Date.now();
      return;
    }
    others.set(id, { presence: data as Presence, seen: Date.now() });
    listener();
  };

  const publishTo = (ws: WebSocket) => {
    const body = [...mqttStr(topic), ...enc.encode(JSON.stringify(mine))];
    ws.send(mqttPacket(0x30, body));
  };

  const connect = (url: string, delay = 0) => {
    window.setTimeout(() => {
      if (closed) return;
      let ws: WebSocket;
      try {
        ws = new WebSocket(url, "mqtt");
      } catch {
        return;
      }
      ws.binaryType = "arraybuffer";
      sockets.set(url, ws);
      let ping = 0;
      let buf = new Uint8Array(0);
      ws.onopen = () => {
        // CONNECT: protocol "MQTT" level 4, clean session, 60 s keep-alive
        ws.send(mqttPacket(0x10, [...mqttStr("MQTT"), 4, 0x02, 0, 60, ...mqttStr(clientId)]));
        ping = window.setInterval(() => ws.readyState === 1 && ws.send(new Uint8Array([0xc0, 0])), 30000);
      };
      ws.onmessage = (m) => {
        const chunk = new Uint8Array(m.data as ArrayBuffer);
        const all = new Uint8Array(buf.length + chunk.length);
        all.set(buf);
        all.set(chunk, buf.length);
        let i = 0;
        // Split the stream into packets
        for (;;) {
          if (all.length - i < 2) break;
          let len = 0;
          let mul = 1;
          let j = i + 1;
          let byte: number;
          do {
            if (j >= all.length) break;
            byte = all[j++];
            len += (byte & 127) * mul;
            mul *= 128;
          } while (byte & 128);
          if (j + len > all.length || (all[j - 1] & 128)) break;
          const type = all[i] >> 4;
          const body = all.subarray(j, j + len);
          if (type === 2) {
            // CONNACK: subscribe, then say hello
            if (body[1] === 0) {
              ws.send(mqttPacket(0x82, [0, 1, ...mqttStr(topic), 0]));
              ready.add(ws);
              publishTo(ws);
            }
          } else if (type === 3) {
            const tl = (body[0] << 8) | body[1];
            const qos = (all[i] >> 1) & 3;
            onPublish(body.subarray(2 + tl + (qos ? 2 : 0)));
          }
          i = j + len;
        }
        buf = all.slice(i);
      };
      ws.onclose = () => {
        window.clearInterval(ping);
        ready.delete(ws);
        if (sockets.get(url) === ws) sockets.delete(url);
        if (!closed) connect(url, Math.min(30000, delay * 2 + 3000));
      };
      ws.onerror = () => ws.close();
    }, delay);
  };
  urls.forEach((u) => connect(u));

  // At most a few sends a second, always the latest state
  let lastSent = 0;
  let queued = 0;
  const flush = () => {
    for (const ws of ready) if (ws.readyState === 1) publishTo(ws);
    lastSent = Date.now();
  };
  const schedule = () => {
    if (queued) return;
    queued = window.setTimeout(() => {
      queued = 0;
      flush();
    }, Math.max(0, 150 - (Date.now() - lastSent)));
  };
  const beat = window.setInterval(() => {
    schedule();
    const now = Date.now();
    let changed = false;
    for (const [id, o] of others)
      if (now - o.seen > 12000) {
        others.delete(id);
        changed = true;
      }
    if (changed) listener();
  }, 3000);

  return {
    name: "mqtt",
    send(p) {
      mine = p;
      schedule();
    },
    others: () => [...others.values()].map((o) => o.presence),
    onChange: (fn) => (listener = fn),
    servers: () => ({ up: ready.size, total: urls.length }),
    leave() {
      closed = true;
      window.clearInterval(beat);
      window.clearTimeout(queued);
      for (const ws of sockets.values()) {
        try {
          ws.send(new Uint8Array([0xe0, 0]));
        } catch {
          /* already closed */
        }
        ws.close();
      }
    },
  };
}

/* ───────────────────────────── Same device ───────────────────────────── */

function localRoute(code: string): Route {
  const ch = new BroadcastChannel(`onebridge-pc-${code.toLowerCase()}`);
  const me = Math.random().toString(36).slice(2, 10);
  let mine: Presence = {};
  const others = new Map<string, { presence: Presence; seen: number }>();
  let listener = () => {};
  const send = () => ch.postMessage({ id: me, presence: mine });
  ch.onmessage = (e) => {
    const { id, presence, bye } = e.data ?? {};
    if (!id || id === me) return;
    if (bye) others.delete(id);
    else {
      const isNew = !others.has(id);
      others.set(id, { presence, seen: Date.now() });
      if (isNew) send(); // let a newcomer see us at once
    }
    listener();
  };
  // Heartbeat, and drop peers that went quiet
  const beat = window.setInterval(() => {
    send();
    const now = Date.now();
    let changed = false;
    for (const [id, o] of others)
      if (now - o.seen > 4000) {
        others.delete(id);
        changed = true;
      }
    if (changed) listener();
  }, 1000);
  const bye = () => ch.postMessage({ id: me, bye: true });
  window.addEventListener("pagehide", bye);
  return {
    name: "local",
    send(p) {
      mine = p;
      send();
    },
    others: () => [...others.values()].map((o) => o.presence),
    onChange: (fn) => (listener = fn),
    leave() {
      bye();
      window.clearInterval(beat);
      window.removeEventListener("pagehide", bye);
      ch.close();
    },
  };
}

/* ───────────────────────────── All together ───────────────────────────── */

/**
 * Join a game by code on every available route. `localOnly` (the `?local`
 * test switch) uses just the same-device channel.
 */
export async function joinRoom(code: string, localOnly = false): Promise<NetRoom> {
  const routes: Route[] = [localRoute(code)];
  if (!localOnly) {
    const params = new URLSearchParams(location.search);
    const testRelay = params.get("relay");
    const testBroker = params.get("broker");
    const [claude, p2p, relay] = await Promise.all([
      claudeRoute(code).catch(() => null),
      testRelay ? Promise.resolve([] as Route[]) : p2pRoutes(code).catch(() => [] as Route[]),
      relayRoute(code, testRelay ? [testRelay] : NOSTR_RELAYS).catch(() => null),
    ]);
    if (claude) routes.push(claude);
    routes.push(...p2p);
    if (relay) routes.push(relay);
    try {
      routes.push(mqttRoute(code, testBroker ? [testBroker] : MQTT_BROKERS));
    } catch {
      /* unavailable here */
    }
  }
  // ?only=mqtt (or relay, nostr, torrent, comma-separated) keeps just those routes, for testing
  const only = new URLSearchParams(location.search).get("only");
  if (only) {
    const keep = only.split(",");
    for (const r of routes.filter((x) => !keep.includes(x.name))) r.leave();
    routes.splice(0, routes.length, ...routes.filter((x) => keep.includes(x.name)));
  }
  const cid = Math.random().toString(36).slice(2, 12);
  let seq = 0;
  let mine: Presence = { cid, seq };
  const listeners = new Set<(p: NetPeer[]) => void>();

  /** Everyone heard on any route, once each, newest state winning. */
  const list = (): NetPeer[] => {
    const best = new Map<string, Presence>();
    for (const r of routes)
      for (const p of r.others()) {
        const id = typeof p?.cid === "string" ? p.cid : null;
        if (!id || id === cid) continue;
        const prev = best.get(id);
        if (!prev || Number(p.seq) >= Number(prev.seq)) best.set(id, p);
      }
    return [{ id: cid, isMe: true, presence: mine }, ...[...best].map(([id, presence]) => ({ id, isMe: false, presence }))];
  };
  const notify = () => {
    const l = list();
    listeners.forEach((fn) => fn(l));
  };
  for (const r of routes) r.onChange(notify);
  const sendAll = () => routes.forEach((r) => r.send(mine));
  // Resend now and then, in case a message was lost on the way
  const beat = window.setInterval(sendAll, 2500);

  return {
    code,
    transports: routes.map((r) => r.name),
    setPresence(patch) {
      const next: Presence = { ...mine, ...patch, cid, seq: ++seq };
      for (const k of Object.keys(patch)) if (patch[k] === null) delete next[k];
      mine = next;
      sendAll();
      notify();
    },
    peers: list,
    onPeers(fn) {
      listeners.add(fn);
      queueMicrotask(() => fn(list()));
      return () => listeners.delete(fn);
    },
    servers() {
      let up = 0;
      let total = 0;
      const hasRelay = routes.some((r) => r.name === "relay");
      for (const r of routes) {
        // The relay route and Trystero's Nostr route use the same servers: count them once
        if (hasRelay && r.name === "nostr") continue;
        const s = r.servers?.();
        if (s) {
          up += s.up;
          total += s.total;
        }
      }
      return { up, total };
    },
    status() {
      return routes.map((r) => {
        const s = r.servers?.() ?? { up: 0, total: 0 };
        return { name: r.name, ...s, heard: r.others().some((p) => typeof p?.cid === "string" && p.cid !== cid) };
      });
    },
    leave() {
      window.clearInterval(beat);
      listeners.clear();
      routes.forEach((r) => r.leave());
    },
  };
}

/** A short, easy-to-say game code. */
export function newCode() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 4; i++) s += letters[Math.floor(Math.random() * letters.length)];
  return s;
}
