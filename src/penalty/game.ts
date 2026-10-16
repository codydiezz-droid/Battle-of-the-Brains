import {
  CanvasTexture,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Plane,
  Raycaster,
  RingGeometry,
  SphereGeometry,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
  DoubleSide,
} from "three";
import { DIFF, KeeperBrain, ShooterBrain, gauss, keeperDiveTime, keeperMaxLat, type Difficulty, type ShotPlan } from "./ai";
import { RUNUP, keeperPose, newKeeper, newShooter, shooterPose, type KeeperState, type ShooterState } from "./anim";
import * as sfx from "./audio";
import { Avatar, type Pose } from "./avatar";
import { CELEBRATION_SECONDS, celebrationPose, loserPose } from "./celebrations";
import { BALL_R, STEP, newBall, solveShot, stepBall, type Ball, type BallEvent, type Sphere } from "./physics";
import type { Player } from "./players";
import { GOAL_H, GOAL_HALF, SPOT_Z, buildStadium } from "./stadium";

export type Role = "shoot" | "keep";
export type Outcome = "goal" | "save" | "post" | "bar" | "wide" | "over";

/** A strike, fully decided at release, so it can be sent to the other player. */
export interface Shot {
  tx: number;
  ty: number;
  speed: number;
  spin: number;
  power: number;
  perfect: boolean;
  /** Which way the striker's hips open: usually honest, sometimes a disguise. */
  cue: number;
}

/** A keeper's dive as sent online: its start is relative to the moment of the kick. */
export interface SentDive {
  rel: number;
  fromX: number;
  tx: number;
  ty: number;
  dur: number;
  maxLat: number;
}

export interface SentResult {
  outcome: Outcome;
  x: number;
  y: number;
  speed: number;
}

export interface KickResult {
  role: Role;
  outcome: Outcome;
  /** True when the result is good for the human player. */
  good: boolean;
  label: string;
  perfect: boolean;
  shotX: number;
  speed: number;
}

type Phase = "idle" | "aim" | "ready" | "runup" | "flight" | "result" | "replay" | "celebrate";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));


interface Frame {
  t: number;
  ball: [number, number, number, number];
  shooter: Pose;
  keeper: Pose;
}

export class Engine {
  readonly renderer: WebGLRenderer;
  private camera = new PerspectiveCamera(42, 1, 0.1, 400);
  private stadium = buildStadium();
  private raycaster = new Raycaster();
  private goalPlane = new Plane(new Vector3(0, 0, 1), 0);
  private ballMesh: Mesh;
  private reticle: Mesh;
  private diveMarker: Mesh;
  private timingRing: Mesh;

  // Cast
  private shooterAv: Avatar | null = null;
  private keeperAv: Avatar | null = null;
  private shooter: ShooterState = newShooter();
  private keeper: KeeperState = newKeeper();
  private ball: Ball = newBall();
  private keeperBrain: KeeperBrain;
  private shooterBrain: ShooterBrain;
  private plan: ShotPlan | null = null;

  // Clock
  private simT = 0;
  private lastReal = performance.now() / 1000;
  private acc = 0;
  private timeScale = 1;
  private slowUntil = 0;
  paused = false;

  // Kick state
  role: Role = "shoot";
  phase: Phase = "idle";
  private phaseT = 0;
  difficulty: Difficulty = "medium";
  aim = { x: 0, y: 1.2 };
  power = 0;
  charging = false;
  private chargeT = 0;
  curve = 0;
  private released: { power: number; aim: { x: number; y: number }; curve: number; perfect: boolean } | null = null;
  /** Online play: the other player controls the other end. */
  online = false;
  /** Online: set while the other player is not yet ready for this kick. */
  holdShot = false;
  private pendingShot: Shot | null = null;
  private remoteResult: SentResult | null = null;
  private waitingRemote = -1;
  private contactT = -1;
  private diveTarget = { x: 0, y: 0.6 };
  private result: KickResult | null = null;
  private resultT = 0;
  private events: BallEvent[] = [];
  private spheres: Sphere[] = [];
  private lastEventT = 0;
  private cheer = 0;
  private shake = 0;
  private record: Frame[] = [];
  private replayStart = 0;
  private replayFrom = 0;
  private replayed = false;

  // Input
  private keys = new Set<string>();
  private mouse = new Vector2(0, 0);
  private mouseActive = false;
  private moved = { aim: false, shuffle: false, dir: false };

  // Callbacks
  onResult: (r: KickResult) => void = () => {};
  onHint: (text: string) => void = () => {};
  onPhase: (phase: Phase) => void = () => {};
  /** Lets the tutorial know what the player has done. */
  onAction: (a: "aim" | "charge" | "release" | "curve" | "shuffle" | "direction" | "dive") => void = () => {};

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.outputColorSpace = SRGBColorSpace;
    const scene = this.stadium.scene;

    // Ball with a classic panel pattern
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 128;
    const g = c.getContext("2d")!;
    g.fillStyle = "#f4f6fa";
    g.fillRect(0, 0, 256, 128);
    g.fillStyle = "#091d3f";
    for (let i = 0; i < 10; i++) {
      const x = (i % 5) * 52 + (i < 5 ? 0 : 26) + 13;
      const y = i < 5 ? 38 : 90;
      g.beginPath();
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
        g.lineTo(x + Math.cos(a) * 13, y + Math.sin(a) * 11);
      }
      g.fill();
    }
    g.fillStyle = "#f68835";
    g.fillRect(0, 62, 256, 4);
    const ballTex = new CanvasTexture(c);
    ballTex.colorSpace = SRGBColorSpace;
    this.ballMesh = new Mesh(new SphereGeometry(BALL_R, 24, 16), new MeshLambertMaterial({ map: ballTex }));
    this.ballMesh.castShadow = true;
    scene.add(this.ballMesh);

    const ringMat = (color: string, opacity = 0.95) =>
      new MeshBasicMaterial({ color, transparent: true, opacity, side: DoubleSide, depthWrite: false });
    this.reticle = new Mesh(new RingGeometry(0.17, 0.24, 32), ringMat("#ffffff"));
    scene.add(this.reticle);
    this.diveMarker = new Mesh(new RingGeometry(0.2, 0.28, 32), ringMat("#8fb8ff"));
    scene.add(this.diveMarker);
    this.timingRing = new Mesh(new RingGeometry(0.9, 1.0, 40), ringMat("#ffb81c", 0.8));
    this.timingRing.rotation.x = -Math.PI / 2;
    scene.add(this.timingRing);

    this.keeperBrain = new KeeperBrain(DIFF.medium, { power: 3, accuracy: 3, reflex: 3, reach: 3 });
    this.shooterBrain = new ShooterBrain(DIFF.medium, { power: 3, accuracy: 3, reflex: 3, reach: 3 });

    this.bindInput();
    window.addEventListener("resize", () => this.resize());
    this.resize();
    requestAnimationFrame(() => this.loop());
  }

  /* ───────────────────────────── Setup ───────────────────────────── */

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // Narrow (portrait) screens need a wider lens to fit the goal.
    this.baseFov = w / h < 0.8 ? 62 : w / h < 1.2 ? 52 : 42;
    this.camera.fov = this.baseFov;
    this.camera.updateProjectionMatrix();
  }

  /** Put the two players for the next kick on the pitch. */
  setCast(shooter: Player, keeper: Player) {
    const scene = this.stadium.scene;
    if (this.shooterAv?.player.id !== shooter.id || !this.shooterAv) {
      if (this.shooterAv) scene.remove(this.shooterAv.root);
      this.shooterAv = new Avatar(shooter, false);
      scene.add(this.shooterAv.root);
    }
    if (this.keeperAv?.player.id !== keeper.id || !this.keeperAv) {
      if (this.keeperAv) scene.remove(this.keeperAv.root);
      this.keeperAv = new Avatar(keeper, true);
      scene.add(this.keeperAv.root);
    }
  }

  setDifficulty(d: Difficulty) {
    this.difficulty = d;
  }

  private get diff() {
    return DIFF[this.difficulty];
  }

  /** Forget the keeper AI's memory of the player's shots (new match). */
  resetMemory() {
    this.keeperBrain.history = [];
  }

  /* ───────────────────────────── Kicks ───────────────────────────── */

  startKick(role: Role, online = false) {
    if (!this.shooterAv || !this.keeperAv) return;
    this.endCelebration(false);
    this.role = role;
    this.online = online;
    this.pendingShot = null;
    this.remoteResult = null;
    this.waitingRemote = -1;
    this.ball = newBall();
    this.shooter = newShooter();
    this.keeper = newKeeper();
    this.result = null;
    this.released = null;
    this.contactT = -1;
    this.power = 0;
    this.charging = false;
    this.curve = 0;
    this.record = [];
    this.replayed = false;
    this.events = [];
    this.timeScale = 1;
    this.aim = { x: 0, y: 1.2 };
    this.diveTarget = { x: 0, y: 0.6 };
    this.keeperBrain.setDiff(this.diff, this.keeperAv.player.stats);
    this.shooterBrain.setDiff(this.diff, this.shooterAv.player.stats);
    sfx.whistle();
    if (role === "shoot") {
      const { lean } = this.keeperBrain.plan();
      this.keeper.x = online ? 0 : lean;
      this.setPhase("aim");
      this.onHint("Aim with the mouse or arrow keys. Hold Space (or press and hold) to charge, release to shoot.");
    } else if (online) {
      this.plan = null;
      this.setPhase("ready");
      this.onHint("Waiting for the striker. A / D to step across while you wait.");
    } else {
      this.plan = this.shooterBrain.plan();
      this.shooter.cue = this.plan.cue;
      this.setPhase("ready");
      this.onHint("A / D to step across. Arrows or the mouse pick the dive, Space or click to dive. Watch the striker’s hips.");
    }
  }

  private setPhase(p: Phase) {
    this.phase = p;
    this.phaseT = this.simT;
    this.onPhase(p);
  }

  /** Begin charging the shot (Space or pointer down). */
  private startCharge() {
    if (this.role !== "shoot" || this.phase !== "aim" || this.charging) return;
    // Online: wait until the other player is in goal for this kick
    if (this.holdShot) return;
    this.charging = true;
    this.chargeT = this.simT;
    this.onAction("charge");
  }

  /** Release: lock in the strike and start the run-up. */
  private release() {
    if (!this.charging || this.phase !== "aim") return;
    this.charging = false;
    const p = this.power;
    const [lo, hi] = this.diff.sweet;
    const perfect = p >= lo && p <= hi;
    this.released = { power: p, aim: { ...this.aim }, curve: this.curve, perfect };
    this.shooter.runStart = this.simT;
    this.shooter.cue = 0;
    if (this.online) {
      // Decide the strike now and send it, so both screens play the same kick
      const shot = this.computeShot();
      const honest = Math.sign(shot.tx) || 1;
      shot.cue = Math.random() < 0.7 ? honest : -honest;
      this.pendingShot = shot;
      this.shooter.cue = shot.cue;
      this.onLocalShot(shot);
    }
    this.setPhase("runup");
    this.onAction("release");
    this.onHint("");
  }

  /** The player's strike, computed at the moment of contact from what they did. */
  private playerStrike() {
    const s = this.computeShot();
    this.launch(s.tx, s.ty, s.speed, s.spin, s.power);
  }

  private computeShot(): Shot {
    const r = this.released!;
    const stats = this.shooterAv!.player.stats;
    const d = this.diff;
    let sigma = d.shootErr * (1.25 - stats.accuracy * 0.08);
    if (r.perfect) sigma *= 0.65;
    if (r.power > d.overStart) sigma += (r.power - d.overStart) * 0.24;
    sigma += Math.abs(r.curve) * 0.004;
    const dist = 11;
    let tx = r.aim.x + gauss() * sigma * dist;
    let ty = r.aim.y + gauss() * sigma * dist * 0.7;
    // Leaning back on a full-power strike sends it high
    if (r.power > d.overStart) ty += (r.power - d.overStart) * 7.5 * (0.6 + Math.random() * 0.6);
    // A scuffed, weak strike stays low
    if (r.power < 0.3) ty = Math.min(ty, 0.5);
    ty = Math.max(BALL_R, ty);
    tx = clamp(tx, -9, 9);
    const speed = 13 + r.power * 17 + (stats.power - 3) * 0.6;
    return { tx, ty, speed, spin: r.curve, power: r.power, perfect: r.perfect, cue: 0 };
  }

  /* ───────────────────────────── Online ───────────────────────────── */

  onLocalShot: (shot: Shot) => void = () => {};
  onLocalDive: (dive: SentDive) => void = () => {};
  onLocalKeeperX: (x: number) => void = () => {};
  onLocalResult: (r: SentResult) => void = () => {};

  /** The other player struck the ball: start the run-up here. */
  remoteShot(shot: Shot) {
    if (!this.online || this.role !== "keep" || this.phase !== "ready") return;
    this.pendingShot = shot;
    this.shooter.cue = shot.cue;
    this.shooter.runStart = this.simT;
    this.setPhase("runup");
    this.onHint("Here it comes. Read the hips, dive with the strike.");
  }

  /** The other player's keeper dived. */
  remoteDive(d: SentDive) {
    if (!this.online || this.role !== "shoot" || this.shooter.runStart === null) return;
    this.keeper.dive = { start: this.shooter.runStart + RUNUP + d.rel, fromX: d.fromX, tx: d.tx, ty: d.ty, dur: d.dur, maxLat: d.maxLat };
    this.keeper.x = d.fromX;
  }

  remoteKeeperX(x: number) {
    if (!this.online || this.role !== "shoot" || this.keeper.dive) return;
    this.keeper.moving = Math.abs(x - this.keeper.x) > 0.01 ? Math.sign(x - this.keeper.x) : 0;
    this.keeper.x = x;
  }

  /** The keeper's screen decides saves; the striker's screen shows that result. */
  remoteResultIn(r: SentResult) {
    if (this.online && this.role === "shoot") this.remoteResult = r;
  }

  private sendDive() {
    const d = this.keeper.dive;
    if (!this.online || !d || this.shooter.runStart === null) return;
    this.onLocalDive({ rel: d.start - (this.shooter.runStart + RUNUP), fromX: d.fromX, tx: d.tx, ty: d.ty, dur: d.dur, maxLat: d.maxLat });
  }

  private aiStrike() {
    const k = this.keeper;
    const divedEarly = !!k.dive && k.dive.start < this.simT - 0.12;
    const diveDir = k.dive ? Math.sign(k.dive.tx - k.dive.fromX) : 0;
    const shot = this.shooterBrain.finalise(this.plan!, { x: k.x, divedEarly, diveDir });
    this.launch(shot.tx, shot.ty, shot.speed, shot.spin, (shot.speed - 15) / 15);
  }

  private launch(tx: number, ty: number, speed: number, spin: number, power: number) {
    const from = this.ball.p.clone();
    this.ball.v.copy(solveShot(from, tx, ty, speed, spin));
    this.ball.spin = spin;
    this.ball.active = true;
    this.kickSpeed = this.ball.v.length();
    this.contactT = this.simT;
    sfx.kick(clamp(power, 0, 1));
    if (this.role === "shoot") this.keeperBrain.onKick(this.simT);
    this.setPhase("flight");
  }

  /** Player goalkeeper: commit to a dive toward the chosen point. */
  private playerDive() {
    if (this.role !== "keep" || this.keeper.dive) return;
    if (this.phase !== "ready" && this.phase !== "runup" && this.phase !== "flight") return;
    // Online, there is nothing to dive at until the striker has struck
    if (this.online && this.phase === "ready") return;
    const stats = this.keeperAv!.player.stats;
    const t = this.diveTarget;
    this.keeper.dive = {
      start: this.simT,
      fromX: this.keeper.x,
      tx: t.x,
      ty: t.y,
      // The human keeper dives a little quicker and further than the AI, so saves are reachable
      dur: keeperDiveTime(0.41, stats),
      maxLat: keeperMaxLat(stats, 1.15),
    };
    this.keeper.moving = 0;
    this.onAction("dive");
    this.sendDive();
  }

  /* ───────────────────────────── Input ───────────────────────────── */

  private bindInput() {
    const c = this.canvas;
    window.addEventListener("keydown", (e) => {
      if (this.phase === "idle" || this.paused) return;
      const k = e.key.toLowerCase();
      if ([" ", "arrowleft", "arrowright", "arrowup", "arrowdown"].includes(k)) e.preventDefault();
      if (e.repeat && k === " ") return;
      this.keys.add(k);
      if (k === " " || k === "enter") {
        if (this.phase === "result" || this.phase === "replay" || this.phase === "celebrate") this.skip();
        else if (this.role === "shoot") this.startCharge();
        else this.playerDive();
      }
      if (this.role === "shoot" && this.phase === "aim") {
        if (k === "q") this.setCurve(this.curve - 0.25);
        if (k === "e") this.setCurve(this.curve + 0.25);
      }
      if (k.startsWith("arrow")) this.mouseActive = false;
    });
    window.addEventListener("keyup", (e) => {
      const k = e.key.toLowerCase();
      this.keys.delete(k);
      if ((k === " " || k === "enter") && this.role === "shoot" && this.phase === "aim") this.release();
    });
    window.addEventListener("blur", () => {
      this.keys.clear();
      if (this.charging) this.release();
    });
    c.addEventListener("pointermove", (e) => {
      this.setMouse(e);
      this.mouseActive = true;
    });
    c.addEventListener("pointerdown", (e) => {
      if (this.paused) return;
      c.setPointerCapture?.(e.pointerId);
      this.setMouse(e);
      this.mouseActive = true;
      if (this.phase === "result" || this.phase === "replay" || this.phase === "celebrate") return this.skip();
      if (this.role === "shoot") {
        this.updateAimFromMouse();
        this.startCharge();
      } else {
        this.updateDiveFromMouse();
        this.playerDive();
      }
    });
    c.addEventListener("pointerup", () => {
      if (this.role === "shoot") this.release();
    });
    c.addEventListener("pointercancel", () => {
      if (this.role === "shoot") this.release();
    });
  }

  setCurve(v: number) {
    this.curve = clamp(Math.round(v * 4) / 4, -1, 1);
    this.onAction("curve");
  }

  /** On-screen buttons for touch screens. */
  touchShuffle(dir: number) {
    if (this.role === "keep" && (this.phase === "ready" || this.phase === "runup") && !this.keeper.dive) {
      this.keeper.x = clamp(this.keeper.x + dir * 0.35, -1.4, 1.4);
      this.onAction("shuffle");
      if (this.online) this.onLocalKeeperX(this.keeper.x);
    }
  }

  private setMouse(e: PointerEvent) {
    const r = this.canvas.getBoundingClientRect();
    this.mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  }

  private mouseOnGoal() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hit = new Vector3();
    return this.raycaster.ray.intersectPlane(this.goalPlane, hit) ? hit : null;
  }

  private updateAimFromMouse() {
    const hit = this.mouseOnGoal();
    if (!hit) return;
    const nx = clamp(hit.x, -GOAL_HALF - 1.2, GOAL_HALF + 1.2);
    const ny = clamp(hit.y, 0.12, GOAL_H + 1.2);
    if (Math.hypot(nx - this.aim.x, ny - this.aim.y) > 0.05) {
      this.moved.aim = true;
      this.onAction("aim");
    }
    this.aim.x = nx;
    this.aim.y = ny;
  }

  private updateDiveFromMouse() {
    const hit = this.mouseOnGoal();
    if (!hit) return;
    this.diveTarget.x = clamp(hit.x, -GOAL_HALF - 0.5, GOAL_HALF + 0.5);
    this.diveTarget.y = clamp(hit.y, 0.2, GOAL_H + 0.3);
    this.onAction("direction");
  }

  skip() {
    if (this.phase === "celebrate") {
      if (this.simT - this.phaseT > 1.2) this.endCelebration();
      return;
    }
    if (this.phase === "replay") {
      this.finishReplay();
      return;
    }
    if (this.phase === "result" && this.simT - this.resultT > 0.6) this.finish();
  }

  /* ───────────────────────────── Loop ───────────────────────────── */

  private loop() {
    const now = performance.now() / 1000;
    const dt = Math.min(0.05, now - this.lastReal);
    this.lastReal = now;
    if (!this.paused) {
      if (this.slowUntil && now > this.slowUntil) {
        this.slowUntil = 0;
        this.timeScale = 1;
      }
      this.update(dt * this.timeScale, dt);
    }
    this.render();
    requestAnimationFrame(() => this.loop());
  }

  private update(dt: number, realDt: number) {
    if (this.phase === "replay") return this.updateReplay(realDt);
    if (this.phase === "celebrate") return this.updateCelebration(dt);
    const prevT = this.simT;
    this.simT += dt;
    const t = this.simT;
    const e = t - this.phaseT;
    this.cheer = Math.max(0, this.cheer - realDt * 0.35);

    // Shooting controls
    if (this.role === "shoot" && this.phase === "aim") {
      if (this.mouseActive) this.updateAimFromMouse();
      const ax = (this.keys.has("arrowright") ? 1 : 0) - (this.keys.has("arrowleft") ? 1 : 0);
      const ay = (this.keys.has("arrowup") ? 1 : 0) - (this.keys.has("arrowdown") ? 1 : 0);
      if (ax || ay) {
        this.aim.x = clamp(this.aim.x + ax * 2.6 * realDt, -GOAL_HALF - 1.2, GOAL_HALF + 1.2);
        this.aim.y = clamp(this.aim.y + ay * 2.0 * realDt, 0.12, GOAL_H + 1.2);
        this.onAction("aim");
      }
      if (this.charging) {
        // Rises for 0.85 s, then falls back if held too long
        const c = ((t - this.chargeT) / 0.85) % 2;
        this.power = c < 1 ? c : 2 - c;
      }
      // The keeper sways on the line while the player aims
      this.keeper.x += (this.keeperBrain.gamble * 0.35 + Math.sin(t * 1.3) * 0.15 - this.keeper.x) * Math.min(1, realDt * 2);
    }

    // Goalkeeping controls
    if (this.role === "keep" && (this.phase === "ready" || this.phase === "runup" || this.phase === "flight")) {
      const mv = (this.keys.has("d") ? 1 : 0) - (this.keys.has("a") ? 1 : 0);
      if (mv && !this.keeper.dive && this.contactT < 0) {
        this.keeper.x = clamp(this.keeper.x + mv * 2.4 * dt, -1.4, 1.4);
        this.keeper.moving = mv;
        if (this.online) this.onLocalKeeperX(this.keeper.x);
        this.onAction("shuffle");
      } else this.keeper.moving = 0;
      // Steering lasts a moment into the dive, and at most until just after the kick
      const kd = this.keeper.dive;
      const steering = !!kd && t < Math.min(kd.start + 0.4, Math.max(kd.start + 0.16, (this.contactT > 0 ? this.contactT : Infinity) + 0.3));
      if (!this.keeper.dive || steering) {
        if (this.mouseActive) this.updateDiveFromMouse();
        const l = this.keys.has("arrowleft");
        const r = this.keys.has("arrowright");
        const up = this.keys.has("arrowup");
        if (l || r || up || this.keys.has("arrowdown")) {
          const dir = (r ? 1 : 0) - (l ? 1 : 0);
          this.diveTarget.x = this.keeper.x + dir * 3.1;
          this.diveTarget.y = up ? (dir ? 1.9 : 2.1) : dir ? 0.55 : 0.35;
          this.onAction("direction");
        } else if (!this.mouseActive && !steering) {
          this.diveTarget.x = this.keeper.x;
          this.diveTarget.y = 0.6;
        }
      }
      // Just after committing, the keeper can still adjust height and stretch,
      // but not change sides: read the body for the side, the ball for the rest.
      if (steering && this.keeper.dive) {
        const d = this.keeper.dive;
        const side = Math.sign(d.tx - d.fromX);
        let nx = this.diveTarget.x;
        if (side && Math.sign(nx - d.fromX) !== side) nx = d.fromX + side * 0.8;
        if (d.tx !== nx || d.ty !== this.diveTarget.y) {
          d.tx = nx;
          d.ty = this.diveTarget.y;
          this.sendDive();
        }
      }
    }

    // Phase flow
    if (this.phase === "ready" && e > 0.9 && !this.online) {
      this.shooter.runStart = t;
      this.setPhase("runup");
    }
    if (this.phase === "runup" && this.shooter.runStart !== null && t - this.shooter.runStart >= RUNUP) {
      const s = this.pendingShot;
      if (s) this.launch(s.tx, s.ty, s.speed, s.spin, s.power);
      else if (this.role === "shoot") this.playerStrike();
      else this.aiStrike();
    }

    // AI keeper reacts to the flight
    if (this.phase === "flight" && this.role === "shoot" && !this.keeper.dive && !this.online) {
      const dive = this.keeperBrain.update(t, this.ball, this.keeper.x);
      if (dive) this.keeper.dive = dive;
    }

    // Physics, in fixed steps (keeper pose updated each step so saves are physical)
    if (this.ball.active) {
      this.acc += dt;
      let simStepT = prevT;
      while (this.acc >= STEP) {
        this.acc -= STEP;
        simStepT += STEP;
        this.poseKeeper(simStepT);
        this.keeperAv!.root.updateMatrixWorld(true);
        this.keeperAv!.hitSpheres(this.spheres);
        stepBall(this.ball, this.spheres, this.events);
        if (this.events.length) this.handleEvents(simStepT);
      }
    }
    if (this.phase === "flight") this.checkFinished(t);
    if (this.phase === "result" && t - this.resultT > (this.result && this.isHighlight(this.result) && !this.replayed ? 1.9 : 2.6)) {
      if (this.result && this.isHighlight(this.result) && !this.replayed) this.startReplay();
      else this.finish();
    }

    // Record for replays
    if (this.phase === "runup" || this.phase === "flight" || (this.phase === "result" && e < 1.2)) {
      this.record.push({
        t,
        ball: [this.ball.p.x, this.ball.p.y, this.ball.p.z, this.ball.roll],
        shooter: shooterPose(this.shooter, t),
        keeper: keeperPose(this.keeper, t),
      });
      if (this.record.length > 600) this.record.shift();
    }
  }

  private poseKeeper(t: number) {
    this.keeperAv!.pose = keeperPose(this.keeper, t);
    this.keeperAv!.apply();
  }

  private handleEvents(t: number) {
    for (const ev of this.events) {
      this.lastEventT = t;
      if (ev === "save") {
        sfx.glove();
        this.shake = 0.6;
        const speed = this.ballSpeedAtKick();
        if (this.role === "keep" && (speed > 23 || Math.abs(this.ball.p.x) > 2.2)) this.slowMo(0.75);
      }
      if (ev === "post" || ev === "bar") {
        sfx.post();
        this.stadium.shakeFrame(1);
        this.shake = 0.4;
      }
      if (ev === "goal") {
        this.stadium.rippleNet(this.ball.p.x, this.ball.p.y, 1);
        sfx.net();
        const top = Math.abs(this.ball.p.x) > 2.7 && this.ball.p.y > 1.5;
        if (this.role === "shoot" && top) this.slowMo(0.7);
      }
    }
    this.events.length = 0;
  }

  private kickSpeed = 0;
  private ballSpeedAtKick() {
    return this.kickSpeed;
  }

  private slowMo(seconds: number) {
    this.timeScale = 0.3;
    this.slowUntil = performance.now() / 1000 + seconds;
  }

  private checkFinished(t: number) {
    const b = this.ball;
    const since = t - this.contactT;
    const quiet = t - this.lastEventT;
    let done = false;
    if (b.goal && since > 0.35) done = true;
    else if (b.saved && quiet > 0.7) done = true;
    else if (b.crossed && !b.goal && quiet > 0.5) done = true;
    else if (b.touchedFrame && quiet > 0.8) done = true;
    else if (since > 3) done = true;
    if (!done) return;
    // Online striker: wait (briefly) for the keeper's screen to call it
    if (this.online && this.role === "shoot" && !this.remoteResult) {
      if (this.waitingRemote < 0) this.waitingRemote = t;
      if (t - this.waitingRemote < 4) return;
    }
    this.resolve(t);
  }

  private resolve(t: number) {
    const b = this.ball;
    const shooting = this.role === "shoot";
    const speed = this.kickSpeed;
    let cross = b.crossAt ?? { x: b.p.x, y: b.p.y };
    let outcome: Outcome;
    if (b.goal) outcome = "goal";
    else if (b.saved) outcome = "save";
    else if (b.touchedFrame) outcome = b.touchedFrame;
    else outcome = cross.y > GOAL_H ? "over" : "wide";
    if (this.online && this.role === "shoot" && this.remoteResult) {
      outcome = this.remoteResult.outcome;
      cross = { x: this.remoteResult.x, y: this.remoteResult.y };
    }

    let label: string;
    const top = Math.abs(cross.x) > 2.7 && cross.y > 1.5;
    if (outcome === "goal") {
      if (shooting && (top || speed > 28.5)) label = "GOLAZO!";
      else if (shooting && this.released?.perfect) label = "PERFECT SHOT!";
      else label = "GOAL!";
    } else if (outcome === "save") {
      label = (speed > 23 && Math.abs(cross.x) > 1.6) || Math.abs(cross.x) > 2.6 ? "INCREDIBLE SAVE!" : "SAVED!";
    } else if (outcome === "post") label = "OFF THE POST!";
    else if (outcome === "bar") label = "OFF THE BAR!";
    else if (outcome === "over") label = "OVER THE BAR!";
    else label = "WIDE!";

    const good = shooting ? outcome === "goal" : outcome !== "goal";
    this.result = {
      role: this.role,
      outcome,
      good,
      label,
      perfect: !!this.released?.perfect,
      shotX: cross.x,
      speed,
    };
    if (shooting && !this.online) this.keeperBrain.remember(this.released?.aim.x ?? cross.x);
    if (this.online && !shooting) this.onLocalResult({ outcome, x: cross.x, y: cross.y, speed });

    // Reactions
    if (outcome === "goal") {
      this.shooter.mood = "celebrate";
      this.shooter.celebrateDir = Math.sign(cross.x) || 1;
      this.keeper.mood = "dejected";
      sfx.crowd(shooting ? "cheer" : "groan", label === "GOLAZO!");
      if (shooting) this.cheer = 1;
    } else {
      this.shooter.mood = "dejected";
      if (outcome === "save") this.keeper.mood = "celebrate";
      sfx.crowd(shooting ? "ooh" : "cheer", label === "INCREDIBLE SAVE!");
      if (!shooting) this.cheer = 0.8;
    }
    this.shooter.moodStart = t;
    this.keeper.moodStart = t;
    this.resultT = t;
    this.setPhase("result");
    this.onResult(this.result);
  }

  private isHighlight(r: KickResult) {
    return r.label === "GOLAZO!" || r.label === "INCREDIBLE SAVE!";
  }

  private finish() {
    this.kickSpeed = 0;
    this.setPhase("idle");
    this.onHint("");
    this.onKickDone();
  }

  onKickDone: () => void = () => {};

  /* ───────────────────────────── Replay ───────────────────────────── */

  private startReplay() {
    this.replayed = true;
    if (this.record.length < 10) return this.finish();
    // Start a little before contact
    const contact = this.contactT;
    const startIdx = Math.max(0, this.record.findIndex((f) => f.t >= contact - 0.5));
    this.replayFrom = this.record[startIdx].t;
    this.replayStart = performance.now() / 1000;
    this.setPhase("replay");
    this.onHint("Replay · tap or press Space to skip");
  }

  private updateReplay(_realDt: number) {
    const now = performance.now() / 1000;
    const rt = this.replayFrom + (now - this.replayStart) * 0.45;
    const last = this.record[this.record.length - 1];
    if (rt >= last.t) return this.finishReplay();
    let f = this.record[0];
    for (const fr of this.record) {
      if (fr.t > rt) break;
      f = fr;
    }
    this.ball.p.set(f.ball[0], f.ball[1], f.ball[2]);
    this.ball.roll = f.ball[3];
    this.shooterAv!.pose = f.shooter;
    this.keeperAv!.pose = f.keeper;
    this.replayClock = rt;
  }

  private replayClock = 0;

  private finishReplay() {
    this.finish();
  }

  /* ───────────────────────────── Celebration ───────────────────────────── */

  private celeb: { winner: Avatar; loser: Avatar; id: string; done: () => void } | null = null;

  /**
   * The match winner's celebration, in front of the goal, with the beaten
   * player on their knees behind. `wasKeeper` dresses each in the kit they wore.
   */
  celebrate(winner: Player, winnerKeeper: boolean, loser: Player, loserKeeper: boolean, id: string, done: () => void) {
    this.endCelebration(false);
    const w = new Avatar(winner, winnerKeeper);
    const l = new Avatar(loser, loserKeeper);
    this.stadium.scene.add(w.root, l.root);
    if (this.shooterAv) this.shooterAv.root.visible = false;
    if (this.keeperAv) this.keeperAv.root.visible = false;
    this.ballMesh.visible = false;
    this.celeb = { winner: w, loser: l, id, done };
    this.cheer = 1;
    sfx.crowd("cheer");
    this.setPhase("celebrate");
    const p = celebrationPose(id, 0).root;
    this.camPos.set(p.x + 1.8, 1.8, p.z + 5.4);
    this.camLook.set(p.x, 1.0, p.z);
    this.onHint("Tap or press Space to skip");
  }

  private updateCelebration(dt: number) {
    this.simT += dt;
    const c = this.celeb;
    if (!c) return;
    const e = this.simT - this.phaseT;
    c.winner.pose = celebrationPose(c.id, e);
    c.loser.pose = loserPose(e);
    c.winner.apply();
    c.loser.apply();
    this.cheer = Math.max(this.cheer, 0.8);
    if (e > CELEBRATION_SECONDS) this.endCelebration();
  }

  /** Stop a celebration without its callback (leaving the match). */
  cancelCelebration() {
    this.endCelebration(false);
  }

  private endCelebration(notify = true) {
    const c = this.celeb;
    if (!c) return;
    this.celeb = null;
    this.stadium.scene.remove(c.winner.root, c.loser.root);
    if (this.shooterAv) this.shooterAv.root.visible = true;
    if (this.keeperAv) this.keeperAv.root.visible = true;
    this.ballMesh.visible = true;
    this.setPhase("idle");
    this.onHint("");
    if (notify) c.done();
  }

  /* ───────────────────────────── Render ───────────────────────────── */

  private camPos = new Vector3(1.6, 2.2, SPOT_Z + 6.5);
  private camLook = new Vector3(0, 1, 0);

  private render() {
    const t = this.simT;
    if (this.shooterAv && this.keeperAv) {
      if (this.phase !== "replay") {
        this.shooterAv.pose = shooterPose(this.shooter, t);
        this.keeperAv.pose = keeperPose(this.keeper, t);
      }
      this.shooterAv.apply();
      this.keeperAv.apply();
    }
    this.ballMesh.position.copy(this.ball.p);
    this.ballMesh.rotation.x = -this.ball.roll;
    this.ballMesh.rotation.z = this.ball.spin * this.ball.roll * 0.2;

    // Aim reticle and dive marker
    const aiming = this.role === "shoot" && this.phase === "aim";
    this.reticle.visible = aiming;
    if (aiming) {
      this.reticle.position.set(this.aim.x, this.aim.y, 0.08);
      const m = this.reticle.material as MeshBasicMaterial;
      m.color.set(this.charging ? (this.power > this.diff.overStart ? "#ff5a5a" : this.power >= this.diff.sweet[0] && this.power <= this.diff.sweet[1] ? "#ffb81c" : "#ffffff") : "#ffffff");
      const s = 1 + (this.charging ? 0 : Math.sin(t * 6) * 0.06);
      this.reticle.scale.set(s, s, 1);
    }
    const choosing = this.role === "keep" && !this.keeper.dive && (this.phase === "ready" || this.phase === "runup" || this.phase === "flight");
    this.diveMarker.visible = choosing;
    if (choosing) this.diveMarker.position.set(this.diveTarget.x, this.diveTarget.y, 0.3);
    // Timing helper: shrinks onto the ball at the moment of the kick
    const help = this.diff.timingHelp;
    const showRing = this.role === "keep" && help > 0 && this.phase === "runup" && this.shooter.runStart !== null;
    this.timingRing.visible = showRing;
    if (showRing) {
      const u = clamp((t - this.shooter.runStart!) / RUNUP, 0, 1);
      const s = 1.4 - u * 1.25;
      this.timingRing.scale.set(s, s, s);
      this.timingRing.position.set(0, 0.02, SPOT_Z);
      (this.timingRing.material as MeshBasicMaterial).opacity = 0.85 * help;
    }

    this.stadium.update(t, 1 / 60, this.cheer);
    this.updateCamera();
    this.renderer.render(this.stadium.scene, this.camera);
  }

  private updateCamera() {
    const b = this.ball.p;
    const pos = new Vector3();
    const look = new Vector3();
    if (this.phase === "celebrate" && this.celeb) {
      // In front of the winner, following them round, the goal and crowd behind
      const r = this.celeb.winner.pose.root;
      pos.set(r.x * 0.5 + 1.8, 1.75, r.z + 5.4);
      look.set(r.x * 0.7, 1.0, r.z - 0.5);
      this.camPos.lerp(pos, 0.06);
      this.camLook.lerp(look, 0.08);
      this.camera.position.copy(this.camPos);
      this.camera.lookAt(this.camLook);
      if (Math.abs(this.camera.fov - this.baseFov) > 0.05) {
        this.camera.fov = this.baseFov;
        this.camera.updateProjectionMatrix();
      }
      this.stadium.setNetOpacity(0.55);
      return;
    }
    if (this.phase === "replay") {
      // Low side angle at the goalmouth
      const k = (this.replayClock - this.replayFrom) * 0.4;
      pos.set(7.5 - k, 1.4, 4.5 + k * 0.5);
      look.set(b.x * 0.4, 1.0, Math.max(0, b.z * 0.25));
      this.camera.position.copy(pos);
      this.camera.lookAt(look);
      if (this.camera.fov !== this.baseFov) {
        this.camera.fov = this.baseFov;
        this.camera.updateProjectionMatrix();
      }
      this.stadium.setNetOpacity(0.55);
      return;
    }
    if (this.role === "shoot") {
      pos.set(0.9, 2.0, SPOT_Z + 6.4);
      look.set(-0.1, 1.0, 0);
      if (this.phase === "runup") pos.set(0.7, 1.9, SPOT_Z + 5.6);
      if (this.phase === "flight") {
        const k = clamp((SPOT_Z - b.z) / SPOT_Z, 0, 1);
        pos.set(0.7 + b.x * 0.25, 1.9, SPOT_Z + 5.4 - k * 2.6);
        look.set(b.x * 0.5, 1.05 + b.y * 0.15, 0);
      }
      if (this.phase === "result") {
        // Pull up and back so the celebration and the goal are both in shot
        pos.set(4.6, 2.8, SPOT_Z + 3.2);
        look.set((this.ball.crossAt?.x ?? 0) * 0.5, 1.0, 2.5);
      }
    } else {
      // Behind the goal, looking out at the penalty taker
      // High behind the goal: the whole goal mouth, the keeper and the striker in one view
      pos.set(this.keeper.x * 0.25, 3.7, -5.3);
      look.set(this.keeper.x * 0.1, 0.55, SPOT_Z * 0.75);
      if (this.phase === "flight" || this.phase === "result") look.set(b.x * 0.3, 1.0, Math.max(4, b.z));
    }
    const ease = this.phase === "flight" ? 0.12 : this.phase === "result" ? 0.05 : 0.08;
    this.camPos.lerp(pos, ease);
    this.camLook.lerp(look, ease);
    this.camera.position.copy(this.camPos);
    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - 0.03);
      this.camera.position.x += (Math.random() - 0.5) * 0.06 * this.shake;
      this.camera.position.y += (Math.random() - 0.5) * 0.06 * this.shake;
    }
    this.camera.lookAt(this.camLook);
    // A wider lens in goal, so all of the goal fits; the net fades so it doesn't hide the play
    const wantFov = this.baseFov + (this.role === "keep" ? 14 : 0);
    if (Math.abs(this.camera.fov - wantFov) > 0.05) {
      this.camera.fov += (wantFov - this.camera.fov) * 0.15;
      this.camera.updateProjectionMatrix();
    }
    this.stadium.setNetOpacity(this.role === "keep" ? 0.16 : 0.55);
  }

  private baseFov = 42;

  /** Snap the camera into place (when a kick starts). */
  snapCamera() {
    this.camPos.set(this.role === "shoot" ? 0.9 : 0, this.role === "shoot" ? 2.0 : 3.7, this.role === "shoot" ? SPOT_Z + 6.4 : -5.3);
    this.camLook.set(this.role === "shoot" ? -0.1 : 0, this.role === "shoot" ? 1.0 : 0.55, this.role === "shoot" ? 0 : SPOT_Z * 0.75);
  }

}
