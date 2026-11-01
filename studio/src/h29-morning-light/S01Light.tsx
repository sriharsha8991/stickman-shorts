import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Actor, addPose, idle, type Pose } from "../stickman/stick";
import { COL, FONT } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, K, VoiceCaptions } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { G, gestureKeys, hop, nod, shake } from "../shared/gestures";
import { camAt, Transition, VERTICAL, type Shot } from "../shared/camera";
import { ease, popIn, wobble } from "../shared/motion";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// H29 · "Your alarm is not what sets your body clock." (Myth check, ~42 s, clarity rules, Health-edu)
// TWO places. (1) A dark blue bedroom before sunrise: an unmade bed, a nightstand with a ringing twin-bell alarm
// clock, a window with closed curtains. Spark is groggy. A thought bubble shows his BODY CLOCK; its hand lags
// ("runs a little slow"). The alarm's sound waves bounce off the bubble (ALARM ✗); a thin sunbeam through the
// curtain gap lights it (LIGHT ✓). (2) Iris → a pine-forest campsite: three campers, a tent, a NO LAMPS sign.
// Night: Zzz in the tent and a card BODY CLOCK · 2 HOURS EARLIER. Sunrise: the campers step out and stretch.
// SMALL STUDY sign, then LAB TESTS AGREE ✓. Hard cut back to the bedroom: the curtains open, sunlight fills the
// room, the body clock glows. Question SUN OR PHONE?; the dark room + ringing alarm return (loop).
// Sources: Wright et al. 2013 Current Biology 23:1554 (camping, ~2 h earlier); Czeisler et al. 1999 Science
// (clock period ~24 h 11 min); Khalsa et al. 2003 J Physiol (light after the body-temperature low moves the clock earlier).

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const SS = 1.9;
const STANDY = GROUND - 92.5 * SS;
const HEADY = STANDY - 200;

// palette: bedroom = night blue → warm morning; camp = pine greens + sky that changes with the time of day
const WALL_N = "#2f3b66";
const WALL_D = "#ffe7b0";
const FLOOR_N = "#25304f";
const FLOOR_D = "#d9a46b";
const SUN = "#ffd23f";
const SUNC = "#ffb52e";
const YEL = "#ffd23f";
const RED = "#e8484f";
const GREEN = "#2fb463";
const WHITE = "#ffffff";
const CURT = "#c44d6a";
const CURT2 = "#9e3653";
const PINE = "#245a3e";
const PINE2 = "#1b4630";
const INK = COL.ink;

const T = {
  c0: C(0),
  alarm0: W(0, 1),
  clock0: W(0, 8),
  c1: C(1),
  never1: W(1, 2),
  does1: W(1, 5),
  c2: C(2),
  clock2: W(2, 1),
  head2: W(2, 4),
  wake2: W(2, 9),
  c3: C(3),
  slow3: W(3, 5),
  reset3: W(3, 10),
  c4: C(4),
  alarm4: W(4, 1),
  cannot4: W(4, 2),
  light4: W(4, 6),
  can4: W(4, 7),
  c5: C(5),
  camping5: W(5, 3),
  week5: W(5, 6),
  lamps5: W(5, 8),
  c6: C(6),
  clocks6: W(6, 2),
  two6: W(6, 5),
  earlier6: W(6, 7),
  c7: C(7),
  ready7: W(7, 3),
  sunrise7: W(7, 7),
  c8: C(8),
  small8: W(8, 3),
  lab8: W(8, 6),
  agree8: W(8, 8),
  c9: C(9),
  back9: W(9, 1),
  open9: W(9, 5),
  curtains9: W(9, 7),
  c10: C(10),
  sun10: W(10, 4),
  phone10: W(10, 7),
  first10: W(10, 8),
};
const LOOP = VOICE_FRAMES - 14;
const CAMP0 = T.c5 - 10; // iris covers the frame here
const BACK = T.c9 - 2; // hard cut back to the bedroom ("So, back in your bedroom")
const NIGHT0 = T.c6 - 16; // camp goes dark
const DAWN0 = T.c7 - 4; // sun starts to rise

// staging (bedroom)
const SX = 300;
const NS = { x: 500, top: 1110 }; // nightstand
const WIN = { x0: 650, x1: 1010, y0: 400, y1: 940 }; // window
const BUB = { x: 330, y: 610, r: 118 }; // body-clock thought bubble
// staging (camp)
const SXC = 170;
const TENT = { x: 760, w: 300, h: 230 };
const FIRE = { x: 470 };
const CAMPERS = [
  { x: 610, c: "#ff8a3d", o: 0 },
  { x: 770, c: "#a46bd6", o: 13 },
  { x: 930, c: "#e8a33d", o: 27 },
];
const CS = 1.25;
const CY = GROUND - 92.5 * CS;

const SHOTS: Shot[] = [
  { f: 0, z: 1.15, at: [430, 960], e: "cut" }, // frame 0: groggy Spark + ringing alarm
  { f: T.c1 - 8, z: 1.45, at: [SX + 40, HEADY + 70], e: "slow" }, // CU Spark
  { f: T.c2 - 8, z: 1.08, at: [420, 820], e: "slow" }, // MED: Spark + body-clock bubble
  { f: T.c3 - 6, z: 1.2, at: [BUB.x + 40, BUB.y + 60], e: "slow" }, // INSERT: the clock runs slow
  { f: T.c4 - 8, z: 1.0, at: [540, 900], e: "slow" }, // WIDE: alarm ✗ / light ✓
  { f: CAMP0, z: 1.0, at: [540, 960], e: "cut" }, // WIDE camp
  { f: T.c6 - 8, z: 1.06, at: [560, 860], e: "slow" }, // night + 2 HOURS EARLIER card
  { f: T.c7 - 4, z: 1.1, at: [620, 960], e: "slow" }, // sunrise, campers step out
  { f: T.c8 - 8, z: 1.08, at: [440, 880], e: "slow" }, // SMALL STUDY / LAB TESTS AGREE
  { f: BACK, z: 1.0, at: [540, 960], e: "cut" }, // WIDE bedroom again
  { f: T.c9 + 40, z: 1.08, at: [640, 880], e: "slow" }, // curtains open
  { f: T.c10 - 6, z: 1.3, at: [SX + 120, HEADY + 20], e: "slow" }, // question
  { f: LOOP, z: 1.15, at: [430, 960], e: "cut" }, // back into frame 0
];

// --- helpers --------------------------------------------------------------------------------------------------------
const hex = (c: string) => (c.startsWith("rgb") ? (c.match(/\d+/g) ?? ["0", "0", "0"]).slice(0, 3).map(Number) : [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)));
const mix = (a: string, b: string, t: number) => {
  const A = hex(a);
  const B = hex(b);
  const k = Math.max(0, Math.min(1, t));
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(",")})`;
};

const Txt: React.FC<{ x?: number; y: number; s: number; c?: string; children: React.ReactNode; a?: "middle" | "start" | "end"; w?: number; font?: string }> = ({
  x = 0,
  y,
  s,
  c = INK,
  children,
  a = "middle",
  w = 900,
  font = FONT.title,
}) => (
  <text x={x} y={y} textAnchor={a} fontFamily={font} fontWeight={w} fontSize={s} fill={c}>
    {children}
  </text>
);

const Tag: React.FC<{ text: string; fill: string; w: number; s?: number; c?: string }> = ({ text, fill, w, s = 40, c = WHITE }) => (
  <g>
    <rect x={-w / 2} y={-36} width={w} height={72} rx={36} fill={fill} {...K} strokeWidth={5} />
    <Txt y={14} s={s} c={c}>
      {text}
    </Txt>
  </g>
);

// a clock face; h = hour hand angle in hours, m = minute hand angle in minutes
const ClockFace: React.FC<{ r: number; h: number; m: number; fill?: string; glow?: number }> = ({ r, h, m, fill = WHITE, glow = 0 }) => (
  <g>
    {glow > 0.01 && <circle r={r + 60} fill={SUN} opacity={0.45 * glow} />}
    <circle r={r} fill={fill} stroke={INK} strokeWidth={8} />
    {Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return <line key={i} x1={Math.sin(a) * r * 0.78} y1={-Math.cos(a) * r * 0.78} x2={Math.sin(a) * r * 0.9} y2={-Math.cos(a) * r * 0.9} stroke={INK} strokeWidth={i % 3 ? 4 : 8} strokeLinecap="round" />;
    })}
    <line x1={0} y1={0} x2={Math.sin((h / 12) * Math.PI * 2) * r * 0.5} y2={-Math.cos((h / 12) * Math.PI * 2) * r * 0.5} stroke={INK} strokeWidth={10} strokeLinecap="round" />
    <line x1={0} y1={0} x2={Math.sin((m / 60) * Math.PI * 2) * r * 0.74} y2={-Math.cos((m / 60) * Math.PI * 2) * r * 0.74} stroke={RED} strokeWidth={6} strokeLinecap="round" />
    <circle r={9} fill={INK} />
  </g>
);

// twin-bell alarm clock standing on (0,0)
const AlarmClock: React.FC<{ f: number; ring: number }> = ({ f, ring }) => {
  const sh = ring > 0 ? 5 * Math.sin(f * 1.9) * ring : 0;
  return (
    <g transform={`rotate(${sh} 0 -60)`}>
      <line x1={-40} y1={-10} x2={-56} y2={6} stroke={INK} strokeWidth={8} strokeLinecap="round" />
      <line x1={40} y1={-10} x2={56} y2={6} stroke={INK} strokeWidth={8} strokeLinecap="round" />
      <path d="M -70 -118 A 30 30 0 0 1 -26 -150 Z" fill={RED} stroke={INK} strokeWidth={5} />
      <path d="M 70 -118 A 30 30 0 0 0 26 -150 Z" fill={RED} stroke={INK} strokeWidth={5} />
      <circle cx={0} cy={-70} r={66} fill={RED} stroke={INK} strokeWidth={6} />
      <g transform="translate(0 -70)">
        <ClockFace r={50} h={7} m={0} />
      </g>
      {ring > 0.01 &&
        [0, 1, 2].map((i) => {
          const p = ((f + i * 8) % 24) / 24;
          return (
            <g key={i} opacity={(1 - p) * ring}>
              <path d={`M ${-90 - 40 * p} ${-120} Q ${-110 - 50 * p} ${-70} ${-90 - 40 * p} ${-20}`} fill="none" stroke={YEL} strokeWidth={7} strokeLinecap="round" />
              <path d={`M ${90 + 40 * p} ${-120} Q ${110 + 50 * p} ${-70} ${90 + 40 * p} ${-20}`} fill="none" stroke={YEL} strokeWidth={7} strokeLinecap="round" />
            </g>
          );
        })}
    </g>
  );
};

// bedroom: wall, window with curtains (open = 0..1), bed, nightstand
const Bedroom: React.FC<{ f: number; light: number; gap: number; open: number }> = ({ f, light, gap, open }) => {
  const sky = mix("#1d2546", "#9fd8ff", light);
  const cw = ((WIN.x1 - WIN.x0) / 2) * (1 - 0.82 * open) - gap / 2;
  return (
    <g>
      <rect width={1080} height={1920} fill={mix(WALL_N, WALL_D, light)} />
      {/* window */}
      <rect x={WIN.x0} y={WIN.y0} width={WIN.x1 - WIN.x0} height={WIN.y1 - WIN.y0} fill={sky} {...K} strokeWidth={10} />
      {light > 0.05 && (
        <g opacity={light}>
          <circle cx={900} cy={560} r={70} fill={SUN} stroke={SUNC} strokeWidth={6} />
          <path d={`M ${WIN.x0} 860 Q 760 800 860 840 Q 940 800 ${WIN.x1} 850 L ${WIN.x1} ${WIN.y1} L ${WIN.x0} ${WIN.y1} Z`} fill="#7cc488" />
        </g>
      )}
      {light <= 0.05 &&
        [0, 1, 2, 3, 4].map((i) => <circle key={i} cx={690 + i * 70} cy={460 + ((i * 53) % 140)} r={4} fill="#fff6d0" opacity={0.5 + 0.4 * Math.sin(f / 15 + i)} />)}
      <line x1={(WIN.x0 + WIN.x1) / 2} y1={WIN.y0} x2={(WIN.x0 + WIN.x1) / 2} y2={WIN.y1} stroke={INK} strokeWidth={8} />
      <line x1={WIN.x0} y1={(WIN.y0 + WIN.y1) / 2} x2={WIN.x1} y2={(WIN.y0 + WIN.y1) / 2} stroke={INK} strokeWidth={8} />
      {/* curtain rod + curtains */}
      <rect x={WIN.x0 - 40} y={WIN.y0 - 40} width={WIN.x1 - WIN.x0 + 80} height={16} rx={8} fill="#6b4a2f" {...K} strokeWidth={4} />
      {[0, 1].map((side) => {
        const x = side === 0 ? WIN.x0 - 26 : WIN.x1 + 26 - (cw + 26);
        return (
          <g key={side}>
            <rect x={x} y={WIN.y0 - 30} width={cw + 26} height={WIN.y1 - WIN.y0 + 80} rx={14} fill={mix(CURT2, CURT, light)} {...K} strokeWidth={5} />
            {[0.25, 0.5, 0.75].map((k) => (
              <line key={k} x1={x + (cw + 26) * k} y1={WIN.y0 - 20} x2={x + (cw + 26) * k} y2={WIN.y1 + 40} stroke={INK} strokeWidth={3} opacity={0.25} />
            ))}
          </g>
        );
      })}
      {/* floor */}
      <rect x={0} y={GROUND - 120} width={1080} height={1920 - GROUND + 120} fill={mix(FLOOR_N, FLOOR_D, light)} />
      <rect x={0} y={GROUND - 120} width={1080} height={10} fill={INK} opacity={0.25} />
      {/* bed (left, behind Spark) */}
      <rect x={-20} y={1000} width={70} height={GROUND - 1000} rx={12} fill="#7a5233" {...K} />
      <rect x={-20} y={1120} width={420} height={110} rx={20} fill={mix("#5a6aa8", "#8fb4ff", light)} {...K} />
      <ellipse cx={90} cy={1110} rx={70} ry={34} fill={WHITE} {...K} strokeWidth={5} />
      <path d="M 120 1130 Q 240 1090 400 1140 L 400 1230 L 120 1230 Z" fill={mix("#7b5fa8", "#c9a0ff", light)} {...K} strokeWidth={5} />
      <rect x={380} y={1200} width={20} height={GROUND - 1200} fill="#7a5233" />
      {/* nightstand */}
      <rect x={NS.x - 80} y={NS.top} width={160} height={GROUND - NS.top} rx={10} fill="#8a5a36" {...K} />
      <rect x={NS.x - 56} y={NS.top + 40} width={112} height={50} rx={8} fill="#a06c45" {...K} strokeWidth={4} />
    </g>
  );
};

// pine tree with its base on (0,0)
const Pine: React.FC<{ s: number; c: string }> = ({ s, c }) => (
  <g transform={`scale(${s})`}>
    <rect x={-12} y={-60} width={24} height={60} fill="#5b3b23" />
    <path d="M 0 -330 L 90 -170 L 50 -170 L 120 -60 L -120 -60 L -50 -170 L -90 -170 Z" fill={c} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
  </g>
);

// the campsite; sky = day / night / dawn amounts
const Camp: React.FC<{ f: number; night: number; dawn: number }> = ({ f, night, dawn }) => {
  const day = mix("#8fd3ff", "#141b3a", night);
  const sky = mix(day, "#ffb27a", dawn * (1 - 0)); // warm sunrise tint
  const sky2 = mix(mix("#d8f1ff", "#2a2f5a", night), "#ffe2a8", dawn);
  const sunY = night > 0.5 && dawn < 0.01 ? 1300 : interpolate(dawn, [0, 1], [1000, 560]);
  return (
    <g>
      <defs>
        <linearGradient id="h29-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky} />
          <stop offset="1" stopColor={sky2} />
        </linearGradient>
      </defs>
      <rect width={1080} height={1920} fill="url(#h29-sky)" />
      {night > 0.05 &&
        dawn < 0.6 &&
        Array.from({ length: 24 }, (_, i) => (
          <circle key={i} cx={(i * 211) % 1080} cy={300 + ((i * 137) % 520)} r={i % 4 ? 3 : 5} fill="#fff6d0" opacity={night * (1 - dawn) * (0.5 + 0.4 * Math.sin(f / 14 + i))} />
        ))}
      {night > 0.05 && dawn < 0.3 && <circle cx={220} cy={420} r={56} fill="#fff3c4" opacity={night * (1 - dawn * 3)} />}
      {/* sun (day + sunrise) */}
      {(night < 0.5 || dawn > 0.01) && (
        <g transform={`translate(${night < 0.5 && dawn < 0.01 ? 880 : 800} ${night < 0.5 && dawn < 0.01 ? 420 : sunY})`}>
          <circle r={110} fill={SUN} opacity={0.3} />
          <circle r={74} fill={SUN} stroke={SUNC} strokeWidth={6} />
        </g>
      )}
      {/* mountains */}
      <path d="M -40 1060 L 230 760 L 420 980 L 640 700 L 900 1000 L 1120 820 L 1120 1100 L -40 1100 Z" fill={mix(mix("#7c9fc4", "#2b3560", night), "#c98d8a", dawn)} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      {/* back pines */}
      {[40, 150, 330, 980, 1060].map((x, i) => (
        <g key={x} transform={`translate(${x} ${1120})`}>
          <Pine s={0.9 + (i % 2) * 0.2} c={mix(PINE, "#10291c", night * (1 - dawn))} />
        </g>
      ))}
      {/* ground */}
      <rect x={0} y={1100} width={1080} height={820} fill={mix(mix("#6fae5a", "#24402c", night), "#8db45e", dawn)} />
      <rect x={0} y={GROUND} width={1080} height={1920 - GROUND} fill={mix(mix("#5d9a4b", "#1d3524", night), "#79a34f", dawn)} />
      {Array.from({ length: 14 }, (_, i) => (
        <path key={i} d={`M ${30 + i * 76} ${GROUND + 70 + (i % 3) * 60} l 8 -22 l 8 22`} fill="none" stroke={PINE2} strokeWidth={4} strokeLinecap="round" />
      ))}
    </g>
  );
};

const Tent: React.FC<{ door: number }> = ({ door }) => (
  <g transform={`translate(${TENT.x} ${GROUND})`}>
    <path d={`M ${-TENT.w / 2} 0 L 0 ${-TENT.h} L ${TENT.w / 2} 0 Z`} fill="#f28c38" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d={`M ${-TENT.w / 2 - 20} 0 L 0 ${-TENT.h - 10} L ${TENT.w / 2 + 20} 0`} fill="none" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d={`M 0 ${-TENT.h} L ${-60 - 30 * door} 0 L ${60 + 30 * door} 0 Z`} fill="#2a1a12" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
  </g>
);

const Campfire: React.FC<{ f: number; lit: number }> = ({ f, lit }) => (
  <g transform={`translate(${FIRE.x} ${GROUND})`}>
    {lit > 0.01 && <circle cy={-40} r={150} fill="#ffb347" opacity={0.25 * lit} />}
    <rect x={-60} y={-22} width={120} height={22} rx={10} fill="#6b4226" stroke={INK} strokeWidth={4} transform="rotate(12)" />
    <rect x={-60} y={-22} width={120} height={22} rx={10} fill="#7a4c2c" stroke={INK} strokeWidth={4} transform="rotate(-12)" />
    {lit > 0.01 && (
      <g transform={`scale(${lit})`}>
        <path d={`M -34 -18 Q ${-30 + 6 * Math.sin(f / 3)} -80 0 ${-120 - 8 * Math.sin(f / 2)} Q ${30 + 6 * Math.cos(f / 3)} -80 34 -18 Z`} fill="#ff7a2f" stroke={INK} strokeWidth={4} />
        <path d={`M -16 -18 Q -14 -56 0 ${-76 - 6 * Math.cos(f / 2.5)} Q 14 -56 16 -18 Z`} fill={SUN} />
      </g>
    )}
  </g>
);

// a plain table lamp with a red line through it (NO LAMPS sign)
const NoLamps: React.FC = () => (
  <g>
    <rect x={-150} y={-150} width={300} height={300} rx={26} fill={WHITE} {...K} />
    <g transform="translate(0 -12)">
      <path d="M -50 -40 L 50 -40 L 34 -100 L -34 -100 Z" fill={YEL} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <rect x={-6} y={-40} width={12} height={60} fill={INK} />
      <rect x={-40} y={20} width={80} height={14} rx={6} fill={INK} />
    </g>
    <line x1={-90} y1={-120} x2={90} y2={60} stroke={RED} strokeWidth={16} strokeLinecap="round" />
    <Txt y={118} s={44}>
      NO LAMPS
    </Txt>
  </g>
);

// --- sound ----------------------------------------------------------------------------------------------------------
export const S01_SFX: SfxCue[] = [
  [2, "tick", 0.2],
  [T.alarm0 + 2, "clink", 0.18],
  [T.does1, "tick", 0.15],
  [T.clock2 - 4, "pop", 0.25],
  [T.slow3, "tick", 0.15],
  [T.reset3, "boing", 0.18],
  [T.alarm4, "clink", 0.18],
  [T.cannot4 + 10, "buzz", 0.15],
  [T.light4 - 4, "swish", 0.2],
  [T.can4, "ding", 0.25],
  [CAMP0 - 8, "whoosh_long", 0.25],
  [T.lamps5, "pop", 0.25],
  [NIGHT0, "swish", 0.15],
  [T.c6 + 4, "pop", 0.2],
  [T.two6, "ding", 0.22],
  [T.sunrise7 - 8, "riser", 0.15],
  [T.ready7 + 6, "pop", 0.18],
  [T.small8, "pop", 0.22],
  [T.agree8, "ding", 0.22],
  [BACK, "whoosh", 0.2],
  [T.open9, "swish", 0.25],
  [T.curtains9 + 6, "ding", 0.22],
  [T.sun10, "pop", 0.2],
  [T.phone10, "pop", 0.2],
  [LOOP, "tick", 0.2],
].map((c) => c as SfxCue);

export const S01Light: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const loopBack = f >= LOOP - 2;
  const camp = f >= CAMP0 && f < BACK;
  const room2 = f >= BACK && !loopBack;
  const cam = camAt(f, SHOTS, VERTICAL);

  // ---------------- bedroom ----------------
  const ring = loopBack ? 1 : f < T.c1 + 20 ? 1 : f >= T.alarm4 - 2 && f < T.light4 ? 1 : 0;
  const gap = !room2 && !loopBack && f >= T.light4 - 6 && f < CAMP0 ? ease(f, T.light4 - 6, T.light4 + 8, 0, 34) : 0;
  const open = room2 ? ease(f, T.open9 - 4, T.curtains9 + 14, 0, 1) : 0;
  const light = loopBack ? 0 : room2 ? open : gap > 0 ? 0.12 * (gap / 34) : 0;
  const bubK = !camp && !loopBack && f >= T.clock2 - 6 ? popIn(f, T.clock2 - 6) * (room2 ? 1 - ease(f, T.c10 - 16, T.c10 - 6, 0, 1) : 1) : 0;
  // body clock hands: the real time ticks normally (ghost); the body clock drifts behind ("runs a little slow")
  const tMin = (f / 30) * 6; // minutes drawn per second (just a moving hand)
  const lag = room2 ? 0 : ease(f, T.slow3 - 6, T.slow3 + 40, 0, 1);
  const bodyM = tMin - lag * 25;
  const reset = room2 ? ease(f, T.curtains9, T.curtains9 + 20, 0, 1) : f >= T.can4 ? ease(f, T.can4, T.can4 + 18, 0, 1) : 0;
  const shownM = bodyM + reset * lag * 25;
  const slowTag = !room2 && f >= T.slow3 - 2 && f < T.c4 - 6 ? popIn(f, T.slow3 - 2) : 0;
  const resetTag = !room2 && f >= T.reset3 - 2 && f < T.c4 - 6 ? popIn(f, T.reset3 - 2) : 0;
  const alarmTag = !room2 && f >= T.cannot4 && f < CAMP0 ? popIn(f, T.cannot4) : 0;
  const lightTag = !room2 && f >= T.can4 - 4 && f < CAMP0 ? popIn(f, T.can4 - 4) : 0;
  const waveP = !room2 && f >= T.alarm4 && f < T.light4 ? (f - T.alarm4) / Math.max(1, T.light4 - T.alarm4) : -1;
  const glow = room2 ? open : f >= T.can4 && f < CAMP0 ? ease(f, T.can4 - 4, T.can4 + 10, 0, 1) : 0;
  const askK = room2 && f >= T.c10 - 6 ? popIn(f, T.c10 - 6) : 0;

  // ---------------- camp ----------------
  const night = camp ? ease(f, NIGHT0, NIGHT0 + 20, 0, 1) : 0;
  const dawn = camp ? ease(f, DAWN0, T.sunrise7 + 10, 0, 1) : 0;
  const campersOut = camp && (f < NIGHT0 + 10 || f >= T.ready7 - 2);
  const outK = f >= T.ready7 - 2 ? popIn(f, T.ready7 - 2) : 1;
  const zzz = camp && f >= NIGHT0 + 10 && f < T.ready7 - 2;
  const lampK = camp && f >= T.lamps5 - 6 && f < NIGHT0 ? popIn(f, T.lamps5 - 6) : 0;
  const cardK = camp && f >= T.c6 - 4 && f < T.c7 - 2 ? popIn(f, T.c6 - 4) * (1 - ease(f, T.c7 - 12, T.c7 - 2, 0, 1)) : 0;
  const cardTurn = ease(f, T.two6 - 4, T.earlier6 + 10, 0, 1); // body-night marker moves 2 h earlier
  const twoK = f >= T.two6 ? popIn(f, T.two6) : 0;
  const smallK = camp && f >= T.small8 - 4 ? popIn(f, T.small8 - 4) : 0;
  const labK = camp && f >= T.lab8 - 2 ? popIn(f, T.lab8 - 2) : 0;

  // --- Spark ---
  const sparkKeys = gestureKeys([
    [0, G.facepalm],
    [T.c1, G.thinkChin, "smooth"],
    [T.never1, G.shrugBig, "smooth"],
    [T.c2, G.pointUp, "smooth"],
    [T.wake2, G.rest, "smooth"],
    [T.c3, G.handsHips, "smooth"],
    [T.reset3, G.shrugBig, "smooth"],
    [T.c4, G.pointSide, "smooth"],
    [T.cannot4, G.stop, "snap"],
    [T.light4, G.presentBoth, "smooth"],
    [CAMP0, G.present, "snap"],
    [T.lamps5, G.pointSide, "smooth"],
    [T.c6, G.thinkChin, "smooth"],
    [T.two6, G.count2, "smooth"],
    [T.c7, G.rest, "smooth"],
    [T.sunrise7, G.celebrate, "smooth"],
    [T.c8, G.shrugBig, "smooth"],
    [T.lab8, G.fistPump, "smooth"],
    [BACK, G.rest, "snap"],
    [T.open9 - 4, G.pointSide, "smooth"],
    [T.curtains9 + 8, G.celebrate, "smooth"],
    [T.c10, G.doublePoint, "smooth"],
    [T.first10, G.beckon, "smooth"],
    [LOOP - 4, G.facepalm, "snap"],
  ]);
  const mood = (t: number): Mood => {
    if (t >= LOOP - 2) return "worried";
    if (t < T.c1) return "worried";
    if (t < T.c2) return "curious";
    if (t < T.c3) return "thinking";
    if (t < T.c4) return "sad";
    if (t < T.light4) return "skeptical";
    if (t < CAMP0) return "mindblown";
    if (t < T.c6) return "excited";
    if (t < T.c7) return "curious";
    if (t < T.c8) return "happy";
    if (t < T.lab8) return "thinking";
    if (t < BACK) return "smug";
    if (t < T.curtains9) return "determined";
    if (t < T.c10) return "excited";
    if (t < T.first10) return "curious";
    return "wink";
  };
  const bulb = (t: number) => Math.max(bulbPulse(t, T.light4, 30), bulbPulse(t, T.two6, 24), bulbPulse(t, T.curtains9 + 6, 28));
  const sparkMod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t, 3));
    q = addPose(q, shake(t, T.alarm0, 2));
    q = addPose(q, nod(t, T.wake2 - 10, 1));
    q = addPose(q, hop(t, T.light4 + 4, 12));
    q = addPose(q, nod(t, T.earlier6, 1));
    q = addPose(q, hop(t, T.curtains9 + 10, 14));
    const inCamp = t >= CAMP0 && t < BACK;
    return { ...q, x: inCamp ? SXC : SX };
  };
  const sparkFacing = () => 1;

  const camperKeys = (o: number) =>
    gestureKeys([
      [0, G.rest],
      [CAMP0 + 20 + o, G.present, "smooth"],
      [CAMP0 + 70 + o, G.rest, "smooth"],
      [T.ready7 - 2, G.rest, "snap"],
      [T.ready7 + 8 + o, G.celebrate, "smooth"],
      [T.ready7 + 50 + o, G.rest, "smooth"],
      [T.c8 + 20 + o, G.present, "smooth"],
      [T.c8 + 70 + o, G.rest, "smooth"],
    ]);

  const sparkEl = (
    <Spark f={f} scale={SS} base={{ x: SX, y: STANDY }} facing={sparkFacing} talk={(t) => mouthAt(t)} bulb={bulb} mood={mood} look={1} keys={sparkKeys} mod={sparkMod} />
  );

  // body-clock thought bubble
  const bubble = bubK > 0.01 && (
    <g transform={`translate(${BUB.x} ${BUB.y}) scale(${bubK})`}>
      {[
        [-30, 200, 16],
        [-10, 160, 24],
      ].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={WHITE} {...K} strokeWidth={5} />
      ))}
      <ellipse rx={175} ry={150} fill={WHITE} {...K} strokeWidth={6} />
      <g transform="translate(0 -14)">
        <ClockFace r={BUB.r - 20} h={6.5 + shownM / 60} m={shownM % 60} fill={glow > 0.5 ? "#fff6cf" : WHITE} glow={glow} />
      </g>
      <Txt y={-178} s={40} c={INK}>
        BODY CLOCK
      </Txt>
    </g>
  );

  const roomSvg = (
    <>
      <Bedroom f={f} light={light} gap={gap} open={open} />
      {/* thin sunbeam through the curtain gap onto the body clock */}
      {gap > 2 && !room2 && (
        <path
          d={`M ${(WIN.x0 + WIN.x1) / 2 - gap / 2} ${WIN.y0 + 40} L ${(WIN.x0 + WIN.x1) / 2 + gap / 2} ${WIN.y0 + 40} L ${BUB.x + 60} ${BUB.y + 60} L ${BUB.x - 20} ${BUB.y - 60} Z`}
          fill={SUN}
          opacity={0.45 * (gap / 34)}
        />
      )}
      {room2 && open > 0.05 && (
        <path d={`M ${WIN.x0} ${WIN.y0} L ${WIN.x1} ${WIN.y0} L 700 ${GROUND} L 60 ${GROUND} Z`} fill={SUN} opacity={0.18 * open} />
      )}
      <g transform={`translate(${NS.x} ${NS.top})`}>
        <AlarmClock f={f} ring={ring} />
      </g>
      {/* sound waves from the alarm bounce off the bubble */}
      {waveP >= 0 &&
        [0, 0.33, 0.66].map((o) => {
          const p = (waveP * 2 + o) % 1;
          const x = interpolate(p, [0, 1], [NS.x - 40, BUB.x + 170]);
          const y = interpolate(p, [0, 1], [NS.top - 80, BUB.y + 40]);
          return <path key={o} d={`M ${x} ${y - 40} Q ${x - 30} ${y} ${x} ${y + 40}`} fill="none" stroke={YEL} strokeWidth={8} strokeLinecap="round" opacity={1 - p * 0.6} />;
        })}
      {sparkEl}
      {bubble}
      {slowTag > 0.01 && (
        <g transform={`translate(${BUB.x + 300} ${BUB.y - 90}) scale(${slowTag}) rotate(${-3 + wobble(f, T.slow3 - 2, 6)})`}>
          <Tag text="A LITTLE SLOW" fill={RED} w={300} s={36} />
        </g>
      )}
      {resetTag > 0.01 && (
        <g transform={`translate(${BUB.x + 300} ${BUB.y + 10}) scale(${resetTag}) rotate(${2 + wobble(f, T.reset3 - 2, 6)})`}>
          <Tag text="NEEDS A RESET" fill={WHITE} w={310} s={36} c={INK} />
        </g>
      )}
      {alarmTag > 0.01 && (
        <g transform={`translate(${BUB.x + 340} ${BUB.y - 110}) scale(${alarmTag})`}>
          <Tag text="ALARM ✗" fill={RED} w={240} />
        </g>
      )}
      {lightTag > 0.01 && (
        <g transform={`translate(${BUB.x + 340} ${BUB.y - 10}) scale(${lightTag}) rotate(${wobble(f, T.can4 - 4, 6)})`}>
          <Tag text="LIGHT ✓" fill={GREEN} w={240} />
        </g>
      )}
      {askK > 0.01 && (
        <g transform={`translate(${SX + 260} ${HEADY - 300}) scale(${askK}) rotate(${wobble(f, T.c10 - 6, 6)})`}>
          <rect x={-200} y={-90} width={400} height={180} rx={40} fill={WHITE} {...K} />
          <g transform="translate(-110 -10)" opacity={f >= T.sun10 - 2 ? 1 : 0.25}>
            <circle r={44} fill={SUN} stroke={INK} strokeWidth={5} />
            <Txt y={84} s={32}>
              SUN
            </Txt>
          </g>
          <Txt y={10} s={34}>
            OR
          </Txt>
          <g transform="translate(110 -10)" opacity={f >= T.phone10 - 2 ? 1 : 0.25}>
            <rect x={-28} y={-48} width={56} height={96} rx={12} fill="#2b2b3a" stroke={INK} strokeWidth={5} />
            <rect x={-20} y={-38} width={40} height={70} rx={6} fill="#7fc3ff" />
            <Txt y={84} s={32}>
              PHONE
            </Txt>
          </g>
        </g>
      )}
    </>
  );

  const campSvg = (
    <>
      <Camp f={f} night={night} dawn={dawn} />
      <Tent door={zzz ? 0 : 1} />
      <Campfire f={f} lit={night * (1 - dawn)} />
      {zzz &&
        [0, 1, 2].map((i) => {
          const p = ((f + i * 20) % 60) / 60;
          return (
            <Txt key={i} x={TENT.x + 40 + 50 * p + i * 12} y={GROUND - TENT.h - 20 - 120 * p} s={44 + i * 8} c={WHITE}>
              Z
            </Txt>
          );
        })}
      {campersOut &&
        CAMPERS.map((c) => (
          <g key={c.x} opacity={outK}>
            <Actor f={f} color={c.c} scale={CS} base={{ x: c.x, y: CY }} keys={camperKeys(c.o)} mod={(t, p) => addPose(p, idle(t + c.o, 4))} facing={-1} face="happy" trails={false} />
          </g>
        ))}
      {lampK > 0.01 && (
        <g transform={`translate(780 560) scale(${lampK}) rotate(${-4 + wobble(f, T.lamps5 - 6, 6)})`}>
          <NoLamps />
        </g>
      )}
      {cardK > 0.01 && (
        <g transform={`translate(600 600) scale(${cardK})`}>
          <rect x={-330} y={-250} width={660} height={500} rx={30} fill={WHITE} {...K} />
          <Txt y={-182} s={46}>
            BODY CLOCK
          </Txt>
          <g transform="translate(0 10)">
            <ClockFace r={130} h={11 - 2 * cardTurn} m={0} />
          </g>
          {twoK > 0.01 && (
            <g transform={`translate(0 205) scale(${twoK})`}>
              <Txt y={0} s={54} c={RED}>
                2 HOURS EARLIER
              </Txt>
            </g>
          )}
        </g>
      )}
      {sparkEl}
      {smallK > 0.01 && (
        <g transform={`translate(560 520) scale(${smallK}) rotate(${-3 + wobble(f, T.small8 - 4, 6)})`}>
          <Tag text="SMALL STUDY" fill={WHITE} w={360} s={44} c={INK} />
        </g>
      )}
      {labK > 0.01 && (
        <g transform={`translate(600 640) scale(${labK}) rotate(${2 + wobble(f, T.lab8 - 2, 6)})`}>
          <Tag text="LAB TESTS AGREE ✓" fill={GREEN} w={470} s={42} />
        </g>
      )}
    </>
  );

  const html = (
    <>
      {(f < T.c1 - 4 || loopBack) && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 262,
            textAlign: "center",
            fontFamily: FONT.title,
            fontWeight: 900,
            lineHeight: 1.0,
            fontSize: 112,
            transform: `rotate(-2deg) scale(${1 + wobble(f, loopBack ? LOOP : 0, 0.03, 8)})`,
            opacity: loopBack ? 1 : interpolate(f, [T.c1 - 14, T.c1 - 4], [1, 0], clamp),
          }}
        >
          <div style={{ color: WHITE, WebkitTextStroke: `10px ${INK}`, paintOrder: "stroke fill" }}>NOT YOUR</div>
          <div style={{ color: YEL, WebkitTextStroke: `10px ${INK}`, paintOrder: "stroke fill" }}>ALARM</div>
        </div>
      )}
      {f >= 300 && f < LOOP - 4 && (
        <>
          <div
            style={{
              position: "absolute",
              left: 540,
              top: 1700,
              transform: "translate(-50%,-50%)",
              fontFamily: FONT.body,
              fontWeight: 700,
              fontSize: 22,
              color: INK,
              whiteSpace: "nowrap",
              opacity: 0.9,
              background: "rgba(255,255,255,0.85)",
              padding: "2px 12px",
              borderRadius: 8,
            }}
          >
            Wright et al. 2013 (8 campers, 1 week) · Khalsa et al. 2003 · Education, not medical advice
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
        </>
      )}
      <VoiceCaptions
        f={f}
        y={1500}
        cues={VOICE_CUES}
        hi={["alarm", "body", "clock.", "never", "clock", "wake.", "slow,", "reset.", "light", "camping", "lamps.", "two", "earlier.", "sunrise.", "small", "agree.", "bedroom,", "curtains.", "sun", "phone"]}
      />
      <Transition f={f} at={CAMP0} kind="iris" size={VERTICAL} colors={[SUN, "#8fd3ff", WALL_N]} />
    </>
  );

  return <Stage bg={<AbsoluteFill style={{ background: camp ? "#8fd3ff" : WALL_N }} />} cam={cam} hits={[]} power={4} svg={camp ? campSvg : roomSvg} html={html} />;
};
