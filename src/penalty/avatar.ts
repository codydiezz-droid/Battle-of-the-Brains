import {
  BoxGeometry,
  CanvasTexture,
  Group,
  Mesh,
  MeshLambertMaterial,
  NearestFilter,
  Object3D,
  SRGBColorSpace,
  Vector3,
  type Material,
} from "three";
import type { Player } from "./players";
import {
  armTexture,
  backTexture,
  faceTexture,
  hairBlockTexture,
  legTexture,
  shade,
  sideTexture,
  topTexture,
  torsoBack,
  torsoFront,
} from "./textures";

/*
 * A blocky (Roblox / Minecraft style) footballer built from boxes, with
 * pivots at the hips, shoulders, knees and neck so it can run, kick, dive and
 * celebrate. Local +Z is the way the character faces.
 */

const tex = (c: HTMLCanvasElement) => {
  const t = new CanvasTexture(c);
  t.magFilter = NearestFilter;
  t.minFilter = NearestFilter;
  t.colorSpace = SRGBColorSpace;
  return t;
};
const mat = (c: HTMLCanvasElement) => new MeshLambertMaterial({ map: tex(c) });
const flat = (color: string) => new MeshLambertMaterial({ color });

// Box face order in three.js: +x, -x, +y, -y, +z, -z
function box(w: number, h: number, d: number, mats: Material | Material[]) {
  const m = new Mesh(new BoxGeometry(w, h, d), mats);
  m.castShadow = true;
  return m;
}

export interface Joint {
  x: number;
  y: number;
  z: number;
}

/** Everything an animation can set. Angles in radians. */
export interface Pose {
  root: { x: number; y: number; z: number; yaw: number };
  /** Whole body around the hips: lean forward (pitch), side roll for dives, twist (yaw). */
  body: { pitch: number; roll: number; yaw: number; lift: number };
  head: Joint;
  armL: Joint;
  armR: Joint;
  legL: Joint;
  legR: Joint;
  kneeL: number;
  kneeR: number;
}

export function restPose(): Pose {
  return {
    root: { x: 0, y: 0, z: 0, yaw: 0 },
    body: { pitch: 0, roll: 0, yaw: 0, lift: 0 },
    head: { x: 0, y: 0, z: 0 },
    armL: { x: 0, y: 0, z: 0.12 },
    armR: { x: 0, y: 0, z: -0.12 },
    legL: { x: 0, y: 0, z: 0 },
    legR: { x: 0, y: 0, z: 0 },
    kneeL: 0,
    kneeR: 0,
  };
}

export const HIP_Y = 0.92;

export class Avatar {
  readonly root = new Group();
  readonly player: Player;
  readonly keeper: boolean;
  pose: Pose = restPose();
  private body = new Group();
  private headPivot = new Group();
  private armL = new Group();
  private armR = new Group();
  private legL = new Group();
  private legR = new Group();
  private kneeL = new Group();
  private kneeR = new Group();
  /** Points used for goalkeeper saves, with their reach radius. */
  readonly hitPoints: { obj: Object3D; r: number }[] = [];
  /** The kicking foot, used to place the ball contact. */
  readonly footR = new Object3D();

  constructor(player: Player, keeper: boolean) {
    this.player = player;
    this.keeper = keeper;
    const k = player.kit;
    const L = player.look;
    const shirtSide = flat(k.shirt);
    const skinSide = flat(L.skin);

    this.root.add(this.body);
    this.body.position.y = HIP_Y;

    // Torso: 0.52 wide, 0.64 tall, 0.28 deep
    const torso = box(0.52, 0.64, 0.28, [
      shirtSide,
      shirtSide,
      flat(shade(k.shirt, -0.05)),
      flat(k.shorts),
      mat(torsoFront(k, player.number)),
      mat(torsoBack(k, player.shirtName, player.number)),
    ]);
    torso.position.y = 0.32;
    this.body.add(torso);
    // Chest and belly, so the whole torso blocks the ball
    for (const y of [0.5, 0.16]) {
      const m = new Object3D();
      m.position.y = y;
      this.body.add(m);
      this.hitPoints.push({ obj: m, r: 0.26 });
    }

    // Head
    this.headPivot.position.y = 0.64;
    this.body.add(this.headPivot);
    const head = box(0.46, 0.46, 0.46, [
      mat(sideTexture(L, false)),
      mat(sideTexture(L, true)),
      mat(topTexture(L)),
      skinSide,
      mat(faceTexture(L)),
      mat(backTexture(L)),
    ]);
    head.position.y = 0.24;
    this.headPivot.add(head);
    this.hitPoints.push({ obj: head, r: 0.24 });
    this.addHair(L);

    // Arms: pivot at the shoulder, hanging down
    const armMat = mat(armTexture(k, L.skin, keeper));
    for (const [arm, side] of [
      [this.armL, 1],
      [this.armR, -1],
    ] as const) {
      arm.position.set(side * 0.35, 0.6, 0);
      this.body.add(arm);
      const a = box(0.18, 0.62, 0.18, [armMat, armMat, flat(k.shirt), skinSide, armMat, armMat]);
      a.position.y = -0.29;
      arm.add(a);
      const hand = box(keeper ? 0.22 : 0.17, keeper ? 0.16 : 0.12, keeper ? 0.22 : 0.17, keeper ? flat("#d7ff3f") : skinSide);
      hand.position.y = -0.64;
      arm.add(hand);
      if (keeper) {
        const cuff = box(0.2, 0.04, 0.2, flat("#1b2a5c"));
        cuff.position.y = -0.56;
        arm.add(cuff);
      }
      // Upper arm, forearm and hand/glove
      for (const [y, r] of [
        [-0.14, 0.12],
        [-0.38, 0.12],
        [-0.62, keeper ? 0.23 : 0.12],
      ] as const) {
        const marker = new Object3D();
        marker.position.y = y;
        arm.add(marker);
        this.hitPoints.push({ obj: marker, r });
      }
    }

    // Legs: hip pivot, thigh, knee pivot, shin and boot
    const legCanvas = legTexture(k, L.skin);
    const legMat = mat(legCanvas);
    for (const [leg, knee, side] of [
      [this.legL, this.kneeL, 1],
      [this.legR, this.kneeR, -1],
    ] as const) {
      leg.position.set(side * 0.13, 0, 0);
      this.body.add(leg);
      const thigh = box(0.22, 0.46, 0.22, [legMat, legMat, flat(k.shorts), skinSide, legMat, legMat]);
      thigh.position.y = -0.23;
      leg.add(thigh);
      knee.position.y = -0.46;
      leg.add(knee);
      const shin = box(0.2, 0.36, 0.2, flat(k.socks));
      shin.position.y = -0.18;
      knee.add(shin);
      const boot = box(0.22, 0.1, 0.32, flat("#14171d"));
      boot.position.set(0, -0.41, 0.05);
      knee.add(boot);
      const stripe = box(0.225, 0.03, 0.2, flat(side > 0 ? "#ffb81c" : "#f68835"));
      stripe.position.set(0, -0.4, 0.04);
      knee.add(stripe);
      for (const y of [-0.2, -0.46]) {
        const m = new Object3D();
        leg.add(m);
        m.position.y = y;
        this.hitPoints.push({ obj: m, r: 0.14 });
      }
      const foot = side < 0 ? this.footR : new Object3D();
      foot.position.set(0, -0.42, 0.12);
      knee.add(foot);
      this.hitPoints.push({ obj: foot, r: 0.14 });
    }
    void legCanvas;
    this.apply();
  }

  private addHair(L: Player["look"]) {
    const hairMat = mat(hairBlockTexture(L));
    const hairFlat = flat(L.hair);
    const add = (w: number, h: number, d: number, x: number, y: number, z: number, m: Material = hairMat) => {
      const b = box(w, h, d, m);
      b.position.set(x, y, z);
      this.headPivot.add(b);
      return b;
    };
    switch (L.style) {
      case "long":
      case "long-wavy":
        // A curtain of hair down the back and over the shoulders
        add(0.5, 0.62, 0.12, 0, 0.08, -0.22);
        add(0.06, 0.4, 0.3, 0.25, 0.06, -0.06, hairFlat);
        add(0.06, 0.4, 0.3, -0.25, 0.06, -0.06, hairFlat);
        add(0.5, 0.06, 0.5, 0, 0.49, 0, hairFlat);
        break;
      case "bob-bangs":
        add(0.52, 0.34, 0.14, 0, 0.18, -0.21);
        add(0.07, 0.3, 0.44, 0.255, 0.2, 0, hairFlat);
        add(0.07, 0.3, 0.44, -0.255, 0.2, 0, hairFlat);
        add(0.5, 0.07, 0.5, 0, 0.5, 0, hairFlat);
        break;
      case "chin":
        add(0.5, 0.28, 0.1, 0, 0.24, -0.22);
        add(0.06, 0.24, 0.4, 0.25, 0.26, -0.02, hairFlat);
        add(0.06, 0.24, 0.4, -0.25, 0.26, -0.02, hairFlat);
        add(0.5, 0.06, 0.5, 0, 0.49, 0, hairFlat);
        break;
      case "curly-short":
        add(0.5, 0.1, 0.5, 0, 0.5, 0, hairFlat);
        for (let i = 0; i < 9; i++) add(0.12, 0.08, 0.12, -0.16 + (i % 3) * 0.16, 0.57, -0.16 + Math.floor(i / 3) * 0.16, hairFlat);
        break;
      case "short-up":
        add(0.48, 0.12, 0.44, 0, 0.53, 0.02, hairFlat);
        add(0.3, 0.06, 0.2, 0, 0.61, 0.12, hairFlat);
        break;
      case "short-messy":
        add(0.48, 0.1, 0.48, 0, 0.51, 0, hairFlat);
        add(0.14, 0.08, 0.14, 0.12, 0.58, 0.1, hairFlat);
        add(0.12, 0.07, 0.12, -0.1, 0.57, -0.05, hairFlat);
        add(0.1, 0.06, 0.1, 0.02, 0.59, 0.18, hairFlat);
        break;
      case "short-side":
        add(0.48, 0.08, 0.48, 0, 0.5, 0, hairFlat);
        add(0.22, 0.06, 0.4, -0.1, 0.56, 0.02, hairFlat);
        break;
      case "braids-up":
        add(0.48, 0.06, 0.48, 0, 0.5, 0, hairFlat);
        add(0.3, 0.18, 0.3, 0, 0.62, -0.02, hairMat);
        add(0.2, 0.12, 0.2, 0, 0.76, -0.02, hairMat);
        break;
    }
    if (L.glasses) {
      // Thin arms of the glasses along the sides of the head
      add(0.005, 0.02, 0.24, 0.232, 0.24, 0.1, flat(L.glasses));
      add(0.005, 0.02, 0.24, -0.232, 0.24, 0.1, flat(L.glasses));
    }
  }

  /** Copy the pose onto the model. */
  apply() {
    const p = this.pose;
    this.root.position.set(p.root.x, p.root.y, p.root.z);
    this.root.rotation.set(0, p.root.yaw, 0);
    this.body.position.y = HIP_Y + p.body.lift;
    this.body.rotation.set(p.body.pitch, p.body.yaw, p.body.roll, "YXZ");
    this.headPivot.rotation.set(p.head.x, p.head.y, p.head.z);
    this.armL.rotation.set(p.armL.x, p.armL.y, p.armL.z);
    this.armR.rotation.set(p.armR.x, p.armR.y, p.armR.z);
    this.legL.rotation.set(p.legL.x, p.legL.y, p.legL.z);
    this.legR.rotation.set(p.legR.x, p.legR.y, p.legR.z);
    this.kneeL.rotation.x = p.kneeL;
    this.kneeR.rotation.x = p.kneeR;
  }

  /** World positions of the save points (call after apply + updateMatrixWorld). */
  hitSpheres(out: { p: Vector3; r: number }[]) {
    out.length = 0;
    for (const h of this.hitPoints) out.push({ p: h.obj.getWorldPosition(new Vector3()), r: h.r });
    return out;
  }

  snapshot(): Pose {
    return structuredClone(this.pose);
  }
}
