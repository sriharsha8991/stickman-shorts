import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { addPose, idle, type Pose } from "../stickman/stick";
import { COL, FONT } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, K, VoiceCaptions } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { G, gestureKeys, hop, nod, shake } from "../shared/gestures";
import { camAt, VERTICAL, type Shot } from "../shared/camera";
import { ease, popIn, wobble } from "../shared/motion";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// V020 · "Why does this pop-up make you insult yourself?" (Designed to get you, ~39 s, clarity rules)
// ONE place: a sage-green library reading nook in the afternoon. Spark stands by a wooden desk with a big laptop.
// A shop pop-up: SAVE 10% · YES, PLEASE · "No thanks, I hate saving money." The cursor drifts to YES (almost buys),
// Spark stops it. A card names the trick (CONFIRM SHAMING) and says what it means. Spark brings a big rule book onto
// the desk: INDIA · CONSUMER RULES · NOT ALLOWED: CONFIRM SHAMING; two notes COMPANY · FINED (2026). The book goes
// away, a tag says THE SHOP WROTE THIS, the cursor clicks NO, the pop-up closes. Comment question; the pop-up returns (loop).
// Sources: CCPA Guidelines for Prevention and Regulation of Dark Patterns 2023; PIB release 3 Jun 2026; Mathur et al. 2019.

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const SS = 1.9;
const STANDY = GROUND - 92.5 * SS;
const HEADY = STANDY - 200;

// palette: sage library + warm wood + honey afternoon light
const WALL1 = "#d5e6c8";
const WALL2 = "#bcd5ab";
const SHELF = "#7a4f32";
const SHELF2 = "#5e3b25";
const FLOOR = "#b9875a";
const FLOOR2 = "#a37349";
const DESK = "#8c5a36";
const DESK2 = "#6f4529";
const LIGHT = "#fff3c8";
const RED = "#e8484f";
const GREEN = "#2fb463";
const GOLD = "#ffcf3f";
const PAPER = "#fffaf0";
const WHITE = "#ffffff";
const HL = "#fff06a";
const INK = COL.ink;
const BOOKS = ["#c8553d", "#2f6690", "#e0a526", "#5a8f4e", "#8e5aa8", "#d97a4a", "#3d7d7a", "#b33f62"];

const T = {
  c0: C(0),
  popup0: W(0, 3),
  insult0: W(0, 6),
  c1: C(1),
  no1: W(1, 3),
  saving1: W(1, 7),
  money1: W(1, 8),
  c2: C(2),
  silly2: W(2, 3),
  almost2: W(2, 6),
  buy2: W(2, 7),
  not2: W(2, 11),
  c3: C(3),
  confirm3: W(3, 4),
  c4: C(4),
  guilty4: W(4, 5),
  no4: W(4, 8),
  c5: C(5),
  india5: W(5, 1),
  rules5: W(5, 3),
  allow5: W(5, 5),
  c6: C(6),
  year6: W(6, 1),
  two6: W(6, 2),
  fined6: W(6, 5),
  c7: C(7),
  shop7: W(7, 2),
  words7: W(7, 5),
  you7: W(7, 7),
  c8: C(8),
  click8: W(8, 1),
  no8: W(8, 2),
  fine8: W(8, 6),
  c9: C(9),
  rudest9: W(9, 2),
  seen9: W(9, 6),
};
const LOOP = VOICE_FRAMES - 14;

// staging
const SX = 190; // Spark
const LAP = { x: 680, y0: 560, y1: 980, w: 640 }; // laptop screen (outer)
const DESK_TOP = 1040;
const POP = { x: 680, y: 770, w: 520, h: 340 }; // pop-up centre + size
const YES = { x: 680, y: 790 };
const NO = { x: 680, y: 880 };
const BOOK = { x: 640, y: 830 };

const SHOTS: Shot[] = [
  { f: 0, z: 1.06, at: [530, 860], e: "cut" }, // frame 0: Spark + pop-up
  { f: 4, z: 1.12, at: [520, 850], e: "slow" },
  { f: T.c1 - 6, z: 1.55, at: [NO.x - 20, NO.y - 30], e: "slow" }, // INSERT: the NO button
  { f: T.c2 - 6, z: 1.12, at: [500, 880], e: "slow" }, // MED: Spark + cursor
  { f: T.c3 - 6, z: 1.08, at: [520, 760], e: "slow" }, // MED: name card + laptop
  { f: T.c4 + 10, z: 1.12, at: [520, 770], e: "slow" }, // slow drift (hold)
  { f: T.c5 - 6, z: 1.08, at: [520, 860], e: "slow" }, // MED: the book arrives
  { f: T.c6 - 6, z: 1.25, at: [BOOK.x + 40, BOOK.y - 40], e: "slow" }, // INSERT: the book + FINED notes
  { f: T.c7 - 6, z: 1.4, at: [730, NO.y - 80], e: "slow" }, // INSERT: NO button + tag
  { f: T.c8 - 6, z: 1.08, at: [540, 880], e: "slow" }, // WIDE: the click
  { f: T.c9 - 6, z: 1.5, at: [SX + 120, HEADY + 40], e: "slow" }, // CU: question
  { f: LOOP, z: 1.06, at: [530, 860], e: "cut" }, // back into frame 0
];

// --- props --------------------------------------------------------------------------------------------------------
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

const Library: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <defs>
      <linearGradient id="v020-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={WALL1} />
        <stop offset="1" stopColor={WALL2} />
      </linearGradient>
      <linearGradient id="v020-beam" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={LIGHT} stopOpacity={0.55} />
        <stop offset="1" stopColor={LIGHT} stopOpacity={0} />
      </linearGradient>
    </defs>
    <rect width={1080} height={1920} fill="url(#v020-wall)" />
    {/* arched window, top right, with a soft beam of afternoon light */}
    <g transform="translate(880 330)">
      <path d="M -120 220 L -120 -40 A 120 120 0 0 1 120 -40 L 120 220 Z" fill="#fff7d6" stroke={SHELF} strokeWidth={14} />
      <path d="M 0 -160 L 0 220 M -120 60 L 120 60" stroke={SHELF} strokeWidth={9} />
      <circle cx={-40} cy={-30} r={34} fill="#ffe08a" opacity={0.9} />
    </g>
    <path d="M 760 380 L 1000 380 L 700 1290 L 260 1290 Z" fill="url(#v020-beam)" opacity={0.8 + 0.08 * Math.sin(f / 40)} />
    {/* tall bookshelf on the left */}
    <g>
      <rect x={-20} y={180} width={360} height={1110} fill={SHELF} />
      <rect x={-20} y={180} width={360} height={26} fill={SHELF2} />
      {[0, 1, 2, 3, 4].map((r) => (
        <g key={r}>
          <rect x={-20} y={400 + r * 200} width={360} height={18} fill={SHELF2} />
          {Array.from({ length: 9 }, (_, i) => {
            const h = 120 + ((i * 37 + r * 13) % 50);
            return (
              <rect
                key={i}
                x={4 + i * 36}
                y={400 + r * 200 - h}
                width={30}
                height={h}
                rx={4}
                fill={BOOKS[(i + r * 3) % BOOKS.length]}
                opacity={0.85}
                transform={i === 6 && r % 2 ? `rotate(-12 ${4 + i * 36} ${400 + r * 200})` : undefined}
              />
            );
          })}
        </g>
      ))}
    </g>
    {/* floor */}
    <rect x={0} y={GROUND} width={1080} height={1920 - GROUND} fill={FLOOR} />
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <path key={i} d={`M 0 ${GROUND + 40 + i * 70} L 1080 ${GROUND + 40 + i * 70}`} stroke={FLOOR2} strokeWidth={4} />
    ))}
    {/* rug */}
    <ellipse cx={540} cy={GROUND + 60} rx={460} ry={46} fill="#c96f5a" opacity={0.75} />
  </g>
);

const Desk: React.FC = () => (
  <g>
    <rect x={380} y={DESK_TOP} width={640} height={34} rx={8} fill={DESK} {...K} />
    <rect x={410} y={DESK_TOP + 34} width={30} height={GROUND - DESK_TOP - 34} fill={DESK2} />
    <rect x={960} y={DESK_TOP + 34} width={30} height={GROUND - DESK_TOP - 34} fill={DESK2} />
    <rect x={450} y={DESK_TOP + 34} width={500} height={70} fill={DESK2} opacity={0.6} />
    {/* little plant at the desk's right end */}
    <g transform={`translate(985 ${DESK_TOP})`}>
      <path d="M -26 0 L 26 0 L 20 -46 L -20 -46 Z" fill="#d07a4a" {...K} strokeWidth={4} />
      <path d="M 0 -46 Q -40 -80 -30 -120 Q -4 -96 0 -46 Q 6 -110 34 -124 Q 40 -84 0 -46" fill={GREEN} {...K} strokeWidth={4} />
    </g>
  </g>
);

// a mouse cursor (arrow), tip at (0,0)
const Cursor: React.FC<{ press?: number }> = ({ press = 0 }) => (
  <g transform={`scale(${1.5 - 0.2 * press})`}>
    {press > 0.01 && <circle r={30 * press + 10} fill="none" stroke={GOLD} strokeWidth={5} opacity={press} />}
    <path d="M 0 0 L 0 44 L 11 33 L 20 54 L 28 50 L 19 30 L 34 30 Z" fill={WHITE} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
  </g>
);

// the shop pop-up, centred at (0,0). `ul` = how far the NO text is underlined (0..1), `noHot` = NO button highlight
const Popup: React.FC<{ ul: number; noHot: number; yesHot: number }> = ({ ul, noHot, yesHot }) => (
  <g>
    <rect x={-POP.w / 2 + 8} y={-POP.h / 2 + 10} width={POP.w} height={POP.h} rx={22} fill="#00000030" />
    <rect x={-POP.w / 2} y={-POP.h / 2} width={POP.w} height={POP.h} rx={22} fill={WHITE} stroke={INK} strokeWidth={5} />
    <rect x={-POP.w / 2} y={-POP.h / 2} width={POP.w} height={70} rx={22} fill={GOLD} />
    <rect x={-POP.w / 2} y={-POP.h / 2 + 48} width={POP.w} height={22} fill={GOLD} />
    <Txt y={-POP.h / 2 + 50} s={42}>
      SAVE 10% TODAY!
    </Txt>
    {/* close x (greyed out) */}
    <Txt x={POP.w / 2 - 30} y={-POP.h / 2 + 46} s={30} c="#b08a20">
      ×
    </Txt>
    {/* YES button */}
    <g transform={`translate(0 ${YES.y - POP.y}) scale(${1 + 0.06 * yesHot})`}>
      <rect x={-200} y={-38} width={400} height={76} rx={38} fill={GREEN} stroke={INK} strokeWidth={4} />
      <Txt y={14} s={40} c={WHITE}>
        YES, PLEASE
      </Txt>
    </g>
    {/* NO button: small grey text, two lines */}
    <g transform={`translate(0 ${NO.y - POP.y})`}>
      {noHot > 0.01 && <rect x={-236} y={-40} width={472} height={88} rx={16} fill={HL} opacity={0.75 * noHot} />}
      <Txt y={-6} s={33} c={noHot > 0.5 ? INK : "#5d6270"} w={700} font={FONT.body}>
        No thanks, I hate
      </Txt>
      <Txt y={34} s={33} c={noHot > 0.5 ? INK : "#5d6270"} w={700} font={FONT.body}>
        saving money.
      </Txt>
      {ul > 0.01 && (
        <>
          <path d={`M -140 4 L ${-140 + 280 * Math.min(1, ul * 1.6)} 4`} stroke={RED} strokeWidth={5} strokeLinecap="round" />
          {ul > 0.62 && <path d={`M -112 44 L ${-112 + 224 * Math.min(1, (ul - 0.62) / 0.38)} 44`} stroke={RED} strokeWidth={5} strokeLinecap="round" />}
        </>
      )}
    </g>
  </g>
);

// a calm shop page behind the pop-up
const ShopPage: React.FC = () => (
  <g>
    <rect x={-LAP.w / 2 + 26} y={-(LAP.y1 - LAP.y0) / 2 + 26} width={LAP.w - 52} height={LAP.y1 - LAP.y0 - 52} rx={10} fill="#f4f6fb" />
    <rect x={-LAP.w / 2 + 26} y={-(LAP.y1 - LAP.y0) / 2 + 26} width={LAP.w - 52} height={56} fill="#e2e7f2" />
    <Txt x={-LAP.w / 2 + 56} y={-(LAP.y1 - LAP.y0) / 2 + 66} s={30} a="start" c="#4a5470">
      SHOP
    </Txt>
    {[-170, 0, 170].map((x, i) => (
      <g key={x} transform={`translate(${x} 30)`}>
        <rect x={-72} y={-80} width={144} height={150} rx={12} fill={WHITE} stroke="#cfd5e3" strokeWidth={3} />
        <rect x={-54} y={-62} width={108} height={80} rx={8} fill={["#ffd9b0", "#d9ecff", "#e3f7d9"][i]} />
        <rect x={-50} y={34} width={70} height={12} rx={6} fill="#cfd5e3" />
      </g>
    ))}
  </g>
);

const Laptop: React.FC<{ dim: number; children?: React.ReactNode }> = ({ dim, children }) => {
  const h = LAP.y1 - LAP.y0;
  return (
    <g transform={`translate(${LAP.x} ${(LAP.y0 + LAP.y1) / 2})`}>
      <rect x={-LAP.w / 2} y={-h / 2} width={LAP.w} height={h} rx={24} fill="#2a2d38" {...K} />
      <ShopPage />
      {dim > 0.01 && <rect x={-LAP.w / 2 + 26} y={-h / 2 + 26} width={LAP.w - 52} height={h - 52} rx={10} fill="#1b1e2a" opacity={0.35 * dim} />}
      {children}
      {/* base */}
      <path d={`M ${-LAP.w / 2 - 40} ${h / 2} L ${LAP.w / 2 + 40} ${h / 2} L ${LAP.w / 2 + 10} ${h / 2 + 40} L ${-LAP.w / 2 - 10} ${h / 2 + 40} Z`} fill="#c7ccd8" {...K} strokeWidth={5} />
      <rect x={-60} y={h / 2 + 6} width={120} height={12} rx={6} fill="#9aa1b2" />
    </g>
  );
};

// the big open rule book, centred at (0,0)
const RuleBook: React.FC<{ hl: number }> = ({ hl }) => (
  <g>
    <path d="M -330 -200 Q -170 -230 0 -196 Q 170 -230 330 -200 L 330 210 Q 170 180 0 214 Q -170 180 -330 210 Z" fill="#7a2f2f" {...K} />
    <path d="M -310 -190 Q -160 -214 -4 -184 L -4 196 Q -160 168 -310 192 Z" fill={PAPER} stroke={INK} strokeWidth={4} />
    <path d="M 310 -190 Q 160 -214 4 -184 L 4 196 Q 160 168 310 192 Z" fill={PAPER} stroke={INK} strokeWidth={4} />
    {/* left page */}
    <Txt x={-158} y={-96} s={50} c="#7a2f2f">
      INDIA
    </Txt>
    <Txt x={-158} y={-36} s={34}>
      CONSUMER
    </Txt>
    <Txt x={-158} y={6} s={34}>
      RULES
    </Txt>
    {[60, 96, 132].map((y) => (
      <rect key={y} x={-270} y={y} width={220} height={10} rx={5} fill="#d9d2c0" />
    ))}
    {/* right page */}
    <Txt x={158} y={-110} s={36} c={RED}>
      NOT ALLOWED:
    </Txt>
    {[-66, 82, 118, 154].map((y) => (
      <rect key={y} x={50} y={y} width={216} height={10} rx={5} fill="#d9d2c0" />
    ))}
    {hl > 0.01 && <rect x={36} y={-38} width={244 * hl} height={96} rx={10} fill={HL} />}
    <Txt x={158} y={2} s={34}>
      CONFIRM
    </Txt>
    <Txt x={158} y={42} s={34}>
      SHAMING
    </Txt>
  </g>
);

// a small note: COMPANY / FINED ₹
const FinedNote: React.FC = () => (
  <g>
    <rect x={-120} y={-80} width={240} height={160} rx={14} fill={WHITE} {...K} strokeWidth={5} />
    <Txt y={-28} s={30} c="#4a5470">
      COMPANY
    </Txt>
    <rect x={-96} y={-6} width={192} height={64} rx={10} fill={RED} />
    <Txt y={40} s={40} c={WHITE}>
      FINED ₹
    </Txt>
  </g>
);

// --- sound --------------------------------------------------------------------------------------------------------
export const S01_SFX: SfxCue[] = [
  [2, "pop", 0.2],
  [T.no1, "tick", 0.15],
  [T.saving1, "tick", 0.15],
  [T.almost2 - 4, "whoosh", 0.18],
  [T.not2, "boing", 0.18],
  [T.confirm3 - 4, "pop", 0.3],
  [T.guilty4 - 6, "page", 0.2],
  [T.india5 + 4, "whoosh", 0.2],
  [T.rules5 + 4, "thud", 0.3],
  [T.allow5 + 2, "scribble", 0.18],
  [T.two6, "stamp", 0.25],
  [T.two6 + 12, "stamp", 0.25],
  [T.year6 - 2, "pop", 0.15],
  [T.c7 - 2, "swish", 0.2],
  [T.shop7, "pop", 0.25],
  [T.no8 - 2, "pop", 0.3],
  [T.no8 + 6, "swish", 0.2],
  [T.fine8, "ding", 0.25],
  [T.rudest9, "pop", 0.2],
  [LOOP, "pop", 0.25],
].map((c) => c as SfxCue);

export const S01Shame: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const loopBack = f >= LOOP - 2;
  const cam = camAt(f, SHOTS, VERTICAL);

  // pop-up: up from frame 0, closes on "no" (cue 8), returns at the loop
  const closeAt = T.no8 + 4;
  const popScale = loopBack ? popIn(f, LOOP - 2) : f < closeAt ? 1 : Math.max(0, 1 - (f - closeAt) / 8);
  const popupOn = popScale > 0.01;
  const ul = !loopBack ? ease(f, T.no1 - 2, T.money1 + 10, 0, 1) * (f < T.c2 ? 1 : 0) : 0;
  const noHot = loopBack ? 1 : Math.max(f < T.c1 ? 1 : 0, f >= T.c4 && f < T.c5 ? ease(f, T.no4 - 10, T.no4, 0, 1) : 0, f >= T.c7 && f < closeAt ? 1 : 0);

  // cursor path (screen coords): on NO → drift to YES (almost) → stopped → back to NO → click
  const nearYes: [number, number] = [YES.x + 120, YES.y + 26];
  const onNo: [number, number] = [NO.x + 140, NO.y + 6];
  const parked: [number, number] = [POP.x + 250, POP.y + 150];
  const toYes = ease(f, T.almost2 - 4, T.not2 - 2, 0, 1);
  const pullBack = ease(f, T.not2 + 6, T.c3, 0, 1);
  const toNo = ease(f, T.click8 - 10, T.no8 - 2, 0, 1);
  const lerp = (a: [number, number], b: [number, number], k: number): [number, number] => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  let cur = lerp(onNo, nearYes, toYes);
  cur = lerp(cur, parked, pullBack);
  cur = lerp(cur, onNo, toNo);
  if (loopBack) cur = onNo;
  const press = Math.max(0, 1 - Math.abs(f - T.no8) / 6);
  const yesHot = f < T.c3 ? toYes * (1 - pullBack) : 0;
  const showCursor = loopBack || f < closeAt + 20;

  // name card (cues 3–4)
  const nameK = !loopBack && f >= T.confirm3 - 4 && f < T.c5 - 4 ? popIn(f, T.confirm3 - 4) * (1 - ease(f, T.c5 - 14, T.c5 - 4, 0, 1)) : 0;
  const meanK = !loopBack && f >= T.c4 + 4 && f < T.c5 - 4 ? popIn(f, T.c4 + 4) : 0;

  // the rule book (cues 5–6): comes in on "India", leaves at cue 7
  const bookIn = ease(f, T.india5 - 4, T.rules5 + 4, 0, 1);
  const bookOut = ease(f, T.c7 - 6, T.c7 + 10, 0, 1);
  const bookK = loopBack ? 0 : bookIn * (1 - bookOut);
  const bookY = BOOK.y + 160 * (1 - bookIn) + 160 * bookOut;
  const hl = ease(f, T.allow5 - 2, T.allow5 + 14, 0, 1);
  const noteA = f >= T.two6 - 2 ? popIn(f, T.two6 - 2) : 0;
  const noteB = f >= T.two6 + 10 ? popIn(f, T.two6 + 10) : 0;
  const yearK = f >= T.year6 - 4 ? popIn(f, T.year6 - 4) : 0;

  // tag (cue 7): THE SHOP WROTE THIS
  const tagK = !loopBack && f >= T.shop7 - 4 && f < closeAt ? popIn(f, T.shop7 - 4) : 0;
  // after the click: OK tick on the calm page
  const okK = !loopBack && f >= closeAt + 6 ? popIn(f, closeAt + 6) : 0;
  // comment bubble (cue 9)
  const askK = !loopBack && f >= T.rudest9 - 6 ? popIn(f, T.rudest9 - 6) : 0;

  // --- Spark ---
  const sparkKeys = gestureKeys([
    [0, G.pointSide],
    [T.insult0 - 3, G.recoil, "snap"],
    [T.c1, G.pointSide, "smooth"],
    [T.c2, G.shrugBig, "smooth"],
    [T.not2 - 4, G.stop, "snap"],
    [T.c3, G.pointUp, "smooth"],
    [T.c4, G.thinkChin, "smooth"],
    [T.no4 - 6, G.present, "smooth"],
    [T.c5, G.presentBoth, "smooth"],
    [T.c6, G.handsHips, "smooth"],
    [T.c7, G.pointSide, "smooth"],
    [T.c8, G.fistPump, "smooth"],
    [T.fine8 - 4, G.celebrate, "smooth"],
    [T.c9, G.beckon, "smooth"],
    [LOOP - 4, G.pointSide, "snap"],
  ]);
  const mood = (t: number): Mood => {
    if (t >= LOOP - 2) return "shock";
    if (t < T.insult0 - 3) return "skeptical";
    if (t < T.c1) return "shock";
    if (t < T.c2) return "skeptical";
    if (t < T.not2 - 4) return "worried";
    if (t < T.c3) return "determined";
    if (t < T.c4) return "curious";
    if (t < T.c5) return "thinking";
    if (t < T.c6) return "determined";
    if (t < T.c7) return "smug";
    if (t < T.c8) return "wink";
    if (t < T.c9) return "happy";
    if (t < T.seen9) return "curious";
    return "laugh";
  };
  const bulb = (t: number) => Math.max(bulbPulse(t, T.confirm3, 30), bulbPulse(t, T.shop7, 24), bulbPulse(t, T.fine8, 24));
  const sparkMod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t, 3));
    q = addPose(q, shake(t, T.insult0, 3));
    q = addPose(q, shake(t, T.silly2, 2));
    q = addPose(q, nod(t, T.allow5, 1));
    q = addPose(q, nod(t, T.fined6, 1));
    q = addPose(q, hop(t, T.fine8, 12));
    q = addPose(q, nod(t, T.seen9, 1));
    return { ...q, x: SX };
  };

  const svg = (
    <>
      <Library f={f} />
      <Desk />
      <Laptop dim={popupOn ? popScale : 0}>
        {popupOn && (
          <g transform={`translate(0 ${POP.y - (LAP.y0 + LAP.y1) / 2}) scale(${popScale})`}>
            <Popup ul={ul} noHot={noHot} yesHot={yesHot} />
          </g>
        )}
        {okK > 0.01 && (
          <g transform={`translate(0 ${-130}) scale(${okK})`}>
            <rect x={-150} y={-40} width={300} height={80} rx={40} fill={GREEN} {...K} strokeWidth={5} />
            <Txt y={16} s={44} c={WHITE}>
              CLOSED ✓
            </Txt>
          </g>
        )}
      </Laptop>
      {showCursor && (
        <g transform={`translate(${cur[0]} ${cur[1]})`}>
          <Cursor press={press} />
        </g>
      )}
      {/* name card above the laptop */}
      {nameK > 0.01 && (
        <g transform={`translate(${LAP.x - 40} ${395}) scale(${nameK}) rotate(${-2 + wobble(f, T.confirm3 - 4, 4)})`}>
          <rect x={-300} y={-62} width={600} height={124} rx={20} fill={PAPER} {...K} />
          <Txt y={24} s={68} c={RED}>
            CONFIRM SHAMING
          </Txt>
        </g>
      )}
      {meanK > 0.01 && nameK > 0.01 && (
        <g transform={`translate(${LAP.x - 40} ${512}) scale(${meanK * nameK})`}>
          <rect x={-300} y={-40} width={600} height={80} rx={16} fill={WHITE} {...K} strokeWidth={5} />
          <Txt y={14} s={38}>
            = feel guilty for saying NO
          </Txt>
        </g>
      )}
      {/* rule book on the desk */}
      {bookK > 0.01 && (
        <g opacity={Math.min(1, bookK * 1.4)} transform={`translate(${BOOK.x} ${bookY}) rotate(${-3 + 3 * (1 - bookIn)}) scale(${0.85 + 0.15 * bookK})`}>
          <RuleBook hl={hl} />
          {noteA > 0.01 && (
            <g transform={`translate(-170 ${120}) scale(${noteA * 0.85}) rotate(-6)`}>
              <FinedNote />
            </g>
          )}
          {noteB > 0.01 && (
            <g transform={`translate(165 ${130}) scale(${noteB * 0.85}) rotate(5)`}>
              <FinedNote />
            </g>
          )}
          {yearK > 0.01 && (
            <g transform={`translate(270 -250) scale(${yearK}) rotate(8)`}>
              <circle r={62} fill={GOLD} {...K} strokeWidth={5} />
              <Txt y={14} s={40}>
                2026
              </Txt>
            </g>
          )}
        </g>
      )}
      {/* tag: the shop wrote this */}
      {tagK > 0.01 && (
        <g transform={`translate(${LAP.x - 40} ${505}) scale(${tagK}) rotate(${wobble(f, T.shop7 - 4, 5)})`}>
          <rect x={-250} y={-50} width={500} height={100} rx={18} fill={WHITE} {...K} />
          <Txt y={18} s={50} c="#8a3a1a">
            THE SHOP WROTE THIS
          </Txt>
          <path d="M 220 52 Q 330 200 260 330" fill="none" stroke={INK} strokeWidth={8} strokeDasharray="4 16" strokeLinecap="round" />
          <path d="M 246 306 L 252 350 L 284 322 Z" fill={INK} />
        </g>
      )}
      <Spark f={f} scale={SS} base={{ x: SX, y: STANDY }} facing={1} talk={(t) => mouthAt(t)} bulb={bulb} mood={mood} look={1} keys={sparkKeys} mod={sparkMod} />
      {/* comment bubble */}
      {askK > 0.01 && (
        <g transform={`translate(${SX + 210} ${HEADY - 170}) scale(${askK}) rotate(${wobble(f, T.rudest9 - 6, 6)})`}>
          <path d="M -110 -70 Q -110 -100 -80 -100 L 80 -100 Q 110 -100 110 -70 L 110 30 Q 110 60 80 60 L -30 60 L -70 100 L -60 60 L -80 60 Q -110 60 -110 30 Z" fill={WHITE} {...K} />
          <Txt y={4} s={92} c={RED}>
            ?
          </Txt>
        </g>
      )}
    </>
  );

  return (
    <Stage
      bg={<AbsoluteFill style={{ background: WALL1 }} />}
      cam={cam}
      hits={[]}
      power={4}
      svg={svg}
      html={
        <>
          {/* frame-0 overlay (2 words) */}
          {(f < T.c1 - 6 || loopBack) && (
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
                fontSize: 108,
                transform: `rotate(-2deg) scale(${1 + wobble(f, loopBack ? LOOP : 0, 0.03, 8)})`,
                opacity: loopBack ? 1 : interpolate(f, [T.c1 - 16, T.c1 - 6], [1, 0], clamp),
              }}
            >
              <div style={{ color: WHITE, WebkitTextStroke: `10px ${INK}`, paintOrder: "stroke fill" }}>INSULT</div>
              <div style={{ color: RED, WebkitTextStroke: `10px ${INK}`, paintOrder: "stroke fill" }}>YOURSELF?</div>
            </div>
          )}
          {f >= 300 && f < LOOP - 4 && (
            <>
              <div
                style={{
                  position: "absolute",
                  left: 540,
                  top: 1690,
                  transform: "translate(-50%,-50%)",
                  fontFamily: FONT.body,
                  fontWeight: 700,
                  fontSize: 21,
                  color: INK,
                  whiteSpace: "nowrap",
                  opacity: 0.9,
                  background: "rgba(255,255,255,0.82)",
                  padding: "2px 12px",
                  borderRadius: 8,
                }}
              >
                India Dark Patterns Guidelines 2023 · Govt of India (PIB) 3 Jun 2026 · pop-up = illustration
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 96,
                  top: 1738,
                  fontFamily: FONT.body,
                  fontWeight: 700,
                  fontSize: 23,
                  color: INK,
                  opacity: 0.85,
                }}
              >
                Education, not legal advice
              </div>
              <div
                style={{
                  position: "absolute",
                  right: 96,
                  top: 1738,
                  fontFamily: FONT.title,
                  fontWeight: 900,
                  fontSize: 27,
                  color: "#3f6b2e",
                  WebkitTextStroke: `1px ${INK}`,
                  letterSpacing: 2,
                  opacity: 0.95,
                }}
              >
                DESIGNED TO GET YOU
              </div>
            </>
          )}
          <VoiceCaptions
            f={f}
            y={1500}
            cues={VOICE_CUES}
            hi={["insult", "yourself?", "hate", "silly,", "confirm", "shaming.", "guilty", "India,", "fined", "shop", "click", "no,", "rudest"]}
          />
        </>
      }
    />
  );
};
