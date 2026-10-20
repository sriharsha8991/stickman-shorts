import React from "react";
import { Easing, interpolate } from "remotion";

// Stick-figure animation engine (snappy, physical, cartoon-action style).
// Angles in degrees. Convention: dir(a) = (sin a, cos a) in screen coordinates,
// so 0 = down, 90 = right, -90 = left, 180 = up.
// Upper limbs are relative to the torso (0 = hanging down); forearms/shins are relative to the upper limb.

export type Pose = {
  x: number; // hip position
  y: number;
  lean: number; // torso lean (>0 leans right)
  head: number; // head tilt
  la1: number; // left upper arm (shoulder)
  la2: number; // left forearm (elbow)
  ra1: number;
  ra2: number;
  ll1: number; // left thigh (hip)
  ll2: number; // left shin (knee)
  rl1: number;
  rl2: number;
  rot: number; // whole-body rotation around the hip (flips, falls)
};

export const STAND: Pose = {
  x: 960,
  y: 760,
  lean: 0,
  head: 0,
  la1: -18,
  la2: 8,
  ra1: 18,
  ra2: -8,
  ll1: -12,
  ll2: 4,
  rl1: 12,
  rl2: -4,
  rot: 0,
};

export const P = {
  stand: {} as Partial<Pose>,
  armsUp: { la1: -160, la2: -10, ra1: 160, ra2: 10 },
  cheer: { la1: -150, la2: -30, ra1: 150, ra2: 30, head: -6 },
  pointR: { ra1: 95, ra2: 0, la1: -15, la2: 10 },
  pointL: { la1: -95, la2: 0, ra1: 15, ra2: -10 },
  shrug: { la1: -55, la2: -100, ra1: 55, ra2: 100, head: 8 },
  think: { ra1: 30, ra2: 145, la1: 25, la2: 80, head: 10 },
  crouch: { y: 790, ll1: -60, ll2: 95, rl1: 50, rl2: 90, lean: 10, la1: -40, la2: -30, ra1: 40, ra2: 30 },
  punchR: { lean: 14, ra1: 92, ra2: 0, la1: -40, la2: -110, ll1: -30, ll2: 10, rl1: 35, rl2: -5 },
  kickR: { lean: -30, rl1: 105, rl2: 0, ll1: -10, ll2: 5, la1: -100, la2: 20, ra1: -20, ra2: -40 },
  carry: { la1: -160, la2: -30, ra1: 160, ra2: 30, lean: 0, ll1: -15, ll2: 15, rl1: 15, rl2: -10 },
  hold: { la1: 50, la2: 60, ra1: 70, ra2: 40 },
  facepalm: { ra1: 160, ra2: 120, head: 20, lean: 5 },
  sit: { y: 800, ll1: 80, ll2: -80, rl1: 95, rl2: -85, lean: -5 },
  handshake: { ra1: 70, ra2: 10, la1: -15, la2: 10 },
  sad: { lean: 12, head: 25, la1: -5, la2: 0, ra1: 5, ra2: 0 },
  shock: { la1: -120, la2: -40, ra1: 120, ra2: 40, head: -10, lean: -8 },
} satisfies Record<string, Partial<Pose>>;

const rad = (d: number) => (d * Math.PI) / 180;
const dir = (a: number) => [Math.sin(rad(a)), Math.cos(rad(a))] as const;

export type Joints = {
  hip: [number, number];
  neck: [number, number];
  headC: [number, number];
  lElbow: [number, number];
  lHand: [number, number];
  rElbow: [number, number];
  rHand: [number, number];
  lKnee: [number, number];
  lFoot: [number, number];
  rKnee: [number, number];
  rFoot: [number, number];
  headR: number;
};

export const solve = (p: Pose, s = 1, facing = 1): Joints => {
  const T = 78 * s,
    UA = 40 * s,
    FA = 38 * s,
    TH = 48 * s,
    SH = 46 * s,
    R = 24 * s;
  // every offset is relative to the hip, then rotated by rot and mirrored by facing
  const body = -p.lean;
  const up = dir(180 - p.lean);
  const neck = [up[0] * T, up[1] * T];
  const hd = dir(180 - p.lean + p.head);
  const headC = [neck[0] + hd[0] * (R + 3), neck[1] + hd[1] * (R + 3)];
  const limb = (o: number[], a1: number, a2: number, L1: number, L2: number, ref = body) => {
    const d1 = dir(ref + a1);
    const e = [o[0] + d1[0] * L1, o[1] + d1[1] * L1];
    const d2 = dir(ref + a1 + a2);
    return [e, [e[0] + d2[0] * L2, e[1] + d2[1] * L2]];
  };
  const sh = [neck[0] * 0.92, neck[1] * 0.92];
  const [lE, lH] = limb(sh, p.la1, p.la2, UA, FA);
  const [rE, rH] = limb(sh, p.ra1, p.ra2, UA, FA);
  // legs use the vertical reference, not the torso's
  const [lK, lF] = limb([0, 0], p.ll1, p.ll2, TH, SH, 0);
  const [rK, rF] = limb([0, 0], p.rl1, p.rl2, TH, SH, 0);
  const c = Math.cos(rad(p.rot)),
    sn = Math.sin(rad(p.rot));
  const tr = (v: number[]): [number, number] => {
    const x = v[0] * c - v[1] * sn;
    const y = v[0] * sn + v[1] * c;
    return [p.x + x * facing, p.y + y];
  };
  return {
    hip: [p.x, p.y],
    neck: tr(neck),
    headC: tr(headC),
    lElbow: tr(lE),
    lHand: tr(lH),
    rElbow: tr(rE),
    rHand: tr(rH),
    lKnee: tr(lK),
    lFoot: tr(lF),
    rKnee: tr(rK),
    rFoot: tr(rF),
    headR: R,
  };
};

export type Accessory = "tie" | "scarf" | "tophat" | "crown" | "cap" | "glasses" | "none";

const pts = (...a: [number, number][]) => a.map((v) => v.join(",")).join(" ");

export const Figure: React.FC<{
  pose: Pose;
  color: string;
  scale?: number;
  facing?: number;
  accessory?: Accessory;
  opacity?: number;
  face?: "none" | "eyes" | "angry" | "sad" | "happy";
  label?: string;
  labelColor?: string;
  draw?: number; // 0..1: the figure is progressively "drawn" (pencil stroke)
  children?: (j: Joints) => React.ReactNode;
  behind?: (j: Joints) => React.ReactNode;
}> = ({ pose, color, scale = 1, facing = 1, accessory = "none", opacity = 1, face = "none", label, labelColor, draw = 1, children, behind }) => {
  const j = solve(pose, scale, facing);
  const w = 12 * scale;
  const st = {
    stroke: color,
    strokeWidth: w,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
  };
  const R = j.headR;
  const [hx, hy] = j.headC;
  // stroke progress per part: head, torso, arms, legs
  const seg = (a: number, b: number) => Math.max(0, Math.min(1, (draw - a) / (b - a)));
  const dash = (t: number) =>
    draw >= 1 ? {} : { pathLength: 1, strokeDasharray: `${t} 2`, opacity: t > 0 ? 1 : 0 };
  const dHead = seg(0, 0.3),
    dTorso = seg(0.3, 0.45),
    dArms = seg(0.45, 0.72),
    dLegs = seg(0.72, 1);
  // head "up" direction, used to orient accessories
  const ux = (hx - j.neck[0]) / (R + 3);
  const uy = (hy - j.neck[1]) / (R + 3);
  const ang = (Math.atan2(uy, ux) * 180) / Math.PI + 90;
  return (
    <g opacity={opacity}>
      {behind?.(j)}
      <polyline points={pts(j.lFoot, j.lKnee, j.hip, j.rKnee, j.rFoot)} {...st} {...dash(dLegs)} />
      <polyline points={pts(j.lHand, j.lElbow, j.neck, j.rElbow, j.rHand)} {...st} {...dash(dArms)} />
      <line x1={j.neck[0]} y1={j.neck[1]} x2={j.hip[0]} y2={j.hip[1]} {...st} {...dash(dTorso)} />
      {accessory === "tie" && (
        <polygon
          points={pts(
            [j.neck[0] * 0.85 + j.hip[0] * 0.15 - 6 * scale, j.neck[1] * 0.85 + j.hip[1] * 0.15],
            [j.neck[0] * 0.85 + j.hip[0] * 0.15 + 6 * scale, j.neck[1] * 0.85 + j.hip[1] * 0.15],
            [j.neck[0] * 0.45 + j.hip[0] * 0.55, j.neck[1] * 0.45 + j.hip[1] * 0.55],
          )}
          fill="#d6263b"
          stroke="#1a1a1a"
          strokeWidth={2.5 * scale}
          strokeLinejoin="round"
        />
      )}
      {draw >= 1 ? (
        <circle cx={hx} cy={hy} r={R} fill={color} />
      ) : (
        <circle cx={hx} cy={hy} r={R - w / 2} {...st} fill={dHead >= 1 ? color : "none"} {...dash(dHead)} />
      )}
      <g transform={`translate(${hx} ${hy}) rotate(${ang}) scale(${facing} 1)`}>
        {face !== "none" && draw >= 1 && (
          <>
            <ellipse cx={7 * scale} cy={-3 * scale} rx={3.2 * scale} ry={4.6 * scale} fill="#fff" />
            <ellipse cx={15 * scale} cy={-3 * scale} rx={3.2 * scale} ry={4.6 * scale} fill="#fff" />
            {face === "angry" && (
              <path d={`M${3 * scale},${-11 * scale} L${19 * scale},${-7 * scale}`} stroke="#fff" strokeWidth={3 * scale} strokeLinecap="round" />
            )}
            {face === "sad" && (
              <path d={`M${3 * scale},${-8 * scale} L${19 * scale},${-12 * scale}`} stroke="#fff" strokeWidth={3 * scale} strokeLinecap="round" />
            )}
            {face === "happy" && (
              <path d={`M${6 * scale},${7 * scale} Q${11 * scale},${12 * scale} ${16 * scale},${7 * scale}`} stroke="#fff" strokeWidth={2.6 * scale} fill="none" strokeLinecap="round" />
            )}
          </>
        )}
        {accessory === "scarf" && (
          <>
            {/* headscarf: cap on the head plus cloth falling behind the neck */}
            <path
              d={`M${R + 3 * scale},${-9 * scale} Q${R + 3 * scale},${-R - 7 * scale} 0,${-R - 7 * scale} Q${-R - 4 * scale},${-R - 7 * scale} ${-R - 5 * scale},${-2 * scale} L${-R - 12 * scale},${R + 24 * scale} L${-R + 8 * scale},${R + 16 * scale} L${-R + 6 * scale},${-9 * scale} Z`}
              fill="#ffffff"
              stroke="#1a1a1a"
              strokeWidth={3 * scale}
              strokeLinejoin="round"
            />
            <rect x={-R - 3 * scale} y={-R * 0.62} width={2 * R + 6 * scale} height={6 * scale} rx={3 * scale} fill="#1a1a1a" />
          </>
        )}
        {accessory === "tophat" && (
          <>
            <rect x={-R - 8 * scale} y={-R - 2 * scale} width={2 * R + 16 * scale} height={7 * scale} rx={3 * scale} fill="#1a1a1a" />
            <rect x={-R + 2 * scale} y={-R - 34 * scale} width={2 * R - 4 * scale} height={34 * scale} rx={3 * scale} fill="#1a1a1a" />
            <rect x={-R + 2 * scale} y={-R - 10 * scale} width={2 * R - 4 * scale} height={6 * scale} fill="#d6263b" />
          </>
        )}
        {accessory === "crown" && (
          <polygon
            points={`${-R},${-R + 6 * scale} ${-R},${-R - 18 * scale} ${-R / 2},${-R - 6 * scale} 0,${-R - 22 * scale} ${R / 2},${-R - 6 * scale} ${R},${-R - 18 * scale} ${R},${-R + 6 * scale}`}
            fill="#f2c12e"
            stroke="#1a1a1a"
            strokeWidth={3 * scale}
            strokeLinejoin="round"
          />
        )}
        {accessory === "cap" && (
          <>
            <path d={`M${-R},${-4 * scale} Q0,${-R - 16 * scale} ${R},${-4 * scale} Z`} fill="#1a1a1a" />
            <rect x={0} y={-8 * scale} width={R + 16 * scale} height={6 * scale} rx={3 * scale} fill="#1a1a1a" />
          </>
        )}
        {accessory === "glasses" && (
          <>
            <rect x={1 * scale} y={-9 * scale} width={11 * scale} height={9 * scale} rx={3 * scale} fill="#111" />
            <rect x={13 * scale} y={-9 * scale} width={11 * scale} height={9 * scale} rx={3 * scale} fill="#111" />
          </>
        )}
      </g>
      {label && (
        <text
          x={hx}
          y={hy - R - (accessory === "tophat" ? 52 : accessory === "scarf" || accessory === "crown" ? 36 : 16) * scale}
          textAnchor="middle"
          fontFamily="Bangers"
          fontSize={30 * scale}
          letterSpacing={1.5}
          fill={labelColor ?? color}
          stroke="#fafaf7"
          strokeWidth={6}
          paintOrder="stroke"
        >
          {label}
        </text>
      )}
      {children?.(j)}
    </g>
  );
};

// ---------- pose animation -----------

export type Key = { f: number; p: Partial<Pose>; e?: (t: number) => number };

export const SNAP = Easing.bezier(0.2, 0.9, 0.25, 1.15); // snap with slight overshoot
export const SMOOTH = Easing.bezier(0.45, 0, 0.55, 1);
export const HOLD = () => 0;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// keys are cumulative: each key inherits unspecified values from the previous one
export const poseAt = (f: number, keys: Key[], base: Pose = STAND): Pose => {
  const full: Pose[] = [];
  let acc = { ...base };
  for (const k of keys) {
    acc = { ...acc, ...k.p };
    full.push(acc);
  }
  if (keys.length === 0) return base;
  if (f <= keys[0].f) return full[0];
  for (let i = 1; i < keys.length; i++) {
    if (f <= keys[i].f) {
      const a = keys[i - 1].f;
      const b = keys[i].f;
      const t = (keys[i].e ?? SNAP)(interpolate(f, [a, b], [0, 1]));
      const A = full[i - 1];
      const B = full[i];
      const out = {} as Pose;
      (Object.keys(A) as (keyof Pose)[]).forEach((n) => {
        out[n] = lerp(A[n], B[n], t);
      });
      return out;
    }
  }
  return full[full.length - 1];
};

// run cycle, added on top of a pose
export const runCycle = (f: number, speed = 0.45, amp = 1): Partial<Pose> => {
  const s = Math.sin(f * speed);
  const c = Math.cos(f * speed);
  return {
    lean: 14 * amp,
    ll1: -45 * s * amp,
    ll2: (35 + 35 * Math.max(0, -c)) * amp,
    rl1: 45 * s * amp,
    rl2: (35 + 35 * Math.max(0, c)) * amp,
    la1: 50 * s * amp,
    la2: -70 * amp,
    ra1: -50 * s * amp,
    ra2: -70 * amp,
  };
};

export const walkCycle = (f: number, speed = 0.22): Partial<Pose> => {
  const s = Math.sin(f * speed);
  return {
    ll1: -22 * s,
    ll2: 10 + 12 * Math.max(0, s),
    rl1: 22 * s,
    rl2: 10 + 12 * Math.max(0, -s),
    la1: 20 * s - 6,
    la2: -10,
    ra1: -20 * s + 6,
    ra2: 10,
  };
};

// idle "breathing": small continuous motion that keeps characters alive
export const idle = (f: number, seed = 0): Partial<Pose> => ({
  y: Math.sin(f * 0.12 + seed) * 1.6,
  la1: Math.sin(f * 0.1 + seed) * 2,
  ra1: -Math.sin(f * 0.1 + seed) * 2,
});

export const addPose = (p: Pose, d: Partial<Pose>, replace = false): Pose => {
  const o = { ...p };
  (Object.keys(d) as (keyof Pose)[]).forEach((k) => {
    o[k] = replace ? (d[k] as number) : o[k] + (d[k] as number);
  });
  return o;
};

// animated figure with motion trails (smears) when it moves fast
export const Actor: React.FC<{
  f: number;
  keys: Key[];
  color: string;
  base?: Partial<Pose>;
  scale?: number;
  facing?: number | ((f: number) => number);
  accessory?: Accessory;
  face?: "none" | "eyes" | "angry" | "sad" | "happy";
  label?: string;
  mod?: (f: number, p: Pose) => Pose;
  trails?: boolean;
  opacity?: number;
  draw?: number;
  children?: (j: Joints) => React.ReactNode;
  behind?: (j: Joints) => React.ReactNode;
}> = ({ f, keys, color, base, scale = 1, facing = 1, accessory, face = "eyes", label, mod, trails = true, opacity = 1, draw, children, behind }) => {
  const b = { ...STAND, ...base };
  const get = (t: number) => {
    const p = poseAt(t, keys, b);
    return mod ? mod(t, p) : p;
  };
  const fc = (t: number) => (typeof facing === "function" ? facing(t) : facing);
  const now = get(f);
  const ghosts: React.ReactNode[] = [];
  if (trails) {
    [3, 2, 1].forEach((d) => {
      const g = get(f - d);
      const dist = Math.hypot(g.x - now.x, g.y - now.y) + Math.abs(g.rot - now.rot) * 1.5;
      if (dist > 26) {
        ghosts.push(
          <Figure key={d} pose={g} color={color} scale={scale} facing={fc(f - d)} opacity={(0.32 - d * 0.08) * opacity} />,
        );
      }
    });
  }
  return (
    <>
      {ghosts}
      <Figure
        pose={now}
        color={color}
        scale={scale}
        facing={fc(f)}
        accessory={accessory}
        face={face}
        label={label}
        opacity={opacity}
        draw={draw}
        behind={behind}
      >
        {children}
      </Figure>
    </>
  );
};

// hip y so the feet touch the ground (ground line ~852)
export const groundY = (s = 1, ground = 852) => ground - 92.5 * s;
