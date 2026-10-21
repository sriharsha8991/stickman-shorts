import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { Actor, P, SNAP, addPose, idle, runCycle } from "../stickman/stick";
import { Burst, COL, Dust, FONT, Slam, Type, countUp } from "../stickman/fx";
import { Bubble, Stage, Stamp } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { DayBg, GROUND, K, VoiceCaptions, punch } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// V001 v2 · POV: You asked AI to fix ONE bug. Your app is a Jenga tower of code blocks; the AI
// "helps" by stacking blocks and kicking out tests/ until it collapses, and the one bug rides the
// rubble to the top. Every beat is anchored to a spoken word (VOICE_CUES).

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// --- tower -------------------------------------------------------------------
const TX = 660; // tower centre
const BW = 290;
const BH = 76;
const yAt = (level: number) => GROUND - BH / 2 - level * BH;

type Block = { label: string; fill: string; color?: string; add?: () => number; dx: number; rubble: [number, number, number] };
const BLOCKS: Block[] = [
  { label: "db.sql", fill: "#d9c3a0", dx: 0, rubble: [590, 1252, 3] },
  { label: "tests/", fill: "#bfe3c4", dx: 0, rubble: [0, 0, 0] }, // kicked out, never lands
  { label: "api.js", fill: "#d9c3a0", dx: 0, rubble: [865, 1250, -6] },
  { label: "cart.js", fill: "#e8d3ad", dx: 0, rubble: [700, 1178, -12] },
  { label: "login()", fill: "#d9c3a0", dx: 0, rubble: [905, 1176, 16] },
  { label: "NEW FRAMEWORK", fill: "#ffd6d6", color: COL.red, add: () => W(3, 1), dx: -18, rubble: [520, 1190, 20] },
  { label: "RENAMED ALL", fill: "#ffd6d6", color: COL.red, add: () => W(3, 3), dx: 24, rubble: [790, 1112, 7] },
  { label: "+4,812 LINES", fill: "#ffd6d6", color: COL.red, add: () => W(3, 6) + 2, dx: -14, rubble: [640, 1050, -9] },
];
const BUG_BLOCK = 3;
const TESTS = 1;

const tDel = () => W(3, 4) + 6; // "Deleted" → kick lands
const tCol = () => W(4, 3); // "fails" → collapse
const tRw0 = () => W(8, 1); // "Single" → rewind starts
const tRw1 = () => VOICE_FRAMES - 16; // tower back in place → loop seam

const BlockShape: React.FC<{ b: Block; s?: number }> = ({ b, s = 1 }) => (
  <g transform={`scale(${s})`}>
    <rect x={-BW / 2} y={-BH / 2} width={BW} height={BH} rx={8} fill={b.fill} {...K} />
    <line x1={-BW / 2 + 14} y1={-BH / 2 + 12} x2={BW / 2 - 14} y2={-BH / 2 + 12} stroke="#fff" strokeWidth={4} opacity={0.5} />
    <text y={13} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={b.add ? 40 : 38} letterSpacing={1} fill={b.color ?? COL.ink}>
      {b.label}
    </text>
  </g>
);

// world transform of block i at frame f: x, y, rotation, scale, visible
const blockAt = (i: number, f: number) => {
  const b = BLOCKS[i];
  const add = b.add?.() ?? -999;
  if (f < add) return null;
  const added = BLOCKS.filter((x, k) => k < i && (x.add?.() ?? -999) <= f).length; // blocks below (incl. tests)
  const removed = i > TESTS && f >= tDel() ? 1 : 0;
  const lvlBefore = added;
  const lvl = added - removed;
  // stacked position
  let y: number;
  if (b.add && f < add + 10) y = lerp(-200, yAt(lvlBefore), ((f - add) / 10) ** 2);
  else if (removed && f < tDel() + 9) y = lerp(yAt(lvlBefore), yAt(lvl), ((f - tDel()) / 9) ** 2);
  else y = yAt(lvl);
  let x = TX + b.dx;
  let r = 0;
  // tests/ is kicked out sideways (Jenga)
  if (i === TESTS && f >= tDel()) {
    const t = (f - tDel()) / 16;
    x = TX + t * 900;
    y = yAt(1) - Math.sin(Math.min(t, 1) * Math.PI) * 160 + Math.max(0, t - 1) * 300;
    r = t * 70;
    if (f >= tRw0()) {
      // flies back in for the loop
      const k = interpolate(f, [tRw0(), tRw1()], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
      return { x: lerp(1500, TX, k), y: lerp(yAt(1) - 300, yAt(1), k), r: lerp(80, 0, k), s: 1 };
    }
    return { x, y, r, s: 1 };
  }
  // wobble grows with every block the AI adds
  const extra = BLOCKS.filter((x) => x.add && x.add() <= f).length;
  const amp = Math.min(extra, 3) * 1.6;
  const ang = Math.sin(f * 0.32) * amp * (f < tCol() ? 1 : 0);
  const rad = (ang * Math.PI) / 180;
  const px = x - TX;
  const py = y - GROUND;
  const wx = TX + px * Math.cos(rad) - py * Math.sin(rad);
  const wy = GROUND + px * Math.sin(rad) + py * Math.cos(rad);
  x = wx;
  y = wy;
  r = ang;
  // collapse into rubble
  const [rx, ry, rr] = b.rubble;
  if (f >= tCol()) {
    const delay = Math.max(0, 8 - lvl) * 0.8; // top falls first-ish
    const c = interpolate(f, [tCol() + delay * 0.5, tCol() + 14 + delay], [0, 1], clamp);
    x = lerp(x, rx, c);
    y = lerp(y, ry, c * c);
    r = lerp(r, rr, c);
  }
  let s = f >= tCol() ? interpolate(f, [tCol(), tCol() + 14], [1, 0.86], clamp) : 1;
  // rewind for the loop: base blocks go home, added blocks fly up and away
  if (f >= tRw0()) {
    const k = interpolate(f, [tRw0() + (b.add ? 0 : 3), tRw1()], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
    const home = b.add ? { x: x, y: -260 } : { x: TX, y: yAt(i) };
    x = lerp(x, home.x, k);
    y = lerp(y, home.y, k);
    r = lerp(r, 0, k);
    s = lerp(s, 1, k);
  }
  return { x, y, r, s };
};

// --- bug ---------------------------------------------------------------------
const Bug: React.FC<{ f: number; s?: number; seed?: number; wave?: number }> = ({ f, s = 1, seed = 0, wave = 0 }) => {
  const leg = Math.sin(f * 0.9 + seed) * 10;
  return (
    <g transform={`scale(${s})`}>
      {[-10, 0, 10].map((lx, i) => (
        <g key={i}>
          <line x1={lx} y1={0} x2={lx - 6 + (i % 2 ? leg : -leg) * 0.4} y2={16} stroke={COL.ink} strokeWidth={3.5} strokeLinecap="round" />
          <line x1={lx} y1={0} x2={lx + 6 + (i % 2 ? -leg : leg) * 0.4} y2={-16} stroke={COL.ink} strokeWidth={3.5} strokeLinecap="round" />
        </g>
      ))}
      <ellipse cx={0} cy={0} rx={22} ry={15} fill={COL.red} stroke={COL.ink} strokeWidth={4} />
      <line x1={-4} y1={-14} x2={-4} y2={14} stroke={COL.ink} strokeWidth={2.5} opacity={0.6} />
      <circle cx={24} cy={0} r={10} fill={COL.ink} />
      <circle cx={27} cy={-5} r={5} fill="#fff" />
      <circle cx={28 + Math.sin(f * 0.2 + seed) * 1.5} cy={-5} r={2.2} fill={COL.ink} />
      <path d={`M 30 -8 Q 40 ${-22 - wave * 10} 46 ${-20 - wave * 14}`} stroke={COL.ink} strokeWidth={3} fill="none" />
      <path d="M 27 -9 Q 32 -24 26 -30" stroke={COL.ink} strokeWidth={3} fill="none" />
    </g>
  );
};

const NEW_BUGS = Array.from({ length: 46 }, (_, i) => ({
  x: 410 + ((i * 137) % 580),
  y: 1000 + ((i * 71) % 290),
  d: (i * 0.29) % 1,
  r: ((i * 53) % 60) - 30,
}));

// caution tape
const Tape: React.FC<{ t: number }> = ({ t }) => {
  const w = 760 * t;
  return (
    <g transform="translate(700 1105) rotate(-6)">
      <clipPath id="tapeclip">
        <rect x={-380} y={-36} width={w} height={72} />
      </clipPath>
      <g clipPath="url(#tapeclip)">
        <rect x={-380} y={-36} width={760} height={72} fill={COL.yellow} stroke={COL.ink} strokeWidth={5} />
        {Array.from({ length: 22 }, (_, i) => (
          <path key={i} d={`M ${-400 + i * 40} 36 L ${-380 + i * 40} -36 L ${-362 + i * 40} -36 L ${-382 + i * 40} 36 Z`} fill={COL.ink} opacity={0.85} />
        ))}
        <rect x={-190} y={-26} width={380} height={52} rx={6} fill={COL.yellow} stroke={COL.ink} strokeWidth={4} />
        <text y={16} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={44} letterSpacing={4} fill={COL.ink}>
          DO NOT TOUCH
        </text>
      </g>
    </g>
  );
};

// the prompt the viewer typed (POV)
const Prompt: React.FC<{ f: number; at: number; out: number; text: string; good?: boolean }> = ({ f, at, out, text, good }) => {
  if (f < at || f > out + 8) return null;
  const s = interpolate(f - at, [0, 6, 10], [0.6, 1.05, 1], clamp);
  const o = interpolate(f, [at, at + 4, out, out + 8], [0, 1, 1, 0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: 100,
        width: 880,
        top: 330,
        transform: `scale(${s})`,
        opacity: o,
        background: "#fff",
        border: `6px solid ${good ? COL.green : COL.ink}`,
        borderRadius: 28,
        boxShadow: `10px 10px 0 ${COL.ink}`,
        padding: "22px 28px",
        fontFamily: FONT.body,
        fontWeight: 800,
        fontSize: 54,
        color: COL.ink,
        lineHeight: 1.2,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
        <span style={{ background: COL.orange, color: "#fff", border: `4px solid ${COL.ink}`, borderRadius: 12, padding: "2px 14px", fontSize: 34 }}>YOU</span>
        <span style={{ fontSize: 30, color: COL.grey, fontWeight: 700 }}>{good ? "better prompt" : "prompt"}</span>
      </div>
      <Type f={f} at={at + 4} text={text} cps={1.6} />
    </div>
  );
};

export const S01_SFX: SfxCue[] = [
  [0, "slam", 0.6],
  [W(0, 5), "pop", 0.7],
  [C(1), "scribble", 0.4],
  [W(1, 3), "whoosh", 0.4],
  [W(1, 5), "ding", 0.6],
  [C(2) - 4, "whoosh_long", 0.5],
  [C(2) + 16, "thud", 0.5],
  [W(2, 2), "pop", 0.6],
  ...BLOCKS.filter((b) => b.add).map((b): SfxCue => [b.add!() + 9, "thud", 0.8]),
  [tDel() - 4, "swish", 0.6],
  [tDel(), "punch", 0.8],
  [tCol(), "crash", 0.9],
  [tCol() + 10, "impact", 0.6],
  ...Array.from({ length: 8 }, (_, i): SfxCue => [tCol() + 6 + i * 4, "tick", 0.35]),
  [W(4, 6), "stamp", 0.8],
  [W(4, 6) + 6, "buzz", 0.4],
  [W(5, 2), "boing", 0.5],
  [W(6, 0), "slam", 0.6],
  [W(6, 1), "slam", 0.7],
  [W(7, 0), "swish", 0.5],
  [W(7, 5), "ding", 0.7],
  [W(8, 0), "punch", 0.5],
  [W(8, 1), "punch", 0.55],
  [W(8, 1) + 2, "whoosh_long", 0.5],
  [W(8, 2), "punch", 0.6],
  [tRw1(), "pop", 0.5],
];

export const S01Tower: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const aiIn = C(2) - 6;
  const aiOut = W(8, 0);
  const aha = W(7, 5); // "not"

  // camera: punch-ins on beats + a zoom on the bug on "Tiny"
  const zoom = interpolate(f, [W(1, 3), W(1, 3) + 8, C(2) - 8, C(2)], [0, 1, 1, 0], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const bugBlock = blockAt(BUG_BLOCK, f)!;
  const ruleBugLocal: [number, number] = [96, -2];
  const rad = (bugBlock.r * Math.PI) / 180;
  const bx0 = bugBlock.x + (ruleBugLocal[0] * Math.cos(rad) - ruleBugLocal[1] * Math.sin(rad)) * bugBlock.s;
  const by0 = bugBlock.y + (ruleBugLocal[0] * Math.sin(rad) + ruleBugLocal[1] * Math.cos(rad)) * bugBlock.s;
  // the original bug climbs to the top of the pile, then rides home on the rewind
  const climb = interpolate(f, [W(5, 2), W(6, 0)], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) }) * interpolate(f, [tRw0(), tRw1()], [1, 0], clamp);
  const hop = climb > 0 && climb < 1 ? Math.abs(Math.sin(climb * Math.PI * 4)) * 26 : 0;
  const bugX = lerp(bx0, 690, climb);
  const bugY = lerp(by0, 975, climb) - hop;
  const bugS = 1.25 + climb * 0.9;

  const z = punch(f, [0, W(0, 5), C(2) + 16, ...BLOCKS.filter((b) => b.add).map((b) => b.add!() + 9), tDel(), tCol(), W(4, 6), W(6, 0), W(6, 1), aha, W(8, 0), W(8, 1), W(8, 2)], 0.045);
  const cam = { z: z * (1 + zoom * 0.16), x: zoom * (bx0 - 540) * 0.35, y: zoom * (by0 - 900) * 0.5 };

  const spark: Mood = "happy";
  const mood = (t: number): Mood =>
    t >= C(3) && t < C(5) ? "shock" : t >= C(5) && t < C(6) ? "neutral" : t >= C(6) && t < C(7) ? "sad" : t >= C(8) && t < tRw1() ? "smug" : spark;
  const bulb = (t: number) => bulbPulse(t, aha, 40);

  const nBugs = f >= tCol() ? countUp(f, tCol() + 4, W(4, 6), 47, 1) : 1;
  const tape = interpolate(f, [W(7, 0), W(7, 0) + 14], [0, 1], clamp) * interpolate(f, [tRw0(), tRw0() + 8], [1, 0], clamp);

  return (
    <Stage
      bg={<DayBg tint="#f4f6f9" />}
      hits={[tDel(), tCol(), W(4, 6), W(6, 1)]}
      power={14}
      cam={cam}
      svg={
        <>
          {/* the AI, drawn behind the rubble */}
          {f >= aiIn && (
            <Actor
              f={f}
              color={COL.blue}
              scale={1.5}
              label="AI"
              face="happy"
              base={{ x: 1300, y: GROUND - 92.5 * 1.5 }}
              facing={(t) => (t >= aiOut ? 1 : -1)}
              keys={[
                { f: aiIn, p: {} },
                { f: aiIn + 22, p: { lean: -18, la1: -60, ra1: 60 } }, // skid
                { f: W(2, 2) - 2, p: { lean: 0 } },
                { f: W(2, 2) + 3, p: { ra1: 150, ra2: 30, la1: -20 }, e: SNAP }, // "sure!"
                { f: C(3) - 2, p: { ra1: 150, ra2: 30 } },
                { f: W(3, 1), p: { ...P.armsUp }, e: SNAP },
                { f: W(3, 1) + 10, p: { ...P.carry } },
                { f: W(3, 3), p: { ...P.armsUp }, e: SNAP },
                { f: W(3, 3) + 10, p: { ...P.carry } },
                { f: tDel() - 6, p: { ...P.carry } },
                { f: tDel(), p: { ...P.kickR }, e: SNAP }, // kicks tests/ out
                { f: tDel() + 10, p: { ...P.kickR } },
                { f: W(3, 6), p: { ...P.armsUp }, e: SNAP },
                { f: tCol() - 2, p: { ...P.armsUp } },
                { f: tCol() + 6, p: { ...P.cheer }, e: SNAP },
                { f: aiOut - 2, p: { ...P.cheer } },
                { f: aiOut + 2, p: {} },
              ]}
              mod={(t, p) => {
                // run in from the right, stand at x 950; on the rewind, zip off to the right
                const xIn = interpolate(t, [aiIn, aiIn + 22], [1300, 955], { ...clamp, easing: Easing.out(Easing.quad) });
                const xOut = interpolate(t, [aiOut, aiOut + 22], [0, 520], { ...clamp, easing: Easing.in(Easing.quad) });
                const q = { ...p, x: xIn + xOut };
                if (t < aiIn + 18 || t >= aiOut) return addPose(q, runCycle(t));
                const bounce = t >= tCol() + 6 && t < aiOut ? -Math.abs(Math.sin(t * 0.35)) * 24 : 0;
                return addPose({ ...q, y: q.y + bounce }, idle(t, 5));
              }}
            />
          )}

          {/* tower / rubble */}
          {BLOCKS.map((b, i) => {
            const p = blockAt(i, f);
            if (!p) return null;
            return (
              <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${p.r})`}>
                <BlockShape b={b} s={p.s} />
              </g>
            );
          })}
          {f >= tCol() && <Dust x={700} y={GROUND} at={tCol() + 10} f={f} spread={420} />}
          {f >= tCol() && <Burst x={700} y={1020} at={tCol() + 2} f={f} size={300} color={COL.yellow} />}

          {/* 46 new bugs swarm the rubble */}
          {f >= tCol() &&
            NEW_BUGS.map((b, i) => {
              const at = tCol() + 4 + b.d * (W(4, 6) - tCol() - 4);
              const sIn = interpolate(f, [at, at + 6, at + 9], [0, 1.15, 1], clamp);
              const sOut = interpolate(f, [tRw0() + (i % 10), tRw0() + 8 + (i % 10)], [1, 0], clamp);
              const s = sIn * sOut;
              if (s <= 0.01) return null;
              const wander = Math.sin(f * 0.07 + i) * 18;
              return (
                <g key={i} transform={`translate(${b.x + wander} ${b.y + Math.cos(f * 0.05 + i) * 6}) rotate(${b.r + Math.sin(f * 0.1 + i) * 15})`}>
                  <Bug f={f} s={0.85 * s} seed={i} />
                </g>
              );
            })}

          {f >= W(7, 0) && tape > 0 && <Tape t={tape} />}

          {/* THE bug, with a highlight ring when it matters */}
          {(() => {
            const ring = Math.max(
              interpolate(f, [W(0, 5), W(0, 5) + 5, C(1) + 20, C(1) + 28], [0, 1, 1, 0], clamp),
              interpolate(f, [W(1, 5), W(1, 5) + 5, C(2) - 6, C(2)], [0, 1, 1, 0], clamp),
              interpolate(f, [W(6, 0), W(6, 0) + 5, C(7) - 6, C(7)], [0, 1, 1, 0], clamp),
            );
            const pulse = 1 + Math.sin(f * 0.4) * 0.08;
            const wave = f >= W(6, 1) && f < C(7) ? Math.abs(Math.sin(f * 0.5)) : 0;
            return (
              <g transform={`translate(${bugX} ${bugY})`}>
                {ring > 0 && <circle r={60 * bugS * pulse} fill="none" stroke={COL.yellow} strokeWidth={10} opacity={ring} />}
                {ring > 0 && <circle r={60 * bugS * pulse} fill="none" stroke={COL.ink} strokeWidth={3} opacity={ring * 0.6} />}
                <g transform={`scale(${f >= W(5, 2) && f < tRw0() ? -1 : 1} 1)`}>
                  <Bug f={f} s={bugS} seed={99} wave={wave} />
                </g>
              </g>
            );
          })()}

          {/* AI speech */}
          {f >= W(2, 0) && f < C(3) + 4 && (
            <Bubble x={770} y={800} w={480} h={130} t={interpolate(f, [W(2, 0), W(2, 0) + 6, C(3), C(3) + 4], [0, 1, 1, 0], clamp)} tailX={930} tailY={980}>
              <text y={-6} textAnchor="middle" fontFamily={FONT.comic} fontSize={50} fill={COL.blue}>SURE! AND WHILE</text>
              <text y={44} textAnchor="middle" fontFamily={FONT.comic} fontSize={50} fill={COL.blue}>I'M HERE...</text>
            </Bubble>
          )}
          {f >= tCol() + 8 && f < C(5) + 6 && (
            <Bubble x={820} y={790} w={330} h={100} t={interpolate(f, [tCol() + 8, tCol() + 14, C(5), C(5) + 6], [0, 1, 1, 0], clamp)} tailX={950} tailY={950}>
              <text y={18} textAnchor="middle" fontFamily={FONT.comic} fontSize={56} fill={COL.blue}>FIXED IT!</text>
            </Bubble>
          )}

          {/* SPARK, the host */}
          <Spark
            f={f}
            scale={1.85}
            base={{ x: 215, y: GROUND - 92.5 * 1.85 }}
            talk={(t) => mouthAt(t)}
            bulb={bulb}
            mood={mood}
            look={f >= C(2) && f < C(3) ? 1 : f >= C(5) && f < W(5, 3) ? Math.sin(f * 0.2) : 1}
            keys={[
              { f: 0, p: { ...P.pointR, ra1: 80 } },
              { f: C(1) - 3, p: { ...P.pointR, ra1: 80 } },
              { f: C(1) + 3, p: { ra1: 60, ra2: -70, la1: -18 }, e: SNAP }, // "just this one" pinch
              { f: W(1, 4) - 3, p: { ra1: 60, ra2: -70 } },
              { f: W(1, 4) + 3, p: { ...P.pointR, ra1: 85 }, e: SNAP }, // "right here"
              { f: W(2, 4) - 3, p: { ...P.pointR, ra1: 85 } },
              { f: W(2, 4) + 3, p: { ...P.shrug }, e: SNAP }, // "while I'm here"
              { f: C(3) - 2, p: { ...P.shrug } },
              { f: C(3) + 4, p: { ...P.shock }, e: SNAP },
              { f: tCol() - 2, p: { ...P.shock } },
              { f: tCol() + 4, p: { ...P.armsUp, lean: -10 }, e: SNAP },
              { f: C(5) - 3, p: { ...P.armsUp, lean: -10 } },
              { f: C(5) + 4, p: { ...P.think } },
              { f: W(6, 0) - 3, p: { ...P.think } },
              { f: W(6, 0) + 3, p: { ...P.facepalm }, e: SNAP },
              { f: C(7) - 3, p: { ...P.facepalm } },
              { f: C(7) + 3, p: { ra1: 165, ra2: 5, la1: -18 }, e: SNAP }, // finger up: "next time"
              { f: aha + 6, p: { ra1: 165, ra2: 5 } },
              { f: aha + 12, p: { ...P.pointR, ra1: 70 }, e: SNAP }, // points at the tape
              { f: C(8) - 3, p: { ...P.pointR, ra1: 70 } },
              { f: C(8) + 3, p: { ...P.shrug }, e: SNAP },
              { f: tRw1() - 8, p: { ...P.shrug } },
              { f: tRw1(), p: { ...P.pointR, ra1: 80 } }, // loop: same pose as frame 0
            ]}
            mod={(t, p) => addPose(p, idle(t, 9))}
          />
        </>
      }
      html={
        <>
          {/* hook overlay: works muted */}
          <Slam f={f} at={0} out={C(1) - 6} x={540} y={300} size={130} color={COL.ink}>
            POV:
          </Slam>
          <Slam f={f} at={W(0, 1)} out={C(1) - 6} x={540} y={430} size={92} font={FONT.title} weight={900} spacing={2} color={COL.ink}>
            YOU ASKED AI TO FIX
          </Slam>
          <Slam f={f} at={W(0, 5)} out={C(1) - 6} x={540} y={560} size={150} color={COL.red} stroke={`9px ${COL.ink}`} rotate={-3}>
            ONE BUG
          </Slam>
          <Prompt f={f} at={C(1)} out={C(2) - 4} text="fix this ONE bug pls" />

          {/* the damage */}
          {f >= tCol() && f < C(5) + 8 && (
            <div
              style={{
                position: "absolute",
                left: 540,
                top: 300,
                transform: `translate(-50%,-50%) scale(${interpolate(f - tCol(), [0, 5, 9], [2, 0.95, 1], clamp)})`,
                opacity: interpolate(f, [C(5), C(5) + 8], [1, 0], clamp),
                fontFamily: FONT.comic,
                fontSize: 120,
                color: COL.red,
                WebkitTextStroke: `8px ${COL.ink}`,
                paintOrder: "stroke fill",
                whiteSpace: "nowrap",
              }}
            >
              BUGS: {nBugs}
            </div>
          )}
          {f < C(5) + 8 && <Stamp f={f} at={W(4, 6)} x={540} y={470} text="BUILD FAILED" size={96} />}

          <Slam f={f} at={W(6, 0)} out={C(7) - 6} x={360} y={420} size={150} color={COL.ink} rotate={-4}>
            STILL.
          </Slam>
          <Slam f={f} at={W(6, 1)} out={C(7) - 6} x={720} y={560} size={150} color={COL.red} stroke={`9px ${COL.ink}`} rotate={3}>
            THERE.
          </Slam>

          <Prompt f={f} at={C(7)} out={C(8) - 4} text="fix ONLY this bug. touch nothing else." good />

          <Slam f={f} at={W(8, 0)} out={tRw1() - 4} x={540} y={300} size={120} color={COL.ink}>
            EVERY.
          </Slam>
          <Slam f={f} at={W(8, 1)} out={tRw1() - 4} x={540} y={430} size={120} color={COL.ink}>
            SINGLE.
          </Slam>
          <Slam f={f} at={W(8, 2)} out={tRw1() - 4} x={540} y={560} size={140} color={COL.red} stroke={`9px ${COL.ink}`}>
            TIME.
          </Slam>

          <VoiceCaptions f={f} cues={VOICE_CUES} hi={["one", "bug", "fortyseven", "still", "there", "not"]} />
        </>
      }
    />
  );
};
