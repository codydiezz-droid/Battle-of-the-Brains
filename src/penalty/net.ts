/*
 * The connection between two players' browsers. Everything travels as each
 * player's "presence": one small object describing their current state
 * (absolute values, never deltas), which the other side reads.
 *
 * Three transports, tried in order:
 *  - the claude.ai artifact `room` capability, when the page runs as an artifact;
 *  - direct peer-to-peer (WebRTC, via Trystero with public Nostr relays for the
 *    handshake), so the game works anywhere it is hosted, independent of Claude;
 *  - BroadcastChannel, for two windows on the same device (testing, `?local`).
 */

export type Presence = Record<string, unknown>;

export interface NetPeer {
  id: string;
  isMe: boolean;
  presence: Presence;
}

export interface NetRoom {
  readonly code: string;
  readonly transport: "live" | "p2p" | "local";
  setPresence(patch: Presence): void;
  peers(): NetPeer[];
  onPeers(fn: (peers: NetPeer[]) => void): () => void;
  leave(): void;
}

/* ───────────────────────────── claude.ai room ───────────────────────────── */

interface ClaudeNamedRoom {
  presence(patch: Record<string, unknown>): Promise<void>;
  peers(): readonly { peer: string; isMe: boolean; sameTab: boolean; presence: Record<string, unknown> }[];
  onPeers(fn: (c: { peers: readonly { peer: string; isMe: boolean; sameTab: boolean; presence: Record<string, unknown> }[] }) => void, onError?: (e: { code: string }) => void): () => void;
  leave(): Promise<void>;
}
interface ClaudeRoom {
  join(name: string): Promise<ClaudeNamedRoom>;
}

let roomPromise: Promise<ClaudeRoom | null> | null = null;

/** The artifact room, or null where it cannot connect (GitHub Pages, signed out). */
export function liveRoom(): Promise<ClaudeRoom | null> {
  if (!roomPromise) {
    const c = (window as unknown as { claude?: { use?: (n: string) => Promise<unknown> } }).claude;
    roomPromise = c?.use ? (c.use("room") as Promise<ClaudeRoom | null>).catch(() => null) : Promise.resolve(null);
  }
  return roomPromise;
}

async function joinLive(code: string): Promise<NetRoom | null> {
  const room = await liveRoom();
  if (!room) return null;
  const named = await room.join(`pc-${code.toLowerCase()}`);
  const map = (list: ReturnType<ClaudeNamedRoom["peers"]>): NetPeer[] =>
    list.filter((p) => !p.isMe || p.sameTab).map((p) => ({ id: p.peer, isMe: p.isMe && p.sameTab, presence: p.presence ?? {} }));
  return {
    code,
    transport: "live",
    setPresence: (patch) => void named.presence(patch).catch(() => {}),
    peers: () => map(named.peers()),
    onPeers: (fn) => named.onPeers((c) => fn(map(c.peers))),
    leave: () => void named.leave().catch(() => {}),
  };
}

/* ───────────────────────────── Peer to peer ───────────────────────────── */

async function joinP2P(code: string): Promise<NetRoom> {
  const { joinRoom: joinTrystero, selfId } = await import("trystero");
  const room = joinTrystero({ appId: "onebridge-penalty-club" }, `pc-${code.toLowerCase()}`);
  // Presence travels as JSON text
  const pres = room.makeAction<string>("pres");
  let mine: Presence = {};
  const others = new Map<string, Presence>();
  const listeners = new Set<(p: NetPeer[]) => void>();
  const list = (): NetPeer[] => [
    { id: selfId, isMe: true, presence: mine },
    ...[...others].map(([id, presence]) => ({ id, isMe: false, presence })),
  ];
  const notify = () => listeners.forEach((fn) => fn(list()));
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
    notify();
  };
  room.onPeerJoin = (peerId) => send(peerId);
  room.onPeerLeave = (peerId) => {
    others.delete(peerId);
    notify();
  };
  // Resend now and then, in case a message was lost
  const beat = window.setInterval(() => send(), 2500);
  return {
    code,
    transport: "p2p",
    setPresence(patch) {
      mine = { ...mine, ...patch };
      for (const k of Object.keys(patch)) if (patch[k] === null) delete mine[k];
      send();
      notify();
    },
    peers: list,
    onPeers(fn) {
      listeners.add(fn);
      queueMicrotask(() => fn(list()));
      return () => listeners.delete(fn);
    },
    leave() {
      window.clearInterval(beat);
      listeners.clear();
      void room.leave().catch(() => {});
    },
  };
}

/* ───────────────────────────── Same device ───────────────────────────── */

function joinLocal(code: string): NetRoom {
  const ch = new BroadcastChannel(`onebridge-pc-${code}`);
  const me = Math.random().toString(36).slice(2, 10);
  let mine: Presence = {};
  const others = new Map<string, { presence: Presence; seen: number }>();
  const listeners = new Set<(p: NetPeer[]) => void>();
  const list = (): NetPeer[] => [
    { id: me, isMe: true, presence: mine },
    ...[...others].map(([id, o]) => ({ id, isMe: false, presence: o.presence })),
  ];
  const notify = () => listeners.forEach((fn) => fn(list()));
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
    notify();
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
    if (changed) notify();
  }, 1000);
  window.addEventListener("pagehide", () => ch.postMessage({ id: me, bye: true }));
  return {
    code,
    transport: "local",
    setPresence(patch) {
      mine = { ...mine, ...patch };
      for (const k of Object.keys(patch)) if (patch[k] === null) delete mine[k];
      send();
      notify();
    },
    peers: list,
    onPeers(fn) {
      listeners.add(fn);
      queueMicrotask(() => fn(list()));
      return () => listeners.delete(fn);
    },
    leave() {
      ch.postMessage({ id: me, bye: true });
      window.clearInterval(beat);
      ch.close();
      listeners.clear();
    },
  };
}

/** Join a game by code: the artifact room if available, else peer to peer, else same-device. */
export async function joinRoom(code: string, preferLocal = false): Promise<NetRoom> {
  if (!preferLocal) {
    try {
      const live = await joinLive(code);
      if (live) return live;
    } catch {
      /* try peer to peer */
    }
    if (typeof RTCPeerConnection !== "undefined") {
      try {
        return await joinP2P(code);
      } catch {
        /* fall back to same-device */
      }
    }
  }
  return joinLocal(code);
}

/** A short, easy-to-say game code. */
export function newCode() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 4; i++) s += letters[Math.floor(Math.random() * letters.length)];
  return s;
}
