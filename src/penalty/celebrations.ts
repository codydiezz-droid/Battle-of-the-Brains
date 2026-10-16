import { restPose, type Pose } from "./avatar";

/*
 * Ten famous goal celebrations, as poses over time for the blocky players.
 * The celebrating player starts at (0, 0, BASE_Z) facing the camera (+z).
 * Conventions (character space): arm.x < 0 swings forward, armL.z > 0 / armR.z < 0
 * raise sideways (±PI is straight up); leg.x < 0 kicks forward, knee > 0 bends;
 * body.pitch > 0 leans forward; body.lift raises the hips.
 */

export const BASE_Z = 8;
export const CELEBRATION_SECONDS = 4.6;

export interface Celebration {
  id: string;
  name: string;
  /** Who made it famous, shown as a hint. */
  by: string;
  /** Player level needed to use it. */
  level: number;
  /** A word or two shouted in the banner. */
  shout: string;
}

export const celebrations: Celebration[] = [
  { id: "siu", name: "SIUUU", by: "Cristiano Ronaldo", level: 1, shout: "SIUUU!" },
  { id: "slide", name: "Knee slide", by: "A classic", level: 1, shout: "WHAT A FINISH!" },
  { id: "airplane", name: "Airplane", by: "A classic", level: 1, shout: "CLEARED FOR TAKEOFF!" },
  { id: "crossed", name: "Arms crossed", by: "Kylian Mbappé", level: 1, shout: "UNBOTHERED." },
  { id: "sky", name: "Point to the sky", by: "Lionel Messi", level: 2, shout: "FOR ABUELA!" },
  { id: "heart", name: "Heart hands", by: "Gareth Bale", level: 3, shout: "WITH LOVE." },
  { id: "shush", name: "Shush", by: "Away-day favourite", level: 4, shout: "SHHH…" },
  { id: "dance", name: "Victory dance", by: "Dressing-room classic", level: 5, shout: "LET’S GO!" },
  { id: "zen", name: "Zen", by: "Erling Haaland", level: 6, shout: "INNER PEACE." },
  { id: "backflip", name: "Backflip", by: "Pierre-Emerick Aubameyang", level: 7, shout: "SHOWTIME!" },
];

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};

function base(): Pose {
  const p = restPose();
  p.root.z = BASE_Z;
  p.root.yaw = 0;
  return p;
}

function run(p: Pose, e: number, speed = 14, amp = 0.8) {
  const s = Math.sin(e * speed);
  p.legL.x = s * amp;
  p.legR.x = -s * amp;
  p.kneeL = Math.max(0, -s) * 0.9 + 0.1;
  p.kneeR = Math.max(0, s) * 0.9 + 0.1;
  p.armL.x = -s * 0.6;
  p.armR.x = s * 0.6;
  p.body.lift = Math.abs(s) * 0.05;
  p.body.pitch = 0.15;
}

export function celebrationPose(id: string, e: number): Pose {
  const p = base();
  switch (id) {
    case "siu": {
      // Jog away, jump and spin to face the crowd, land legs wide, arms flung down
      if (e < 0.8) {
        p.root.yaw = Math.PI;
        p.root.z = BASE_Z - e * 2.2;
        run(p, e);
      } else if (e < 1.45) {
        const u = (e - 0.8) / 0.65;
        p.root.z = BASE_Z - 1.76;
        p.root.yaw = Math.PI * (1 - smooth(u));
        p.body.lift = Math.sin(Math.PI * u) * 1.0;
        p.armL.z = lerp(0.3, 2.6, Math.sin(Math.PI * u));
        p.armR.z = -lerp(0.3, 2.6, Math.sin(Math.PI * u));
        p.kneeL = 0.5;
        p.kneeR = 0.5;
        p.legL.x = -0.3;
        p.legR.x = -0.3;
      } else {
        const u = smooth((e - 1.45) / 0.2);
        p.root.z = BASE_Z - 1.76;
        p.legL.z = 0.55 * u;
        p.legR.z = -0.55 * u;
        p.kneeL = 0.45 * u;
        p.kneeR = 0.45 * u;
        p.body.lift = -0.18 * u;
        p.body.pitch = -0.25 * u;
        p.armL.z = lerp(2.6, 0.55, u);
        p.armR.z = -lerp(2.6, 0.55, u);
        p.armL.x = 0.55 * u;
        p.armR.x = 0.55 * u;
        p.head.x = -0.25 * u;
      }
      break;
    }
    case "sky": {
      // Walk slowly, both fingers to the sky, looking up
      const u = smooth(e / 0.6);
      p.root.z = BASE_Z + Math.min(e, 3) * 0.5;
      run(p, e, 6, 0.35);
      p.body.pitch = 0;
      p.armL.z = lerp(0.1, 2.85, u);
      p.armR.z = -lerp(0.1, 2.85, u);
      p.armL.x = -0.25 * u;
      p.armR.x = -0.25 * u;
      p.head.x = -0.5 * u;
      break;
    }
    case "crossed": {
      // Stop dead, arms folded, chin up
      const u = smooth(e / 0.5);
      p.armL.x = -1.45 * u;
      p.armR.x = -1.45 * u;
      p.armL.z = -0.75 * u;
      p.armR.z = 0.75 * u;
      p.armL.y = 0.4 * u;
      p.armR.y = -0.4 * u;
      p.body.pitch = -0.1 * u;
      p.head.x = -0.22 * u;
      p.legL.z = 0.12;
      p.legR.z = -0.12;
      break;
    }
    case "slide": {
      // Sprint at the camera, drop onto the knees and slide, arms wide
      if (e < 0.9) {
        p.root.z = BASE_Z - 2 + e * 3.4;
        run(p, e, 16);
      } else {
        const u = smooth((e - 0.9) / 0.3);
        const slide = 1 - Math.exp(-(e - 0.9) * 2.2);
        p.root.z = BASE_Z - 2 + 0.9 * 3.4 + slide * 2.2;
        p.body.lift = -0.5 * u;
        p.legL.x = 0.05;
        p.legR.x = 0.05;
        p.kneeL = 1.55 * u;
        p.kneeR = 1.55 * u;
        p.body.pitch = -0.45 * u;
        p.armL.z = lerp(0.2, 1.7, u);
        p.armR.z = -lerp(0.2, 1.7, u);
        p.armL.x = 0.3 * u;
        p.armR.x = 0.3 * u;
        p.head.x = -0.35 * u;
      }
      break;
    }
    case "airplane": {
      // Wings out, banking round in a circle
      const r = 1.8;
      const a = e * 1.6;
      p.root.x = Math.sin(a) * r;
      p.root.z = BASE_Z - r + Math.cos(a) * r;
      p.root.yaw = a + Math.PI / 2;
      run(p, e, 13, 0.6);
      p.armL.z = 1.55;
      p.armR.z = -1.55;
      p.armL.x = 0;
      p.armR.x = 0;
      p.body.roll = -0.4;
      break;
    }
    case "zen": {
      // Sit cross-legged and meditate
      const u = smooth(e / 0.7);
      p.body.lift = -0.62 * u;
      p.legL.x = -1.45 * u;
      p.legR.x = -1.45 * u;
      p.legL.z = 0.55 * u;
      p.legR.z = -0.55 * u;
      p.kneeL = 1.7 * u;
      p.kneeR = 1.7 * u;
      p.armL.x = -0.55 * u;
      p.armR.x = -0.55 * u;
      p.armL.z = 0.35 * u;
      p.armR.z = -0.35 * u;
      p.head.x = 0.12 * u;
      p.body.pitch = 0.04;
      break;
    }
    case "heart": {
      // Hands make a heart in front of the chest, a little sway
      const u = smooth(e / 0.5);
      p.armL.x = -1.65 * u;
      p.armR.x = -1.65 * u;
      p.armL.z = -0.5 * u;
      p.armR.z = 0.5 * u;
      p.body.roll = Math.sin(e * 2.5) * 0.05;
      p.head.z = Math.sin(e * 2.5) * 0.08;
      break;
    }
    case "shush": {
      // Finger to the lips, other hand on the hip, a slow walk
      const u = smooth(e / 0.5);
      p.root.z = BASE_Z + Math.min(e, 3) * 0.35;
      run(p, e, 5, 0.25);
      p.body.pitch = 0;
      p.armR.x = -2.45 * u;
      p.armR.z = 0.42 * u;
      p.armL.z = 0.65 * u;
      p.armL.x = 0.35 * u;
      p.head.y = -0.15 * u;
      break;
    }
    case "dance": {
      // Hips sway, arms take turns going up
      const s = Math.sin(e * 6);
      p.root.x = s * 0.15;
      p.body.roll = s * 0.18;
      p.body.lift = Math.abs(Math.sin(e * 12)) * 0.08;
      p.armL.z = 1.2 + Math.max(0, s) * 1.6;
      p.armR.z = -(1.2 + Math.max(0, -s) * 1.6);
      p.legL.z = 0.15 + Math.max(0, s) * 0.2;
      p.legR.z = -0.15 - Math.max(0, -s) * 0.2;
      p.kneeL = 0.2 + Math.max(0, -s) * 0.3;
      p.kneeR = 0.2 + Math.max(0, s) * 0.3;
      p.head.z = -s * 0.15;
      break;
    }
    case "backflip": {
      // Crouch, launch, a full backward somersault, land, arms up
      if (e < 0.35) {
        const u = smooth(e / 0.35);
        p.body.lift = -0.3 * u;
        p.kneeL = 0.9 * u;
        p.kneeR = 0.9 * u;
        p.legL.x = -0.4 * u;
        p.legR.x = -0.4 * u;
        p.armL.x = 0.8 * u;
        p.armR.x = 0.8 * u;
      } else if (e < 1.15) {
        const u = (e - 0.35) / 0.8;
        p.body.lift = Math.sin(Math.PI * u) * 1.5 - 0.1;
        p.body.pitch = -Math.PI * 2 * smooth(u);
        const tuck = Math.sin(Math.PI * u);
        p.kneeL = 1.6 * tuck;
        p.kneeR = 1.6 * tuck;
        p.legL.x = -1.2 * tuck;
        p.legR.x = -1.2 * tuck;
        p.armL.x = -1.4 * tuck;
        p.armR.x = -1.4 * tuck;
      } else {
        const u = smooth((e - 1.15) / 0.3);
        p.body.lift = -0.25 * (1 - u);
        p.kneeL = 0.6 * (1 - u);
        p.kneeR = 0.6 * (1 - u);
        p.armL.z = 2.8 * u;
        p.armR.z = -2.8 * u;
      }
      break;
    }
  }
  return p;
}
