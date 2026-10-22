import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Actor, P, SNAP, addPose, idle, type Key } from "../stickman/stick";
import { Burst, COL, FONT, Slam } from "../stickman/fx";
import { Stage, Stamp } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, K, VoiceCaptions, punch } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// V010 · Why that notification dot is red. Mechanism Reveal on a giant pastel home-screen wall (Playful).
// YOU taps a red badge before deciding to. Red = stop signs and alarms; the number = something unfinished (an
// open ring around the badge). The famous reason (Zeigarnik: unfinished tasks stick in memory) gets stamped
// NO MEMORY BOOST by a 2025 meta-analysis (aha). What holds: the pull to finish — the badge inflates into a
// ringing alarm bell that pulls YOU up (wow); people resumed ~2 in 3 interrupted tasks (67%). The dot needs your
// thumb, not your memory; clear it and the next ping reopens the loop. Fix: badges OFF for anything that isn't a
// person; only FRIEND keeps a dot. Ends on the hook frame (loop).

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pop = (f: number, at: number) => interpolate(f, [at, at + 5, at + 9], [0, 1.15, 1], clamp);

const SS = 1.85;
const SGY = GROUND - 92.5 * SS;
const YS = 1.6;
const YGY = GROUND - 92.5 * YS;
const RED = "#ff3b3b";
const DEEP = "#5b4f8f";

// hero icon (rests on the floor), badge at its top-right corner
const IX = 370;
const IY = 1160;
const IS = 260;
const BX = IX + IS / 2 - 12;
const BY = IY - IS / 2 + 12;

// --- background: a giant home-screen wall -------------------------------------------------------
const TILE_COLS = ["#b9d7ff", "#ffd6a8", "#c9f2d8", "#ffc8dd", "#fff1a8", "#d9ccff"];
const Wall: React.FC<{ f: number; flash: number }> = ({ f, flash }) => (
  <AbsoluteFill>
    <svg width={1080} height={1920} style={{ position: "absolute" }}>
      <defs>
        <linearGradient id="v10bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f4f2fb" />
          <stop offset="100%" stopColor="#d8d3ec" />
        </linearGradient>
      </defs>
      <rect width={1080} height={1920} fill="url(#v10bg)" />
      {Array.from({ length: 24 }, (_, i) => {
        const c = i % 4;
        const r = Math.floor(i / 4);
        const x = 95 + c * 250 + (r % 2) * 20;
        const y = 250 + r * 175 + Math.sin(f * 0.03 + i) * 3;
        return <rect key={i} x={x} y={y} width={150} height={150} rx={38} fill={TILE_COLS[i % 6]} opacity={0.28} />;
      })}
      <rect x={0} y={GROUND} width={1080} height={1920 - GROUND} fill="#c4bddd" />
      <line x1={0} y1={GROUND} x2={1080} y2={GROUND} stroke={COL.ink} strokeWidth={6} />
      {flash > 0.01 && <rect width={1080} height={1920} fill={RED} opacity={0.28 * flash} />}
    </svg>
  </AbsoluteFill>
);

// generic app glyphs (no logos)
const Glyph: React.FC<{ kind: number; s: number }> = ({ kind, s }) => {
  const k = { fill: "#fff", stroke: COL.ink, strokeWidth: 5 * s };
  switch (kind % 5) {
    case 0:
      return <path d={`M ${-40 * s} ${-28 * s} h ${80 * s} a ${12 * s} ${12 * s} 0 0 1 ${12 * s} ${12 * s} v ${40 * s} a ${12 * s} ${12 * s} 0 0 1 ${-12 * s} ${12 * s} h ${-44 * s} l ${-22 * s} ${18 * s} v ${-18 * s} h ${-14 * s} a ${12 * s} ${12 * s} 0 0 1 ${-12 * s} ${-12 * s} v ${-40 * s} a ${12 * s} ${12 * s} 0 0 1 ${12 * s} ${-12 * s} z`} {...k} />;
    case 1:
      return <circle r={34 * s} {...k} />;
    case 2:
      return <path d={`M 0 ${-38 * s} L ${36 * s} ${30 * s} L ${-36 * s} ${30 * s} Z`} {...k} strokeLinejoin="round" />;
    case 3:
      return <rect x={-32 * s} y={-32 * s} width={64 * s} height={64 * s} rx={10 * s} {...k} />;
    default:
      return <path d={`M 0 ${-38 * s} L ${11 * s} ${-12 * s} L ${38 * s} ${-12 * s} L ${16 * s} ${6 * s} L ${24 * s} ${34 * s} L 0 ${18 * s} L ${-24 * s} ${34 * s} L ${-16 * s} ${6 * s} L ${-38 * s} ${-12 * s} L ${-11 * s} ${-12 * s} Z`} {...k} strokeLinejoin="round" />;
  }
};

const Icon: React.FC<{ x: number; y: number; size: number; color: string; kind: number; squash?: number }> = ({ x, y, size, color, kind, squash = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${1 + squash * 0.06} ${1 - squash * 0.08})`}>
    <rect x={-size / 2} y={-size / 2} width={size} height={size} rx={size * 0.24} fill={color} {...K} />
    <rect x={-size / 2 + 14} y={-size / 2 + 10} width={size * 0.5} height={size * 0.12} rx={size * 0.06} fill="#fff" opacity={0.45} />
    <Glyph kind={kind} s={size / 150} />
  </g>
);

const Badge: React.FC<{ x: number; y: number; r: number; n: string | number; s?: number }> = ({ x, y, r, n, s = 1 }) =>
  s > 0.01 ? (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle r={r} fill={RED} {...K} />
      <text y={r * 0.36} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={r * 1.1} fill="#fff">
        {n}
      </text>
    </g>
  ) : null;

// open loop: a ring with a gap around a point
const OpenRing: React.FC<{ x: number; y: number; r: number; k: number; rot: number }> = ({ x, y, r, k, rot }) => {
  const circ = 2 * Math.PI * r;
  return k > 0.01 ? (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <circle r={r} fill="none" stroke={DEEP} strokeWidth={12} strokeLinecap="round" strokeDasharray={`${circ * 0.84 * k} ${circ}`} />
    </g>
  ) : null;
};

const StopSign: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => {
  const pts = Array.from({ length: 8 }, (_, i) => {
    const a = ((i + 0.5) / 8) * Math.PI * 2;
    return `${Math.cos(a) * 90},${Math.sin(a) * 90}`;
  }).join(" ");
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-8} y={60} width={16} height={130} fill="#9aa0ad" {...K} strokeWidth={4} />
      <polygon points={pts} fill={RED} {...K} />
      <text y={18} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={54} fill="#fff">
        STOP
      </text>
    </g>
  );
};

const Beacon: React.FC<{ x: number; y: number; s: number; f: number }> = ({ x, y, s, f }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {[0, 1].map((i) => {
      const a = f * 0.25 + i * Math.PI;
      return <path key={i} d={`M 0 -10 L ${Math.cos(a) * 220} ${-10 + Math.sin(a) * 60 - 40} L ${Math.cos(a + 0.3) * 220} ${-10 + Math.sin(a + 0.3) * 60 - 40} Z`} fill={RED} opacity={0.25} />;
    })}
    <path d="M -60 40 L -60 -20 Q -60 -80 0 -80 Q 60 -80 60 -20 L 60 40 Z" fill={RED} {...K} />
    <rect x={-80} y={40} width={160} height={36} rx={8} fill="#4a4a58" {...K} />
    <path d="M -30 -30 Q -30 -56 -4 -58" stroke="#fff" strokeWidth={8} fill="none" strokeLinecap="round" opacity={0.7} />
  </g>
);

const Brain: React.FC<{ x: number; y: number; s: number; notes: number; f: number; drop: number }> = ({ x, y, s, notes, f, drop }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path
      d="M -130 20 C -160 -40 -110 -100 -60 -95 C -40 -130 30 -130 50 -100 C 100 -115 150 -60 130 -10 C 160 30 120 90 70 80 C 40 110 -40 110 -60 80 C -120 95 -150 60 -130 20 Z"
      fill="#ffb3c7"
      {...K}
    />
    <path d="M -80 -40 q 30 20 0 50 M 0 -90 q -20 40 10 70 M 70 -50 q -30 30 0 60" stroke="#e57f9e" strokeWidth={7} fill="none" strokeLinecap="round" />
    {[
      [-90, -40, -12, "#fff1a8"],
      [10, -70, 8, "#c9f2d8"],
      [80, 0, -6, "#b9d7ff"],
    ].map(([nx, ny, r, c], i) => {
      const at = i * 6;
      const k = interpolate(notes, [at / 18, at / 18 + 0.4], [0, 1], clamp);
      const dy = drop * (300 + i * 60);
      const dr = drop * (40 - i * 30);
      return k > 0.01 ? (
        <g key={i} transform={`translate(${nx as number} ${(ny as number) + dy}) rotate(${(r as number) + dr + Math.sin(f * 0.1 + i) * 2}) scale(${k})`} opacity={1 - drop * 0.8}>
          <rect x={-38} y={-34} width={76} height={68} rx={6} fill={c as string} {...K} strokeWidth={4} />
          <path d="M -24 -10 h 48 M -24 8 h 34" stroke={COL.ink} strokeWidth={5} strokeLinecap="round" />
        </g>
      ) : null;
    })}
  </g>
);

const Bell: React.FC<{ x: number; y: number; s: number; f: number; ring: number; n: string }> = ({ x, y, s, f, ring, n }) => {
  const sh = Math.sin(f * 1.9) * 10 * ring;
  return s > 0.01 ? (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${sh})`}>
      {ring > 0.1 &&
        [-1, 1].map((d) => (
          <path key={d} d={`M ${d * 190} -80 q ${d * 30} 50 0 100 M ${d * 230} -110 q ${d * 44} 80 0 160`} stroke={RED} strokeWidth={10} fill="none" strokeLinecap="round" opacity={ring} />
        ))}
      <circle cx={0} cy={-150} r={22} fill={RED} {...K} />
      <path d="M -150 70 Q -150 -140 0 -140 Q 150 -140 150 70 L 185 110 L -185 110 Z" fill={RED} {...K} strokeWidth={8} strokeLinejoin="round" />
      <circle cx={sh * 2} cy={140} r={30} fill="#ffd23f" {...K} />
      <path d="M -90 -60 Q -100 -110 -40 -118" stroke="#fff" strokeWidth={12} fill="none" strokeLinecap="round" opacity={0.6} />
      <text y={40} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={150} fill="#fff" stroke={COL.ink} strokeWidth={5} paintOrder="stroke">
        {n}
      </text>
    </g>
  ) : null;
};

// --- sfx ---------------------------------------------------------------------------------------------
export const S01_SFX: SfxCue[] = [
  [W(0, 1), "pop", 0.6],
  [W(0, 1) + 1, "ding", 0.4],
  [W(0, 8), "boing", 0.35],
  [W(1, 5), "stamp", 0.45],
  [W(1, 8), "horn", 0.25],
  ...[0, 1, 2, 3].map((i): SfxCue => [W(2, 2) + i * 5, "tick", 0.35]),
  [W(2, 5), "scribble", 0.35],
  [C(3), "whoosh", 0.45],
  [W(3, 4), "page", 0.5],
  [C(4), "pop", 0.35],
  [C(4) + 6, "pop", 0.35],
  [C(4) + 12, "pop", 0.35],
  [C(5), "ding", 0.45],
  [W(5, 8), "stamp", 0.6],
  [W(5, 7), "swish", 0.4],
  [C(6) - 12, "riser", 0.4],
  [W(6, 4), "impact", 0.65],
  [W(6, 4) + 4, "buzz", 0.35],
  [W(7, 1), "riser", 0.25],
  [W(7, 5), "kaching", 0.5],
  [W(7, 3), "pop", 0.4],
  [W(7, 3) + 8, "pop", 0.4],
  [W(8, 3), "buzz", 0.35],
  [W(8, 6), "pop", 0.5],
  [W(8, 8), "ding", 0.4],
  [W(9, 0), "shatter", 0.35],
  [W(9, 5), "ding", 0.55],
  [W(9, 6), "boing", 0.35],
  [C(10), "whoosh", 0.4],
  [W(10, 1), "clink", 0.5],
  ...Array.from({ length: 8 }, (_, i): SfxCue => [W(10, 2) + i * 4, "pop", 0.25]),
  [W(11, 5), "ding", 0.5],
  [VOICE_FRAMES - 20, "pop", 0.45],
];

export const S01RedDot: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const E = VOICE_FRAMES;
  const tap = W(0, 1);
  const decide = W(0, 8);
  const redAt = C(1);
  const stopAt = W(1, 5);
  const alarms = W(1, 8);
  const numAt = C(2);
  const unfin = W(2, 5);
  const zeig = C(3);
  const memory = C(4);
  const twist = C(5);
  const fails = W(5, 8);
  const hold = C(6);
  const pull = W(6, 4);
  const people = C(7);
  const twoIn3 = W(7, 3);
  const dotNeeds = C(8);
  const thumb = W(8, 8);
  const clear = W(9, 0);
  const ping = W(9, 5);
  const offAt = W(10, 1);
  const panelAt = C(10);
  const someone = W(11, 5);
  const loopAt = E - 22;

  // phases
  const iconVis = Math.max(
    interpolate(f, [zeig - 2, zeig + 8], [1, 0], clamp) * (f < hold ? 1 : 0),
    f >= hold - 4 && f < people ? interpolate(f, [hold - 4, hold + 4], [0, 1], clamp) : 0,
    f >= dotNeeds - 4 && f < panelAt + 4 ? interpolate(f, [dotNeeds - 4, dotNeeds + 4, panelAt - 2, panelAt + 4], [0, 1, 1, 0], clamp) : 0,
    interpolate(f, [loopAt, loopAt + 8], [0, 1], clamp),
  );
  const iconSlide = f < hold ? interpolate(f, [zeig - 2, zeig + 8], [0, -500], { ...clamp, easing: Easing.in(Easing.quad) }) : 0;
  const brainK = interpolate(f, [zeig + 4, zeig + 12, hold - 6, hold + 2], [0, 1, 1, 0], clamp);
  const statsK = interpolate(f, [people - 2, people + 8, dotNeeds - 6, dotNeeds + 2], [0, 1, 1, 0], clamp);
  const panelK = interpolate(f, [panelAt - 2, panelAt + 8, loopAt - 6, loopAt + 2], [0, 1, 1, 0], clamp);
  const bellK = interpolate(f, [pull - 6, pull + 2, people - 6, people + 2], [0, 1, 1, 0], { ...clamp, easing: Easing.out(Easing.back(2)) });
  const flash = interpolate(f, [pull, pull + 3, pull + 22], [0, 1, 0], clamp) + interpolate(f, [pull + 30, pull + 33, pull + 50], [0, 0.6, 0], clamp);

  // the number on the badge
  const n =
    f < numAt + 6 ? 3 : f < clear ? Math.round(interpolate(f, [W(2, 2), W(2, 2) + 18], [3, 12], clamp)) : f < loopAt ? 1 : 3;
  const badgeS = f >= clear && f < ping ? interpolate(f, [clear, clear + 4], [1, 0], clamp) : f >= ping && f < ping + 10 ? pop(f, ping) : f >= pull - 6 && f < people ? 1 - bellK : 1;
  const squash = Math.max(interpolate(f, [tap, tap + 3, tap + 10], [0, 1, 0], clamp), interpolate(f, [thumb, thumb + 3, thumb + 10], [0, 1, 0], clamp));
  const ringK = Math.max(
    interpolate(f, [unfin - 4, unfin + 14, zeig - 6, zeig], [0, 1, 1, 0], clamp),
    interpolate(f, [ping + 2, ping + 16, panelAt - 4, panelAt + 2], [0, 1, 1, 0], clamp),
  );

  // YOU (faces left toward the icon)
  const youKeys: Key[] = [
    { f: 0, p: { ra1: 20, la1: -10 } },
    { f: tap - 4, p: { ra1: 20, la1: -10 } },
    { f: tap, p: { ra1: 98, ra2: -4, lean: -6 }, e: SNAP },
    { f: tap + 10, p: { ra1: 98, ra2: -4, lean: -6 } },
    { f: tap + 18, p: { ra1: 15, ra2: 0, lean: 0 } },
    { f: decide - 2, p: { ra1: 15 } },
    { f: decide + 4, p: { ...P.think }, e: SNAP },
    { f: numAt - 2, p: { ...P.think } },
    { f: numAt + 6, p: { ...P.shock } },
    { f: zeig - 2, p: { ...P.shock } },
    { f: zeig + 6, p: { ...P.think } },
    { f: pull - 4, p: { ...P.think } },
    { f: pull + 2, p: { ra1: 160, ra2: 10, la1: -140, lean: -8, y: YGY - 30 }, e: SNAP },
    { f: people - 4, p: { ra1: 160, ra2: 10, la1: -140, lean: -8, y: YGY - 30 } },
    { f: people + 4, p: { ...P.think, y: YGY } },
    { f: thumb - 4, p: { ...P.think } },
    { f: thumb, p: { ra1: 98, ra2: -4, lean: -6 }, e: SNAP },
    { f: thumb + 10, p: { ra1: 98, ra2: -4, lean: -6 } },
    { f: clear - 2, p: { ra1: 40 } },
    { f: clear + 4, p: { ...P.cheer } },
    { f: ping - 2, p: { ...P.cheer } },
    { f: ping + 4, p: { ...P.sad }, e: SNAP },
    { f: panelAt - 2, p: { ...P.sad } },
    { f: panelAt + 8, p: { ...P.stand } },
    { f: someone - 2, p: { ...P.stand } },
    { f: someone + 4, p: { ...P.cheer } },
    { f: loopAt, p: { ...P.cheer } },
    { f: loopAt + 8, p: { ra1: 20, la1: -10 } },
  ];

  const sparkMood = (t: number): Mood =>
    t >= numAt && t < zeig ? "shock" : t >= fails && t < hold ? "smug" : t >= pull && t < people ? "shock" : t >= twoIn3 && t < dotNeeds ? "happy" : t >= dotNeeds && t < clear ? "smug" : t >= ping && t < panelAt ? "sad" : t >= someone ? "happy" : "neutral";
  const bulb = (t: number) => Math.max(bulbPulse(t, twist, 40), bulbPulse(t, offAt, 20) * 0.6);
  const sparkKeys: Key[] = [
    { f: 0, p: { ...P.pointR, ra1: 110 } },
    { f: redAt - 2, p: { ...P.pointR, ra1: 110 } },
    { f: redAt + 6, p: { ...P.pointR, ra1: 150 } },
    { f: numAt - 2, p: { ...P.pointR, ra1: 150 } },
    { f: numAt + 4, p: { ...P.shock }, e: SNAP },
    { f: zeig - 2, p: { ...P.shock } },
    { f: zeig + 6, p: { ...P.think } },
    { f: twist - 2, p: { ...P.think } },
    { f: twist + 3, p: { ra1: 160, ra2: -10, la1: -18 }, e: SNAP }, // aha
    { f: fails - 2, p: { ra1: 160, ra2: -10, la1: -18 } },
    { f: fails + 4, p: { ...P.shrug } },
    { f: pull - 2, p: { ...P.shrug } },
    { f: pull + 3, p: { ...P.shock }, e: SNAP },
    { f: people - 2, p: { ...P.shock } },
    { f: people + 6, p: { ...P.pointR, ra1: 120 } },
    { f: twoIn3 - 2, p: { ...P.pointR, ra1: 120 } },
    { f: twoIn3 + 3, p: { ...P.cheer }, e: SNAP },
    { f: dotNeeds - 2, p: { ...P.cheer } },
    { f: dotNeeds + 6, p: { ...P.shrug } },
    { f: ping - 2, p: { ...P.shrug } },
    { f: ping + 4, p: { ...P.facepalm }, e: SNAP },
    { f: panelAt - 2, p: { ...P.facepalm } },
    { f: panelAt + 6, p: { ...P.pointR, ra1: 130 } },
    { f: someone - 2, p: { ...P.pointR, ra1: 130 } },
    { f: someone + 4, p: { ...P.cheer } },
    { f: loopAt, p: { ...P.cheer } },
    { f: loopAt + 8, p: { ...P.pointR, ra1: 110 } },
  ];

  const z = punch(f, [tap, numAt, fails, pull, twoIn3, ping, offAt, someone], 0.03);

  // stats: pie fills to 67%
  const pie = interpolate(f, [W(7, 1), twoIn3 + 4], [0, 0.67], { ...clamp, easing: Easing.out(Easing.cubic) });
  const pieR = 150;
  const PX = 420;
  const PY = 560;
  const arc = (k: number) => {
    const a = k * Math.PI * 2 - Math.PI / 2;
    const large = k > 0.5 ? 1 : 0;
    return `M ${PX} ${PY} L ${PX} ${PY - pieR} A ${pieR} ${pieR} 0 ${large} 1 ${PX + Math.cos(a) * pieR} ${PY + Math.sin(a) * pieR} Z`;
  };

  // panel: 9 icons, FRIEND (index 4) keeps its dot
  const panel = Array.from({ length: 9 }, (_, i) => ({ x: 200 + (i % 3) * 190, y: 470 + Math.floor(i / 3) * 180, i }));
  const FRIEND = 4;
  const toggled = f >= offAt;

  return (
    <Stage
      bg={<Wall f={f} flash={flash} />}
      hits={[pull, ping]}
      power={8}
      cam={{ z }}
      svg={
        <>
          {/* act 1: the hero icon on the floor */}
          {iconVis > 0.01 && (
            <g opacity={iconVis} transform={`translate(${iconSlide} 0)`}>
              <Icon x={IX} y={IY} size={IS} color="#7fb2ff" kind={0} squash={squash} />
              <OpenRing x={BX} y={BY} r={78} k={ringK} rot={-60 + f * 1.2} />
              <Badge x={BX} y={BY} r={52} n={n} s={badgeS} />
            </g>
          )}
          {f >= tap && f < tap + 14 && <Burst x={BX} y={BY} at={tap} f={f} size={150} color={RED} />}
          {f >= thumb && f < thumb + 14 && <Burst x={BX} y={BY} at={thumb} f={f} size={150} color={RED} />}
          {f >= clear && f < clear + 16 && <Burst x={BX} y={BY} at={clear} f={f} size={200} color="#ffd23f" />}

          {/* red = stop signs and alarms */}
          {f >= stopAt - 2 && f < unfin && (
            <g opacity={interpolate(f, [unfin - 8, unfin - 1], [1, 0], clamp)}>
              <StopSign x={250} y={420} s={pop(f, stopAt)} />
              {f >= alarms - 2 && <Beacon x={600} y={470} s={pop(f, alarms)} f={f} />}
            </g>
          )}

          {/* the famous reason: memory (brain with sticky notes) */}
          {brainK > 0.01 && (
            <g opacity={brainK}>
              <Brain x={420} y={760} s={1.25} notes={interpolate(f, [memory, memory + 18], [0, 1], clamp)} f={f} drop={interpolate(f, [fails + 4, fails + 22], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) })} />
            </g>
          )}

          {/* wow: the badge inflates into an alarm bell */}
          <Bell x={500} y={640} s={bellK * 1.05} f={f} ring={f >= pull ? 1 : 0} n="12" />
          {f >= pull && f < pull + 18 && <Burst x={500} y={640} at={pull} f={f} size={320} color={RED} />}

          {/* stats */}
          {statsK > 0.01 && (
            <g opacity={statsK}>
              <circle cx={PX} cy={PY} r={pieR} fill="#fff" {...K} />
              {pie > 0.005 && <path d={arc(pie)} fill={DEEP} />}
              <circle cx={PX} cy={PY} r={pieR} fill="none" {...K} />
              {[0, 1, 2].map((i) => {
                const x = 230 + i * 190;
                const done = i < 2 && f >= twoIn3 + i * 8;
                return (
                  <g key={i} transform={`translate(${x} 830)`}>
                    <rect x={-70} y={-48} width={140} height={96} rx={14} fill={done ? "#c9f2d8" : "#fff"} {...K} strokeWidth={5} />
                    <path d="M -46 -16 h 60 M -46 8 h 40" stroke={COL.ink} strokeWidth={5} strokeLinecap="round" opacity={0.5} />
                    {done && <path d="M 18 4 l 14 16 l 28 -36" stroke="#1f9d55" strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" transform={`scale(${pop(f, twoIn3 + i * 8)})`} />}
                  </g>
                );
              })}
            </g>
          )}

          {/* payoff: phone panel */}
          {panelK > 0.01 && (
            <g opacity={panelK}>
              <rect x={90} y={370} width={680} height={560} rx={46} fill="#2b2540" {...K} />
              {panel.map(({ x, y, i }) => {
                const offAtI = offAt + 6 + (i > FRIEND ? i - 1 : i) * 4;
                const gone = i !== FRIEND && toggled ? interpolate(f, [offAtI, offAtI + 4], [1, 0], clamp) : 1;
                const big = i === FRIEND && f >= someone ? pop(f, someone) * 1.12 + Math.sin(f * 0.3) * 0.02 : 1;
                return (
                  <g key={i} transform={`translate(${x} ${y}) scale(${big})`}>
                    <Icon x={0} y={0} size={140} color={i === FRIEND ? "#9be7b0" : TILE_COLS[i % 6]} kind={i === FRIEND ? 0 : i} />
                    {i === FRIEND && (
                      <g>
                        <circle cx={0} cy={-14} r={11} fill={COL.ink} />
                        <path d="M -20 14 q 20 -24 40 0" stroke={COL.ink} strokeWidth={8} fill="none" strokeLinecap="round" />
                      </g>
                    )}
                    <Badge x={58} y={-58} r={26} n={i === FRIEND ? 1 : (i * 7) % 13 + 2} s={gone} />
                  </g>
                );
              })}
            </g>
          )}

          {/* YOU */}
          <Actor
            f={f}
            color={COL.orange}
            scale={YS}
            label="YOU"
            facing={-1}
            face={f >= numAt && f < zeig ? "sad" : f >= clear && f < ping ? "happy" : f >= ping && f < panelAt ? "sad" : f >= someone ? "happy" : "eyes"}
            base={{ x: 600, y: YGY }}
            keys={youKeys}
            opacity={f >= panelAt + 2 && f < loopAt ? interpolate(f, [panelAt + 2, panelAt + 10], [1, 0], clamp) : 1}
            mod={(t, p) => {
              const jitter = t >= pull && t < people ? Math.sin(t * 1.7) * 4 : 0;
              return addPose({ ...p, x: p.x + jitter }, idle(t, 4));
            }}
          />

          {/* SPARK (right, facing left) */}
          <Spark f={f} scale={SS} base={{ x: 905, y: SGY }} facing={-1} talk={(t) => mouthAt(t)} bulb={bulb} mood={sparkMood} look={-1} keys={sparkKeys} mod={(t, p) => addPose(p, idle(t, 8))} />
        </>
      }
      html={
        <>
          {/* hook overlay (frame 0) + loop */}
          <div
            style={{
              position: "absolute",
              left: 540,
              top: 360,
              transform: `translate(-50%,-50%) rotate(-3deg) scale(${f >= loopAt ? pop(f, loopAt) : 1})`,
              opacity: Math.max(interpolate(f, [redAt - 6, redAt + 2], [1, 0], clamp), f >= loopAt ? 1 : 0),
              fontFamily: FONT.comic,
              fontSize: 150,
              color: "#fff",
              WebkitTextStroke: `10px ${COL.ink}`,
              paintOrder: "stroke fill",
              whiteSpace: "nowrap",
              letterSpacing: 3,
            }}
          >
            WHY IS IT <span style={{ color: RED }}>RED?</span>
          </div>
          {/* late decision */}
          {f >= decide && f < numAt && (
            <div style={{ position: "absolute", left: 330, top: 900, transform: `translate(-50%,-50%) scale(${pop(f, decide)})`, background: "#fff", border: `5px solid ${COL.ink}`, borderRadius: 30, padding: "4px 26px", fontFamily: FONT.comic, fontSize: 56, color: COL.ink, whiteSpace: "nowrap" }}>
              …SHOULD I?
            </div>
          )}
          <Slam f={f} at={unfin} out={zeig - 4} x={540} y={420} size={110} color={DEEP} stroke={`9px #fff`} rotate={-2}>
            UNFINISHED
          </Slam>
          {/* textbook card */}
          {f >= W(3, 4) && f < hold - 4 && (
            <div
              style={{
                position: "absolute",
                left: 540,
                top: 380,
                transform: `translate(-50%,-50%) rotate(-2deg) scale(${pop(f, W(3, 4))})`,
                background: "#fffdf4",
                border: `6px solid ${COL.ink}`,
                borderRadius: 12,
                padding: "10px 36px",
                textAlign: "center",
                boxShadow: "10px 10px 0 rgba(0,0,0,0.15)",
              }}
            >
              <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 82, color: COL.ink, whiteSpace: "nowrap" }}>ZEIGARNIK EFFECT</div>
              <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 36, color: "#6b6b7b", whiteSpace: "nowrap" }}>1927 · “unfinished tasks stick in memory”</div>
            </div>
          )}
          {f >= fails && f < hold && <Stamp f={f} at={fails} x={430} y={780} text="NO MEMORY BOOST" size={74} color={RED} r={-8} />}
          <Slam f={f} at={W(6, 2)} out={people - 4} x={540} y={330} size={100} color="#fff" stroke={`9px ${COL.ink}`}>
            THE PULL TO FINISH
          </Slam>
          {/* stats labels */}
          {statsK > 0.02 && pie > 0.02 && (
            <div style={{ position: "absolute", left: 760, top: 520, transform: "translate(-50%,-50%)", opacity: statsK, textAlign: "center" }}>
              <div style={{ fontFamily: FONT.comic, fontSize: 150, color: DEEP, WebkitTextStroke: `7px #fff`, paintOrder: "stroke fill", lineHeight: 1 }}>{Math.round(pie * 100)}%</div>
              <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 48, color: COL.ink, whiteSpace: "nowrap" }}>RESUMED</div>
            </div>
          )}
          <Slam f={f} at={twoIn3} out={dotNeeds - 4} x={540} y={300} size={86} color="#fff" stroke={`8px ${COL.ink}`} rotate={-2}>
            ~2 IN 3 INTERRUPTED TASKS
          </Slam>
          {/* memory vs thumb */}
          {f >= dotNeeds && f < panelAt - 2 && (
            <div style={{ position: "absolute", left: 540, top: 420, transform: `translate(-50%,-50%) scale(${pop(f, dotNeeds)})`, display: "flex", gap: 28, fontFamily: FONT.title, fontWeight: 900, fontSize: 72, whiteSpace: "nowrap" }}>
              <span style={{ background: "#fff", color: "#9a95b0", border: `5px solid ${COL.ink}`, borderRadius: 14, padding: "0 22px", textDecoration: f >= W(8, 3) ? "line-through" : "none", textDecorationColor: RED, textDecorationThickness: 8 }}>MEMORY</span>
              {f >= thumb - 2 && (
                <span style={{ background: RED, color: "#fff", border: `5px solid ${COL.ink}`, borderRadius: 14, padding: "0 22px", transform: `scale(${pop(f, thumb - 2)})` }}>THUMB ✓</span>
              )}
            </div>
          )}
          {f >= ping && f < panelAt && (
            <div style={{ position: "absolute", left: 540, top: 330, transform: `translate(-50%,-50%) rotate(3deg) scale(${pop(f, ping)})`, fontFamily: FONT.comic, fontSize: 120, color: RED, WebkitTextStroke: `8px ${COL.ink}`, paintOrder: "stroke fill", whiteSpace: "nowrap" }}>
              PING!
            </div>
          )}
          {/* toggle */}
          {panelK > 0.02 && (
            <div style={{ position: "absolute", left: 430, top: 300, transform: "translate(-50%,-50%)", opacity: panelK, display: "flex", alignItems: "center", gap: 24, background: "#fff", border: `6px solid ${COL.ink}`, borderRadius: 24, padding: "10px 28px" }}>
              <span style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 66, color: COL.ink }}>BADGES</span>
              <div style={{ width: 150, height: 76, borderRadius: 40, background: toggled ? "#b8b4c8" : "#2fd39a", border: `5px solid ${COL.ink}`, position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    top: 4,
                    left: interpolate(f, [offAt, offAt + 6], [78, 4], clamp),
                    width: 58,
                    height: 58,
                    borderRadius: 30,
                    background: "#fff",
                    border: `4px solid ${COL.ink}`,
                  }}
                />
              </div>
              <span style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 54, color: toggled ? RED : "#1f9d55", width: 80 }}>{toggled ? "OFF" : "ON"}</span>
            </div>
          )}
          {panelK > 0.02 && (
            <div style={{ position: "absolute", left: 390, top: 990, transform: "translate(-50%,-50%)", opacity: panelK * (toggled ? 1 : 0), fontFamily: FONT.title, fontWeight: 900, fontSize: 44, color: "#1f9d55", whiteSpace: "nowrap" }}>
              ONLY PEOPLE KEEP A DOT
            </div>
          )}
          <Slam f={f} at={someone} out={loopAt - 2} x={430} y={1080} size={76} color={RED} stroke={`8px #fff`} rotate={-2}>
            SOMEONE NEEDS YOU
          </Slam>
          {/* sources */}
          {f >= twist && f < dotNeeds && (
            <div style={{ position: "absolute", left: 540, top: 1590, transform: "translate(-50%,-50%)", fontFamily: FONT.body, fontWeight: 700, fontSize: 25, color: "#5b4f8f", whiteSpace: "nowrap", opacity: 0.95 }}>
              {f < people ? "Ghibellini & Meier (2025) meta-analysis, 59 publications: no memory advantage" : "Same meta-analysis: 67% average resumption rate (21 publications)"}
            </div>
          )}
          <VoiceCaptions f={f} cues={VOICE_CUES} hi={["red", "tap", "decide", "stop", "alarms", "unfinished", "zeigarnik", "memory", "twist", "fails", "pull", "two", "three", "thumb", "ping", "loop", "badges", "person", "needs"]} />
        </>
      }
    />
  );
};
