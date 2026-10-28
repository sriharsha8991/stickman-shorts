import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Actor, addPose, idle, type Pose } from "../stickman/stick";
import { Burst, COL, FONT, Slam } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, K, VoiceCaptions, punch } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { G, gestureKeys, hop, nod, shake } from "../shared/gestures";
import { camAt, Transition, VERTICAL, type Shot } from "../shared/camera";
import { popIn, squash, wobble } from "../shared/motion";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// V103 · "Your pocket buzzed. Your phone didn't." (Your brain did this, ~20 s)
// World A: a sunny morning metro carriage (coral seats, lemon rails, a city skyline sliding past). Spark's pocket buzzes,
// he whips the phone out: nothing. Three STAFF commuters: two of them feel the phantom buzz too.
// Whip → World B: inside Spark's head, a sonar room called BUZZ DETECTOR with SENSITIVITY jammed at MAX. A shirt-rub
// blip turns into a CALL!, a twitch blip into a TEXT!, then the caveat stamp BEST GUESS.
// Hard cut back to the carriage: the VIBRATE switch flips to OFF and the buzzing stops. Loops into frame 0.
// Source: Rothberg et al. 2010, BMJ 341:c6914 (115 of 169 staff, 68%; off vibrate worked for 75% of those who tried it).

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const SS = 1.9;
const STANDY = GROUND - 92.5 * SS;
const HEADY = STANDY - 197;
const SX = 300; // Spark in the carriage
const RX = 270; // Spark in the sonar room

// palette: morning metro (A) + sonar room (B)
const SKY = "#bfe6ff";
const SKY2 = "#e9f6ff";
const CORAL = "#ff7a6b";
const CORAL2 = "#d9574a";
const LEMON = "#ffd84d";
const CREAM = "#fff4dc";
const WALL = "#f7e3c8";
const FLOOR = "#8a7f9e";
const CITY = ["#9fb6d9", "#b6c7e6", "#8aa3cc", "#a9bde0"];
const STAFF = "#4f6fd1";
const OLIVE = "#2e3a24";
const OLIVE2 = "#3f4f30";
const AMBER = "#ffb000";
const AMBER2 = "#8a5d00";
const SCOPE = "#132010";
const RED = "#e8333c";
const STEEL = "#8d9a86";
const DENIM = "#3b5b92";
const DENIM2 = "#2b4473";
const INK = COL.ink;

const T = {
  pocket: W(0, 1),
  buzzed: W(0, 2),
  phone0: W(0, 4),
  didnt: W(0, 5),
  c1: C(1),
  stop: W(1, 0),
  checking: W(1, 1),
  not: W(1, 3),
  c2: C(2),
  two: W(2, 0),
  three: W(2, 2),
  staff: W(2, 4),
  too: W(2, 7),
  room: C(3),
  waiting: W(3, 3),
  buzz3: W(3, 6),
  c4: C(4),
  shirt: W(4, 2),
  rub: W(4, 3),
  call: W(4, 6),
  c5: C(5),
  twitch: W(5, 1),
  text: W(5, 4),
  c6: C(6),
  researchers: W(6, 2),
  best: W(6, 3),
  guess: W(6, 4),
  back: C(7),
  vibrate: W(7, 1),
  stopped: W(7, 2),
  most: W(7, 5),
  c8: C(8),
  pocket8: W(8, 3),
  lie: W(8, 5),
  you8: W(8, 7),
};
const LOOP = VOICE_FRAMES - 14;
const ROOM0 = T.room;
const ROOM1 = T.back;
const FLIP = T.stopped - 4; // the VIBRATE switch flips to OFF

const SHOTS: Shot[] = [
  { f: 0, z: 1.5, at: [420, 1000], e: "cut" }, // frame 0: Spark + buzzing pocket
  { f: T.buzzed - 3, z: 1.75, at: [SX + 30, 1080], e: "snap" }, // INSERT pocket
  { f: T.didnt - 4, z: 1.6, at: [SX + 120, 900], e: "snap" }, // INSERT phone out: nothing
  { f: T.c1, z: 2.0, at: [SX + 20, HEADY], e: "cut" }, // CU: "Stop checking."
  { f: T.not - 3, z: 1.4, at: [SX + 60, 900], e: "snap" }, // MED: taps his head
  { f: T.c2, z: 1.0, at: [540, 960], e: "cut" }, // WIDE carriage
  { f: T.three - 3, z: 1.6, at: [820, 960], e: "snap" }, // the three STAFF
  { f: ROOM0, z: 1.0, at: [540, 960], e: "cut" }, // whip → WIDE sonar room
  { f: ROOM0 + 6, z: 1.18, at: [640, 900], e: "slow" }, // slow push to the scope
  { f: T.shirt - 4, z: 1.7, at: [700, 760], e: "snap" }, // INSERT scope: shirt rub
  { f: T.call - 2, z: 1.3, at: [520, 830], e: "snap" }, // MED: alarm + Spark
  { f: T.c5, z: 1.75, at: [700, 760], e: "cut" }, // INSERT scope: twitch
  { f: T.text - 2, z: 1.25, at: [520, 840], e: "snap" }, // MED: alarm again
  { f: T.c6, z: 2.0, at: [RX + 20, HEADY], e: "cut" }, // CU (re-hook): best guess
  { f: T.best - 4, z: 1.45, at: [420, 760], e: "snap" }, // MED: clipboard stamp
  { f: ROOM1, z: 1.0, at: [540, 960], e: "cut" }, // hard cut WIDE carriage
  { f: T.vibrate - 3, z: 1.7, at: [690, 640], e: "snap" }, // INSERT the switch
  { f: T.most - 4, z: 1.2, at: [600, 960], e: "snap" }, // MED: everyone calm
  { f: T.c8, z: 2.05, at: [SX + 20, HEADY], e: "cut" }, // CU: the comment question
  { f: LOOP, z: 1.5, at: [420, 1000], e: "cut" }, // back into frame 0
];

// --- props ------------------------------------------------------------------------------------------------------
const PhoneProp: React.FC<{ s?: number; r?: number; lit?: number }> = ({ s = 1, r = 0, lit = 0 }) => (
  <g transform={`rotate(${r}) scale(${s})`}>
    <rect x={-30} y={-54} width={60} height={108} rx={12} fill="#1c1c22" {...K} strokeWidth={5} />
    <rect x={-23} y={-44} width={46} height={84} rx={6} fill={lit > 0 ? "#3a4256" : "#2a2f3c"} />
    <text y={-14} textAnchor="middle" fontFamily={FONT.body} fontWeight={700} fontSize={15} fill="#cfd8ea">
      8:14
    </text>
    <line x1={-12} y1={24} x2={12} y2={24} stroke="#5d6680" strokeWidth={3} strokeLinecap="round" />
  </g>
);

// zigzag "buzz" lines around a point; k = strength 0..1
const BuzzLines: React.FC<{ x: number; y: number; f: number; k: number; col?: string }> = ({ x, y, f, k, col = INK }) => {
  if (k <= 0.01) return null;
  const j = Math.sin(f * 2.3) * 4;
  const z = (sx: number, sy: number, dir: number) =>
    `M ${sx} ${sy} l ${10 * dir} -12 l ${-10 * dir} -12 l ${10 * dir} -12 l ${-10 * dir} -12`;
  return (
    <g opacity={k} transform={`translate(${x + j} ${y})`}>
      <path d={z(-58, 40, -1)} fill="none" stroke={col} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      <path d={z(-78, 52, -1)} fill="none" stroke={col} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" opacity={0.6} />
      <path d={z(58, 40, 1)} fill="none" stroke={col} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      <path d={z(78, 52, 1)} fill="none" stroke={col} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" opacity={0.6} />
    </g>
  );
};

// hip pocket (denim patch) with the phone top peeking out
const Pocket: React.FC<{ x: number; y: number; phoneIn: boolean; jig: number }> = ({ x, y, phoneIn, jig }) => (
  <g transform={`translate(${x + jig} ${y})`}>
    {phoneIn && <rect x={-16} y={-34} width={32} height={30} rx={6} fill="#1c1c22" stroke={INK} strokeWidth={4} />}
    <path d="M -30 -10 L 30 -10 L 26 40 Q 0 52 -26 40 Z" fill={DENIM} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <path d="M -24 -2 L 24 -2" stroke={DENIM2} strokeWidth={3} strokeDasharray="6 5" />
  </g>
);

const Book: React.FC = () => (
  <g>
    <rect x={-34} y={-24} width={68} height={48} rx={4} fill={CORAL} {...K} strokeWidth={4} />
    <line x1={0} y1={-24} x2={0} y2={24} stroke={INK} strokeWidth={3} />
  </g>
);

const Carriage: React.FC<{ f: number }> = ({ f }) => {
  const off = (f * 5) % 1400;
  return (
    <g>
      <rect width={1080} height={1920} fill={WALL} />
      {/* ceiling */}
      <rect x={0} y={0} width={1080} height={300} fill={CREAM} />
      <rect x={0} y={292} width={1080} height={16} fill={STEEL} stroke={INK} strokeWidth={4} />
      {/* windows with the city sliding past */}
      <defs>
        <clipPath id="v103-win">
          <rect x={40} y={430} width={1000} height={360} rx={40} />
        </clipPath>
      </defs>
      <g clipPath="url(#v103-win)">
        <rect x={40} y={430} width={1000} height={360} fill={SKY} />
        <rect x={40} y={430} width={1000} height={120} fill={SKY2} opacity={0.6} />
        <circle cx={860} cy={520} r={44} fill={LEMON} stroke={INK} strokeWidth={4} />
        {Array.from({ length: 16 }, (_, i) => {
          const bx = ((i * 175 - off) % 1400 + 1400) % 1400 - 160;
          const bh = 120 + ((i * 73) % 160);
          return (
            <g key={i}>
              <rect x={bx} y={790 - bh} width={130} height={bh} fill={CITY[i % 4]} stroke={INK} strokeWidth={3} />
              {Array.from({ length: Math.floor(bh / 46) }, (_, r) => (
                <rect key={r} x={bx + 22} y={790 - bh + 18 + r * 46} width={86} height={14} rx={3} fill="#fff" opacity={0.55} />
              ))}
            </g>
          );
        })}
      </g>
      {[40, 540].map((x) => (
        <rect key={x} x={x} y={430} width={500} height={360} rx={40} fill="none" stroke={INK} strokeWidth={8} />
      ))}
      {/* grab rail */}
      <rect x={0} y={354} width={1080} height={18} rx={9} fill={LEMON} stroke={INK} strokeWidth={5} />
      {/* poles */}
      <rect x={510} y={372} width={18} height={GROUND - 372} fill={LEMON} stroke={INK} strokeWidth={5} />
      {/* bench */}
      <rect x={560} y={1050} width={520} height={46} rx={14} fill={CORAL} {...K} />
      <rect x={570} y={1096} width={500} height={GROUND - 1096} fill={CORAL2} {...K} strokeWidth={5} />
      <rect x={560} y={860} width={520} height={190} rx={16} fill={CORAL} {...K} />
      {/* floor */}
      <rect y={GROUND} width={1080} height={1920 - GROUND} fill={FLOOR} />
      {Array.from({ length: 9 }, (_, i) => (
        <circle key={i} cx={60 + i * 120} cy={GROUND + 120} r={10} fill="#fff" opacity={0.25} />
      ))}
      <line x1={0} y1={GROUND} x2={1080} y2={GROUND} stroke={INK} strokeWidth={6} />
    </g>
  );
};

// --- world B: the sonar room ----------------------------------------------------------------------------------------
const SCX = 720;
const SCY = 760;
const SCR = 200;

const SonarRoom: React.FC<{ f: number; alarm: number; needle: number }> = ({ f, alarm, needle }) => {
  const sweep = (f * 7) % 360;
  return (
    <g>
      <rect width={1080} height={1920} fill={OLIVE} />
      {Array.from({ length: 7 }, (_, i) => (
        <line key={i} x1={i * 180} y1={0} x2={i * 180} y2={GROUND} stroke={OLIVE2} strokeWidth={14} />
      ))}
      {/* pipes */}
      <rect x={0} y={250} width={1080} height={26} fill={STEEL} stroke={INK} strokeWidth={4} />
      <rect x={0} y={300} width={1080} height={16} fill={STEEL} stroke={INK} strokeWidth={3} opacity={0.8} />
      {/* alarm lamp */}
      <g transform="translate(940 420)">
        <circle r={110 + alarm * 60} fill={RED} opacity={alarm * 0.35} />
        <rect x={-46} y={30} width={92} height={30} rx={6} fill={STEEL} {...K} strokeWidth={4} />
        <path d="M -40 30 Q -40 -50 0 -50 Q 40 -50 40 30 Z" fill={alarm > 0.3 ? RED : "#7a2a2e"} stroke={INK} strokeWidth={5} />
        <path d="M -18 0 Q -14 -26 6 -32" stroke="#fff" strokeWidth={6} strokeLinecap="round" fill="none" opacity={0.6} />
      </g>
      {/* scope panel */}
      <rect x={SCX - 250} y={SCY - 290} width={500} height={560} rx={30} fill={STEEL} {...K} strokeWidth={7} />
      <rect x={SCX - 170} y={SCY - 270} width={340} height={52} rx={10} fill={INK} />
      <text x={SCX} y={SCY - 232} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={34} fill={AMBER} letterSpacing={3}>
        BUZZ DETECTOR
      </text>
      <circle cx={SCX} cy={SCY + 20} r={SCR} fill={SCOPE} stroke={INK} strokeWidth={8} />
      {[0.33, 0.66, 1].map((k) => (
        <circle key={k} cx={SCX} cy={SCY + 20} r={SCR * k - 6} fill="none" stroke={AMBER} strokeWidth={2} opacity={0.4} />
      ))}
      <line x1={SCX - SCR} y1={SCY + 20} x2={SCX + SCR} y2={SCY + 20} stroke={AMBER} strokeWidth={2} opacity={0.3} />
      <line x1={SCX} y1={SCY + 20 - SCR} x2={SCX} y2={SCY + 20 + SCR} stroke={AMBER} strokeWidth={2} opacity={0.3} />
      <g transform={`translate(${SCX} ${SCY + 20}) rotate(${sweep})`}>
        <path d={`M 0 0 L ${SCR - 8} 0 A ${SCR - 8} ${SCR - 8} 0 0 0 ${(SCR - 8) * Math.cos(-0.6)} ${(SCR - 8) * Math.sin(-0.6)} Z`} fill={AMBER} opacity={0.28} />
        <line x1={0} y1={0} x2={SCR - 8} y2={0} stroke={AMBER} strokeWidth={4} />
      </g>
      {/* console desk */}
      <rect x={330} y={1070} width={760} height={40} rx={8} fill={STEEL} {...K} />
      <rect x={350} y={1110} width={720} height={GROUND - 1110} fill="#55614c" {...K} />
      {/* SENSITIVITY dial */}
      <g transform="translate(470 1190)">
        <circle r={62} fill={CREAM} {...K} />
        <path d="M -44 22 A 48 48 0 1 1 44 22" fill="none" stroke={INK} strokeWidth={4} />
        <path d="M 30 -36 A 48 48 0 0 1 44 22" fill="none" stroke={RED} strokeWidth={10} />
        <line x1={0} y1={0} x2={0} y2={-46} stroke={RED} strokeWidth={6} strokeLinecap="round" transform={`rotate(${needle})`} />
        <circle r={7} fill={INK} />
        <text x={80} y={8} textAnchor="start" fontFamily={FONT.body} fontWeight={800} fontSize={24} fill={CREAM}>
          SENSITIVITY
        </text>
        <text x={58} y={-40} fontFamily={FONT.body} fontWeight={900} fontSize={22} fill={RED}>
          MAX
        </text>
      </g>
      {/* buttons */}
      {[800, 880, 960].map((x, i) => (
        <circle key={x} cx={x} cy={1250} r={20} fill={[AMBER, RED, "#6fbf4a"][i]} stroke={INK} strokeWidth={4} opacity={(Math.floor(f / 7) + i) % 3 === 0 ? 0.5 : 1} />
      ))}
      <rect y={GROUND} width={1080} height={1920 - GROUND} fill="#1f2818" />
      <line x1={0} y1={GROUND} x2={1080} y2={GROUND} stroke={INK} strokeWidth={6} />
    </g>
  );
};

// blips on the scope
const ShirtBlip: React.FC<{ x: number; y: number; f: number }> = ({ x, y, f }) => (
  <g transform={`translate(${x} ${y}) rotate(${Math.sin(f / 3) * 6})`}>
    <path d="M -46 -30 L -20 -40 Q 0 -28 20 -40 L 46 -30 L 40 -6 L 28 -10 L 28 36 L -28 36 L -28 -10 L -40 -6 Z" fill="#ff9e8f" stroke={AMBER} strokeWidth={4} strokeLinejoin="round" />
    {[-8, 8, 24].map((dy) => (
      <line key={dy} x1={-26} y1={dy} x2={26} y2={dy} stroke={AMBER} strokeWidth={4} opacity={0.8} />
    ))}
  </g>
);
const TwitchBlip: React.FC<{ x: number; y: number; f: number }> = ({ x, y, f }) => (
  <g transform={`translate(${x} ${y}) scale(${1 + 0.08 * Math.sin(f * 1.4)})`}>
    <path d="M -60 0 L -34 0 L -22 -30 L -6 30 L 8 -34 L 20 20 L 32 0 L 60 0" fill="none" stroke={AMBER} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
  </g>
);
const CallIcon: React.FC<{ x: number; y: number; k: number }> = ({ x, y, k }) =>
  k > 0.01 ? (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <circle r={62} fill={RED} stroke={INK} strokeWidth={5} />
      <path d="M -30 -22 Q -34 -34 -22 -36 L -10 -36 L -4 -18 L -14 -10 Q -6 8 12 16 L 20 6 L 38 12 L 38 24 Q 36 36 24 34 Q -22 26 -30 -22 Z" fill="#fff" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
    </g>
  ) : null;
const TextIcon: React.FC<{ x: number; y: number; k: number }> = ({ x, y, k }) =>
  k > 0.01 ? (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <path d="M -62 -40 Q -62 -56 -46 -56 L 46 -56 Q 62 -56 62 -40 L 62 20 Q 62 36 46 36 L -10 36 L -34 58 L -30 36 L -46 36 Q -62 36 -62 20 Z" fill={RED} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      {[-26, 0, 26].map((dx) => (
        <circle key={dx} cx={dx} cy={-10} r={9} fill="#fff" />
      ))}
    </g>
  ) : null;

const Clipboard: React.FC<{ k: number; stamp: number; sq: number }> = ({ k, stamp, sq }) =>
  k > 0.01 ? (
    <g transform={`scale(${k})`}>
      <rect x={-110} y={-140} width={220} height={280} rx={16} fill="#b98a55" {...K} />
      <rect x={-92} y={-110} width={184} height={234} rx={6} fill={CREAM} stroke={INK} strokeWidth={4} />
      <rect x={-40} y={-156} width={80} height={36} rx={8} fill={STEEL} {...K} strokeWidth={4} />
      {[-70, -40, -10].map((y) => (
        <line key={y} x1={-70} y1={y} x2={70} y2={y} stroke={INK} strokeWidth={4} opacity={0.35} />
      ))}
      {stamp > 0.01 && (
        <g transform={`translate(0 50) rotate(-12) scale(${1 / sq} ${sq})`} opacity={stamp}>
          <rect x={-104} y={-42} width={208} height={84} rx={10} fill="none" stroke={RED} strokeWidth={8} />
          <text y={-4} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={40} fill={RED}>
            BEST
          </text>
          <text y={34} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={40} fill={RED}>
            GUESS
          </text>
        </g>
      )}
    </g>
  ) : null;

const Toggle: React.FC<{ k: number; on: number }> = ({ k, on }) =>
  k > 0.01 ? (
    <g transform={`scale(${k})`}>
      <rect x={-230} y={-100} width={460} height={200} rx={36} fill={CREAM} {...K} strokeWidth={7} />
      <text x={-130} y={-48} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={34} fill={INK} opacity={0.4 + 0.6 * (1 - on)}>
        VIBRATE
      </text>
      <text x={140} y={-48} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={34} fill={INK} opacity={0.4 + 0.6 * on}>
        OFF
      </text>
      <rect x={-150} y={-16} width={300} height={84} rx={42} fill={on > 0.5 ? "#8fd16a" : "#cfcfcf"} {...K} strokeWidth={6} />
      <circle cx={interpolate(on, [0, 1], [-108, 108])} cy={26} r={34} fill="#fff" {...K} strokeWidth={6} />
    </g>
  ) : null;

export const S01_SFX: SfxCue[] = [
  [0, "buzz", 0.45],
  [T.buzzed - 3, "whoosh", 0.25],
  [T.buzzed, "buzz", 0.4],
  [T.didnt - 4, "swish", 0.35],
  [T.didnt + 2, "pop", 0.35],
  [T.c1, "whoosh", 0.25],
  [T.checking, "swish", 0.3],
  [T.checking + 9, "swish", 0.3],
  [T.not, "ding", 0.35],
  [T.c2, "whoosh", 0.25],
  [T.two, "buzz", 0.35],
  [T.three, "buzz", 0.35],
  [T.three + 4, "boing", 0.3],
  [ROOM0 - 6, "whoosh_long", 0.45],
  [T.waiting, "tick", 0.3],
  [T.waiting + 14, "tick", 0.25],
  [T.buzz3, "tick", 0.3],
  [T.shirt - 4, "whoosh", 0.25],
  [T.call, "impact", 0.6],
  [T.call + 2, "buzz", 0.35],
  [T.c5, "whoosh", 0.25],
  [T.text, "ding", 0.45],
  [T.text + 2, "buzz", 0.3],
  [T.c6, "whoosh", 0.25],
  [T.best, "stamp", 0.65],
  [ROOM1, "whoosh", 0.3],
  [FLIP, "clink", 0.5],
  [FLIP + 3, "pop", 0.4],
  [T.most, "ding", 0.45],
  [T.c8, "whoosh", 0.3],
  [T.lie, "pop", 0.3],
  [LOOP, "buzz", 0.45],
];

const HOLD: Partial<Pose> = { la1: -24, la2: -20, ra1: 30, ra2: 24, head: 6 }; // frozen, arms out

export const S01Carriage: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const room = f >= ROOM0 && f < ROOM1;
  const loopBack = f >= LOOP - 2;
  const cam0 = camAt(f, SHOTS, VERTICAL);
  const cam = { ...cam0, z: cam0.z * punch(f, [T.buzzed, T.call, T.text, T.best], 0.035) };

  // phone in or out of the pocket
  const phoneOut = !room && !loopBack && ((f >= T.didnt - 4 && f < T.checking + 3) || (f >= T.checking + 9 && f < T.not - 2) || (f >= ROOM1 && f < FLIP + 26));
  // pocket buzz strength
  const buzzK = loopBack
    ? 1
    : f < T.didnt - 4
      ? 1
      : f >= ROOM1 && f < FLIP
        ? 0.45
        : 0;

  const sparkKeys = room
    ? gestureKeys([
        [ROOM0, G.leanIn],
        [T.waiting, G.pointSide, "snap"],
        [T.c4, G.leanIn, "snap"],
        [T.call - 2, G.recoil, "snap"],
        [T.c5, G.pointSide, "snap"],
        [T.text, G.shrugBig, "snap"],
        [T.c6, G.thinkChin, "snap"],
        [T.best, G.present, "snap"],
      ])
    : gestureKeys([
        [0, HOLD],
        [T.didnt - 5, { la1: -30, la2: -20, ra1: 100, ra2: 30, head: 8 }, "snap"],
        [T.c1, G.facepalm, "snap"],
        [T.checking, { la1: -20, la2: -10, ra1: 20, ra2: 20 }, "snap"],
        [T.checking + 9, { la1: -20, la2: -10, ra1: 100, ra2: 30, head: 8 }, "snap"],
        [T.not - 2, { la1: -150, la2: -110, ra1: 20, ra2: 10, head: -6 }, "snap"],
        [T.c2, G.present, "snap"],
        [T.three, G.doublePoint, "snap"],
        [ROOM1, { ...G.stop, ra1: 100, ra2: 30 }, "snap"],
        [T.most, G.celebrate, "snap"],
        [T.c8, G.leanIn, "snap"],
        [T.lie - 2, G.beckon, "snap"],
        [LOOP - 2, HOLD],
      ]);

  const mood = (t: number): Mood =>
    t >= LOOP - 2
      ? "shock"
      : t < T.phone0
        ? "shock"
        : t < T.c1
          ? "skeptical"
          : t < T.not
            ? "angry"
            : t < T.c2
              ? "curious"
              : t < T.three
                ? "excited"
                : t < ROOM0
                  ? "laugh"
                  : t < T.c4
                    ? "determined"
                    : t < T.c5
                      ? "shock"
                      : t < T.c6
                        ? "laugh"
                        : t < T.best
                          ? "thinking"
                          : t < ROOM1
                            ? "wink"
                            : t < T.most
                              ? "happy"
                              : t < T.c8
                                ? "excited"
                                : "curious";
  const bulb = (t: number) =>
    Math.max(bulbPulse(t, T.not, 24), bulbPulse(t, T.buzz3, 26), bulbPulse(t, T.most, 26), t >= T.call && t < T.c5 ? 0.5 + 0.5 * Math.sign(Math.sin(t * 1.4)) : 0);

  const sparkMod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t, 4));
    q = addPose(addPose(q, shake(t, 0, 3)), shake(t, T.buzzed, 2));
    q = addPose(addPose(q, nod(t, T.stop, 1)), hop(t, T.three, 22));
    q = addPose(addPose(q, shake(t, T.call, 3)), hop(t, T.text, 20));
    q = addPose(addPose(q, nod(t, T.guess, 1)), hop(t, T.most, 30));
    q = addPose(addPose(q, nod(t, T.lie, 1)), shake(t, LOOP, 3));
    // the carriage sways a little
    const sway = room ? 0 : Math.sin(t / 14) * 2;
    return { ...q, lean: q.lean + sway, x: room ? RX : SX };
  };

  // STAFF commuters (carriage): two of them feel phantom buzzes on "two" / "three"
  const staffX = [690, 830, 970];
  const staffBuzz = (i: number) =>
    !room && i < 2 && f >= [T.two, T.three][i] && f < [T.two, T.three][i] + 24 ? 1 : !room && i < 2 && f >= ROOM1 && f < FLIP ? 0.35 : 0;
  const staffKeys = (i: number) =>
    gestureKeys([
      [0, i === 2 ? { ra1: 70, ra2: 80, la1: -70, la2: -80, head: 14 } : G.rest],
      ...(i < 2
        ? ([
            [[T.two, T.three][i], { la1: -40, la2: -60, ra1: 30, ra2: 70, head: 12 }, "snap"],
            [[T.two, T.three][i] + 30, G.rest],
            [T.most, { ...G.shrugBig, head: -6 }, "snap"],
            [LOOP - 2, G.rest],
          ] as Parameters<typeof gestureKeys>[0])
        : []),
    ]);
  const staffMod = (i: number) => (t: number, p: Pose) => {
    let q = addPose(p, idle(t + i * 20, 3));
    if (i < 2) q = addPose(q, shake(t, [T.two, T.three][i], 3));
    return { ...q, lean: q.lean + Math.sin(t / 14) * 2 };
  };

  // sonar room state
  const shirtT = interpolate(f, [T.c4, T.rub], [0, 1], clamp);
  const shirtOn = room && f >= T.c4 && f < T.call;
  const callK = room && f >= T.call && f < T.c6 + 6 ? popIn(f, T.call) : 0;
  const twitchT = interpolate(f, [T.c5, T.twitch + 6], [0, 1], clamp);
  const twitchOn = room && f >= T.c5 && f < T.text;
  const textK = room && f >= T.text && f < T.c6 + 6 ? popIn(f, T.text) : 0;
  const alarm = room
    ? Math.max(
        f >= T.call && f < T.c5 ? 0.5 + 0.5 * Math.sign(Math.sin(f * 0.9)) : 0,
        f >= T.text && f < T.c6 ? 0.5 + 0.5 * Math.sign(Math.sin(f * 0.9)) : 0,
      )
    : 0;
  const needle = 118 + Math.sin(f * 1.7) * 8 + wobble(f, T.call, 10);
  const clipK = room && f >= T.researchers - 4 ? popIn(f, T.researchers - 2) : 0;
  const stampK = f >= T.best ? 1 : 0;
  const stampSq = squash(f, T.best, 0.22)[1];

  // carriage: switch
  const toggleK = !room && f >= ROOM1 && f < T.c8 ? popIn(f, ROOM1 + 2) : 0;
  const toggleOn = interpolate(f, [FLIP, FLIP + 5], [0, 1], clamp);

  return (
    <Stage
      bg={<AbsoluteFill style={{ background: room ? OLIVE : WALL }} />}
      cam={cam}
      hits={[T.call, T.best]}
      power={10}
      svg={
        room ? (
          <>
            <SonarRoom f={f} alarm={alarm} needle={needle} />
            {shirtOn && <ShirtBlip x={interpolate(shirtT, [0, 1], [SCX - 170, SCX - 30])} y={SCY + 20 + interpolate(shirtT, [0, 1], [-90, -10])} f={f} />}
            {twitchOn && <TwitchBlip x={interpolate(twitchT, [0, 1], [SCX + 160, SCX + 40])} y={SCY + 60} f={f} />}
            <CallIcon x={SCX - 30} y={SCY + 10} k={callK} />
            <TextIcon x={SCX + 50} y={SCY + 60} k={textK} />
            {f >= T.call && f < T.call + 16 && <Burst x={SCX} y={SCY + 20} at={T.call} f={f} size={240} color={RED} />}
            {f >= T.text && f < T.text + 16 && <Burst x={SCX + 50} y={SCY + 60} at={T.text} f={f} size={200} color={AMBER} />}
            <Spark f={f} scale={SS} base={{ x: RX, y: STANDY }} facing={1} talk={(t) => mouthAt(t)} bulb={bulb} mood={mood} look={1} keys={sparkKeys} mod={sparkMod}>
              {(j) => (
                // headset
                <g>
                  <path d={`M ${j.headC[0] - 44} ${j.headC[1] + 4} Q ${j.headC[0]} ${j.headC[1] - 92} ${j.headC[0] + 44} ${j.headC[1] + 4}`} fill="none" stroke={INK} strokeWidth={9} />
                  <rect x={j.headC[0] + 34} y={j.headC[1] - 14} width={22} height={40} rx={8} fill={AMBER2} stroke={INK} strokeWidth={4} />
                </g>
              )}
            </Spark>
            <g transform={`translate(470 600) rotate(${wobble(f, T.best, 7)})`}>
              <Clipboard k={clipK} stamp={stampK} sq={stampSq} />
            </g>
          </>
        ) : (
          <>
            <Carriage f={f} />
            {staffX.map((x, i) => (
              <Actor
                key={i}
                f={f}
                color={STAFF}
                scale={1.32}
                base={{ x, y: GROUND - 92.5 * 1.32 }}
                keys={staffKeys(i)}
                mod={staffMod(i)}
                facing={-1}
                face={i < 2 && staffBuzz(i) > 0.5 ? "eyes" : "happy"}
                label="STAFF"
                trails={false}
              >
                {(j) => (
                  <g>
                    {i === 2 && (
                      <g transform={`translate(${(j.lHand[0] + j.rHand[0]) / 2} ${(j.lHand[1] + j.rHand[1]) / 2 - 10})`}>
                        <Book />
                      </g>
                    )}
                    <g transform={`translate(${j.hip[0]} ${j.hip[1] + 20}) scale(1.4) translate(${-j.hip[0]} ${-j.hip[1] - 20})`}><BuzzLines x={j.hip[0]} y={j.hip[1] + 20} f={f} k={staffBuzz(i)} col={RED} /></g>
                  </g>
                )}
              </Actor>
            ))}
            <Spark f={f} scale={SS} base={{ x: SX, y: STANDY }} facing={1} talk={(t) => mouthAt(t)} bulb={bulb} mood={mood} look={1} keys={sparkKeys} mod={sparkMod}>
              {(j) => (
                <g>
                  <Pocket x={j.hip[0] + (j.rKnee[0] - j.hip[0]) * 0.5} y={j.hip[1] + (j.rKnee[1] - j.hip[1]) * 0.5} phoneIn={!phoneOut} jig={buzzK > 0 ? Math.sin(f * 2.6) * 3 * buzzK : 0} />
                  <BuzzLines x={j.hip[0] + (j.rKnee[0] - j.hip[0]) * 0.5} y={j.hip[1] + (j.rKnee[1] - j.hip[1]) * 0.5 + 20} f={f} k={buzzK} col={RED} />
                  {phoneOut && (
                    <g transform={`translate(${j.rHand[0] + 8} ${j.rHand[1] - 40})`}>
                      <PhoneProp s={1.25} r={6} lit={1} />
                    </g>
                  )}
                </g>
              )}
            </Spark>
            <g transform={`translate(690 640) rotate(${wobble(f, FLIP, 5)})`}>
              <Toggle k={toggleK} on={toggleOn} />
            </g>
            {f >= FLIP && f < FLIP + 14 && <Burst x={SX + 40} y={1120} at={FLIP} f={f} size={140} color={LEMON} />}
          </>
        )
      }
      html={
        <>
          {/* frame-0 overlay (≤ 4 words): BZZT? → NOTHING. */}
          {(f < T.c1 - 2 || loopBack) && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center", fontFamily: FONT.title, fontWeight: 900, lineHeight: 1.0 }}>
              <div style={{ fontSize: 150, color: RED, WebkitTextStroke: `10px ${INK}`, paintOrder: "stroke fill", transform: `rotate(-4deg) translateX(${Math.sin(f * 2.2) * 6}px)` }}>BZZT?</div>
              {f >= T.didnt && !loopBack && (
                <div style={{ fontSize: 120, color: "#fff", WebkitTextStroke: `10px ${INK}`, paintOrder: "stroke fill", transform: `scale(${popIn(f, T.didnt)}) rotate(3deg)`, marginTop: 10 }}>NOTHING.</div>
              )}
            </div>
          )}
          <Slam f={f} at={T.call} out={T.c5} x={540} y={330} size={140} color={RED} stroke={`11px ${INK}`} rotate={-4}>
            CALL!
          </Slam>
          <Slam f={f} at={T.text} out={T.c6} x={540} y={330} size={140} color={AMBER} stroke={`11px ${INK}`} rotate={3}>
            TEXT!
          </Slam>
          {f >= 300 && f < LOOP - 4 && (
            <>
              <div style={{ position: "absolute", left: 540, top: 1712, transform: "translate(-50%,-50%)", fontFamily: FONT.body, fontWeight: 700, fontSize: 24, color: INK, whiteSpace: "nowrap", opacity: 0.85, background: "rgba(255,255,255,0.6)", padding: "2px 12px", borderRadius: 8 }}>
                Rothberg et al. 2010, BMJ · survey of one hospital&apos;s staff
              </div>
              <div style={{ position: "absolute", right: 96, top: 1768, fontFamily: FONT.title, fontWeight: 900, fontSize: 28, color: room ? AMBER : CORAL2, letterSpacing: 2, opacity: 0.9 }}>YOUR BRAIN DID THIS</div>
            </>
          )}
          <VoiceCaptions
            f={f}
            y={1500}
            cues={VOICE_CUES}
            hi={["pocket", "buzzed.", "didn't.", "Stop", "not", "Two", "three", "brain", "waiting", "buzz.", "shirt", "call.", "twitch", "text.", "best", "guess.", "Off", "vibrate", "stopped", "lie"]}
          />
          <Transition f={f} at={ROOM0} kind="whip" size={VERTICAL} colors={[CORAL, AMBER]} />
        </>
      }
    />
  );
};
