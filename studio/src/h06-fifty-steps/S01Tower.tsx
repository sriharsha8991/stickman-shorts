import React from "react";
import { AbsoluteFill, Easing, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { Actor, addPose, idle, runCycle, walkCycle, type Pose } from "../stickman/stick";
import { COL, FONT } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, K, VoiceCaptions } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { G, gestureKeys, hop, nod, shake } from "../shared/gestures";
import { popIn, squash, wobble } from "../shared/motion";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// H06 · "How many stairs a day help your heart?" (~37 s, promise → build → reveal, Myth check, Move)
// ONE world, taller than the screen, one VERTICAL camera rig (a first for the channel):
// a cut-away apartment tower at dusk. Lobby + lift at the bottom, a zigzag staircase to the roof.
// Spark carries FIVE RED BLOCKS of heart risk up the stairs. Every step he passes turns yellow and a counter runs:
// up to 50 steps the stack stays at five (no clear change). Lights drop. Step 51 onto the last flight → the roof at sunrise,
// the camera pulls back to the whole tower with its yellow zigzag, the top block falls off and smashes on the street.
// Numbers: Song et al. 2023, Atherosclerosis (UK Biobank, 458,860 adults, 12.5 years) — see facts.md.

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const E = (cue: number) => VOICE_CUES[cue].endFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const eio = Easing.inOut(Easing.cubic);
const eo = Easing.out(Easing.cubic);
const ei = Easing.in(Easing.quad);
const sio = Easing.inOut(Easing.sin);

// palette: dusk periwinkle → sunrise coral, brick tower, sage stairwell, slate stairs, red risk blocks, yellow steps (no teal except Spark)
const DUSK = "#4c5aa0";
const DAWN = "#ffbf8a";
const DUSK2 = "#3a4684";
const DAWN2 = "#f48f6e";
const BRICK = "#b4523f";
const BRICK2 = "#96412f";
const SAGE = "#dfe8c6";
const SAGE2 = "#cbd9ae";
const SHAFT = "#a9b892";
const SHAFT2 = "#8fa07a";
const SLATE = "#37415f";
const SLATE2 = "#4c587b";
const CREAM = "#fff6dc";
const RED = "#e23b3b";
const RED2 = "#b52a2a";
const STEEL = "#d5dce3";
const STEEL2 = "#a5b1bd";
const STREET = "#2e3148";
const WHITE = "#ffffff";
const YEL = "#ffd23f";
const INK = COL.ink;

// --- the tower -----------------------------------------------------------------------------------------------------------
const LV = [GROUND, 850, 410, -30, -470]; // floor heights: lobby, 3 landings, roof
const XL = 520; // left end of a flight
const XR = 975; // right end of a flight
const TW = 1060; // tower right wall
const STEPS = [17, 17, 16, 10]; // steps per flight: 17 + 17 + 16 = 50, the last flight is the 'above fifty'
const ROOF = LV[4];

// all the steps as [x, y(tread), width, flight]
const allSteps = (() => {
  const out: { x0: number; x1: number; y: number; h: number }[] = [];
  STEPS.forEach((n, i) => {
    const goesRight = i % 2 === 0;
    const y0 = LV[i];
    const y1 = LV[i + 1];
    const rise = (y0 - y1) / n;
    const run = (XR - XL) / n;
    for (let k = 0; k < n; k++) {
      const x0 = goesRight ? XL + run * k : XR - run * (k + 1);
      out.push({ x0, x1: x0 + run, y: y0 - rise * (k + 1), h: rise });
    }
  });
  return out;
})();

// --- timing ---------------------------------------------------------------------------------------------------------------
const STOP = W(0, 0);
const N50 = W(0, 4);
const LIFT = W(0, 10);
const PROM = C(1);
const WAIT = W(1, 0);
const WHY = W(1, 7);
const SCI = C(2);
const ASKED = W(2, 1);
const ADULTS = W(2, 3);
const HOME = W(2, 5);
const FOLLOW = W(2, 8);
const LETS = C(3);
const FIVE = W(3, 3);
const BLK = FIVE; // first block lands
const RISKW = W(3, 7);
const CL0 = RISKW + 2; // start climbing
const FL = 37; // frames per flight
const F1 = CL0 + FL;
const F2 = F1 + 3 + FL;
const F3 = F2 + 3 + FL;
const NOTHING = W(4, 6);
const CHANGED = W(4, 8);
const DROP = E(4) + 2;
const BUT = C(5);
const F4A = W(5, 0) + 4; // the foot goes for the next step
const F4B = W(5, 3) + 2; // reaches the roof
const OUT1 = F4B + 12; // walks out onto the roof
const PULL0 = F4B + 2;
const PULL1 = W(5, 7) + 8;
const ONE = W(5, 8);
const FIFTH = W(5, 9);
const LAUNCH = FIFTH - 2;
const LAND = LAUNCH + 22;
const CAV = C(6);
const NOTP = W(6, 8);
const ACT = C(7);
const SL0 = ACT + 2; // slides down the rail
const SL1 = W(7, 4) + 2;
const STAIRSW = W(7, 5);
const Q = C(8);
const LOOP = VOICE_FRAMES - 10;

// --- camera rig: hold → move (ease in-out) → hold. [start, end, focal x, focal y, zoom] ---------------------------------------
type CamKey = [number, number, number, number, number];
const WIDE: [number, number, number] = [1032, 450, 0.5];
const RIG: CamKey[] = [
  [0, 0, 330, 1020, 1.2], // frame 0: lift + Spark
  [PROM - 8, PROM + 12, 395, 1000, 1.36], // CU promise
  [SCI - 10, SCI + 12, 540, 985, 0.98], // lobby + the adults
  [LETS - 4, LETS + 14, 610, 1000, 1.08], // the stair foot
  [CL0, F1, 600, LV[1] - 60, 0.98], // up the first flight
  [F1 + 2, F2, 600, LV[2] - 60, 0.98],
  [F2 + 2, F3, 720, LV[3] - 60, 0.98],
  [F3 + 2, BUT - 2, 800, LV[3] - 150, 1.28], // slow push at the landing: nothing changed
  [F4A - 2, F4B, 640, ROOF + 30, 1.0], // the last flight
  [PULL0, PULL1, WIDE[0], WIDE[1], WIDE[2]], // the whole tower. Arrives before the block falls
  [PULL1 + 1, LAND + 18, WIDE[0] + 2, WIDE[1] + 1, WIDE[2] * 1.01], // the whole tower held: block falls, smashes
  [LAND + 20, LAND + 40, 922, ROOF - 165, 0.85], // closer on Spark's face, the 1/5 stays on the right
  [CAV - 8, CAV + 14, 650, ROOF - 110, 1.04], // Spark on the roof: the caveat
  [SL0, SL1, 560, 1000, 1.04], // down the whole staircase
  [Q - 12, Q + 8, 330, 1020, 1.2], // frame 0 again
];
const camAtRig = (f: number) => {
  let cur = { fx: RIG[0][2], fy: RIG[0][3], z: RIG[0][4] };
  for (const [a, b, fx, fy, z] of RIG) {
    if (f < a) break;
    const k = b <= a ? 1 : interpolate(f, [a, b], [0, 1], { ...clamp, easing: eio });
    cur = { fx: cur.fx + (fx - cur.fx) * k, fy: cur.fy + (fy - cur.fy) * k, z: cur.z + (z - cur.z) * k };
  }
  return { x: cur.fx - 540, y: cur.fy - 960, z: cur.z };
};

// --- Spark's path on the stairs: [frame, x, feet y] (ease per segment) ---------------------------------------------------------
type PathKey = [number, number, number];
const SX0 = 420;
const SXL = 196; // beside the lift while the scientist talks
const SXR = 640; // roof
const PATH: PathKey[] = [
  [0, SX0, GROUND],
  [SCI - 12, SX0, GROUND],
  [SCI + 14, SXL, GROUND],
  [LETS - 2, SXL, GROUND],
  [LETS + 24, XL - 44, GROUND],
  [CL0, XL - 44, GROUND],
  [CL0 + 6, XL, GROUND],
  [F1, XR, LV[1]],
  [F1 + 3, XR + 26, LV[1]],
  [F1 + 6, XR, LV[1]],
  [F2, XL, LV[2]],
  [F2 + 3, XL - 30, LV[2]],
  [F2 + 6, XL, LV[2]],
  [F3, XR, LV[3]],
  [F4A, XR, LV[3]],
  [F4B, XL, ROOF],
  [OUT1, SXR, ROOF],
  [SL0, SXR, ROOF],
  // sliding down the rail, all four flights
  [SL0 + 6, XL, ROOF],
  [SL0 + 13, XR, LV[3]],
  [SL0 + 20, XL, LV[2]],
  [SL0 + 27, XR, LV[1]],
  [SL1 - 2, XL, GROUND],
  [SL1 + 12, SX0, GROUND],
];
const pathAt = (f: number): [number, number] => {
  if (f <= PATH[0][0]) return [PATH[0][1], PATH[0][2]];
  for (let i = 1; i < PATH.length; i++) {
    const [a, ax, ay] = PATH[i - 1];
    const [b, bx, by] = PATH[i];
    if (f <= b) {
      const k = b <= a ? 1 : interpolate(f, [a, b], [0, 1], { ...clamp, easing: sio });
      return [ax + (bx - ax) * k, ay + (by - ay) * k];
    }
  }
  const l = PATH[PATH.length - 1];
  return [l[1], l[2]];
};
const climbing = (t: number) => (t >= CL0 && t < F3) || (t >= F4A && t < OUT1);
const sliding = (t: number) => t >= SL0 && t < SL1;
const walking = (t: number) => (t >= SCI - 12 && t < SCI + 14) || (t >= LETS - 2 && t < LETS + 24) || (t >= SL1 && t < SL1 + 12);

// lit steps (0..60) follow his feet
const stepCount = (f: number) => {
  if (f < CL0 + 4) return 0;
  const a = interpolate(f, [CL0 + 4, F1], [0, 17], { ...clamp, easing: sio });
  const b = interpolate(f, [F1 + 6, F2], [0, 17], { ...clamp, easing: sio });
  const c = interpolate(f, [F2 + 6, F3], [0, 16], { ...clamp, easing: sio });
  const d = interpolate(f, [F4A, F4B], [0, 10], { ...clamp, easing: sio });
  return Math.round(a + b + c + d);
};

// --- helpers ---------------------------------------------------------------------------------------------------------------
const Txt: React.FC<{ x?: number; y: number; s: number; c?: string; children: React.ReactNode; a?: "middle" | "start" | "end" }> = ({ x = 0, y, s, c = INK, children, a = "middle" }) => (
  <text x={x} y={y} textAnchor={a} fontFamily={FONT.title} fontWeight={900} fontSize={s} fill={c}>
    {children}
  </text>
);

const Bubble: React.FC<{ w: number; h: number; fill?: string; tail?: number; children: React.ReactNode }> = ({ w, h, fill = WHITE, tail = -30, children }) => (
  <g>
    <path d={`M ${tail - 26} ${h / 2 - 6} L ${tail} ${h / 2 + 36} L ${tail + 26} ${h / 2 - 6} Z`} fill={fill} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={26} fill={fill} stroke={INK} strokeWidth={5} />
    <rect x={tail - 22} y={h / 2 - 10} width={44} height={8} fill={fill} />
    {children}
  </g>
);

// one red block of risk
const Block: React.FC<{ w: number; h: number; label?: boolean }> = ({ w, h, label = true }) => (
  <g>
    <rect x={-w / 2} y={-h} width={w} height={h} rx={9} fill={RED} {...K} strokeWidth={6} />
    <rect x={-w / 2 + 7} y={-h + 7} width={w - 14} height={h * 0.22} rx={4} fill="#ff7a6e" />
    {label && (
      <Txt y={-h * 0.27} s={h * 0.5} c={WHITE}>
        RISK
      </Txt>
    )}
  </g>
);

const Lift: React.FC<{ f: number; open: number; ding: number }> = ({ f, open, ding }) => {
  const dw = 110;
  const h = 390;
  return (
    <g>
      {/* frame */}
      <rect x={-dw - 22} y={-h - 22} width={dw * 2 + 44} height={h + 22} rx={8} fill={STEEL2} {...K} strokeWidth={7} />
      {/* the cabin inside */}
      <rect x={-dw} y={-h} width={dw * 2} height={h} fill="#ffe7a8" />
      <rect x={-dw} y={-40} width={dw * 2} height={40} fill="#cfa86a" />
      <rect x={-46} y={-h + 60} width={92} height={120} rx={6} fill="#fff4cf" stroke={INK} strokeWidth={4} opacity={0.7} />
      {/* two doors */}
      <rect x={-dw - dw * open * 0.92} y={-h} width={dw} height={h} fill={STEEL} {...K} strokeWidth={6} />
      <rect x={dw * open * 0.92} y={-h} width={dw} height={h} fill={STEEL} {...K} strokeWidth={6} />
      {/* floor display + arrow */}
      <rect x={-68} y={-h - 90} width={136} height={58} rx={10} fill={INK} />
      <path d="M -42 -498 L -26 -520 L -10 -498 Z" transform={`translate(0 ${-h + 390})`} fill={f % 40 < 20 && open > 0 ? YEL : "#666"} />
      <Txt x={26} y={-h - 44} s={44} c={YEL}>
        1
      </Txt>
      {/* ding rays */}
      {ding > 0.01 &&
        [-46, -22, 0, 22, 46].map((a, i) => (
          <line key={i} x1={Math.sin((a * Math.PI) / 180) * 80} y1={-h - 80 - Math.cos((a * Math.PI) / 180) * 26} x2={Math.sin((a * Math.PI) / 180) * (80 + 40 * ding)} y2={-h - 86 - Math.cos((a * Math.PI) / 180) * (26 + 44 * ding)} stroke={YEL} strokeWidth={8} strokeLinecap="round" />
        ))}
      {/* call button */}
      <rect x={dw + 30} y={-210} width={40} height={72} rx={8} fill={STEEL} {...K} strokeWidth={4} />
      <circle cx={dw + 50} cy={-174} r={12} fill={open > 0 ? YEL : "#fff"} {...K} strokeWidth={3} />
    </g>
  );
};

// the world: sky, city, street, tower -----------------------------------------------------------------------------------------
const World: React.FC<{ f: number; lit: number; dawn: number }> = ({ f, lit, dawn }) => {
  const sky = interpolateColors(dawn, [0, 1], [DUSK, DAWN]);
  const sky2 = interpolateColors(dawn, [0, 1], [DUSK2, DAWN2]);
  const cityC = interpolateColors(dawn, [0, 1], ["#2e3768", "#8d4f6c"]);
  const city2 = interpolateColors(dawn, [0, 1], ["#3a4478", "#b86a70"]);
  const sunY = interpolate(dawn, [0, 1], [1460, 800]);
  const wins = dawn > 0.5 ? "#ffe9a8" : YEL;
  return (
    <g>
      {/* sky: flat bands, no gradients */}
      <rect x={-2200} y={-2800} width={6000} height={5200} fill={sky} />
      <rect x={-2200} y={520} width={6000} height={900} fill={sky2} opacity={0.32} />
      {[[1290, -560, 1.1], [1700, -120, 0.85], [1160, 250, 0.7]].map(([x, y, k], i) => (
        <g key={i} transform={`translate(${x + f * 0.05 * (i + 1)} ${y}) scale(${k})`} fill={interpolateColors(dawn, [0, 1], ["#6a78b8", "#fff0dc"])}>
          <rect x={-170} y={-34} width={340} height={68} rx={34} />
          <circle cx={-56} cy={-42} r={54} />
          <circle cx={46} cy={-54} r={68} />
        </g>
      ))}
      {/* sun */}
      <circle cx={1560} cy={sunY} r={190} fill="#fff0a8" stroke={INK} strokeWidth={0} opacity={dawn} />
      <circle cx={1560} cy={sunY} r={130} fill={YEL} opacity={dawn} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2 + f * 0.004;
        return <line key={i} x1={1560 + Math.cos(a) * 225} y1={sunY + Math.sin(a) * 225} x2={1560 + Math.cos(a) * 300} y2={sunY + Math.sin(a) * 300} stroke="#fff0a8" strokeWidth={22} strokeLinecap="round" opacity={dawn} />;
      })}
      {/* far city */}
      {Array.from({ length: 18 }, (_, i) => {
        const x = -1500 + i * 230;
        const h = 300 + ((i * 137) % 420);
        return <rect key={i} x={x} y={GROUND - h} width={210} height={h} fill={city2} />;
      })}
      {/* near city */}
      {Array.from({ length: 14 }, (_, i) => {
        const x = -1450 + i * 300 + ((i * 53) % 60);
        if (x > -40 && x < TW + 20) return null;
        const h = 240 + ((i * 211) % 380);
        return (
          <g key={i}>
            <rect x={x} y={GROUND - h} width={250} height={h} fill={cityC} />
            {Array.from({ length: 6 }, (_, r) =>
              [0, 1, 2].map((c) => (r * 60 + 40 < h - 20 ? <rect key={`${r}${c}`} x={x + 34 + c * 70} y={GROUND - h + 34 + r * 60} width={36} height={32} fill={(i + r + c) % 3 === 0 ? wins : cityC} opacity={0.9} /> : null)),
            )}
          </g>
        );
      })}
      {/* street */}
      <rect x={-2200} y={GROUND} width={6000} height={1400} fill={STREET} />
      <rect x={-2200} y={GROUND} width={6000} height={16} fill={INK} />
      {Array.from({ length: 16 }, (_, i) => (
        <rect key={i} x={-2100 + i * 360} y={GROUND + 150} width={190} height={16} rx={8} fill={YEL} opacity={0.7} />
      ))}

      {/* ===== the tower ===== */}
      <rect x={-34} y={ROOF - 6} width={TW + 68} height={GROUND - ROOF + 6} fill={BRICK} {...K} strokeWidth={10} />
      {/* brick marks on the two outer walls */}
      {Array.from({ length: 28 }, (_, i) => (
        <g key={i}>
          <rect x={-26 + (i % 2) * 10} y={ROOF + 30 + i * 62} width={18} height={10} fill={BRICK2} />
          <rect x={TW + 8 - (i % 2) * 8} y={ROOF + 54 + i * 62} width={18} height={10} fill={BRICK2} />
        </g>
      ))}
      {/* stair well walls */}
      <rect x={0} y={ROOF} width={TW} height={GROUND - ROOF} fill={SAGE} stroke={INK} strokeWidth={6} />
      {[0, 2].map((i) => (
        <rect key={i} x={330} y={LV[i + 1]} width={TW - 330} height={LV[i] - LV[i + 1]} fill={SAGE2} />
      ))}
      {/* windows on the back wall, one per storey */}
      {[1, 2, 3].map((i) => (
        <g key={i} transform={`translate(${i % 2 ? 880 : 430} ${LV[i] + 240 - (i % 2 ? 40 : 110)})`}>
          <rect x={-46} y={-72} width={92} height={120} rx={6} fill={interpolateColors(dawn, [0, 1], ["#5e6db4", "#ffd7a1"])} {...K} strokeWidth={5} />
          <line x1={0} y1={-72} x2={0} y2={48} {...K} strokeWidth={4} />
        </g>
      ))}
      {/* the lift shaft */}
      <rect x={0} y={ROOF} width={330} height={GROUND - ROOF} fill={SHAFT} stroke={INK} strokeWidth={6} />
      <line x1={165} y1={ROOF} x2={165} y2={GROUND - 560} stroke={INK} strokeWidth={7} />
      <line x1={190} y1={ROOF} x2={190} y2={GROUND - 560} stroke={SHAFT2} strokeWidth={5} />
      {[1, 2, 3].map((i) => (
        <g key={i} transform={`translate(165 ${LV[i]})`}>
          <rect x={-120} y={-300} width={240} height={300} rx={6} fill={SHAFT2} stroke={INK} strokeWidth={5} />
          <line x1={0} y1={-300} x2={0} y2={0} stroke={INK} strokeWidth={4} />
          <rect x={-140} y={0} width={280} height={16} fill={SLATE} stroke={INK} strokeWidth={4} />
        </g>
      ))}
      {/* lobby floor */}
      <rect x={0} y={GROUND - 8} width={TW} height={22} fill={SLATE} {...K} strokeWidth={5} />
      {/* left landings + roof */}
      <rect x={330} y={LV[2]} width={XL - 330} height={34} fill={SLATE} {...K} strokeWidth={6} />
      {/* right landings */}
      {[1, 3].map((i) => (
        <rect key={i} x={XR} y={LV[i]} width={TW - XR} height={34} fill={SLATE} {...K} strokeWidth={6} />
      ))}
      {/* the flights: slate underside */}
      {[0, 1, 2, 3].map((i) => {
        const gr = i % 2 === 0;
        const xa = gr ? XL : XR;
        const xb = gr ? XR : XL;
        return <path key={i} d={`M ${xa} ${LV[i]} L ${xb} ${LV[i + 1]} L ${xb} ${LV[i + 1] + 56} L ${xa} ${LV[i] + 56} Z`} fill={SLATE2} {...K} strokeWidth={6} />;
      })}
      {/* every step: turns yellow when he has passed it */}
      {allSteps.map((s, i) => (
        <rect key={i} x={s.x0} y={s.y} width={s.x1 - s.x0 + 1} height={s.h + 1} fill={i < lit ? YEL : CREAM} stroke={INK} strokeWidth={2.5} />
      ))}
      {/* rails */}
      {[0, 1, 2, 3].map((i) => {
        const gr = i % 2 === 0;
        const xa = gr ? XL : XR;
        const xb = gr ? XR : XL;
        return (
          <g key={i}>
            <line x1={xa} y1={LV[i] - 96} x2={xb} y2={LV[i + 1] - 96} stroke={INK} strokeWidth={9} strokeLinecap="round" />
            {[0.1, 0.5, 0.9].map((k, j) => (
              <line key={j} x1={xa + (xb - xa) * k} y1={LV[i] + (LV[i + 1] - LV[i]) * k - 96} x2={xa + (xb - xa) * k} y2={LV[i] + (LV[i + 1] - LV[i]) * k} stroke={INK} strokeWidth={4} />
            ))}
          </g>
        );
      })}
      {/* roof slab with the hatch at the top of the stairs */}
      <rect x={-34} y={ROOF - 2} width={XL - 120} height={26} fill={BRICK2} {...K} strokeWidth={7} />
      <rect x={XL + 2} y={ROOF - 2} width={TW + 34 - XL - 2} height={26} fill={BRICK2} {...K} strokeWidth={7} />
      {/* roof things */}
      <g transform={`translate(190 ${ROOF})`}>
        <rect x={-74} y={-170} width={148} height={130} rx={10} fill="#8c5c3e" {...K} strokeWidth={6} />
        <path d="M -84 -170 L 0 -222 L 84 -170 Z" fill="#6f4a33" {...K} strokeWidth={6} />
        <line x1={-52} y1={-40} x2={-52} y2={0} {...K} strokeWidth={7} />
        <line x1={52} y1={-40} x2={52} y2={0} {...K} strokeWidth={7} />
      </g>
      <g transform={`translate(1000 ${ROOF})`}>
        <line x1={0} y1={0} x2={0} y2={-170} {...K} strokeWidth={8} />
        <path d={`M 0 -168 L ${54 + 6 * Math.sin(f * 0.14)} -150 L 0 -128 Z`} fill={YEL} {...K} strokeWidth={5} />
      </g>
      {/* STAIRS sign by the stair foot */}
      <g transform={`translate(650 1000)`}>
        <rect x={-74} y={-34} width={148} height={68} rx={10} fill={WHITE} {...K} strokeWidth={5} />
        <Txt y={12} s={34}>
          STAIRS
        </Txt>
      </g>
      {/* lobby lamp */}
      <line x1={450} y1={ROOF} x2={450} y2={ROOF} />
    </g>
  );
};

const CROWD = [570, 660, 750, 840, 930, 1010].map((x, i) => ({
  x,
  at: ADULTS - 2 + i * 3,
  c: ["#6d7b98", "#9a6a8d", "#6d7b98", "#7b8b68", "#9a6a8d", "#7b8b68"][i],
  s: 1.32 - (i % 2) * 0.1,
}));

export const S01_SFX: SfxCue[] = [
  [STOP, "thud", 0.34],
  [N50 + 1, "pop", 0.12],
  [LIFT, "ding", 0.3],
  [PROM - 8, "whoosh", 0.07],
  [WHY, "boing", 0.13],
  [SCI - 10, "whoosh", 0.08],
  [ASKED, "pop", 0.11],
  ...CROWD.map(({ at }) => [at, "pop", 0.09] as SfxCue),
  [HOME - 2, "scribble", 0.16],
  [FOLLOW, "page", 0.2],
  [FOLLOW + 12, "page", 0.17],
  [FOLLOW + 24, "page", 0.15],
  ...[0, 1, 2, 3, 4].map((i) => [BLK + i * 7 + 1, "thud", 0.18 + i * 0.02] as SfxCue),
  [CL0, "whoosh", 0.1],
  ...Array.from({ length: 19 }, (_, i) => [CL0 + 5 + i * 6.5, "tick", 0.13] as SfxCue).map(([a, b, c]) => [Math.round(a), b, c] as SfxCue),
  [CHANGED + 2, "buzz", 0.12],
  [DROP + 6, "thud", 0.42],
  [DROP + 16, "thud", 0.5],
  [F4A + 2, "tick", 0.22],
  [F4A + 7, "tick", 0.22],
  [F4A + 12, "tick", 0.22],
  [F4A + 17, "tick", 0.22],
  [F4A + 22, "tick", 0.22],
  [F4B, "whoosh_long", 0.16],
  [LAUNCH - 6, "pop", 0.2],
  [LAND, "crash", 0.5],
  [LAND + 1, "impact", 0.42],
  [CAV - 8, "whoosh", 0.08],
  [SL0 + 2, "whoosh_long", 0.2],
  [SL1 - 2, "thud", 0.24],
  [STAIRSW, "ding", 0.14],
  [Q + 2, "pop", 0.1],
];

export const S01Tower: React.FC<SceneProps> = () => {
  const f0 = useCurrentFrame();
  const loopBack = f0 >= LOOP;
  const f = loopBack ? (f0 - LOOP) * 0 + 0 : f0; // the last frames repeat frame 0: a clean loop
  const real = f0;

  const cam = camAtRig(f);
  const lit = f >= LAND + 2 && f < SL0 ? 60 : f >= SL0 && !loopBack ? Math.max(0, Math.round(interpolate(f, [SL0, SL1], [60, 0], clamp))) : stepCount(f);
  const dawn = interpolate(f, [BUT + 4, PULL1], [0, 1], { ...clamp, easing: eio });
  const dim = interpolate(f, [DROP - 2, DROP + 8, BUT, BUT + 8], [0, 0.56, 0.56, 0], clamp);

  // --- Spark ---------------------------------------------------------------------------------------------------------
  const [px, py] = pathAt(f);
  const sNow = (() => {
    const big = interpolate(f, [PULL0, PULL1], [1.9, 2.4], { ...clamp, easing: eio });
    const back = interpolate(f, [CAV - 8, CAV + 14], [0, 1], { ...clamp, easing: eio });
    return big + (1.9 - big) * back;
  })();
  const sparkKeys = gestureKeys([
    [0, G.stop],
    [N50, { ra1: 92, ra2: 72, la1: -40, la2: -30, lean: -4, head: 6 }, "smooth"],
    [LIFT - 4, G.pointSide, "snap"],
    [WAIT - 6, G.stop, "snap"],
    [W(1, 3), G.pointUp, "smooth"],
    [WHY - 2, { ...G.count1, head: -6 }, "snap"],
    [SCI - 10, G.rest, "smooth"],
    [SCI + 16, G.pointSide, "smooth"],
    [HOME, G.thinkChin, "smooth"],
    [FOLLOW, G.present, "smooth"],
    [LETS - 2, G.rest, "smooth"],
    [LETS + 8, G.fistPump, "snap"],
    [BLK, { ra1: 60, ra2: 40, la1: -60, la2: -40, lean: 8, head: 8 }, "snap"],
    [CL0, { ra1: 30, ra2: 40, la1: -30, la2: -40, lean: 8 }, "smooth"],
    [F3 - 2, G.rest, "smooth"],
    [NOTHING + 6, G.rest, "smooth"],
    [F3 + 2, G.shrugBig, "snap"],
    [DROP + 4, { ...G.leanIn, head: -14 }, "smooth"],
    [F4A, { ra1: 30, ra2: 40, la1: -30, la2: -40, lean: 8 }, "smooth"],
    [OUT1, G.presentBoth, "smooth"],
    [LAUNCH - 6, G.recoil, "snap"],
    [LAUNCH + 8, G.mindBlown, "snap"],
    [LAND + 4, G.celebrate, "snap"],
    [LAND + 20, G.mindBlown, "smooth"],
    [CAV - 6, G.shrugBig, "smooth"],
    [W(6, 5), G.handsHips, "smooth"],
    [NOTP, { ...G.pointUp, head: -6 }, "snap"],
    [ACT, G.rest, "smooth"],
    [SL0 + 2, { ra1: 150, ra2: 20, la1: -150, la2: -20, lean: -8 }, "snap"],
    [SL1, G.fistPump, "snap"],
    [STAIRSW - 4, G.pointSide, "snap"],
    [Q - 4, G.present, "smooth"],
    [W(8, 2), G.count1, "snap"],
    [W(8, 5), G.stop, "smooth"],
  ]);
  const mood = (t: number): Mood => {
    if (t < N50) return "shock";
    if (t < WAIT - 6) return "skeptical";
    if (t < WHY - 2) return "wink";
    if (t < SCI - 8) return "curious";
    if (t < HOME) return "happy";
    if (t < LETS - 2) return "thinking";
    if (t < BLK) return "determined";
    if (t < CL0) return "worried";
    if (t < F3 - 6) return "determined";
    if (t < DROP) return "skeptical";
    if (t < F4A) return "curious";
    if (t < LAUNCH) return "excited";
    if (t < CAV - 6) return "mindblown";
    if (t < W(6, 5)) return "skeptical";
    if (t < ACT) return "thinking";
    if (t < SL1) return "excited";
    if (t < Q - 4) return "happy";
    if (t < W(8, 5)) return "curious";
    return "shock";
  };
  const bulb = (t: number) => Math.max(bulbPulse(t, LAUNCH, 70), bulbPulse(t, WHY, 22), bulbPulse(t, STAIRSW, 26));
  const sparkMod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t, 3));
    if (climbing(t)) q = addPose(q, runCycle(t - CL0, 0.62, 0.8));
    if (walking(t)) q = addPose(q, walkCycle(t, 0.42));
    q = addPose(q, hop(t, LAND + 3, 28));
    q = addPose(q, hop(t, SL1 - 1, 16));
    q = addPose(q, nod(t, STAIRSW, 2));
    q = addPose(q, nod(t, W(1, 8), 2));
    q = addPose(q, shake(t, CHANGED - 4, 2));
    q = addPose(q, shake(t, W(6, 7), 2));
    const [xx, yy] = pathAt(t);
    const s = (() => {
      const big = interpolate(t, [PULL0, PULL1], [1.9, 2.4], { ...clamp, easing: eio });
      const back = interpolate(t, [CAV - 8, CAV + 14], [0, 1], { ...clamp, easing: eio });
      return big + (1.9 - big) * back;
    })();
    // a hop per landing + a sit pose while he slides
    const slide = sliding(t);
    return {
      ...q,
      x: xx,
      y: yy - 92.5 * s - (slide ? 60 : 0) + q.y - p.y,
      ll1: slide ? 70 : q.ll1,
      ll2: slide ? -40 : q.ll2,
      rl1: slide ? 60 : q.rl1,
      rl2: slide ? -30 : q.rl2,
      lean: slide ? -22 : q.lean,
    };
  };
  const facing = (t: number) => {
    if (t >= SCI - 12 && t < SCI + 14) return -1;
    if (t >= SCI + 14 && t < CL0 + 6) return 1;
    if (t < 0) return 1;
    if (t < SCI - 12) return -1; // frame 0: facing the lift
    if (t < F1) return 1;
    if (t < F2) return -1;
    if (t < F3) return 1;
    if (t < F4B) return -1;
    if (t < SL0) return 1;
    if (t < SL0 + 6) return -1;
    if (t < SL0 + 13) return 1;
    if (t < SL0 + 20) return -1;
    if (t < SL0 + 27) return 1;
    if (t < SL1 + 12) return -1;
    if (t < Q - 4) return 1; // points at the stairs
    return -1;
  };

  // --- the stack of five blocks on his back -------------------------------------------------------------------------------
  const BW = 92;
  const BH = 48;
  const hasStack = f >= BLK - 12 && f < SL0;
  const fx = typeof facing === "function" ? facing(f) : 1;
  const sk = sNow / 1.9;
  // anchor: behind his back at hip height, follows him
  const backX = px - fx * 62 * sk;
  const backY = py - 96 * sk;
  const blocks = [0, 1, 2, 3, 4].map((i) => {
    const land = BLK + i * 7;
    const t = f - land;
    const drop = t < 0 ? interpolate(t, [-11, 0], [-520, 0], { ...clamp, easing: ei }) : 0;
    const [sx, sy] = squash(f, land, 0.22);
    const lag = climbing(f) ? Math.sin(f * 0.62 - i * 0.5) * (2 + i * 2.2) * sk : 0;
    return { i, on: f >= land - 11, drop, sx, sy, lag };
  });
  const topGone = f >= LAUNCH; // the fifth block leaves the stack
  const pre = interpolate(f, [ONE - 6, ONE, LAUNCH - 2, LAUNCH], [0, 1, 1, 0.6], clamp);
  const fallK = interpolate(f, [LAUNCH, LAND], [0, 1], { ...clamp, easing: ei });
  const topStartY = backY - 4 * BH * sk - BH * sk;
  const fallX = interpolate(f, [LAUNCH, LAUNCH + 8, LAND], [backX, TW + 100, TW + 130], { ...clamp, easing: eo });
  const fallY = interpolate(fallK, [0, 1], [topStartY - 60, GROUND + 16]);
  const fallR = (f - LAUNCH) * 13;
  const dust = interpolate(f, [LAND, LAND + 26], [0, 1], { ...clamp, easing: eo });
  const leanStack = (LAND - f) < 0 ? wobble(f, LAND, 6, 10) : 0;

  // --- lift + lobby ---------------------------------------------------------------------------------------------------
  const openA = interpolate(f, [LIFT - 2, LIFT + 14, PROM + 34, PROM + 54], [0, 1, 1, 0], { ...clamp, easing: eio });
  const ding = interpolate(f, [LIFT, LIFT + 6, LIFT + 18], [0, 1, 0], clamp);

  // scientist + the adults
  const sciK = interpolate(f, [SCI - 2, SCI + 14, LETS - 8, LETS + 6], [0, 1, 1, 0], { ...clamp, easing: eio });
  const sciX = 430;
  const askK = popIn(f, ASKED + 4) * interpolate(f, [FOLLOW - 10, FOLLOW - 2], [1, 0], { ...clamp, easing: ei });
  const calK = popIn(f, FOLLOW) * interpolate(f, [LETS - 8, LETS], [1, 0], { ...clamp, easing: ei });
  const calPage = Math.max(0, Math.floor((f - FOLLOW) / 12));
  const crowdOut = interpolate(f, [LETS - 8, LETS + 4], [1, 0], { ...clamp, easing: ei });
  const whyK = popIn(f, WHY) * interpolate(f, [SCI - 16, SCI - 6], [1, 0], { ...clamp, easing: ei });
  const waitK = popIn(f, W(1, 3)) * interpolate(f, [WHY - 8, WHY - 2], [1, 0], { ...clamp, easing: ei });
  const riskK = popIn(f, W(3, 6)) * interpolate(f, [CL0 + 18, CL0 + 28], [1, 0], { ...clamp, easing: ei });
  const proofK = popIn(f, NOTP - 4) * interpolate(f, [ACT - 6, ACT + 2], [1, 0], { ...clamp, easing: ei });
  const floorK = popIn(f, STAIRSW) * interpolate(f, [Q - 8, Q], [1, 0], { ...clamp, easing: ei });
  const qK = popIn(f, W(8, 1)) * interpolate(f, [LOOP - 12, LOOP - 2], [1, 0], { ...clamp, easing: ei });

  const svg = (
    <>
      <World f={f} lit={lit} dawn={dawn} />
      <g transform={`translate(165 ${GROUND})`}>
        <Lift f={f} open={openA} ding={ding} />
      </g>

      {/* adults */}
      {crowdOut > 0.01 &&
        CROWD.map((c, i) =>
          f >= c.at - 3 ? (
            <g key={i} transform={`translate(${c.x} ${GROUND}) scale(${popIn(f, c.at) * crowdOut}) translate(${-c.x} ${-GROUND})`}>
              <Actor f={f} color={c.c} scale={c.s} base={{ x: c.x, y: GROUND - 92.5 * c.s }} keys={[{ f: 0, p: G.rest }]} mod={(t, p) => addPose(p, idle(t, i * 2))} facing={-1} face="happy" trails={false} />
            </g>
          ) : null,
        )}
      {/* scientist */}
      {sciK > 0.01 && (
        <g transform={`translate(0 0)`}>
          <g transform={`translate(${sciX} ${GROUND}) scale(${sciK}) translate(${-sciX} ${-GROUND})`}>
            <Actor f={f} color={COL.orange} scale={1.6} base={{ x: sciX, y: GROUND - 92.5 * 1.6 }} keys={gestureKeys([[0, { ra1: 70, ra2: 60, la1: -20, la2: 10 }], [FOLLOW, { ra1: 60, ra2: 72, la1: -24, la2: 10, head: 6 }, "smooth"]])} mod={(t, p) => addPose(p, idle(t, 9))} facing={1} face="happy" trails={false}>
              {(j) => (
                <>
                  <path d={`M ${j.neck[0] - 24} ${j.neck[1] + 2} L ${j.neck[0] + 24} ${j.neck[1] + 2} L ${j.hip[0] + 46} ${j.hip[1] + 32} L ${j.hip[0] - 46} ${j.hip[1] + 32} Z`} fill={WHITE} {...K} strokeWidth={6} />
                  <line x1={j.neck[0]} y1={j.neck[1] + 4} x2={j.hip[0]} y2={j.hip[1] + 30} {...K} strokeWidth={4} />
                  <g transform={`translate(${j.rHand[0] + 12} ${j.rHand[1] - 26})`}>
                    <rect x={-32} y={-42} width={64} height={84} rx={6} fill="#c79256" {...K} strokeWidth={5} />
                    <rect x={-24} y={-28} width={48} height={62} fill={WHITE} {...K} strokeWidth={3} />
                    {[0, 1, 2].map((i) => (
                      <line key={i} x1={-16} y1={-16 + i * 16} x2={f > HOME ? 16 : -2} y2={-16 + i * 16} stroke={INK} strokeWidth={3} />
                    ))}
                  </g>
                </>
              )}
            </Actor>
          </g>
          <g transform={`translate(${sciX} 905) scale(${sciK})`}>
            <rect x={-104} y={-30} width={208} height={60} rx={30} fill={WHITE} {...K} strokeWidth={5} />
            <Txt y={14} s={36} c={COL.orange}>
              SCIENTIST
            </Txt>
          </g>
        </g>
      )}
      {askK > 0.01 && (
        <g transform={`translate(640 690) scale(${askK}) rotate(${wobble(f, ASKED + 4, 4)})`}>
          <Bubble w={640} h={196} tail={-210}>
            <Txt y={-14} s={64}>
              HOW MANY STAIRS
            </Txt>
            <Txt y={58} s={64}>
              AT HOME?
            </Txt>
          </Bubble>
        </g>
      )}
      {calK > 0.01 && (
        <g transform={`translate(640 690) scale(${calK})`}>
          <rect x={-180} y={-138} width={360} height={276} rx={18} fill={WHITE} {...K} strokeWidth={7} />
          <rect x={-180} y={-138} width={360} height={74} rx={18} fill={RED} {...K} strokeWidth={7} />
          <Txt y={-82} s={50} c={WHITE}>
            YEARS
          </Txt>
          {/* flipping pages: dots only, no numbers */}
          {Array.from({ length: 12 }, (_, i) => (
            <rect key={i} x={-140 + (i % 4) * 72} y={-48 + Math.floor(i / 4) * 58} width={56} height={44} rx={8} fill={i < (calPage + 1) * 3 ? YEL : "#e5e5e5"} {...K} strokeWidth={4} />
          ))}
        </g>
      )}

      {/* the top block falling */}
      {topGone && f < LAND && (
        <g transform={`translate(${fallX} ${fallY}) rotate(${fallR}) scale(${sk * interpolate(f, [LAUNCH, LAUNCH + 8], [1, 1.5], clamp)})`}>
          <g transform={`translate(0 ${BH / 2})`}>
            <Block w={BW} h={BH} />
          </g>
        </g>
      )}
      {/* where it smashed */}
      {f >= LAND && f < SL0 && (
        <g transform={`translate(${TW + 130} ${GROUND + 8}) scale(1.7)`}>
          {[-70, -38, -12, 14, 42, 74].map((a, i) => {
            const r = (120 + i * 22) * dust;
            return <line key={i} x1={Math.sin((a * Math.PI) / 180) * r * 0.3} y1={-Math.cos((a * Math.PI) / 180) * r * 0.3} x2={Math.sin((a * Math.PI) / 180) * r} y2={-Math.cos((a * Math.PI) / 180) * r} stroke={YEL} strokeWidth={14} strokeLinecap="round" opacity={interpolate(f, [LAND + 18, LAND + 34], [1, 0], clamp)} />;
          })}
          {[0, 1, 2, 3].map((i) => (
            <g key={i} transform={`translate(${(-90 + i * 60) * dust} ${-10 - (i % 2) * 18 * dust}) rotate(${(i * 37 - 40) * dust})`}>
              <rect x={-40} y={-22} width={84} height={42} rx={7} fill={i % 2 ? RED : RED2} {...K} strokeWidth={7} />
            </g>
          ))}
          {[-110, 0, 110].map((x, i) => (
            <circle key={i} cx={x * dust * 1.5} cy={-20 - dust * 70} r={46 * dust} fill={WHITE} opacity={interpolate(f, [LAND + 8, LAND + 34], [0.9, 0], clamp)} />
          ))}
        </g>
      )}
      {/* blocks left on the roof when he slides */}
      {f >= SL0 && (
        <g transform={`translate(${SXR - 62} ${ROOF - 96 * interpolate(f, [SL0, SL0 + 6], [1, 0], { ...clamp, easing: ei })})`}>
          {[0, 1, 2, 3].map((i) => (
            <g key={i} transform={`translate(0 ${-i * BH})`}>
              <Block w={BW} h={BH} />
            </g>
          ))}
        </g>
      )}

      {dim > 0.01 && <rect x={-2200} y={-2800} width={6000} height={6000} fill="#101428" opacity={dim} />}
      {/* the stack on his back, drawn behind him (stack + Spark stay lit while the lights drop) */}
      {hasStack && (
        <g transform={`translate(${backX} ${backY}) rotate(${(fx * -5) + leanStack})`}>
          {blocks.map((b) =>
            !b.on || (b.i === 4 && topGone) ? null : (
              <g key={b.i} transform={`translate(${b.lag + (b.i === 4 ? fx * pre * Math.sin(f * 1.6) * 6 : 0)} ${(-b.i * BH * sk) + b.drop - (b.i === 4 ? pre * 12 : 0)}) scale(${sk * b.sx} ${sk * b.sy})`}>
                <Block w={BW} h={BH} />
              </g>
            ),
          )}
          {topGone && (
            <g transform={`translate(0 ${-4 * BH * sk}) scale(${sk})`}>
              <rect x={-BW / 2} y={-BH} width={BW} height={BH} rx={9} fill="none" stroke={INK} strokeWidth={5} strokeDasharray="12 9" />
            </g>
          )}
        </g>
      )}
      {riskK > 0.01 && (
        <g transform={`translate(${px + 330} ${py - 410}) scale(${riskK})`}>
          <Bubble w={400} h={104} fill={YEL} tail={-120}>
            <Txt y={22} s={62}>
              HEART RISK
            </Txt>
          </Bubble>
        </g>
      )}


      {waitK > 0.01 && (
        <g transform={`translate(${SX0 + 120} 690) scale(${waitK})`}>
          <Bubble w={430} h={116} tail={-110}>
            <Txt y={22} s={58}>
              THE LAST PART
            </Txt>
          </Bubble>
        </g>
      )}
      {whyK > 0.01 && (
        <g transform={`translate(${SX0 + 120} 690) scale(${whyK}) rotate(${wobble(f, WHY, 5)})`}>
          <Bubble w={400} h={118} fill={YEL} tail={-110}>
            <Txt y={24} s={68}>
              WHY 50?
            </Txt>
          </Bubble>
        </g>
      )}
      {proofK > 0.01 && (
        <g transform={`translate(${SXR + 120} ${ROOF - 560}) scale(${proofK}) rotate(${wobble(f, NOTP - 4, 4)})`}>
          <Bubble w={560} h={120} tail={-120}>
            <Txt y={24} s={68}>
              NOT PROOF
            </Txt>
          </Bubble>
        </g>
      )}
      {floorK > 0.01 && (
        <g transform={`translate(${SX0 + 240} 720) scale(${floorK}) rotate(${wobble(f, STAIRSW, 4)})`}>
          <Bubble w={420} h={116} fill={YEL} tail={-150}>
            <Txt y={22} s={62}>
              ONE FLOOR
            </Txt>
          </Bubble>
        </g>
      )}
      {qK > 0.01 && (
        <g transform={`translate(${SX0 + 90} 700) scale(${qK}) rotate(${wobble(f, W(8, 1), 4)})`}>
          <Bubble w={490} h={116} tail={-80}>
            <Txt y={22} s={58}>
              HOW MANY STEPS?
            </Txt>
          </Bubble>
        </g>
      )}

      <Spark f={f} trails={false} scale={sNow} base={{ x: SX0, y: GROUND - 92.5 * sNow }} talk={(t) => (loopBack ? 0 : mouthAt(t))} bulb={bulb} mood={mood} look={1} keys={sparkKeys} mod={sparkMod} facing={facing} />
    </>
  );

  // --- screen-space text ---------------------------------------------------------------------------------------------------
  const overlayOn = real < PROM - 4 || loopBack;
  const count = stepCount(f);
  const countOn = f >= CL0 - 2 && f < PULL0 + 10;
  const countK = countOn ? popIn(f, CL0) * interpolate(f, [PULL0, PULL0 + 10], [1, 0], clamp) : 0;
  const over50 = count > 50;
  const sameK = popIn(f, CHANGED) * interpolate(f, [BUT - 6, BUT + 2], [1, 0], { ...clamp, easing: ei });
  const bigK = popIn(f, FIFTH);
  const bigOut = interpolate(f, [CAV - 14, CAV - 4], [1, 0], { ...clamp, easing: ei });
  const band = interpolate(f, [CL0, CL0 + 14, PULL0 + 8, PULL1 - 6, LAND + 20, LAND + 34, SL0 + 18, SL1 - 2], [0, 1, 1, 0, 0, 1, 1, 0], clamp);
  const html = (
    <>
      {band > 0.01 && <div style={{ position: "absolute", left: 0, right: 0, top: 1450, bottom: 0, background: STREET, opacity: band * 0.8 }} />}
      {overlayOn && (
        <div
          style={{
            position: "absolute",
            left: 30,
            right: 30,
            top: 262,
            textAlign: "center",
            fontFamily: FONT.title,
            fontWeight: 900,
            lineHeight: 1.0,
            fontSize: 158,
            color: YEL,
            WebkitTextStroke: `12px ${INK}`,
            paintOrder: "stroke fill",
            transform: `rotate(-2deg) scale(${1 + wobble(f, 0, 0.03, 8)})`,
            opacity: loopBack ? 1 : interpolate(f, [PROM - 14, PROM - 4], [1, 0], clamp),
          }}
        >
          50 STEPS
          <br />
          LOST?
        </div>
      )}
      {countK > 0.01 && (
        <div
          style={{
            position: "absolute",
            left: 540,
            top: 340,
            transform: `translate(-50%,-50%) scale(${countK})`,
            background: over50 ? YEL : WHITE,
            border: `8px solid ${INK}`,
            borderRadius: 32,
            padding: "6px 46px 10px",
            fontFamily: FONT.title,
            fontWeight: 900,
            fontSize: 110,
            color: INK,
            whiteSpace: "nowrap",
            lineHeight: 1.05,
          }}
        >
          {count} STEPS
        </div>
      )}
      {sameK > 0.01 && (
        <div
          style={{
            position: "absolute",
            left: 540,
            top: 480,
            transform: `translate(-50%,-50%) scale(${sameK})`,
            fontFamily: FONT.title,
            fontWeight: 900,
            fontSize: 76,
            color: YEL,
            WebkitTextStroke: `9px ${INK}`,
            paintOrder: "stroke fill",
            whiteSpace: "nowrap",
          }}
        >
          NO CLEAR CHANGE
        </div>
      )}
      {f >= FIFTH - 3 && bigOut > 0.01 && (
        <div
          style={{
            position: "absolute",
            left: 650,
            width: 410,
            top: 610,
            textAlign: "center",
            transform: `scale(${bigK}) rotate(2deg)`,
            opacity: bigOut,
            fontFamily: FONT.title,
            fontWeight: 900,
            lineHeight: 0.98,
            color: "#ffffff",
            WebkitTextStroke: `11px ${INK}`,
            paintOrder: "stroke fill",
          }}
        >
          <div style={{ fontSize: 76 }}>ABOUT</div>
          <div style={{ fontSize: 196, color: YEL }}>1/5</div>
          <div style={{ fontSize: 86 }}>LOWER</div>
        </div>
      )}
      {real >= 300 && real < LOOP - 4 && (
        <>
          <div
            style={{
              position: "absolute",
              left: 540,
              top: 1700,
              transform: "translate(-50%,-50%)",
              fontFamily: FONT.body,
              fontWeight: 700,
              fontSize: 21,
              color: INK,
              whiteSpace: "nowrap",
              opacity: 0.9,
              background: "rgba(255,255,255,0.85)",
              padding: "2px 12px",
              borderRadius: 8,
            }}
          >
            {real < CL0
              ? "UK Biobank study, 458,860 adults, about 12 years (Song et al., 2023)"
              : real < BUT
                ? "Compared with no stairs at home. One flight is about 10 steps."
                : real < SL0
                  ? "16% to 23% lower by group. Heart disease and stroke. Linked, not proof."
                  : "Education, not medical advice"}
          </div>
          <div
            style={{
              position: "absolute",
              right: 96,
              top: 1745,
              fontFamily: FONT.title,
              fontWeight: 900,
              fontSize: 27,
              color: YEL,
              WebkitTextStroke: `1px ${INK}`,
              letterSpacing: 2,
              opacity: 0.95,
              background: "rgba(20,20,40,0.55)",
              padding: "2px 10px",
              borderRadius: 8,
            }}
          >
            MYTH CHECK
          </div>
          {real < SL0 && (
            <div
              style={{
                position: "absolute",
                left: 96,
                top: 1745,
                fontFamily: FONT.body,
                fontWeight: 700,
                fontSize: 22,
                color: "#fff",
                opacity: 0.92,
                background: "rgba(20,20,40,0.55)",
                padding: "4px 12px",
                borderRadius: 8,
              }}
            >
              Education, not medical advice
            </div>
          )}
        </>
      )}
      <VoiceCaptions
        f={real}
        y={1548}
        size={62}
        cues={VOICE_CUES}
        hi={["stop", "lift", "lift?", "last", "fifty", "50", "scientists", "stairs", "stairs,", "blocks", "risk", "risk.", "nothing", "steps", "steps,", "fifth", "lower", "proof", "floor", "climb"]}
      />
    </>
  );

  const hits = [STOP + 1, LAND, LAND + 2];
  return <Stage bg={<AbsoluteFill style={{ background: DUSK }} />} cam={cam} hits={hits} power={6} svg={svg} html={html} />;
};
