import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Actor, addPose, idle, walkCycle, type Pose } from "../stickman/stick";
import { COL, FONT } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, K, VoiceCaptions } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { G, gestureKeys, hop, nod, shake } from "../shared/gestures";
import { ease, popIn, squash, wobble } from "../shared/motion";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// V019 · "Your chatbot almost never says 'I don't know.'" (Designed to get you, ~35 s, promise → build → reveal)
// ONE world: an empty classroom after school, wider than the screen, one camera rig travelling along its wall.
//  A (x≈520)  Spark's desk + a big laptop. The CHATBOT (a blue robot face) answers a question it cannot know
//             ("When was my friend born?") with "Your friend was born on May 3!" → WRONG ✗ / SURE!
//  B (x≈1600) the STUDENT's desk. A test paper with four choices: blank → 0 POINTS, a guess → +1 POINT (sometimes).
//  C (x≈2200) three empty desks under the chalkboard. REVEAL: the camera pulls back in the pause, three CHATBOT
//             robots drop into the desks, the chalkboard shows the scoring rule: "I DON'T KNOW" = 0 · GUESS = MAYBE +1.
//             The robots scribble guesses (B! D! A!). Then Spark checks the bot's "May 3!" with a magnifier.
// Source: Kalai, Nachum, Vempala, Zhang et al., "Why language models hallucinate", OpenAI, 5 Sep 2025.

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const SS = 1.9;
const STANDY = GROUND - 92.5 * SS;

// palette: butter wall, brick band, honey floor, green chalkboard, blue chatbots, orange student
const WALL = "#f7e4b5";
const WALL2 = "#efd49b";
const BRICK = "#c4573f";
const FLOOR = "#c98d5a";
const FLOOR2 = "#b57a4a";
const WOOD = "#9a6236";
const WOOD2 = "#b9814f";
const BOARD = "#2f5d46";
const CHALK = "#f4f1e6";
const BOT = "#4a86e8";
const BOT2 = "#2f63bd";
const SCREEN = "#1f2a44";
const YEL = "#ffd23f";
const RED = "#e8484f";
const GREEN = "#2fb463";
const WHITE = "#ffffff";
const TEAL = "#0fb5a6";
const INK = COL.ink;

const T = {
  know0: W(0, 7),
  c1: C(1),
  end1: W(1, 2),
  guess1: W(1, 8),
  c2: C(2),
  asked2: W(2, 1),
  born2: W(2, 7),
  c3: C(3),
  gave3: W(3, 1),
  wrong3: W(3, 3),
  sure3: W(3, 7),
  c4: C(4),
  test4: W(4, 4),
  four4: W(4, 6),
  c5: C(5),
  blank5: W(5, 1),
  zero5: W(5, 4),
  c6: C(6),
  guess6: W(6, 2),
  sometimes6: W(6, 4),
  right6: W(6, 6),
  c7: C(7),
  scored7: W(7, 2),
  same7: W(7, 4),
  way7: W(7, 5),
  c8: C(8),
  learned8: W(8, 2),
  guess8: W(8, 4),
  student8: W(8, 7),
  c9: C(9),
  important9: W(9, 2),
  yourself9: W(9, 4),
  c10: C(10),
  fooled10: W(10, 4),
};
const LOOP = VOICE_FRAMES - 14;
const WALK0 = T.c4 - 4;
const WALK1 = T.c4 + 38;
const DROP = [T.c7 - 8, T.c7 - 1, T.c7 + 6]; // robots pop up from behind their desks (first lands on "Chatbots")
const FALL = 12;

// staging (world coordinates; the world is ~2.6 screens wide)
const SXA = 330;
const SXB = 1580;
const LAP = { x: 700, y0: 740, w: 480, h: 320 }; // laptop screen
const DESK_TOP = 1120;
const STUDENT_X = 1200;
const ROBOTS = [1790, 1990, 2190];
const PAPER = { x: 1330, y: 545, w: 440, h: 500 };
const BOARD_R = { x0: 1690, x1: 2290, y0: 300, y1: 720 };
const STS = 1.3;
const STY = GROUND - 92.5 * STS;

// --- camera rig: hold → move (ease in-out) → hold. [start, end, focal x, focal y, zoom] ---------------------------
type CamKey = [number, number, number, number, number];
const RIG: CamKey[] = [
  [0, 0, 560, 960, 1.3], // frame 0: Spark + laptop
  [100, 122, 400, 900, 1.45], // CU Spark (promise)
  [196, 216, 690, 900, 1.4], // INSERT laptop chat
  [366, 384, 540, 950, 1.2], // MED: Spark's reaction
  [T.c4, T.c4 + 30, 1420, 880, 1.15], // travel along the room to the student's desk
  [T.c5 - 16, T.c5 + 2, 1400, 690, 1.35], // INSERT the test paper
  [T.c7 - 33, T.c7 - 10, 1895, 880, 1.1], // WIDE reveal (camera settles before the hit)
  [T.c9 - 13, T.c9 + 7, 1640, 860, 1.3], // MED: Spark checks the answer
  [T.c10 - 15, T.c10 + 3, 1600, 860, 1.5], // CU question
  [LOOP, LOOP, 560, 960, 1.3], // cut back into frame 0
];
const camAtRig = (f: number) => {
  let cur = { fx: RIG[0][2], fy: RIG[0][3], z: RIG[0][4] };
  for (const [a, b, fx, fy, z] of RIG) {
    if (f < a) break;
    const k = b <= a ? 1 : interpolate(f, [a, b], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
    cur = { fx: cur.fx + (fx - cur.fx) * k, fy: cur.fy + (fy - cur.fy) * k, z: cur.z + (z - cur.z) * k };
  }
  return { x: cur.fx - 540, y: cur.fy - 960, z: cur.z };
};

// --- helpers ----------------------------------------------------------------------------------------------------------
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

// the chatbot's face (used on the laptop and on the robots); (0,0) = centre of the head
const BotHead: React.FC<{ f: number; grin: number; seed?: number }> = ({ f, grin, seed = 0 }) => {
  const blink = (f + seed * 37) % 110 < 4 ? 0.15 : 1;
  return (
    <g>
      <line x1={0} y1={-62} x2={0} y2={-98} stroke={INK} strokeWidth={6} strokeLinecap="round" />
      <circle cy={-104} r={13} fill={YEL} stroke={INK} strokeWidth={5} />
      <rect x={-74} y={-62} width={148} height={124} rx={34} fill={BOT} stroke={INK} strokeWidth={7} />
      <rect x={-58} y={-46} width={116} height={92} rx={22} fill={SCREEN} />
      <ellipse cx={-24} cy={-8} rx={12} ry={15 * blink} fill={WHITE} />
      <ellipse cx={24} cy={-8} rx={12} ry={15 * blink} fill={WHITE} />
      <path d={`M -26 18 Q 0 ${20 + 18 * grin} 26 18`} fill="none" stroke={"#7ef0e4"} strokeWidth={6} strokeLinecap="round" />
      <rect x={-86} y={-14} width={12} height={30} rx={5} fill={BOT2} stroke={INK} strokeWidth={4} />
      <rect x={74} y={-14} width={12} height={30} rx={5} fill={BOT2} stroke={INK} strokeWidth={4} />
    </g>
  );
};

// a robot standing behind a desk; (0,0) = desk top centre. scrib = pencil scribbling 0..1
const Robot: React.FC<{ f: number; grin: number; scrib: number; seed: number }> = ({ f, grin, scrib, seed }) => {
  const wig = scrib * 10 * Math.sin((f + seed * 7) * 1.3);
  return (
    <g>
      <rect x={-52} y={-126} width={104} height={150} rx={24} fill={BOT} stroke={INK} strokeWidth={7} />
      <circle cx={0} cy={-80} r={14} fill={YEL} stroke={INK} strokeWidth={4} />
      {/* arms: left rests on the desk, right holds the pencil */}
      <path d={`M -46 -100 Q -86 -50 -54 -8`} fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
      <path d={`M 46 -100 Q 84 -54 ${36 + wig} -10`} fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
      <g transform={`translate(${36 + wig} -10) rotate(30)`}>
        <rect x={-6} y={-46} width={12} height={46} fill={YEL} stroke={INK} strokeWidth={3} />
        <path d="M -6 0 L 0 10 L 6 0 Z" fill={INK} />
      </g>
      <g transform="translate(0 -196)">
        <BotHead f={f} grin={grin} seed={seed} />
      </g>
    </g>
  );
};

// school desk seen from the front; (x) centre, w width. paper = a small test paper on top
const Desk: React.FC<{ x: number; w: number; label?: string; paper?: boolean }> = ({ x, w, label, paper }) => (
  <g>
    {paper && <path d={`M ${x - 46} ${DESK_TOP + 2} L ${x + 40} ${DESK_TOP + 2} L ${x + 52} ${DESK_TOP - 8} L ${x - 34} ${DESK_TOP - 8} Z`} fill={WHITE} stroke={INK} strokeWidth={3} />}
    <line x1={x - w / 2 + 18} y1={DESK_TOP + 90} x2={x - w / 2 + 12} y2={GROUND} stroke={"#5b5b66"} strokeWidth={10} strokeLinecap="round" />
    <line x1={x + w / 2 - 18} y1={DESK_TOP + 90} x2={x + w / 2 - 12} y2={GROUND} stroke={"#5b5b66"} strokeWidth={10} strokeLinecap="round" />
    <rect x={x - w / 2 + 10} y={DESK_TOP + 20} width={w - 20} height={92} rx={8} fill={WOOD2} stroke={INK} strokeWidth={5} />
    <rect x={x - w / 2} y={DESK_TOP} width={w} height={24} rx={8} fill={WOOD} stroke={INK} strokeWidth={6} />
    {label && (
      <g>
        <rect x={x - 76} y={DESK_TOP + 46} width={152} height={42} rx={10} fill={WHITE} stroke={INK} strokeWidth={4} />
        <Txt x={x} y={DESK_TOP + 78} s={30}>
          {label}
        </Txt>
      </g>
    )}
  </g>
);

// the classroom wall + floor, from x0 to x1 (world wider than the screen)
const Room: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <rect x={-700} y={-700} width={4200} height={1850} fill={WALL} />
    {Array.from({ length: 22 }, (_, i) => (
      <rect key={i} x={-700 + i * 200} y={-700} width={100} height={1850} fill={WALL2} opacity={0.35} />
    ))}
    {/* window with afternoon sky (place A) */}
    <g>
      <rect x={90} y={380} width={380} height={430} fill="#9fd8ff" {...K} strokeWidth={10} />
      <circle cx={380} cy={470} r={48} fill={YEL} stroke="#ffb52e" strokeWidth={6} />
      <path d="M 90 720 Q 200 660 300 700 Q 400 650 470 690 L 470 810 L 90 810 Z" fill="#8cc97a" />
      <rect x={130 + 6 * Math.sin(f / 40)} y={430} width={90} height={30} rx={15} fill={WHITE} opacity={0.9} />
      <line x1={280} y1={380} x2={280} y2={810} stroke={INK} strokeWidth={8} />
      <line x1={90} y1={595} x2={470} y2={595} stroke={INK} strokeWidth={8} />
      <rect x={70} y={806} width={420} height={22} rx={8} fill={WOOD2} {...K} strokeWidth={5} />
    </g>
    {/* wall clock between A and B (seen while the camera travels) */}
    <g transform="translate(1000 460)">
      <circle r={78} fill={WHITE} stroke={INK} strokeWidth={8} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <line key={i} x1={Math.sin(a) * 58} y1={-Math.cos(a) * 58} x2={Math.sin(a) * 68} y2={-Math.cos(a) * 68} stroke={INK} strokeWidth={i % 3 ? 3 : 6} />;
      })}
      <line x1={0} y1={0} x2={30} y2={18} stroke={INK} strokeWidth={8} strokeLinecap="round" />
      <line x1={0} y1={0} x2={Math.sin((f / 30) * 0.21) * 52} y2={-Math.cos((f / 30) * 0.21) * 52} stroke={RED} strokeWidth={5} strokeLinecap="round" />
      <circle r={7} fill={INK} />
    </g>
    {/* brick band + skirting */}
    <rect x={-700} y={1080} width={4200} height={70} fill={BRICK} />
    <rect x={-700} y={1080} width={4200} height={8} fill={INK} opacity={0.3} />
    {/* floor */}
    <rect x={-700} y={1150} width={4200} height={1400} fill={FLOOR} />
    <rect x={-700} y={1150} width={4200} height={10} fill={INK} opacity={0.3} />
    {Array.from({ length: 9 }, (_, i) => (
      <line key={i} x1={-700} y1={1220 + i * 90 + i * i * 8} x2={3500} y2={1220 + i * 90 + i * i * 8} stroke={FLOOR2} strokeWidth={5} />
    ))}
  </g>
);

// chalkboard; header / rows appear as chalk (k = 0..1)
const Chalkboard: React.FC<{ todayK: number; headK: number; row1: number; row2: number }> = ({ todayK, headK, row1, row2 }) => {
  const cx = (BOARD_R.x0 + BOARD_R.x1) / 2;
  return (
    <g>
      <rect x={BOARD_R.x0 - 22} y={BOARD_R.y0 - 22} width={BOARD_R.x1 - BOARD_R.x0 + 44} height={BOARD_R.y1 - BOARD_R.y0 + 44} rx={14} fill={WOOD} {...K} />
      <rect x={BOARD_R.x0} y={BOARD_R.y0} width={BOARD_R.x1 - BOARD_R.x0} height={BOARD_R.y1 - BOARD_R.y0} rx={6} fill={BOARD} stroke={INK} strokeWidth={4} />
      <rect x={BOARD_R.x0 + 20} y={BOARD_R.y1 + 6} width={BOARD_R.x1 - BOARD_R.x0 - 40} height={18} rx={6} fill={WOOD2} {...K} strokeWidth={4} />
      <rect x={BOARD_R.x0 + 80} y={BOARD_R.y1 - 4} width={40} height={12} rx={4} fill={CHALK} />
      {todayK > 0.01 && (
        <g opacity={todayK}>
          <Txt x={cx} y={470} s={76} c={CHALK} font={FONT.comic} w={400}>
            TEST TODAY
          </Txt>
          <path d={`M ${cx - 190} 500 Q ${cx} 520 ${cx + 190} 498`} fill="none" stroke={CHALK} strokeWidth={5} strokeLinecap="round" />
        </g>
      )}
      {headK > 0.01 && (
        <g opacity={headK} transform={`translate(${cx} 400) scale(${0.9 + 0.1 * headK})`}>
          <Txt y={0} s={70} c={YEL} font={FONT.comic} w={400}>
            CHATBOT TEST
          </Txt>
        </g>
      )}
      {row1 > 0.01 && (
        <g opacity={row1}>
          <Txt x={cx} y={530} s={64} c={CHALK}>
            “I DON’T KNOW” = 0
          </Txt>
        </g>
      )}
      {row2 > 0.01 && (
        <g opacity={row2}>
          <Txt x={cx} y={640} s={64} c={CHALK}>
            GUESS = MAYBE +1
          </Txt>
        </g>
      )}
    </g>
  );
};

// the big test paper (insert). choices = how many of A-D are shown; tickB 0..1; zeroK / plusK = red/green marks
const TestPaper: React.FC<{ f: number; choices: number; tickB: number; zeroK: number; plusK: number; qK: number }> = ({ f, choices, tickB, zeroK, plusK, qK }) => (
  <g>
    <rect x={-PAPER.w / 2 + 10} y={-PAPER.h / 2 + 12} width={PAPER.w} height={PAPER.h} rx={16} fill={INK} opacity={0.15} />
    <rect x={-PAPER.w / 2} y={-PAPER.h / 2} width={PAPER.w} height={PAPER.h} rx={16} fill={WHITE} {...K} />
    <Txt y={-PAPER.h / 2 + 70} s={58}>
      TEST
    </Txt>
    <Txt x={-PAPER.w / 2 + 40} y={-PAPER.h / 2 + 140} s={40} a="start" w={800}>
      Question 1: ?
    </Txt>
    {["A", "B", "C", "D"].map((l, i) => {
      const k = i < choices ? popIn(f, T.four4 + i * 4) : 0;
      if (k < 0.01) return null;
      const y = -PAPER.h / 2 + 210 + i * 66;
      return (
        <g key={l} transform={`translate(${-PAPER.w / 2 + 70} ${y}) scale(${k})`}>
          <rect x={-22} y={-22} width={44} height={44} rx={8} fill={WHITE} stroke={INK} strokeWidth={5} />
          <Txt x={50} y={14} s={42} a="start">
            {l}
          </Txt>
          {l === "B" && tickB > 0.01 && (
            <path d="M -14 0 L -3 13 L 18 -16" fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={60} strokeDashoffset={60 * (1 - tickB)} />
          )}
          {l === "B" && qK > 0.01 && (
            <g transform={`translate(120 4) scale(${qK})`}>
              <Txt y={16} s={56} c={BOT2} font={FONT.comic} w={400}>
                ?
              </Txt>
            </g>
          )}
        </g>
      );
    })}
    {zeroK > 0.01 && (
      <g transform={`translate(110 30) rotate(-8) scale(${zeroK})`} opacity={1 - plusK}>
        <ellipse rx={100} ry={64} fill="none" stroke={RED} strokeWidth={8} />
        <Txt y={-4} s={54} c={RED}>
          0
        </Txt>
        <Txt y={40} s={30} c={RED}>
          POINTS
        </Txt>
      </g>
    )}
    {plusK > 0.01 && (
      <g transform={`translate(110 30) rotate(-6) scale(${plusK})`}>
        <ellipse rx={110} ry={70} fill="none" stroke={GREEN} strokeWidth={8} />
        <Txt y={4} s={50} c={GREEN}>
          +1 POINT
        </Txt>
        <Txt y={44} s={28} c={GREEN}>
          SOMETIMES
        </Txt>
      </g>
    )}
  </g>
);

// magnifying glass, (0,0) = where the hand holds it; the lens sits up and to the right
const Magnifier: React.FC = () => (
  <g>
    <line x1={0} y1={0} x2={46} y2={-46} stroke={WOOD} strokeWidth={16} strokeLinecap="round" />
    <circle cx={88} cy={-88} r={58} fill="#dff4ff" fillOpacity={0.45} stroke={INK} strokeWidth={9} />
  </g>
);

// chat bubble in SVG
const Bubble: React.FC<{ w: number; h: number; fill: string; tail: "l" | "r"; children: React.ReactNode }> = ({ w, h, fill, tail, children }) => (
  <g>
    <path d={tail === "l" ? `M ${-w / 2 + 20} ${h / 2 - 6} L ${-w / 2 - 14} ${h / 2 + 18} L ${-w / 2 + 44} ${h / 2 - 6} Z` : `M ${w / 2 - 20} ${h / 2 - 6} L ${w / 2 + 14} ${h / 2 + 18} L ${w / 2 - 44} ${h / 2 - 6} Z`} fill={fill} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={22} fill={fill} stroke={INK} strokeWidth={4} />
    {children}
  </g>
);

// --- sound ------------------------------------------------------------------------------------------------------------
export const S01_SFX: SfxCue[] = [
  [2, "tick", 0.18],
  [T.know0 - 2, "scribble", 0.14],
  [T.end1, "pop", 0.16],
  [T.asked2, "tick", 0.12],
  [T.asked2 + 9, "tick", 0.12],
  [T.asked2 + 18, "tick", 0.12],
  [T.born2 - 6, "pop", 0.2],
  [T.gave3 - 2, "pop", 0.22],
  [T.wrong3, "stamp", 0.24],
  [T.sure3, "boing", 0.16],
  [T.c4, "whoosh", 0.18],
  [T.test4 - 4, "page", 0.22],
  [T.four4 - 3, "pop", 0.14],
  [T.four4 + 1, "pop", 0.14],
  [T.four4 + 5, "pop", 0.14],
  [T.four4 + 9, "pop", 0.14],
  [T.zero5 - 2, "scribble", 0.18],
  [T.zero5 + 6, "buzz", 0.12],
  [T.guess6 - 2, "scribble", 0.16],
  [T.right6 - 2, "ding", 0.22],
  [T.c7 - 33, "whoosh_long", 0.16],
  [DROP[0] + FALL, "thud", 0.26],
  [DROP[1] + FALL, "thud", 0.22],
  [DROP[2] + FALL, "thud", 0.22],
  [T.c7 + 4, "stinger", 0.18],
  [T.scored7 - 2, "scribble", 0.14],
  [T.same7 - 2, "pop", 0.18],
  [T.way7 - 2, "pop", 0.18],
  [T.guess8 - 4, "scribble", 0.2],
  [T.guess8 + 3, "pop", 0.14],
  [T.guess8 + 11, "pop", 0.14],
  [T.guess8 + 19, "pop", 0.14],
  [T.c9 - 4, "swish", 0.2],
  [T.yourself9 - 2, "ding", 0.22],
  [T.fooled10 - 4, "pop", 0.2],
  [LOOP, "tick", 0.18],
].map((c) => c as SfxCue);

export const S01Classroom: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const loopBack = f >= LOOP - 2;
  const cam = camAtRig(f);

  // ---------------- place A: the laptop chat ----------------
  const stage0 = loopBack || f < T.c2 - 6; // frame-0 screen: crossed-out "I don't know"
  const typed = interpolate(f, [T.asked2, T.born2 + 4], [0, 1], clamp);
  const askText = "When was my friend born?";
  const replyK = !stage0 && f >= T.gave3 - 4 ? popIn(f, T.gave3 - 4) : 0;
  const wrongK = !stage0 && f >= T.wrong3 - 2 ? popIn(f, T.wrong3 - 2) : 0;
  const sureK = !stage0 && f >= T.sure3 - 3 ? popIn(f, T.sure3 - 3) : 0;
  const lapGrin = stage0 ? 0.6 : f >= T.gave3 - 4 ? 1 : 0.3;

  // ---------------- place B: the test paper ----------------
  const paperIn = f >= T.test4 - 6 && f < T.c7 - 26 && !loopBack ? popIn(f, T.test4 - 6) * (1 - interpolate(f, [T.c7 - 38, T.c7 - 26], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) })) : 0;
  const choices = f >= T.four4 - 3 ? 4 : 0;
  const zeroK = f >= T.zero5 - 2 ? popIn(f, T.zero5 - 2) : 0;
  const tickB = interpolate(f, [T.guess6 - 2, T.guess6 + 8], [0, 1], clamp);
  const qK = f >= T.guess6 + 4 && f < T.right6 - 2 ? popIn(f, T.guess6 + 4) : 0;
  const plusK = f >= T.right6 - 2 ? popIn(f, T.right6 - 2) : 0;

  // ---------------- place C: the reveal ----------------
  const robotY = (i: number) => {
    const a = DROP[i];
    if (f < a) return null;
    return interpolate(f, [a, a + FALL - 4, a + FALL, a + FALL + 5], [300, -34, 8, 0], { ...clamp, easing: Easing.out(Easing.quad) });
  };
  const todayK = loopBack ? 1 : 1 - ease(f, T.scored7 - 8, T.scored7, 0, 1);
  const headK = loopBack ? 0 : ease(f, T.scored7 - 4, T.scored7 + 8, 0, 1);
  const row1 = loopBack ? 0 : ease(f, T.same7 - 4, T.same7 + 8, 0, 1);
  const row2 = loopBack ? 0 : ease(f, T.way7 - 2, T.way7 + 10, 0, 1);
  const scrib = f >= T.guess8 - 4 && f < T.c9 ? 1 : 0;
  const guessWords = ["B!", "D!", "A!"];

  // ---------------- action + question ----------------
  const checkBub = !loopBack && f >= T.c9 - 4 ? popIn(f, T.c9 - 4) * (1 - ease(f, T.c10 - 10, T.c10 - 2, 0, 1)) : 0;
  const checkK = !loopBack && f >= T.yourself9 - 2 && f < T.c10 - 2 ? popIn(f, T.yourself9 - 2) : 0;
  const magK = !loopBack && f >= T.c9 - 6 && f < T.c10 - 4 ? popIn(f, T.c9 - 6) : 0;
  const askK = !loopBack && f >= T.fooled10 - 4 ? popIn(f, T.fooled10 - 4) : 0;

  // --- Spark ---
  const sparkKeys = gestureKeys([
    [0, G.armsCrossed],
    [T.know0 - 6, G.shrugBig, "smooth"],
    [T.c1, G.pointSide, "smooth"],
    [T.guess1 - 4, G.thinkChin, "smooth"],
    [T.c2, G.leanIn, "smooth"],
    [T.c3, G.rest, "smooth"],
    [T.wrong3 - 2, G.recoil, "snap"],
    [T.sure3, G.facepalm, "smooth"],
    [WALK0, G.present, "smooth"],
    [T.test4, G.pointSide, "smooth"],
    [T.c5, G.thinkChin, "smooth"],
    [T.zero5, G.shrugBig, "smooth"],
    [T.c6, G.rest, "smooth"],
    [T.guess6, G.doublePoint, "smooth"],
    [T.right6, G.count1, "smooth"],
    [T.c7 - 9, G.recoil, "smooth"], // anticipation before the big reaction
    [T.c7, G.mindBlown, "snap"],
    [T.learned8, G.armsCrossed, "smooth"],
    [T.c9 - 6, G.pointSide, "smooth"],
    [T.c10, G.doublePoint, "smooth"],
    [T.fooled10, G.beckon, "smooth"],
    [LOOP - 4, G.armsCrossed, "snap"],
  ]);
  const mood = (t: number): Mood => {
    if (t >= LOOP - 2) return "skeptical";
    if (t < T.c1) return "skeptical";
    if (t < T.guess1 - 4) return "curious";
    if (t < T.c2) return "thinking";
    if (t < T.wrong3 - 2) return "happy";
    if (t < T.sure3) return "shock";
    if (t < WALK0) return "worried";
    if (t < T.c5) return "excited";
    if (t < T.zero5) return "thinking";
    if (t < T.guess6) return "sad";
    if (t < T.right6) return "smug";
    if (t < T.c7 - 9) return "happy";
    if (t < T.c7) return "shock";
    if (t < T.learned8) return "mindblown";
    if (t < T.c9 - 6) return "skeptical";
    if (t < T.c10) return "determined";
    if (t < T.fooled10) return "curious";
    return "wink";
  };
  const bulb = (t: number) => Math.max(bulbPulse(t, T.c7, 84), bulbPulse(t, T.yourself9, 24));
  const sparkX = (t: number) => (t >= LOOP - 2 ? SXA : ease(t, WALK0, WALK1, SXA, SXB));
  const sparkMod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t, 3));
    const walking = t >= WALK0 && t < WALK1 && t < LOOP - 2;
    if (walking) q = addPose(q, walkCycle(t - WALK0, 0.26));
    if (t >= T.c2 + 6 && t < T.born2 + 4) q = addPose(q, { ra2: 8 * Math.sin(t * 1.4), la2: -8 * Math.sin(t * 1.4 + 1) }); // typing
    q = addPose(q, shake(t, T.know0 - 2, 2));
    q = addPose(q, hop(t, T.right6 + 2, 10));
    q = addPose(q, hop(t, T.c7 + 2, 22));
    q = addPose(q, nod(t, T.yourself9, 1));
    return { ...q, x: sparkX(t) };
  };

  const studentKeys = gestureKeys([
    [0, G.rest],
    [T.blank5, G.thinkChin, "smooth"],
    [T.zero5, G.shrugBig, "smooth"],
    [T.guess6 - 4, G.pointDown, "smooth"],
    [T.right6, G.fistPump, "smooth"],
    [T.c7 - 4, G.rest, "smooth"],
    [T.guess8, G.pointDown, "smooth"],
    [T.student8, G.shrugBig, "smooth"],
    [T.c9, G.rest, "smooth"],
  ]);

  const sparkEl = (
    <Spark f={f} scale={SS} base={{ x: SXA, y: STANDY }} facing={(t) => (t >= WALK1 - 2 && t < T.c7 - 9 ? -1 : 1)} talk={(t) => mouthAt(t)} bulb={bulb} mood={mood} look={1} keys={sparkKeys} mod={sparkMod}>
      {(j) =>
        magK > 0.01 ? (
          <g transform={`translate(${j.rHand[0]} ${j.rHand[1]}) scale(${magK}) rotate(${wobble(f, T.c9 - 6, 8)})`}>
            <Magnifier />
          </g>
        ) : null
      }
    </Spark>
  );

  const svg = (
    <>
      <defs>
        <clipPath id="v019-desk-clip">
          <rect x={-700} y={-700} width={4200} height={DESK_TOP + 724} />
        </clipPath>
      </defs>
      <Room f={f} />
      <Chalkboard todayK={todayK} headK={headK} row1={row1} row2={row2} />

      {/* place A: Spark's desk + laptop */}
      <Desk x={LAP.x} w={520} />
      <g>
        {/* laptop base + screen */}
        <path d={`M ${LAP.x - 270} ${DESK_TOP} L ${LAP.x + 270} ${DESK_TOP} L ${LAP.x + 240} ${DESK_TOP - 22} L ${LAP.x - 240} ${DESK_TOP - 22} Z`} fill="#c9ced8" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <rect x={LAP.x - LAP.w / 2 - 16} y={LAP.y0 - 16} width={LAP.w + 32} height={LAP.h + 30} rx={22} fill="#3a3f4f" stroke={INK} strokeWidth={6} />
        <rect x={LAP.x - LAP.w / 2} y={LAP.y0} width={LAP.w} height={LAP.h} rx={10} fill="#f2f6fb" />
        <rect x={LAP.x - LAP.w / 2} y={LAP.y0} width={LAP.w} height={40} rx={10} fill={BOT} />
        <Txt x={LAP.x} y={LAP.y0 + 30} s={28} c={WHITE}>
          CHATBOT
        </Txt>
        {/* bot avatar */}
        <g transform={`translate(${LAP.x - 180} ${LAP.y0 + (stage0 ? 110 : 200)}) scale(0.42)`}>
          <BotHead f={f} grin={lapGrin} />
        </g>
        {stage0 && (
          <g transform={`translate(${LAP.x + 40} ${LAP.y0 + 110})`}>
            <Bubble w={300} h={78} fill="#e3e7ef" tail="l">
              <Txt y={14} s={38} c="#6b7280" font={FONT.body} w={700}>
                I don’t know
              </Txt>
            </Bubble>
            <line x1={-130} y1={-4} x2={130} y2={4} stroke={RED} strokeWidth={9} strokeLinecap="round" />
          </g>
        )}
        {!stage0 && typed > 0 && (
          <g transform={`translate(${LAP.x + 20} ${LAP.y0 + 90})`}>
            <Bubble w={400} h={64} fill={TEAL} tail="r">
              <Txt y={11} s={30} c={WHITE} font={FONT.body} w={700}>
                {askText.slice(0, Math.round(askText.length * typed))}
              </Txt>
            </Bubble>
          </g>
        )}
        {replyK > 0.01 && (
          <g transform={`translate(${LAP.x - 10} ${LAP.y0 + 210}) scale(${replyK})`}>
            <Bubble w={330} h={92} fill="#e3e7ef" tail="l">
              <Txt y={-8} s={28} c={INK} font={FONT.body} w={700}>
                Your friend was born
              </Txt>
              <Txt y={30} s={34} c={INK} font={FONT.body} w={800}>
                on May 3!
              </Txt>
            </Bubble>
          </g>
        )}
        {wrongK > 0.01 && (
          <g transform={`translate(${LAP.x + 160} ${LAP.y0 + 290}) scale(${wrongK}) rotate(${-6 + wobble(f, T.wrong3 - 2, 6)})`}>
            <Tag text="WRONG ✗" fill={RED} w={190} s={34} />
          </g>
        )}
        {sureK > 0.01 && (
          <g transform={`translate(${LAP.x - 180} ${LAP.y0 + 292}) scale(${sureK}) rotate(${wobble(f, T.sure3 - 3, 10)})`}>
            <Tag text="SURE!" fill={YEL} w={140} s={34} c={INK} />
          </g>
        )}
      </g>

      {/* place B: student + desk */}
      <Actor f={f} color={COL.orange} scale={STS} base={{ x: STUDENT_X, y: STY }} keys={studentKeys} mod={(t, p) => addPose(p, idle(t + 9, 4))} facing={1} face="happy" label="STUDENT" trails={false} />
      {qK > 0.01 && (
        <g transform={`translate(${STUDENT_X + 10} ${STY - 260}) scale(${qK})`}>
          <Txt y={0} s={80} c={BOT2} font={FONT.comic} w={400}>
            ?
          </Txt>
        </g>
      )}
      <Desk x={STUDENT_X} w={210} paper />

      {/* place C: robots drop into the empty desks */}
      {ROBOTS.map((x, i) => {
        const y = robotY(i);
        const land = DROP[i] + FALL;
        const [sx, sy] = squash(f, land, 0.18);
        const grin = f >= T.guess8 ? 1 : 0.4;
        return (
          <g key={x}>
            {y !== null && !loopBack && (
              <g clipPath="url(#v019-desk-clip)">
                <g transform={`translate(${x} ${DESK_TOP + y}) scale(${sx} ${sy})`}>
                  <Robot f={f} grin={grin} scrib={scrib} seed={i} />
                </g>
              </g>
            )}
            <Desk x={x} w={180} label="CHATBOT" paper />
            {y !== null && !loopBack && f >= T.guess8 + 3 + i * 8 && f < T.c9 + 6 && (
              <g transform={`translate(${x + 40} ${DESK_TOP - 330}) scale(${popIn(f, T.guess8 + 3 + i * 8)}) rotate(${wobble(f, T.guess8 + 3 + i * 8, 8)})`}>
                <Bubble w={110} h={74} fill={WHITE} tail="l">
                  <Txt y={18} s={50} c={BOT2} font={FONT.comic} w={400}>
                    {guessWords[i]}
                  </Txt>
                </Bubble>
              </g>
            )}
          </g>
        );
      })}

      {paperIn > 0.01 && (
        <g transform={`translate(${PAPER.x} ${PAPER.y}) scale(${paperIn}) rotate(${-2 + wobble(f, T.test4 - 6, 5)})`}>
          <TestPaper f={f} choices={choices} tickB={tickB} zeroK={zeroK} plusK={plusK} qK={0} />
        </g>
      )}

      {sparkEl}

      {/* action: the bot's answer, checked with a magnifier */}
      {checkBub > 0.01 && (
        <g transform={`translate(1790 700) scale(${checkBub})`}>
          <Bubble w={330} h={92} fill="#e3e7ef" tail="l">
            <Txt y={-8} s={28} c={INK} font={FONT.body} w={700}>
              Your friend was born
            </Txt>
            <Txt y={30} s={34} c={INK} font={FONT.body} w={800}>
              on May 3!
            </Txt>
          </Bubble>
        </g>
      )}
      {checkK > 0.01 && (
        <g transform={`translate(1450 640) scale(${checkK}) rotate(${-3 + wobble(f, T.yourself9 - 2, 6)})`}>
          <Tag text="CHECK IT ✓" fill={GREEN} w={300} s={40} />
        </g>
      )}
      {askK > 0.01 && (
        <g transform={`translate(1600 610) scale(${askK}) rotate(${wobble(f, T.fooled10 - 4, 6)})`}>
          <Bubble w={330} h={96} fill={WHITE} tail="l">
            <Txt y={16} s={48} c={INK}>
              FOOLED YOU?
            </Txt>
          </Bubble>
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
            fontSize: 108,
            transform: `rotate(-2deg) scale(${1 + wobble(f, loopBack ? LOOP : 0, 0.03, 8)})`,
            opacity: loopBack ? 1 : interpolate(f, [T.c1 - 14, T.c1 - 4], [1, 0], clamp),
          }}
        >
          <div style={{ position: "relative", display: "inline-block", color: YEL, WebkitTextStroke: `10px ${INK}`, paintOrder: "stroke fill" }}>
            “I DON’T KNOW”
            <div style={{ position: "absolute", left: -10, right: -10, top: "50%", height: 16, borderRadius: 8, background: RED, border: `4px solid ${INK}`, transform: `translateY(-50%) rotate(-4deg) scaleX(${loopBack ? 1 : interpolate(f, [4, 16], [0.15, 1], clamp)})`, transformOrigin: "left center" }} />
          </div>
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
            Kalai et al., OpenAI (Sep 2025): one main reason · newer chatbots say “I don’t know” more often
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
            DESIGNED TO GET YOU
          </div>
        </>
      )}
      <VoiceCaptions
        f={f}
        y={1570}
        cues={VOICE_CUES}
        hi={["chatbot", "know", "end", "guesses", "friend", "born", "wrong", "sure", "test", "four", "blank", "zero", "guess", "right", "chatbots", "scored", "same", "learned", "student", "check", "important", "fooled"]}
      />
    </>
  );

  return <Stage bg={<AbsoluteFill style={{ background: WALL }} />} cam={cam} hits={[]} power={4} svg={svg} html={html} />;
};
