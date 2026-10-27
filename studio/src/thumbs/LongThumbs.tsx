import React from "react";
import { AbsoluteFill, random } from "remotion";
import { addPose } from "../stickman/stick";
import { COL, FONT } from "../stickman/fx";
import { Spark, type Mood } from "../shared/mascot";
import { G, type GestureName } from "../shared/gestures";

// Long-form thumbnails (1280x720), one per Lxxx row of plan/longform_plan.csv.
// Packaging rules (WRITING.md §A): one focal point = Spark's expressive face + one object, 2–4 big words that add
// tension (not the title), high contrast, readable at phone size, no profanity, no logos.
//   npx remotion still ThumbL001 out/L001-thumb.png
const K = { stroke: COL.ink, strokeWidth: 8, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

type Cfg = {
  id: string;
  bg: [string, string];
  l1: string;
  l2: string;
  hot: 1 | 2; // which line gets the accent colour
  accent: string;
  mood: Mood;
  gesture: GestureName;
  bulb?: boolean;
  art: React.FC;
};

// ---------------- per-video art (drawn in the right half: x 520–1250, y 300–710) ----------------
const Phone: React.FC<{ x: number; y: number; w: number; h: number; children?: React.ReactNode; glow?: string }> = ({ x, y, w, h, children, glow }) => (
  <g>
    {glow && <rect x={x - 30} y={y - 30} width={w + 60} height={h + 60} rx={70} fill={glow} opacity={0.35} />}
    <rect x={x} y={y} width={w} height={h} rx={44} fill="#11131c" {...K} />
    <rect x={x + 18} y={y + 22} width={w - 36} height={h - 44} rx={28} fill="#f4f6ff" />
    {children}
  </g>
);

const ArtFeed: React.FC = () => (
  // matches L001's world (2026-10-22 render): neon control room, the recommender's red eye inside the phone,
  // cyan rings
  <g>
    {[0, 1, 2].map((i) => (
      <rect key={i} x={560 + i * 250} y={60} width={220} height={620} rx={10} fill="rgba(63,224,255,0.08)" stroke="#3fe0ff" strokeOpacity={0.25} strokeWidth={3} />
    ))}
    <Phone x={780} y={290} w={300} h={420} glow="#ff2d55">
      <rect x={798} y={312} width={264} height={376} rx={28} fill="#0d1538" />
      {[0, 1].map((i) => (
        <circle key={i} cx={930} cy={470} r={95 + i * 26} fill="none" stroke={i ? "#ff4fd8" : "#3fe0ff"} strokeWidth={6} strokeDasharray="50 28" />
      ))}
      <ellipse cx={930} cy={470} rx={100} ry={60} fill="#fff" {...K} strokeWidth={7} />
      <circle cx={930} cy={470} r={42} fill="#ff2d55" stroke={COL.ink} strokeWidth={6} />
      <circle cx={930} cy={470} r={19} fill={COL.ink} />
      <circle cx={943} cy={457} r={8} fill="#fff" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={820} y={580 + i * 34} width={220} height={24} rx={8} fill={["#ff9f1c", "#2ec4b6", "#7b2ff7"][i]} stroke={COL.ink} strokeWidth={4} />
      ))}
    </Phone>
  </g>
);

const ArtTokens: React.FC = () => (
  // matches L002's world (2026-10-23 render): cream paper, a speech bubble with a slot reel in the blank landing on
  // MAT (gold), a probability bar chart of the options, token bricks
  <g>
    <path d="M 560 300 h 650 a 40 40 0 0 1 40 40 v 150 a 40 40 0 0 1 -40 40 h -480 l -60 60 v -60 h -110 a 40 40 0 0 1 -40 -40 v -150 a 40 40 0 0 1 40 -40 z" fill="#fff" {...K} />
    <text x={580} y={430} fontFamily={FONT.title} fontWeight={900} fontSize={56} fill={COL.ink}>
      The cat sat on the
    </text>
    <rect x={1050} y={345} width={185} height={130} rx={16} fill="#ffc83d" {...K} strokeWidth={6} />
    <text x={1142} y={436} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={70} fill={COL.ink}>
      MAT
    </text>
    <text x={1142} y={340} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={40} fill="#7b2ff7" opacity={0.5}>
      MOON
    </text>
    {/* bar chart */}
    {[0.55, 0.22, 0.15, 0.05].map((p, i) => (
      <g key={i}>
        <rect x={880 + i * 90} y={700 - p * 220} width={70} height={p * 220} rx={8} fill={i === 0 ? "#ffc83d" : i % 2 ? "#3ee6b0" : "#7b2ff7"} stroke={COL.ink} strokeWidth={5} />
      </g>
    ))}
    <line x1={860} x2={1240} y1={700} y2={700} stroke={COL.ink} strokeWidth={6} />
    <g transform="translate(700 650) rotate(-8)">
      <rect x={-90} y={-40} width={180} height={80} rx={16} fill="#7b2ff7" {...K} strokeWidth={6} />
      <text x={0} y={18} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={52} fill="#fff">
        token
      </text>
    </g>
  </g>
);

const ArtSlices: React.FC = () => (
  // matches L003's world (2026-10-26 render): night-market string lights, a neon ₹4,000 tag sliced by a giant pizza
  // cutter into four ₹1,000 slices; mint + coral on charcoal
  <g>
    <path d="M 470 40 Q 860 150 1280 60" stroke="#555a66" strokeWidth={4} fill="none" />
    {Array.from({ length: 9 }, (_, i) => {
      const x = 500 + i * 90;
      const y = 50 + Math.sin(((x - 470) / 810) * Math.PI) * 60 + 8;
      const c = ["#ffc94a", "#5ff2c3", "#ff6b5b", "#ff4fa3"][i % 4];
      return (
        <g key={i}>
          <circle cx={x} cy={y} r={20} fill={c} opacity={0.25} />
          <circle cx={x} cy={y} r={9} fill={c} />
        </g>
      );
    })}
    <rect x={560} y={330} width={690} height={330} rx={40} fill="#5ff2c3" opacity={0.18} />
    {[0, 1, 2, 3].map((i) => (
      <g key={i} transform={`translate(${640 + i * 160} ${420 + (i % 2) * 40}) rotate(${-8 + i * 5})`}>
        <path d="M -40 0 L 0 -80 L 120 -80 L 120 80 L 0 80 Z" fill={i === 0 ? "#5ff2c3" : "#fff6ea"} {...K} strokeWidth={7} />
        <circle cx={-8} cy={0} r={11} fill="#23262b" />
        <text x={62} y={18} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={42} fill={COL.ink}>
          ₹1,000
        </text>
      </g>
    ))}
    {/* giant pizza cutter */}
    <g transform="translate(1130 640) rotate(-35)">
      <rect x={-16} y={-260} width={32} height={180} rx={16} fill="#ff6b5b" {...K} strokeWidth={6} />
      <circle r={88} fill="#e9edf2" {...K} strokeWidth={7} />
      <circle r={18} fill="#5ff2c3" {...K} strokeWidth={5} />
    </g>
  </g>
);

const ArtTower: React.FC = () => (
  // L003 alternate: the 63% tower of stacked payment plans in the dark skyline
  <g>
    {Array.from({ length: 6 }, (_, i) => (
      <rect key={`b${i}`} x={560 + i * 120} y={520 - ((i * 97) % 160)} width={100} height={300} fill="#262a3a" />
    ))}
    {["HEADPHONES", "SHOES", "PHONE CASE", "JACKET", "TRIP", "GAME"].map((l, i) => (
      <g key={l} transform={`translate(${960 + (i % 2) * 14} ${660 - i * 66}) rotate(${(i % 3) - 1 * 2})`}>
        <rect x={-150} y={-30} width={300} height={60} rx={12} fill={["#5ff2c3", "#ff6b5b", "#ffc94a", "#ff4fa3"][i % 4]} {...K} strokeWidth={5} />
        <text x={-130} y={12} fontFamily={FONT.title} fontWeight={900} fontSize={28} fill={COL.ink}>
          {l}
        </text>
      </g>
    ))}
  </g>
);

const ArtCalendar: React.FC = () => (
  <g>
    <rect x={590} y={330} width={600} height={380} rx={24} fill="#fff" {...K} />
    <rect x={590} y={330} width={600} height={70} rx={24} fill="#e76f51" {...K} />
    {Array.from({ length: 21 }, (_, i) => {
      const n = i + 15;
      const x = 625 + (i % 7) * 82;
      const y = 440 + Math.floor(i / 7) * 82;
      return (
        <g key={i}>
          <text x={x + 25} y={y + 30} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={34} fill="#9aa0ad">
            {n > 31 ? n - 31 : n}
          </text>
          {n === 21 && (
            <>
              <text x={x + 25} y={y + 30} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={44} fill={COL.ink}>
                21
              </text>
              <path d={`M ${x - 10} ${y - 10} L ${x + 60} ${y + 50} M ${x + 60} ${y - 10} L ${x - 10} ${y + 50}`} stroke="#e5322d" strokeWidth={12} strokeLinecap="round" />
            </>
          )}
        </g>
      );
    })}
    <circle cx={1110} cy={620} r={52} fill="none" stroke="#2a9d8f" strokeWidth={10} />
    <text x={1110} y={642} textAnchor="middle" fontFamily={FONT.comic} fontSize={70} fill="#2a9d8f">
      ?
    </text>
    {/* sprout */}
    <g transform="translate(1210 700)">
      <path d="M -40 0 h 80 l -12 -70 h -56 z" fill="#c8693f" {...K} strokeWidth={6} />
      <path d="M 0 -70 v -60 M 0 -110 q -40 -10 -50 -40 q 40 0 50 30 M 0 -120 q 40 -20 55 -50 q -45 5 -55 40" stroke="#2a9d8f" strokeWidth={8} fill="#8fd694" />
    </g>
  </g>
);

const ArtFake: React.FC = () => (
  <g>
    <g transform="translate(860 520) rotate(4)">
      <rect x={-210} y={-200} width={420} height={400} rx={12} fill="#fffdf5" {...K} />
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x={-170} y={-160 + i * 42} width={i % 3 === 2 ? 220 : 340} height={14} rx={7} fill="#c9c4b3" />
      ))}
      <g transform="rotate(-14)">
        <rect x={-190} y={-60} width={380} height={120} rx={16} fill="none" stroke="#e5322d" strokeWidth={14} />
        <text y={36} textAnchor="middle" fontFamily={FONT.comic} fontSize={112} fill="#e5322d">
          FAKE
        </text>
      </g>
    </g>
    {/* top hat with smoke */}
    <g transform="translate(1160 640)">
      <path d="M -80 0 h 160 M -55 0 v -110 h 110 v 110" fill="#1f1235" {...K} strokeWidth={7} />
      <rect x={-55} y={-40} width={110} height={18} fill="#e9c46a" />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={-20 + i * 26} cy={-150 - i * 34} r={26 - i * 4} fill="#e8e2f5" opacity={0.8} />
      ))}
    </g>
  </g>
);

const ArtMaze: React.FC = () => (
  <g>
    <Phone x={640} y={300} w={460} h={420} glow="#b8f35a">
      <g stroke="#2b2b2b" strokeWidth={14} strokeLinecap="round" fill="none">
        <path d="M 690 360 h 360 M 690 360 v 300 h 120 M 860 420 v 180 h 140 v -160 M 740 420 h 80 v 120 M 900 660 h 150 v -100 M 1050 440 v 60" />
      </g>
      {/* big door */}
      <rect x={700} y={540} width={110} height={110} rx={10} fill="#b8f35a" {...K} strokeWidth={6} />
      <text x={755} y={608} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={30} fill={COL.ink}>
        SIGN UP
      </text>
      {/* tiny exit */}
      <rect x={1030} y={392} width={34} height={18} rx={4} fill="#ff6b6b" stroke={COL.ink} strokeWidth={3} />
    </Phone>
    {/* magnifier */}
    <g transform="translate(1080 400)">
      <circle r={62} fill="rgba(255,255,255,0.25)" stroke={COL.ink} strokeWidth={10} />
      <path d="M 44 44 L 110 110" stroke={COL.ink} strokeWidth={18} strokeLinecap="round" />
      <text y={14} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={34} fill={COL.ink}>
        cancel
      </text>
    </g>
  </g>
);

const ArtCurve: React.FC = () => {
  const pts = Array.from({ length: 31 }, (_, d) => {
    const x = 560 + d * 22;
    const y = 690 - (Math.pow(2, d) / Math.pow(2, 30)) * 390;
    return `${x},${y}`;
  }).join(" ");
  return (
    <g>
      <polyline points={pts} fill="none" stroke="#ffd166" strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={pts} fill="none" stroke={COL.ink} strokeWidth={4} opacity={0.4} />
      <circle cx={560} cy={690} r={14} fill="#f2b705" {...K} strokeWidth={4} />
      {/* coin mountain */}
      {Array.from({ length: 18 }, (_, i) => {
        const row = Math.floor((-1 + Math.sqrt(1 + 8 * i)) / 2);
        const k = i - (row * (row + 1)) / 2;
        return <ellipse key={i} cx={1150 + (k - row / 2) * 52} cy={690 - (5 - row) * 0 - row * -34 - 170} rx={30} ry={14} fill="#f2b705" stroke={COL.ink} strokeWidth={4} />;
      })}
      <path d="M 1230 300 l 30 -40 l 10 50 z" fill="#ff6b35" {...K} strokeWidth={5} />
    </g>
  );
};

const ArtToll: React.FC = () => (
  <g>
    {[560, 1010].map((x, i) => (
      <g key={x}>
        <rect x={x} y={380} width={230} height={170} rx={18} fill={i ? "#8ecae6" : "#ffd166"} {...K} />
        <rect x={x + 85} y={550} width={60} height={60} fill="#6c757d" {...K} strokeWidth={6} />
        {[0, 1, 2].map((k) => (
          <rect key={k} x={x + 26} y={410 + k * 36} width={k === 2 ? 110 : 170} height={16} rx={8} fill="#fff" opacity={0.9} />
        ))}
      </g>
    ))}
    {/* toll booth + barrier */}
    <rect x={840} y={430} width={120} height={200} rx={14} fill="#f77f00" {...K} />
    <rect x={862} y={460} width={76} height={56} rx={8} fill="#cdeffd" stroke={COL.ink} strokeWidth={5} />
    <g transform="translate(900 640) rotate(-28)">
      <rect x={-10} y={-12} width={300} height={24} rx={12} fill="#fff" {...K} strokeWidth={6} />
      {[40, 120, 200].map((x) => (
        <rect key={x} x={x} y={-12} width={40} height={24} fill="#e5322d" />
      ))}
    </g>
    {[0, 1, 2, 3].map((i) => (
      <g key={i} transform={`translate(${760 + i * 60} ${330 - (i % 2) * 40})`}>
        <circle r={24} fill="#f2b705" {...K} strokeWidth={5} />
        <text y={10} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={28} fill={COL.ink}>
          ₹
        </text>
      </g>
    ))}
  </g>
);

const ArtPin: React.FC = () => (
  <g>
    <Phone x={700} y={290} w={360} h={430} glow="#ff4d6d">
      <rect x={740} y={340} width={280} height={70} rx={12} fill="#ffe3e8" stroke={COL.ink} strokeWidth={4} />
      <text x={880} y={385} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={34} fill={COL.ink}>
        REQUEST ₹5,000
      </text>
      <text x={880} y={460} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={30} fill="#c1121f">
        enter UPI PIN to receive
      </text>
      {Array.from({ length: 9 }, (_, i) => (
        <circle key={i} cx={800 + (i % 3) * 80} cy={520 + Math.floor(i / 3) * 56} r={22} fill="#e6e8f0" stroke={COL.ink} strokeWidth={4} />
      ))}
    </Phone>
    <path d="M 740 490 L 1020 700 M 1020 490 L 740 700" stroke="#e5322d" strokeWidth={30} strokeLinecap="round" />
    {/* puppet strings */}
    {[640, 1140].map((x, i) => (
      <g key={x}>
        <line x1={x} y1={300} x2={x + (i ? -60 : 60)} y2={720} stroke="#f1faee" strokeWidth={4} opacity={0.8} />
        <rect x={x - 70} y={300} width={140} height={44} rx={10} fill="#ffd166" stroke={COL.ink} strokeWidth={4} />
        <text x={x} y={332} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={30} fill={COL.ink}>
          {i ? "OFFICIAL" : "URGENT"}
        </text>
      </g>
    ))}
  </g>
);

const ArtStatic: React.FC = () => (
  <g>
    <rect x={560} y={320} width={680} height={390} rx={24} fill="#000" {...K} />
    <clipPath id="thumbL10">
      <rect x={566} y={326} width={668} height={378} rx={20} />
    </clipPath>
    <g clipPath="url(#thumbL10)">
      {Array.from({ length: 900 }, (_, i) => {
        const x = 566 + (i % 30) * 11.2;
        const y = 326 + Math.floor(i / 30) * 12.6;
        const v = Math.floor(random(`n${i}`) * 255);
        return <rect key={i} x={x} y={y} width={11.4} height={12.8} fill={`rgb(${v},${v},${v})`} />;
      })}
      {/* landscape half */}
      <rect x={900} y={326} width={340} height={380} fill="#8ecae6" />
      <circle cx={1150} cy={400} r={36} fill="#ffd166" />
      <path d="M 900 600 L 990 470 L 1060 560 L 1130 450 L 1240 600 Z" fill="#577590" />
      <path d="M 990 470 L 1010 500 L 970 500 Z M 1130 450 L 1150 485 L 1110 485 Z" fill="#fff" />
      <rect x={900} y={600} width={340} height={110} fill="#219ebc" />
      <path d="M 920 640 h 80 M 1040 670 h 120" stroke="#bde0fe" strokeWidth={6} strokeLinecap="round" />
    </g>
    <line x1={900} y1={326} x2={900} y2={704} stroke="#fff" strokeWidth={10} />
    <line x1={900} y1={326} x2={900} y2={704} stroke="#ff4fd8" strokeWidth={4} />
  </g>
);

export const LONG_THUMBS: Cfg[] = [
  { id: "L001", bg: ["#0b1030", "#141c4a"], l1: "IT CHOSE", l2: "FOR YOU", hot: 2, accent: "#ff2d55", mood: "worried", gesture: "pointSide", art: ArtFeed },
  { id: "L001b", bg: ["#0b1030", "#20124a"], l1: "YOU DIDN'T", l2: "PICK THIS", hot: 2, accent: "#ff2d55", mood: "shock", gesture: "recoil", art: ArtFeed },
  { id: "L001c", bg: ["#0b1030", "#123a5a"], l1: "IT'S", l2: "READING YOU", hot: 2, accent: "#3fe0ff", mood: "skeptical", gesture: "armsCrossed", art: ArtFeed },
  { id: "L002", bg: ["#fff4e0", "#e8dcff"], l1: "IT'S", l2: "GUESSING", hot: 2, accent: "#7b2ff7", mood: "curious", gesture: "leanIn", art: ArtTokens },
  { id: "L002b", bg: ["#f6efe0", "#ece0c6"], l1: "ONE WORD", l2: "AT A TIME", hot: 2, accent: "#7b2ff7", mood: "mindblown", gesture: "mindBlown", bulb: true, art: ArtTokens },
  { id: "L002c", bg: ["#efe6ff", "#d9c8ff"], l1: "IT DOESN'T", l2: "KNOW YET", hot: 2, accent: "#ff5a4e", mood: "skeptical", gesture: "armsCrossed", art: ArtTokens },
  { id: "L003", bg: ["#23262b", "#3a2a2e"], l1: "SAME PRICE.", l2: "LESS PAIN?", hot: 2, accent: "#ff6b5b", mood: "skeptical", gesture: "armsCrossed", art: ArtSlices },
  { id: "L003b", bg: ["#1d2027", "#1f3a33"], l1: "0% INTEREST", l2: "≠ FREE", hot: 2, accent: "#5ff2c3", mood: "shock", gesture: "recoil", art: ArtSlices },
  { id: "L003c", bg: ["#1a1d2b", "#0b0d16"], l1: "THEY", l2: "STACK.", hot: 2, accent: "#ffc94a", mood: "worried", gesture: "pointSide", art: ArtTower },
  { id: "L004", bg: ["#e9f9d8", "#ffd8b8"], l1: "21 DAYS?", l2: "NOPE.", hot: 2, accent: "#e5322d", mood: "wink", gesture: "handsHips", art: ArtCalendar },
  { id: "L005", bg: ["#1f1235", "#4a1d6e"], l1: "6 CASES.", l2: "0 REAL.", hot: 2, accent: "#ffd23f", mood: "shock", gesture: "recoil", art: ArtFake },
  { id: "L006", bg: ["#1d2321", "#2f3b2a"], l1: "ONE TAP IN.", l2: "MAZE OUT.", hot: 2, accent: "#b8f35a", mood: "determined", gesture: "pointSide", art: ArtMaze },
  { id: "L007", bg: ["#0c1445", "#1b2a6b"], l1: "1 PAISA →", l2: "₹53 LAKH", hot: 2, accent: "#ffd166", mood: "mindblown", gesture: "mindBlown", bulb: true, art: ArtCurve },
  { id: "L008", bg: ["#2b2d42", "#4a4e69"], l1: "YOU'RE PAYING", l2: "A FEE", hot: 2, accent: "#f77f00", mood: "worried", gesture: "pointSide", art: ArtToll },
  { id: "L009", bg: ["#5c0a1e", "#0f4c5c"], l1: "PIN TO RECEIVE?", l2: "NO.", hot: 2, accent: "#ff4d6d", mood: "determined", gesture: "stop", art: ArtPin },
  { id: "L010", bg: ["#050505", "#2b0a3d"], l1: "STATIC →", l2: "ART", hot: 2, accent: "#ff4fd8", mood: "excited", gesture: "present", bulb: true, art: ArtStatic },
];

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11 < 128;
};

export const LongThumb: React.FC<{ cfg: Cfg }> = ({ cfg }) => {
  const Art = cfg.art;
  const dark = isDark(cfg.bg[0]);
  const S = 3.7;
  const line = (txt: string, hot: boolean, size: number) => (
    <div
      style={{
        fontFamily: FONT.comic,
        fontSize: size,
        lineHeight: 0.95,
        letterSpacing: 2,
        color: hot ? cfg.accent : "#ffffff",
        WebkitTextStroke: `14px ${COL.ink}`,
        paintOrder: "stroke fill",
        textShadow: "0 10px 0 rgba(0,0,0,0.35)",
        whiteSpace: "nowrap",
      }}
    >
      {txt}
    </div>
  );
  const size = (t: string) => (t.length > 12 ? 104 : t.length > 9 ? 124 : 150);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, ${cfg.bg[0]}, ${cfg.bg[1]})`, overflow: "hidden" }}>
      <svg width={1280} height={720} style={{ position: "absolute" }}>
        {/* spotlight behind Spark's face */}
        <circle cx={270} cy={330} r={300} fill={dark ? "#ffffff" : "#ffffff"} opacity={dark ? 0.1 : 0.45} />
        <Art />
        <Spark
          f={20}
          scale={S}
          base={{ x: 270, y: 735 }}
          keys={[{ f: 0, p: G[cfg.gesture] }]}
          mood={() => cfg.mood}
          bulb={() => (cfg.bulb ? 1 : 0)}
          look={0.8}
          mod={(_t, p) => addPose(p, {})}
        />
      </svg>
      <div style={{ position: "absolute", right: 40, top: 34, textAlign: "right" }}>
        {line(cfg.l1, cfg.hot === 1, size(cfg.l1))}
        {line(cfg.l2, cfg.hot === 2, size(cfg.l2))}
      </div>
    </AbsoluteFill>
  );
};
