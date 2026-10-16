import { buildStand } from "./stand";
import { sponsorStrip } from "./sponsors";
import {
  AmbientLight,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Fog,
  Group,
  HemisphereLight,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PlaneGeometry,
  RepeatWrapping,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  Texture,
} from "three";

/*
 * World layout (metres): the goal line is z = 0 with the goal centred on
 * x = 0, the penalty spot at z = 11, the pitch extends toward +z.
 */
export const GOAL_HALF = 3.66;
export const GOAL_H = 2.44;
export const POST_R = 0.06;
export const NET_DEPTH = 2.0;
export const SPOT_Z = 11;

function canvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export interface Stadium {
  scene: Scene;
  /** Push the back of the net out where the ball hit. */
  rippleNet: (x: number, y: number, strength: number) => void;
  shakeFrame: (amount: number) => void;
  update: (t: number, dt: number, cheer: number) => void;
}

export function buildStadium(): Stadium {
  const scene = new Scene();
  scene.background = new Color("#061430");
  scene.fog = new Fog("#061430", 60, 140);

  // Lights: a night match under floodlights
  scene.add(new HemisphereLight("#cfe0ff", "#1f4a24", 0.9));
  scene.add(new AmbientLight("#ffffff", 0.35));
  const sun = new DirectionalLight("#fff4e0", 1.6);
  sun.position.set(-12, 30, 22);
  sun.target.position.set(0, 0, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  const sc = sun.shadow.camera;
  sc.left = -10;
  sc.right = 10;
  sc.top = 16;
  sc.bottom = -6;
  sc.near = 5;
  sc.far = 70;
  sun.shadow.bias = -0.0008;
  scene.add(sun, sun.target);

  /* Pitch: stripes and markings painted on one large canvas */
  const PW = 80;
  const PZ0 = -12;
  const PZ1 = 52;
  const pitchTex = canvasTexture(2048, 1664, (g) => {
    const sx = 2048 / PW;
    const sz = 1664 / (PZ1 - PZ0);
    const X = (x: number) => (x + PW / 2) * sx;
    const Z = (z: number) => (z - PZ0) * sz;
    g.fillStyle = "#2f8a3c";
    g.fillRect(0, 0, 2048, 1664);
    for (let z = 0; z < PZ1; z += 5.5) {
      g.fillStyle = Math.round(z / 5.5) % 2 ? "#33953f" : "#2c8238";
      g.fillRect(0, Z(z), 2048, 5.5 * sz);
    }
    // Grain
    for (let i = 0; i < 26000; i++) {
      g.fillStyle = Math.random() < 0.5 ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.035)";
      g.fillRect(Math.random() * 2048, Math.random() * 1664, 2, 2);
    }
    g.strokeStyle = "rgba(255,255,255,0.92)";
    g.lineWidth = 0.12 * sx;
    const rect = (x0: number, z0: number, x1: number, z1: number) => g.strokeRect(X(x0), Z(z0), X(x1) - X(x0), Z(z1) - Z(z0));
    g.beginPath();
    g.moveTo(X(-34), Z(0));
    g.lineTo(X(34), Z(0));
    g.stroke();
    rect(-9.16, 0, 9.16, 5.5);
    rect(-20.16, 0, 20.16, 16.5);
    g.beginPath();
    g.arc(X(0), Z(SPOT_Z), 9.15 * sx, 0.93, Math.PI - 0.93);
    g.stroke();
    g.fillStyle = "#ffffff";
    g.beginPath();
    g.ellipse(X(0), Z(SPOT_Z), 0.13 * sx, 0.13 * sz, 0, 0, Math.PI * 2);
    g.fill();
    // Worn grass at the spot and in the goalmouth
    const wear = (x: number, z: number, r: number) => {
      const rg = g.createRadialGradient(X(x), Z(z), 0, X(x), Z(z), r * sx);
      rg.addColorStop(0, "rgba(120,95,50,0.35)");
      rg.addColorStop(1, "rgba(120,95,50,0)");
      g.fillStyle = rg;
      g.fillRect(X(x) - r * sx, Z(z) - r * sz, r * 2 * sx, r * 2 * sz);
    };
    wear(0, SPOT_Z, 0.9);
    wear(0, 0.6, 2.2);
  });
  const pitch = new Mesh(new PlaneGeometry(PW, PZ1 - PZ0), new MeshLambertMaterial({ map: pitchTex }));
  pitch.rotation.x = -Math.PI / 2;
  pitch.position.set(0, 0, (PZ0 + PZ1) / 2);
  pitch.receiveShadow = true;
  scene.add(pitch);
  // Surround outside the pitch
  const ground = new Mesh(new PlaneGeometry(260, 260), new MeshLambertMaterial({ color: "#1d4f25" }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  scene.add(ground);

  /* Goal frame */
  const frame = new Group();
  const white = new MeshLambertMaterial({ color: "#ffffff" });
  for (const sx of [-1, 1]) {
    const post = new Mesh(new CylinderGeometry(POST_R, POST_R, GOAL_H + POST_R, 16), white);
    post.position.set(sx * GOAL_HALF, (GOAL_H + POST_R) / 2, 0);
    post.castShadow = true;
    frame.add(post);
    const back = new Mesh(new CylinderGeometry(0.03, 0.03, GOAL_H, 8), white);
    back.position.set(sx * GOAL_HALF, GOAL_H / 2, -NET_DEPTH);
    frame.add(back);
    const stay = new Mesh(new CylinderGeometry(0.025, 0.025, NET_DEPTH, 8), white);
    stay.rotation.x = Math.PI / 2;
    stay.position.set(sx * GOAL_HALF, GOAL_H, -NET_DEPTH / 2);
    frame.add(stay);
  }
  const bar = new Mesh(new CylinderGeometry(POST_R, POST_R, GOAL_HALF * 2 + POST_R * 2, 16), white);
  bar.rotation.z = Math.PI / 2;
  bar.position.set(0, GOAL_H, 0);
  bar.castShadow = true;
  frame.add(bar);
  scene.add(frame);

  /* Net: a grid of line segments; the back panel can bulge */
  const step = 0.18;
  const nx = Math.round((GOAL_HALF * 2) / step);
  const ny = Math.round(GOAL_H / step);
  const backBase: number[] = [];
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) backBase.push(-GOAL_HALF + i * step, j * step, -NET_DEPTH);
  const backPos = new Float32Array(backBase);
  const backIdx: number[] = [];
  for (let j = 0; j <= ny; j++)
    for (let i = 0; i <= nx; i++) {
      const a = j * (nx + 1) + i;
      if (i < nx) backIdx.push(a, a + 1);
      if (j < ny) backIdx.push(a, a + nx + 1);
    }
  const backGeo = new BufferGeometry();
  backGeo.setAttribute("position", new BufferAttribute(backPos, 3));
  backGeo.setIndex(backIdx);
  const netMat = new LineBasicMaterial({ color: "#e8eef8", transparent: true, opacity: 0.55 });
  scene.add(new LineSegments(backGeo, netMat));
  // Sides and roof
  const side: number[] = [];
  for (const sx of [-GOAL_HALF, GOAL_HALF]) {
    for (let y = 0; y <= GOAL_H + 0.001; y += step) side.push(sx, y, 0, sx, y, -NET_DEPTH);
    for (let z = 0; z >= -NET_DEPTH - 0.001; z -= step) side.push(sx, 0, z, sx, GOAL_H, z);
  }
  for (let x = -GOAL_HALF; x <= GOAL_HALF + 0.001; x += step) side.push(x, GOAL_H, 0, x, GOAL_H, -NET_DEPTH);
  for (let z = 0; z >= -NET_DEPTH - 0.001; z -= step) side.push(-GOAL_HALF, GOAL_H, z, GOAL_HALF, GOAL_H, z);
  const sideGeo = new BufferGeometry();
  sideGeo.setAttribute("position", new BufferAttribute(new Float32Array(side), 3));
  scene.add(new LineSegments(sideGeo, netMat));
  const ripples: { x: number; y: number; k: number }[] = [];

  /* Stands: tiered crowd on all four sides */
  // Rows of blocky spectators: about half a metre each, in team colours
  const crowdTex = canvasTexture(1024, 256, (g) => {
    g.imageSmoothingEnabled = false;
    g.fillStyle = "#08142a";
    g.fillRect(0, 0, 1024, 256);
    const shirts = ["#ffb81c", "#141210", "#f68835", "#dfe7f5", "#3d8bff", "#1d63c9", "#c60b1e", "#0b6b3a", "#2b3d63", "#ffb81c", "#091d3f"];
    const skins = ["#f0c6ae", "#d8a684", "#c99272", "#a8755a", "#8a5a3c", "#5c3826"];
    const hairs = ["#151215", "#4a2e1f", "#8a5a3c", "#2a2523", "#e6c27a"];
    for (let row = 0; row < 8; row++) {
      const y = row * 32;
      g.fillStyle = row % 2 ? "#0c1c38" : "#0a1730";
      g.fillRect(0, y + 22, 1024, 10); // seat row
      for (let x = 2; x < 1024; x += 48 + Math.floor(Math.random() * 10)) {
        if (Math.random() < 0.08) continue; // an empty seat
        g.fillStyle = shirts[Math.floor(Math.random() * shirts.length)];
        g.fillRect(x, y + 13, 30, 16);
        g.fillStyle = skins[Math.floor(Math.random() * skins.length)];
        g.fillRect(x + 8, y + 1, 14, 12);
        g.fillStyle = hairs[Math.floor(Math.random() * hairs.length)];
        g.fillRect(x + 8, y + 1, 14, 4);
        if (Math.random() < 0.15) {
          // a scarf held up
          g.fillStyle = Math.random() < 0.5 ? "#ffb81c" : "#f68835";
          g.fillRect(x - 4, y + 2, 38, 5);
        }
      }
    }
  });
  crowdTex.wrapS = RepeatWrapping;
  const stands: Mesh[] = [];
  const standDefs = [
    { w: 70, x: -44, z: 22, yaw: Math.PI / 2 },
    { w: 70, x: 44, z: 22, yaw: -Math.PI / 2 },
  ];
  for (const s of standDefs) {
    const t = crowdTex.clone();
    t.repeat.set(s.w / 10, 2);
    t.wrapT = RepeatWrapping;
    t.needsUpdate = true;
    const m = new Mesh(new PlaneGeometry(s.w, 18), new MeshLambertMaterial({ map: t, color: "#8e9cb8" }));
    m.position.set(s.x, 7.5, s.z);
    m.rotation.set(-0.62, s.yaw, 0, "YXZ");
    scene.add(m);
    stands.push(m);
    // Roof
    const roof = new Mesh(new BoxGeometry(s.w, 0.6, 9), new MeshLambertMaterial({ color: "#0a1426" }));
    roof.position.set(s.x, 17.5, s.z);
    roof.rotation.y = s.yaw;
    roof.translateZ(-5);
    scene.add(roof);
  }

  /* Tiered end stands with real (blocky) fans, behind each goal line */
  const endStands = [buildStand(scene, -6.4, 0), buildStand(scene, 43, Math.PI)];

  /* LED boards behind the goal and along the touchlines, carrying the sponsors */
  const boardTex = new CanvasTexture(sponsorStrip(384, 72));
  boardTex.colorSpace = SRGBColorSpace;
  boardTex.anisotropy = 4;
  boardTex.wrapS = RepeatWrapping;
  const boardMat = new MeshBasicMaterial({ map: boardTex, color: "#b9c6dd" });
  const boards: Texture[] = [boardTex];
  const addBoard = (w: number, x: number, z: number, yaw: number, repeat: number) => {
    const t = boardTex.clone();
    t.repeat.set(repeat, 1);
    t.needsUpdate = true;
    boards.push(t);
    const m = new Mesh(new BoxGeometry(w, 0.9, 0.12), [boardMat, boardMat, boardMat, boardMat, new MeshBasicMaterial({ map: t, color: "#b9c6dd" }), boardMat]);
    m.position.set(x, 0.45, z);
    m.rotation.y = yaw;
    scene.add(m);
  };
  // One sponsor every ~5.5 m
  addBoard(44, 0, -4.5, 0, 1);
  addBoard(44, 0, 40, Math.PI, 1);
  addBoard(46, -22, 18, Math.PI / 2, 1.05);
  addBoard(46, 22, 18, -Math.PI / 2, 1.05);

  /* Floodlights */
  const glowMat = new MeshBasicMaterial({ color: "#fff6dc" });
  for (const [x, z] of [
    [-38, -10],
    [38, -10],
    [-38, 54],
    [38, 54],
  ]) {
    const pole = new Mesh(new CylinderGeometry(0.35, 0.5, 30, 8), new MeshLambertMaterial({ color: "#1a2438" }));
    pole.position.set(x, 15, z);
    scene.add(pole);
    const panel = new Mesh(new BoxGeometry(6, 3, 0.6), glowMat);
    panel.position.set(x, 31, z);
    panel.lookAt(0, 0, 8);
    scene.add(panel);
    const halo = new Mesh(new SphereGeometry(5, 12, 12), new MeshBasicMaterial({ color: "#fff3cf", transparent: true, opacity: 0.12 }));
    halo.position.copy(panel.position);
    scene.add(halo);
  }

  let shake = 0;
  return {
    scene,
    rippleNet(x, y, strength) {
      ripples.push({ x, y, k: strength });
    },
    shakeFrame(amount) {
      shake = Math.max(shake, amount);
    },
    update(t, dt, cheer) {
      // The LED boards rotate through the sponsors
      for (const b of boards) b.offset.x = Math.floor(t / 6) * 0.125;
      for (const s of endStands) s.update(t, cheer);
      // The crowd bounces when it cheers
      stands.forEach((s, i) => (s.position.y = 7.5 + (cheer > 0 ? Math.abs(Math.sin(t * 9 + i)) * 0.35 * cheer : 0)));
      // Net bulge decays
      for (let i = ripples.length - 1; i >= 0; i--) {
        ripples[i].k -= dt * 1.4;
        if (ripples[i].k <= 0) ripples.splice(i, 1);
      }
      for (let v = 0; v < backBase.length; v += 3) {
        let push = 0;
        for (const r of ripples) {
          const d = Math.hypot(backBase[v] - r.x, backBase[v + 1] - r.y);
          push += Math.max(0, 1 - d / 1.4) * 0.7 * r.k;
        }
        backPos[v + 2] = backBase[v + 2] - push;
      }
      backGeo.attributes.position.needsUpdate = true;
      // Frame wobble after hitting the woodwork
      shake = Math.max(0, shake - dt * 3);
      frame.position.x = Math.sin(t * 60) * 0.015 * shake;
    },
  };
}
