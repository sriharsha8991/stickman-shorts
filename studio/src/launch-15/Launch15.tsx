import React from "react";
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame } from "remotion";
import { addPose, idle, type Pose } from "../stickman/stick";
import { Burst, COL, FONT } from "../stickman/fx";
import { Stage } from "../stickman/common";
import { K } from "../shared/kit";
import { SPARK_COLOR, Spark, bulbPulse, type Mood } from "../shared/mascot";
import { G, gestureKeys, hop, nod, shake, wave } from "../shared/gestures";
import { camAt, Transition, VERTICAL, type Shot } from "../shared/camera";
import { arc, ease, popIn, squash, wobble } from "../shared/motion";

// "SAME STRINGS" — 15 s international brand launch teaser for The Hidden Mechanism (Stickman Shorts, host Spark).
// No voice: music + one on-screen text layer at a time, readable on mute in any country.
// 0–2 s   four price tags ($ € ¥ ₹) swing on ONE knot · "SAME STRINGS?"
// 2–4 s   Spark yanks the pull-ring: all four jerk together · "EVERY COUNTRY."
// 4–7 s   world tour, 4 cuts across time zones (06:00 / 12:00 / 18:00 / 00:00): red dot, next episode, popcorn, only 2 left · "SAME TRICKS."
// 7–10 s  scroll up the strings: they all hang from one giant brain puppeteer · "ONE BRAIN."
// 10–12 s Spark says hi in five languages, snips the strings · "HI, I'M SPARK."
// 12–15 s logo lockup, follow; the tags are yanked back up into frame 0 (loop).

export const LAUNCH15_FRAMES = 450;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const CREAM = "#f7f5ef";
const RED = "#e8392f";
const GOLD = "#ffd23f";
const GOLD2 = "#c99a12";
const INK = COL.ink;
const WHITE = "#ffffff";
const PINK = "#f7a8c4";
const PINK2 = "#e0789e";
const WOOD = "#b98848";
const GROUND = 1290;
const SS = 1.9;


// timeline (frames)
const TUG = 64; // ring yanked
const TOUR = 120; // world tour cuts
const CUTS = [120, 142, 166, 188];
const BRAIN = 210; // scroll up to the brain
const BRAIN_CU = 268; // CU Spark aha
const HELLO = 300;
const SNIP = 348;
const LOGO = 366;
const RELOAD = 432; // strings yank the tags back up (loop)

// --- props ------------------------------------------------------------------------------------------------------
const TAGS = [
  { x: 180, label: "$9.99", col: "#3fae5a", r: -6 },
  { x: 410, label: "€9.99", col: "#2f6fd6", r: 4 },
  { x: 670, label: "¥999", col: "#e8505b", r: -3 },
  { x: 900, label: "₹999", col: "#ff8a1f", r: 6 },
];
const TAG_Y = 640;

const PriceTag: React.FC<{ label: string; col: string }> = ({ label, col }) => (
  <g>
    <path d="M -95 -6 L 75 -6 L 105 40 L 75 86 L -95 86 Z" fill={WHITE} {...K} strokeWidth={6} />
    <rect x={-84} y={4} width={150} height={72} rx={8} fill={col} opacity={0.14} />
    <circle cx={74} cy={40} r={9} fill={CREAM} stroke={INK} strokeWidth={4} />
    <text x={-12} y={62} textAnchor="middle" fontFamily={FONT.comic} fontSize={56} fill={col} stroke={INK} strokeWidth={3} paintOrder="stroke">
      {label}
    </text>
  </g>
);

const Ring: React.FC = () => <circle r={22} fill="none" stroke={RED} strokeWidth={10} />;

const Scissors: React.FC<{ open: number }> = ({ open }) => (
  <g>
    <g transform={`rotate(${-open * 22})`}>
      <path d="M 0 0 L 120 -10 L 120 6 Z" fill="#d7dbe0" {...K} strokeWidth={4} />
      <circle cx={-34} cy={-16} r={20} fill="none" stroke={RED} strokeWidth={10} />
    </g>
    <g transform={`rotate(${open * 22})`}>
      <path d="M 0 0 L 120 10 L 120 -6 Z" fill="#c4c9cf" {...K} strokeWidth={4} />
      <circle cx={-34} cy={16} r={20} fill="none" stroke={RED} strokeWidth={10} />
    </g>
    <circle r={6} fill={INK} />
  </g>
);

const Room: React.FC = () => (
  <g>
    <rect width={1080} height={1920} fill={CREAM} />
    <circle cx={540} cy={820} r={620} fill={SPARK_COLOR} opacity={0.08} />
    <line x1={60} y1={GROUND} x2={1020} y2={GROUND} stroke="#d9d5c8" strokeWidth={6} />
  </g>
);

// four tags hanging from one knot. pull = how far the knot is yanked down. cut = strings cut (tags fall).
const Mobile: React.FC<{ f: number; pull: number; fall: number; hand?: [number, number] | null; knotY?: number; t0?: number }> = ({ f, pull, fall, hand, knotY = 300, t0 = 0 }) => {
  const ky = knotY + pull;
  return (
    <g>
      <line x1={540} y1={-40} x2={540} y2={ky} stroke={INK} strokeWidth={4} strokeDasharray="14 10" />
      {TAGS.map((t, i) => {
        const sway = Math.sin((f - t0) / 9) * 5 + wobble(f, TUG, 9, 7);
        const ty = TAG_Y + pull * 1.15;
        const dropT = fall;
        const fy = dropT > 0 ? interpolate(dropT, [0, 1], [ty, GROUND - 80], { ...clamp, easing: (x) => x * x }) : ty;
        const ang = (Math.atan2(t.x - 540, ty - ky) * 180) / Math.PI;
        return (
          <g key={i}>
            {fall <= 0 && <line x1={540} y1={ky} x2={t.x} y2={ty} stroke={INK} strokeWidth={4} strokeDasharray="14 10" />}
            <g transform={`translate(${t.x} ${fy}) rotate(${fall > 0 ? t.r * 3 * dropT + i * 4 : t.r + sway - ang * 0.15})`}>
              <PriceTag label={t.label} col={t.col} />
            </g>
          </g>
        );
      })}
      <circle cx={540} cy={ky} r={14} fill={RED} stroke={INK} strokeWidth={5} />
      {hand && fall <= 0 && (
        <>
          <line x1={540} y1={ky} x2={hand[0]} y2={hand[1] - 22} stroke={RED} strokeWidth={5} />
          <g transform={`translate(${hand[0]} ${hand[1]})`}>
            <Ring />
          </g>
        </>
      )}
    </g>
  );
};

// world-tour cards: generic skyline + time + one object on a string
const SKIES = [
  { top: "#ffd6c9", bot: "#ffeedd", city: "#e9a99a", time: "06:00", sun: "#ff9a6a" },
  { top: "#8fd0ff", bot: "#dff3ff", city: "#7ab3d9", time: "12:00", sun: "#ffe066" },
  { top: "#ff9a5a", bot: "#ffd29a", city: "#c96a4a", time: "18:00", sun: "#ff5a3a" },
  { top: "#141c46", bot: "#2b3a7a", city: "#0b1030", time: "00:00", sun: "#f3f0d8" },
];
const Skyline: React.FC<{ i: number }> = ({ i }) => {
  const s = SKIES[i];
  const blds = [[60, 260], [170, 380], [260, 210], [360, 470], [480, 300], [560, 420], [680, 250], [770, 520], [880, 330], [960, 400]];
  return (
    <g>
      <defs>
        <linearGradient id={`sky${i}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={s.top} />
          <stop offset="1" stopColor={s.bot} />
        </linearGradient>
      </defs>
      <rect width={1080} height={1920} fill={`url(#sky${i})`} />
      <circle cx={i === 3 ? 820 : 260} cy={i === 1 ? 380 : 560} r={90} fill={s.sun} opacity={0.9} />
      {blds.map(([x, h], k) => (
        <g key={k}>
          <rect x={x - 50} y={GROUND - h} width={100} height={h} fill={s.city} />
          {i === 3 &&
            Array.from({ length: Math.floor(h / 60) }, (_, r) => (
              <rect key={r} x={x - 30 + ((r + k) % 2) * 30} y={GROUND - h + 24 + r * 60} width={18} height={22} fill={GOLD} opacity={0.75} />
            ))}
        </g>
      ))}
      <rect y={GROUND} width={1080} height={1920 - GROUND} fill={i === 3 ? "#0b1030" : "#e9e3d3"} />
      <line x1={620} y1={-40} x2={620} y2={700} stroke={INK} strokeWidth={4} strokeDasharray="14 10" />
      <g transform="translate(540 300)">
        <rect x={-110} y={-44} width={220} height={88} rx={20} fill={INK} opacity={0.85} />
        <text y={22} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={58} fill={WHITE} letterSpacing={3}>
          {s.time}
        </text>
      </g>
    </g>
  );
};

const RedDotPhone: React.FC<{ f: number; at: number }> = ({ f, at }) => (
  <g>
    <rect x={-120} y={-200} width={240} height={400} rx={36} fill={INK} />
    <rect x={-104} y={-176} width={208} height={352} rx={20} fill="#dff3ff" />
    {[0, 1, 2, 3, 4, 5].map((k) => (
      <rect key={k} x={-80 + (k % 3) * 60} y={-140 + Math.floor(k / 3) * 70} width={44} height={44} rx={12} fill={["#ffb84a", "#7ad1a8", "#8fa8ff"][k % 3]} />
    ))}
    <g transform={`translate(100 -190) scale(${popIn(f, at + 4)})`}>
      <circle r={42} fill={RED} stroke={INK} strokeWidth={5} />
      <text y={18} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={48} fill={WHITE}>
        3
      </text>
    </g>
  </g>
);

const NextEpisode: React.FC<{ f: number; at: number }> = ({ f, at }) => {
  const n = Math.max(1, 5 - Math.floor((f - at) / 5));
  return (
    <g>
      <rect x={-230} y={-150} width={460} height={290} rx={22} fill="#141414" {...K} />
      <rect x={-200} y={-120} width={400} height={170} rx={10} fill="#3a3a52" />
      <path d="M -20 -70 L 30 -35 L -20 0 Z" fill={WHITE} opacity={0.8} />
      <text x={-190} y={100} fontFamily={FONT.body} fontWeight={800} fontSize={34} fill={WHITE}>
        Next episode in
      </text>
      <g transform={`translate(160 88) scale(${1 + wobble(f, at + (5 - n) * 5, 0.15, 3)})`}>
        <circle r={36} fill={RED} />
        <text y={16} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={44} fill={WHITE}>
          {n}
        </text>
      </g>
    </g>
  );
};

const Popcorn: React.FC<{ f: number; at: number }> = ({ f, at }) => (
  <g>
    {[
      { x: -170, s: 0.7, l: "S" },
      { x: 0, s: 0.9, l: "M" },
      { x: 190, s: 1.15, l: "L" },
    ].map((b, k) => (
      <g key={k} transform={`translate(${b.x} ${150 - 0}) scale(${b.s * (k === 2 ? 1 + wobble(f, at + 6, 0.12, 4) : 1)})`}>
        <path d="M -70 -180 L 70 -180 L 50 0 L -50 0 Z" fill={WHITE} {...K} />
        {[-40, 0, 40].map((x) => (
          <path key={x} d={`M ${x - 8} -178 L ${x + 6} -2`} stroke={RED} strokeWidth={14} />
        ))}
        {[-50, -20, 10, 40].map((x, q) => (
          <circle key={x} cx={x + 6} cy={-196 - (q % 2) * 16} r={26} fill="#fff4c2" stroke={INK} strokeWidth={4} />
        ))}
        <text y={-70} textAnchor="middle" fontFamily={FONT.comic} fontSize={60} fill={INK}>
          {b.l}
        </text>
      </g>
    ))}
  </g>
);

const OnlyTwo: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <rect x={-250} y={-90} width={500} height={180} rx={26} fill="#1a1030" stroke={INK} strokeWidth={6} />
    <text y={36} textAnchor="middle" fontFamily={FONT.comic} fontSize={96} fill="#ff4fa0" opacity={0.6 + 0.4 * (Math.floor(f / 3) % 2)} style={{ filter: "drop-shadow(0 0 10px #ff4fa0)" }}>
      ONLY 2 LEFT!
    </text>
  </g>
);

// world C: the brain puppeteer high above (content scrolls)
const BrainScene: React.FC<{ f: number; scroll: number }> = ({ f, scroll }) => (
  <g transform={`translate(0 ${scroll})`}>
    <rect y={-2000} width={1080} height={6000} fill="#efe9ff" />
    <circle cx={540} cy={480} r={520} fill={SPARK_COLOR} opacity={0.1} />
    {/* the brain */}
    <g transform={`translate(540 430) scale(${1 + 0.02 * Math.sin(f / 5)})`}>
      <path
        d="M -250 40 C -300 -60 -230 -170 -140 -170 C -110 -240 0 -250 30 -200 C 90 -260 220 -230 230 -140 C 320 -110 310 20 250 60 C 260 140 160 190 90 160 C 40 210 -80 210 -110 160 C -200 190 -290 120 -250 40 Z"
        fill={PINK}
        {...K}
        strokeWidth={8}
      />
      <path d="M 0 -200 C -20 -100 30 -20 0 160 M -180 -60 C -120 -40 -100 20 -150 80 M 160 -100 C 110 -40 140 20 190 40 M -60 -140 C -20 -110 -60 -60 -30 -30 M 90 60 C 60 100 100 120 70 150" fill="none" stroke={PINK2} strokeWidth={8} strokeLinecap="round" />
      {/* eyes so the brain reads as a puppeteer */}
      <circle cx={-70} cy={20} r={20} fill={WHITE} stroke={INK} strokeWidth={5} />
      <circle cx={70} cy={20} r={20} fill={WHITE} stroke={INK} strokeWidth={5} />
      <circle cx={-66} cy={26} r={8} fill={INK} />
      <circle cx={74} cy={26} r={8} fill={INK} />
    </g>
    {/* puppet control bar */}
    <g transform={`translate(540 700) rotate(${Math.sin(f / 7) * 4})`}>
      <rect x={-380} y={-18} width={760} height={36} rx={14} fill={WOOD} {...K} />
      <rect x={-18} y={-110} width={36} height={220} rx={14} fill={WOOD} {...K} />
    </g>
    {/* strings down to everything */}
    {[-360, -240, -120, 0, 120, 240, 360].map((dx, k) => (
      <line key={k} x1={540 + dx} y1={710} x2={540 + dx * 1.15} y2={2600} stroke={INK} strokeWidth={4} strokeDasharray="14 10" />
    ))}
    {/* the four tour objects + tags hanging far below, scrolling past */}
    <g transform="translate(130 1500) scale(0.5)">
      <RedDotPhone f={f} at={-20} />
    </g>
    <g transform="translate(400 1700) scale(0.45)">
      <PriceTag label="€9.99" col="#2f6fd6" />
    </g>
    <g transform="translate(680 1550) scale(0.45)">
      <PriceTag label="¥999" col="#e8505b" />
    </g>
    <g transform="translate(960 1760) scale(0.5)">
      <PriceTag label="₹999" col="#ff8a1f" />
    </g>
    <g transform="translate(260 2050) scale(0.45)">
      <PriceTag label="$9.99" col="#3fae5a" />
    </g>
    <g transform="translate(800 2100) scale(0.4)">
      <OnlyTwo f={f} />
    </g>
  </g>
);

// --- the composition --------------------------------------------------------------------------------------------
const SHOTS: Shot[] = [
  { f: 0, z: 1.12, at: [540, 820], e: "cut" },
  { f: 30, z: 1.0, at: [540, 960], e: "slow" },
  { f: TUG - 4, z: 1.25, at: [540, 700], e: "snap" },
  { f: TUG + 22, z: 1.7, at: [560, 860], e: "cut" }, // CU Spark grin
  { f: TOUR, z: 1.0, at: [540, 960], e: "cut" },
  { f: BRAIN, z: 1.0, at: [540, 960], e: "cut" },
  { f: BRAIN_CU, z: 1.9, at: [560, 880], e: "cut" },
  { f: HELLO, z: 1.15, at: [540, 860], e: "cut" },
  { f: SNIP - 6, z: 1.35, at: [540, 560], e: "snap" },
  { f: LOGO, z: 1.0, at: [540, 960], e: "cut" },
];

const GREET = ["Hi!", "Hola!", "Namaste!", "Bonjour!", "Konnichiwa!"];

const Words: React.FC<{ f: number; at: number; out: number; children: React.ReactNode; col?: string }> = ({ f, at, out, children, col = INK }) => {
  if (f < at - 3 || f >= out) return null;
  const k = popIn(f, at);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 1400,
        textAlign: "center",
        fontFamily: FONT.comic,
        fontSize: 132,
        letterSpacing: 3,
        color: col,
        WebkitTextStroke: `11px ${INK}`,
        paintOrder: "stroke fill",
        transform: `scale(${k}) rotate(${-2 + wobble(f, at + 6, 2, 5)}deg)`,
        transformOrigin: "540px 70px",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>
  );
};

export const Launch15: React.FC<{ music?: number; sfx?: number }> = ({ music = 0.9, sfx = 0.7 }) => {
  const f = useCurrentFrame();
  const intro = f < TOUR;
  const tour = f >= TOUR && f < BRAIN;
  const brain = f >= BRAIN && f < HELLO;
  const hello = f >= HELLO && f < LOGO;
  const logo = f >= LOGO;
  const cam = camAt(f, SHOTS, VERTICAL);

  // knot pull: wind up (slight lift) → yank → spring back
  const pull = intro
    ? f < TUG - 6
      ? 0
      : f < TUG
        ? interpolate(f, [TUG - 6, TUG], [0, -18], clamp)
        : 70 * Math.exp(-(f - TUG) / 10) * Math.cos((f - TUG) / 4) + interpolate(f, [TUG, TUG + 2], [70, 0], clamp) * 0
    : 0;
  const fall = hello ? interpolate(f, [SNIP, SNIP + 12], [0, 1], clamp) : 0;
  const tourIdx = tour ? CUTS.filter((c) => f >= c).length - 1 : 0;
  const tourAt = CUTS[tourIdx];

  // Spark keys
  const sparkKeys = gestureKeys([
    [0, { ra1: 150, ra2: 30, la1: -20, la2: 10, head: -10 }],
    [TUG - 6, { ra1: 170, ra2: 10, la1: -20, la2: 10, head: -12 }, "snap"],
    [TUG, { ra1: 120, ra2: 50, la1: -30, la2: 10, lean: 6, head: -4 }, "snap"],
    [TUG + 22, G.fistPump, "snap"],
    [TOUR, G.pointUp, "snap"],
    [CUTS[1], G.shrugBig, "snap"],
    [CUTS[2], G.thinkChin, "snap"],
    [CUTS[3], G.recoil, "snap"],
    [BRAIN, G.pointUp, "snap"],
    [BRAIN_CU, G.mindBlown, "snap"],
    [HELLO, G.wave1, "snap"],
    [HELLO + 8, G.wave2, "snap"],
    [HELLO + 16, G.wave1, "snap"],
    [HELLO + 24, G.wave2, "snap"],
    [HELLO + 32, G.wave1, "snap"],
    [SNIP - 8, { ra1: 160, ra2: 10, la1: -20, la2: 10, head: -10 }, "snap"],
    [SNIP + 6, G.celebrate, "snap"],
    [LOGO, G.pointUp, "snap"],
    [LOGO + 30, G.present, "snap"],
    [RELOAD, { ra1: 150, ra2: 30, la1: -20, la2: 10, head: -10 }, "snap"],
  ]);
  const mood = (t: number): Mood => {
    if (t < TUG - 6) return "curious";
    if (t < TUG + 22) return "determined";
    if (t < TOUR) return "smug";
    if (t < CUTS[1]) return "shock";
    if (t < CUTS[2]) return "skeptical";
    if (t < CUTS[3]) return "thinking";
    if (t < BRAIN) return "worried";
    if (t < BRAIN_CU) return "curious";
    if (t < HELLO) return "mindblown";
    if (t < SNIP - 8) return "happy";
    if (t < LOGO) return "laugh";
    if (t < RELOAD) return "wink";
    return "curious";
  };
  const bulb = (t: number) => Math.max(bulbPulse(t, BRAIN_CU, 30), bulbPulse(t, SNIP, 20), bulbPulse(t, LOGO + 4, 40));
  const sx = tour ? 200 : logo ? 540 : 540;
  const sscale = tour ? 1.5 : logo ? 1.55 : SS;
  const sy = GROUND - 92.5 * sscale;
  const sparkMod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t, 4));
    q = addPose(addPose(q, hop(t, TUG + 2, 18)), shake(t, CUTS[3], 3));
    q = addPose(addPose(q, hop(t, BRAIN_CU, 22)), nod(t, HELLO + 2, 1));
    q = addPose(addPose(q, hop(t, SNIP, 26)), hop(t, LOGO + 4, 20));
    if (t >= HELLO && t < SNIP - 8) q = addPose(q, wave(t, HELLO, 40));
    return { ...q, x: sx };
  };

  const greetIdx = Math.min(GREET.length - 1, Math.floor((f - HELLO) / 8));
  const snipOpen = hello && f >= SNIP - 8 ? Math.abs(Math.cos(((f - (SNIP - 8)) / 8) * Math.PI)) : 1;

  // brain scroll: content moves from showing the strings/tags (scroll −1100) up to the brain (0)
  const scroll = ease(f, BRAIN, BRAIN + 40, -1150, 0);

  // reload: tags yanked back up for the loop
  const reload = f >= RELOAD ? interpolate(f, [RELOAD, LAUNCH15_FRAMES - 2], [0, 1], { ...clamp, easing: (x) => 1 - (1 - x) * (1 - x) }) : 0;

  const sparkEl = (
    <Spark f={f} scale={sscale} base={{ x: sx, y: sy }} facing={1} bulb={bulb} mood={mood} look={tour ? 1 : 0} keys={sparkKeys} mod={sparkMod}>
      {(j) => {
        if (intro)
          return (
            <g>
              <line x1={540} y1={300 + pull} x2={j.rHand[0]} y2={j.rHand[1] - 20} stroke={RED} strokeWidth={5} />
              <g transform={`translate(${j.rHand[0]} ${j.rHand[1]})`}>
                <Ring />
              </g>
            </g>
          );
        if (hello && f >= SNIP - 10)
          return (
            <g transform={`translate(${j.rHand[0] + 30} ${j.rHand[1] - 70}) rotate(-80) scale(1.6)`}>
              <Scissors open={snipOpen} />
            </g>
          );
        return null;
      }}
    </Spark>
  );

  return (
    <AbsoluteFill style={{ background: CREAM }}>
      <Audio src={staticFile("launch-15/music.mp3")} volume={(t) => music * interpolate(t, [0, 4, LAUNCH15_FRAMES - 12, LAUNCH15_FRAMES], [0, 1, 1, 0.6], clamp)} />
      <Stage
        bg={<AbsoluteFill style={{ background: CREAM }} />}
        cam={cam}
        hits={[TUG, BRAIN_CU, SNIP]}
        power={10}
        svg={
          <>
            {(intro || hello) && (
              <>
                <Room />
                <Mobile f={f} pull={pull} fall={fall} />
                {hello && f >= SNIP && f < SNIP + 14 && <Burst x={540} y={340} at={SNIP} f={f} size={220} color={RED} />}
                                {sparkEl}
                {hello && f < SNIP - 10 && (
                  <g transform={`translate(780 820) scale(${popIn(f, HELLO + greetIdx * 8)})`}>
                    <path d="M -170 -70 L 170 -70 Q 200 -70 200 -40 L 200 40 Q 200 70 170 70 L -60 70 L -120 120 L -110 70 L -170 70 Q -200 70 -200 40 L -200 -40 Q -200 -70 -170 -70 Z" fill={WHITE} {...K} />
                    <text y={26} textAnchor="middle" fontFamily={FONT.comic} fontSize={greetIdx === 4 ? 62 : 78} fill={SPARK_COLOR} stroke={INK} strokeWidth={3} paintOrder="stroke">
                      {GREET[greetIdx]}
                    </text>
                  </g>
                )}
              </>
            )}
            {tour && (
              <>
                <Skyline i={tourIdx} />
                
                <g transform={`translate(620 ${780 + (1 - Math.min(1, (f - tourAt) / 6)) * -260}) rotate(${wobble(f, tourAt + 6, 8, 6)}) scale(${squash(f, tourAt + 6, 0.12)[0]} ${squash(f, tourAt + 6, 0.12)[1]})`}>
                  {tourIdx === 0 && <RedDotPhone f={f} at={tourAt} />}
                  {tourIdx === 1 && <NextEpisode f={f} at={tourAt} />}
                  {tourIdx === 2 && <Popcorn f={f} at={tourAt} />}
                  {tourIdx === 3 && <OnlyTwo f={f} />}
                </g>
                {sparkEl}
              </>
            )}
            {brain && (
              <>
                <BrainScene f={f} scroll={scroll} />
                {f >= BRAIN_CU && (
                  <g>
                    <rect y={GROUND} width={1080} height={700} fill="#e3dbf7" />
                    {sparkEl}
                  </g>
                )}
              </>
            )}
            {logo && (
              <>
                <Room />
                {/* fallen tags on the floor, yanked back up on the reload */}
                {TAGS.map((t, i) => {
                  const y0 = GROUND - 80 + (i % 2) * 10;
                  const y = interpolate(reload, [0, 1], [y0, TAG_Y]);
                  return (
                    <g key={i}>
                      {reload > 0 && <line x1={540} y1={300} x2={t.x} y2={y} stroke={INK} strokeWidth={4} strokeDasharray="14 10" />}
                      <g transform={`translate(${reload > 0 ? t.x : [140, 330, 760, 950][i]} ${y}) rotate(${(1 - reload) * (i % 2 ? 14 : -12) + reload * t.r}) scale(${0.8 + reload * 0.2})`}>
                        <PriceTag label={t.label} col={t.col} />
                      </g>
                    </g>
                  );
                })}
                {reload > 0 && <line x1={540} y1={-40} x2={540} y2={300} stroke={INK} strokeWidth={4} strokeDasharray="14 10" />}
                {reload > 0 && <circle cx={540} cy={300} r={14} fill={RED} stroke={INK} strokeWidth={5} />}
                {sparkEl}
              </>
            )}
          </>
        }
      />
      <AbsoluteFill>
          <>
            <Words f={f} at={0} out={TUG - 8}>
              SAME STRINGS?
            </Words>
            <Words f={f} at={TUG} out={TOUR} col={RED}>
              EVERY COUNTRY.
            </Words>
            <Words f={f} at={TOUR + 2} out={BRAIN} col={WHITE}>
              SAME TRICKS.
            </Words>
            <Words f={f} at={BRAIN + 30} out={HELLO} col={SPARK_COLOR}>
              ONE BRAIN.
            </Words>
            <Words f={f} at={HELLO + 4} out={LOGO} col={WHITE}>
              HI, I'M SPARK.
            </Words>
            {logo && (
              <div style={{ position: "absolute", left: 0, right: 0, top: 360, textAlign: "center", opacity: 1 - reload }}>
                <div style={{ transform: `scale(${popIn(f, LOGO + 2)})`, fontFamily: FONT.comic, fontSize: 150, lineHeight: 0.95, color: RED, WebkitTextStroke: `12px ${INK}`, paintOrder: "stroke fill", letterSpacing: 3 }}>
                  THE HIDDEN
                  <br />
                  MECHANISM
                </div>
                <div style={{ marginTop: 26, transform: `scale(${popIn(f, LOGO + 12)})`, fontFamily: FONT.body, fontWeight: 800, fontSize: 46, color: INK }}>Why you do the weird things you do</div>
              </div>
            )}
            {logo && (
              <div style={{ position: "absolute", left: 0, right: 0, top: 1400, textAlign: "center", opacity: 1 - reload }}>
                <div style={{ display: "inline-block", transform: `scale(${popIn(f, LOGO + 22)})`, background: SPARK_COLOR, color: WHITE, fontFamily: FONT.body, fontWeight: 900, fontSize: 44, padding: "14px 34px", borderRadius: 20, boxShadow: "0 8px 0 rgba(0,0,0,0.15)" }}>
                  New Short every day
                </div>
                <div style={{ marginTop: 28 }}>
                  <div
                    style={{
                      display: "inline-block",
                      transform: `scale(${popIn(f, LOGO + 34) * (1 + 0.05 * Math.sin((f - LOGO) / 4))})`,
                      background: RED,
                      color: WHITE,
                      fontFamily: FONT.comic,
                      fontSize: 72,
                      letterSpacing: 4,
                      padding: "8px 48px",
                      borderRadius: 999,
                      border: `6px solid ${INK}`,
                    }}
                  >
                    FOLLOW ▸
                  </div>
                </div>
              </div>
            )}
            <Transition f={f} at={BRAIN} kind="iris" size={VERTICAL} colors={[SPARK_COLOR, PINK, RED]} />
          </>
        
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const _unused = { arc, sfxVol: 0, GOLD, GOLD2 };
