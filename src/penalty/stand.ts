import {
  BoxGeometry,
  CanvasTexture,
  Color,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  type Scene,
} from "three";
import { sponsorStrip } from "./sponsors";

/*
 * A tiered end stand: concrete steps, seat rows, hundreds of blocky fans
 * (instanced, so it stays fast), aisles, a front wall and roof fascia carrying
 * the sponsors, and a roof on columns. Built facing +Z; the caller places it.
 */

const ROWS = 16;
const STEP_D = 0.85;
const STEP_H = 0.55;
const HALF_W = 34;

function stripTexture(repeat: number) {
  const t = new CanvasTexture(sponsorStrip(512, 96));
  t.colorSpace = SRGBColorSpace;
  t.wrapS = RepeatWrapping;
  t.repeat.set(repeat, 1);
  t.anisotropy = 4;
  return t;
}

export interface Stand {
  group: Group;
  update: (t: number, cheer: number) => void;
}

export function buildStand(scene: Scene, z: number, yaw: number): Stand {
  const group = new Group();
  group.position.set(0, 0, z);
  group.rotation.y = yaw;
  scene.add(group);

  const concrete = new MeshLambertMaterial({ color: "#3b4252" });
  const concreteDark = new MeshLambertMaterial({ color: "#2a303c" });
  // Steps
  for (let r = 0; r < ROWS; r++) {
    const h = 1.2 + r * STEP_H;
    const step = new Mesh(new BoxGeometry(HALF_W * 2, h, STEP_D), r % 2 ? concrete : concreteDark);
    step.position.set(0, h / 2, -0.4 - r * STEP_D);
    step.receiveShadow = true;
    group.add(step);
    // Seat row: gold and black blocks, in Southwestern colours
    const seats = new Mesh(new BoxGeometry(HALF_W * 2, 0.16, 0.42), new MeshLambertMaterial({ color: r % 4 < 2 ? "#1f2533" : "#2b3142" }));
    seats.position.set(0, h + 0.08, -0.55 - r * STEP_D);
    group.add(seats);
  }
  // Back wall
  const backH = 1.2 + ROWS * STEP_H + 2;
  const back = new Mesh(new BoxGeometry(HALF_W * 2, backH, 0.4), concreteDark);
  back.position.set(0, backH / 2, -0.4 - ROWS * STEP_D - 0.2);
  group.add(back);

  // Front wall with sponsors, and a railing
  const wall = new Mesh(new BoxGeometry(HALF_W * 2, 1.25, 0.2), [
    concrete,
    concrete,
    concrete,
    concrete,
    new MeshBasicMaterial({ map: stripTexture(8), color: "#d6deec" }),
    concrete,
  ]);
  wall.position.set(0, 0.62, 0.1);
  group.add(wall);
  const rail = new Mesh(new BoxGeometry(HALF_W * 2, 0.05, 0.05), new MeshLambertMaterial({ color: "#d8dee9" }));
  rail.position.set(0, 1.55, 0.05);
  group.add(rail);
  for (let x = -HALF_W; x <= HALF_W; x += 2.5) {
    const post = new Mesh(new BoxGeometry(0.04, 0.35, 0.04), rail.material);
    post.position.set(x, 1.38, 0.05);
    group.add(post);
  }

  // Roof on columns, with a sponsor fascia along the front edge
  const roofY = 1.2 + ROWS * STEP_H + 4.2;
  const roof = new Mesh(new BoxGeometry(HALF_W * 2 + 2, 0.5, ROWS * STEP_D + 4), new MeshLambertMaterial({ color: "#121a2a" }));
  roof.position.set(0, roofY, -(ROWS * STEP_D) / 2 + 1.2);
  group.add(roof);
  const fascia = new Mesh(new BoxGeometry(HALF_W * 2 + 2, 1.5, 0.15), [
    concreteDark,
    concreteDark,
    concreteDark,
    concreteDark,
    new MeshBasicMaterial({ map: stripTexture(6), color: "#e4ebf6" }),
    concreteDark,
  ]);
  fascia.position.set(0, roofY - 0.5, 3.25);
  group.add(fascia);
  for (let x = -HALF_W + 4; x <= HALF_W - 4; x += 12) {
    const col = new Mesh(new BoxGeometry(0.35, roofY, 0.35), new MeshLambertMaterial({ color: "#1a2233" }));
    col.position.set(x, roofY / 2, -ROWS * STEP_D - 0.3);
    group.add(col);
  }

  // Fans: blocky bodies and heads, one instance each
  const shirts = [
    "#ffb81c", "#ffb81c", "#141210", "#141210", "#f68835", "#3d8bff", "#ffffff",
    "#1d63c9", "#c60b1e", "#0b6b3a", "#2b3d63", "#56688f", "#e8eef8", "#7a1f2b",
  ].map((c) => new Color(c));
  const skins = ["#f0c6ae", "#e6bea2", "#d8a684", "#c99272", "#a8755a", "#8a5a3c", "#5c3826"].map((c) => new Color(c));
  const hairs = ["#151215", "#2a2523", "#4a2e1f", "#8a5a3c", "#c9a061", "#5a5a5a"].map((c) => new Color(c));
  const spots: { x: number; y: number; z: number; stand: boolean; phase: number }[] = [];
  for (let r = 0; r < ROWS; r++) {
    const floor = 1.2 + r * STEP_H;
    for (let x = -HALF_W + 0.4; x < HALF_W - 0.4; x += 0.58) {
      // Aisles every 11 m
      const aisle = Math.abs(((x + HALF_W) % 11) - 5.5) < 0.55;
      if (aisle || Math.random() < 0.07) continue;
      spots.push({ x: x + (Math.random() - 0.5) * 0.08, y: floor, z: -0.6 - r * STEP_D, stand: Math.random() < 0.18, phase: Math.random() * Math.PI * 2 });
    }
  }
  const bodyGeo = new BoxGeometry(0.42, 0.55, 0.3);
  const headGeo = new BoxGeometry(0.26, 0.26, 0.26);
  const hairGeo = new BoxGeometry(0.28, 0.08, 0.28);
  const bodies = new InstancedMesh(bodyGeo, new MeshLambertMaterial(), spots.length);
  const heads = new InstancedMesh(headGeo, new MeshLambertMaterial(), spots.length);
  const hairsMesh = new InstancedMesh(hairGeo, new MeshLambertMaterial(), spots.length);
  const m = new Matrix4();
  const place = (bob: number) => {
    spots.forEach((s, i) => {
      const lift = s.stand ? 0.32 : 0;
      const b = bob ? Math.max(0, Math.sin(bob * 1 + s.phase * 3)) * 0.28 : 0;
      m.makeTranslation(s.x, s.y + 0.44 + lift + b, s.z);
      bodies.setMatrixAt(i, m);
      m.makeTranslation(s.x, s.y + 0.86 + lift + b, s.z);
      heads.setMatrixAt(i, m);
      m.makeTranslation(s.x, s.y + 1.0 + lift + b, s.z);
      hairsMesh.setMatrixAt(i, m);
    });
    bodies.instanceMatrix.needsUpdate = true;
    heads.instanceMatrix.needsUpdate = true;
    hairsMesh.instanceMatrix.needsUpdate = true;
  };
  spots.forEach((_, i) => {
    bodies.setColorAt(i, shirts[Math.floor(Math.random() * shirts.length)]);
    heads.setColorAt(i, skins[Math.floor(Math.random() * skins.length)]);
    hairsMesh.setColorAt(i, hairs[Math.floor(Math.random() * hairs.length)]);
  });
  place(0);
  group.add(bodies, heads, hairsMesh);

  // A few gold and orange flags held up in the crowd
  const flagMat = [new MeshLambertMaterial({ color: "#ffb81c" }), new MeshLambertMaterial({ color: "#f68835" }), new MeshLambertMaterial({ color: "#141210" })];
  const flags: Mesh[] = [];
  for (let i = 0; i < 14; i++) {
    const s = spots[Math.floor(Math.random() * spots.length)];
    const f = new Mesh(new BoxGeometry(1.1, 0.7, 0.02), flagMat[i % 3]);
    f.position.set(s.x, s.y + 1.75, s.z);
    group.add(f);
    flags.push(f);
  }

  let bouncing = false;
  return {
    group,
    update(t, cheer) {
      flags.forEach((f, i) => (f.rotation.z = Math.sin(t * 2 + i) * 0.15));
      if (cheer > 0.02) {
        place(t * 9);
        bouncing = true;
      } else if (bouncing) {
        place(0);
        bouncing = false;
      }
    },
  };
}
