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
  "wss://relay.nostr.bg",
  "wss://purplerelay.com",
  "wss://nostr.data.haus",
  "wss://relay.mostr.pub",
  "wss://nostr-01.yakihonne.com",
];
const TORRENT_TRACKERS = [
  "wss://tracker.webtorrent.dev",
  "wss://tracker.openwebtorrent.com",
  "wss://tracker.btorrent.xyz",
  "wss://open.ftorrent.com",
  "wss://tracker.files.fm:7073/announce",
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
    const [claude, p2p] = await Promise.all([claudeRoute(code).catch(() => null), p2pRoutes(code).catch(() => [] as Route[])]);
    if (claude) routes.push(claude);
    routes.push(...p2p);
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
      for (const r of routes) {
        const s = r.servers?.();
        if (s) {
          up += s.up;
          total += s.total;
        }
      }
      return { up, total };
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
