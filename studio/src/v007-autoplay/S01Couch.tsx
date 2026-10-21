import React from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from "remotion";
import { Actor, P, SNAP, addPose, idle, walkCycle, type Key } from "../stickman/stick";
import { Burst, COL, FONT, Slam, countUp } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, K, VoiceCaptions, punch } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// V007 · Why the next episode starts by itself. Mechanism Reveal in a dark living room lit by a TV.
// YOU (orange) sits on the couch; a conveyor belt from the TV drops episode cases into their lap.
// Spark explains: autoplay flips the default (a flip card), the default effect receipt (42% vs 82%
// bars), the twist — the countdown is a nudge: a giant hand pokes out of the TV (wow) — then the fix:
// AUTOPLAY → OFF and a "stop after" sticky note. Ends on the countdown "5…" that opens the video (loop).

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
const pop = (f: number, at: number) => interpolate(f, [at, at + 5, at + 9], [0, 1.12, 1], clamp);

const YS = 1.5;
const YSIT = GROUND - 92.5 * YS + 60; // seated hip y
const YX = 470;
const SS = 1.85;
const SGY = GROUND - 92.5 * SS;
const YOU = COL.orange;
const TVX = 850;
const TVY = 880;
const TVW = 300;
const TVH = 200;
const BG0 = "#0b0f26";

// --- room ---------------------------------------------------------------------
const Room: React.FC<{ f: number; glow: number; dim: number }> = ({ f, glow, dim }) => (
  <AbsoluteFill>
    <svg width={1080} height={1920} style={{ position: "absolute" }}>
      <defs>
        <radialGradient id="tvglow" cx={TVX / 1080} cy={TVY / 1920} r="0.55">
          <stop offset="0%" stopColor="#6fd3ff" stopOpacity={0.55} />
          <stop offset="100%" stopColor="#6fd3ff" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={1080} height={1920} fill={BG0} />
      <rect width={1080} height={1920} fill="url(#tvglow)" opacity={(0.6 + 0.25 * Math.sin(f * 0.35) * Math.sin(f * 0.13)) * glow} />
      {/* window with moon */}
      <rect x={110} y={660} width={200} height={240} rx={8} fill="#141a3d" stroke="#2a3366" strokeWidth={6} />
      <line x1={210} y1={660} x2={210} y2={900} stroke="#2a3366" strokeWidth={5} />
      <line x1={110} y1={780} x2={310} y2={780} stroke="#2a3366" strokeWidth={5} />
      <circle cx={260} cy={710} r={22} fill="#f5f1d0" opacity={0.85} />
      {Array.from({ length: 8 }, (_, i) => (
        <circle key={i} cx={125 + random(`st${i}`) * 170} cy={675 + random(`sy${i}`) * 210} r={2} fill="#fff" opacity={0.4 + 0.4 * Math.sin(f * 0.1 + i)} />
      ))}
      {/* floor + rug */}
      <rect x={0} y={GROUND} width={1080} height={1920 - GROUND} fill="#0f1433" />
      <line x1={0} y1={GROUND} x2={1080} y2={GROUND} stroke="#2a3366" strokeWidth={4} />
      <ellipse cx={600} cy={GROUND + 40} rx={430} ry={34} fill="#3a2556" opacity={0.7} />
      <rect width={1080} height={1920} fill="#000" opacity={dim * 0.55} />
    </svg>
  </AbsoluteFill>
);

const Couch: React.FC = () => (
  <g>
    <rect x={250} y={1040} width={360} height={170} rx={30} fill="#4b3a7a" {...K} strokeWidth={6} />
    <rect x={240} y={1190} width={400} height={70} rx={18} fill="#5d4a94" {...K} strokeWidth={6} />
    <rect x={220} y={1110} width={60} height={150} rx={22} fill="#4b3a7a" {...K} strokeWidth={6} />
    <rect x={600} y={1110} width={60} height={150} rx={22} fill="#4b3a7a" {...K} strokeWidth={6} />
    <rect x={262} y={1258} width={20} height={32} fill={COL.ink} />
    <rect x={600} y={1258} width={20} height={32} fill={COL.ink} />
  </g>
);

// countdown ring (digits are illustrative)
const Ring: React.FC<{ x: number; y: number; r: number; prog: number; digit: string; o?: number }> = ({ x, y, r, prog, digit, o = 1 }) => (
  <g opacity={o}>
    <circle cx={x} cy={y} r={r} fill="rgba(0,0,0,0.55)" stroke="#ffffff33" strokeWidth={r * 0.14} />
    <circle
      cx={x}
      cy={y}
      r={r}
      fill="none"
      stroke="#fff"
      strokeWidth={r * 0.14}
      strokeDasharray={2 * Math.PI * r}
      strokeDashoffset={2 * Math.PI * r * prog}
      transform={`rotate(-90 ${x} ${y})`}
      strokeLinecap="round"
    />
    <text x={x} y={y + r * 0.36} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={r * 1.05} fill="#fff">
      {digit}
    </text>
  </g>
);

const TV: React.FC<{ f: number; ep: number; cd: { on: boolean; prog: number; digit: string }; autoplay: number; note: number }> = ({ f, ep, cd, autoplay, note }) => (
  <g>
    {/* stand */}
    <rect x={TVX - 140} y={1130} width={280} height={160} rx={10} fill="#2a2246" {...K} strokeWidth={5} />
    <line x1={TVX - 130} y1={1210} x2={TVX + 130} y2={1210} stroke={COL.ink} strokeWidth={4} />
    <rect x={TVX - 12} y={TVY + TVH / 2} width={24} height={1130 - TVY - TVH / 2} fill="#222" />
    {/* body */}
    <rect x={TVX - TVW / 2 - 16} y={TVY - TVH / 2 - 16} width={TVW + 32} height={TVH + 32} rx={14} fill="#161616" {...K} strokeWidth={6} />
    <clipPath id="tvscreen">
      <rect x={TVX - TVW / 2} y={TVY - TVH / 2} width={TVW} height={TVH} rx={6} />
    </clipPath>
    <g clipPath="url(#tvscreen)">
      <rect x={TVX - TVW / 2} y={TVY - TVH / 2} width={TVW} height={TVH} fill="#1d4f7a" />
      {/* generic show: drifting shapes */}
      {[0, 1, 2, 3].map((i) => (
        <circle key={i} cx={TVX - 120 + ((f * (1.2 + i * 0.4) + i * 90) % 300)} cy={TVY - 30 + i * 22} r={18 + i * 6} fill={["#ffd166", "#ef476f", "#06d6a0", "#8ecae6"][i]} opacity={0.55} />
      ))}
      <text x={TVX - TVW / 2 + 14} y={TVY - TVH / 2 + 36} fontFamily={FONT.title} fontWeight={900} fontSize={32} fill="#fff">
        EP {ep}
      </text>
      {cd.on && (
        <>
          <rect x={TVX - TVW / 2} y={TVY - TVH / 2} width={TVW} height={TVH} fill="#000" opacity={0.55} />
          <text x={TVX - 40} y={TVY - 30} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={26} fill="#fff" letterSpacing={2}>
            NEXT EPISODE
          </text>
          <Ring x={TVX + 90} y={TVY - 38} r={30} prog={cd.prog} digit={cd.digit} />
        </>
      )}
      {autoplay > 0 && (
        <g opacity={Math.min(1, autoplay * 3)}>
          <rect x={TVX - TVW / 2} y={TVY - TVH / 2} width={TVW} height={TVH} fill="#101425" />
          <text x={TVX - TVW / 2 + 24} y={TVY + 4} fontFamily={FONT.title} fontWeight={800} fontSize={36} fill="#fff" letterSpacing={1}>
            AUTOPLAY
          </text>
          <rect x={TVX + 40} y={TVY - 26} width={100} height={52} rx={26} fill={autoplay < 1 ? COL.green : "#555"} />
          <circle cx={autoplay < 1 ? TVX + 114 : TVX + 66} cy={TVY} r={21} fill="#fff" />
          <text x={TVX + 90} y={TVY + 62} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={28} fill={autoplay < 1 ? COL.green : "#bbb"}>
            {autoplay < 1 ? "ON" : "OFF"}
          </text>
        </g>
      )}
    </g>
    {note > 0 && (
      <g transform={`translate(${TVX + 120} ${TVY - 130}) rotate(8) scale(${note})`}>
        <rect x={-70} y={-50} width={140} height={110} fill="#ffe66d" {...K} strokeWidth={4} />
        <text y={-6} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={30} fill={COL.ink}>
          STOP
        </text>
        <text y={30} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={30} fill={COL.ink}>
          AFTER EP 2
        </text>
      </g>
    )}
  </g>
);

const EpCase: React.FC<{ n: number; s?: number }> = ({ n, s = 1 }) => (
  <g transform={`scale(${s})`}>
    <rect x={-50} y={-22} width={100} height={44} rx={6} fill="#e8e3ff" {...K} strokeWidth={4} />
    <rect x={-50} y={-22} width={18} height={44} rx={4} fill="#8e7cc3" />
    <text x={10} y={10} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={26} fill={COL.ink}>
      EP {n}
    </text>
  </g>
);

const Remote: React.FC = () => (
  <g transform="rotate(-30)">
    <rect x={-12} y={-46} width={24} height={70} rx={8} fill="#2b2b2b" {...K} strokeWidth={3} />
    <circle cy={-32} r={5} fill={COL.red} />
  </g>
);

// belt path from the TV to above YOU's lap
const BELT = { x0: TVX - 120, y0: TVY - TVH / 2 - 30, x1: YX + 90, y1: 980 };
const beltPt = (t: number) => {
  const cx = (BELT.x0 + BELT.x1) / 2;
  const cy = Math.min(BELT.y0, BELT.y1) - 160;
  const u = 1 - t;
  return [u * u * BELT.x0 + 2 * u * t * cx + t * t * BELT.x1, u * u * BELT.y0 + 2 * u * t * cy + t * t * BELT.y1] as const;
};

// --- sfx ------------------------------------------------------------------------
const drops = () => [W(0, 4), W(0, 7), W(0, 10)];
export const S01_SFX: SfxCue[] = [
  ...[0, 8, 16].map((t): SfxCue => [t, "tick", 0.3]),
  ...drops().map((t): SfxCue => [t + 14, "thud", 0.5]),
  [W(0, 10), "boing", 0.4],
  [W(1, 1), "buzz", 0.35],
  ...[0, 1, 2, 3, 4].map((i): SfxCue => [W(2, 3) + i * 7, "tick", 0.4]),
  [W(2, 7) + 6, "thud", 0.55],
  [W(3, 1), "whoosh", 0.45],
  [W(3, 3), "swirl", 0.55],
  [W(4, 2), "ding", 0.5],
  [W(5, 0), "buzz", 0.45],
  [C(6), "swish", 0.45],
  [W(7, 3), "riser", 0.35],
  [W(7, 4), "pop", 0.5],
  [W(8, 5), "impact", 0.7],
  [C(9), "whoosh_long", 0.45],
  [W(10, 2), "punch", 0.8],
  [W(10, 2) + 1, "boing", 0.45],
  [W(11, 2), "clink", 0.6],
  [W(12, 3), "stamp", 0.5],
  [W(13, 6), "tick", 0.45],
];

export const S01Couch: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const auto = C(3);
  const flip = W(3, 3);
  const keep = C(4);
  const stop = C(5);
  const proof = C(6);
  const b42 = W(7, 3);
  const b82 = W(8, 5);
  const twist = C(9);
  const nudge = W(10, 2);
  const fix = C(11);
  const off = W(11, 2);
  const last = W(12, 3);
  const end = C(13);

  // episode drops: 3 fast ones in the hook, one slow-mo in cue 2
  const D = [...drops(), W(2, 7)];
  const dropped = D.filter((t) => f >= t + 14).length;
  const ep = Math.min(4 + (f >= W(2, 7) + 14 ? 1 : 0), 1 + dropped);

  // countdown ring on the TV: before each drop (hook), slow one in cue 2, and the loop "five…"
  const cd = (() => {
    if (f < D[0]) return { on: true, prog: f / D[0], digit: String(Math.max(1, 5 - Math.floor((f / D[0]) * 5))) };
    if (f >= C(2) && f < D[3]) {
      const k = (f - C(2)) / (D[3] - C(2));
      return { on: true, prog: k, digit: String(Math.max(1, 5 - Math.floor(k * 5))) };
    }
    if (f >= end) return { on: true, prog: interpolate(f, [end, VOICE_FRAMES], [0, 0.1], clamp), digit: "5" };
    return { on: false, prog: 0, digit: "" };
  })();

  const dim = interpolate(f, [proof - 4, proof + 8, twist - 6, twist + 4], [0, 1, 1, 0], clamp);
  const setO = 1 - dim * 0.75;
  const autoplayUI = f >= fix && f < end ? (f >= off ? 1 : 0.5) : 0;
  const note = f >= last && f < end + 10 ? pop(f, last) : 0;
  const standUp = f >= W(12, 6) && f < end + 6;

  // clock on the wall
  const mins = Math.round(interpolate(f, [0, C(2), twist, end], [23 * 60 + 2, 25 * 60 + 14, 25 * 60 + 31, 25 * 60 + 42], clamp));
  const hh = Math.floor(mins / 60) % 24;
  const clock = `${hh % 12 === 0 ? 12 : hh % 12}:${String(mins % 60).padStart(2, "0")} ${hh >= 12 && hh < 24 ? "PM" : "AM"}`;

  // nudge hand
  const handK = interpolate(f, [nudge - 6, nudge, nudge + 14, fix - 2], [0, 1, 1, 0], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
  const handX = lerp(TVX - 150, YX + 80, handK);

  const youKeys: Key[] = [
    { f: 0, p: { ...P.sit, y: YSIT, la1: 40, la2: 70, ra1: 50, ra2: 60 } },
    ...D.flatMap((t): Key[] => [
      { f: t + 10, p: { ...P.sit, y: YSIT, la1: 40, la2: 70, ra1: 50, ra2: 60 } },
      { f: t + 15, p: { ...P.sit, y: YSIT + 6, la1: 40, la2: 70, ra1: 50, ra2: 60, head: 8 }, e: SNAP },
      { f: t + 22, p: { ...P.sit, y: YSIT, la1: 40, la2: 70, ra1: 50, ra2: 60 } },
    ]),
    { f: W(5, 0) - 2, p: { ...P.sit, y: YSIT, la1: 40, la2: 70, ra1: 50, ra2: 60 } },
    { f: W(5, 0) + 6, p: { ...P.sit, y: YSIT, la1: 40, la2: 70, ra1: 100, ra2: 0, lean: 14 }, e: SNAP }, // reaches for the remote
    { f: proof - 2, p: { ...P.sit, y: YSIT, la1: 40, la2: 70, ra1: 100, ra2: 0, lean: 14 } },
    { f: proof + 6, p: { ...P.sit, y: YSIT, la1: 40, la2: 70, ra1: 50, ra2: 60 } },
    { f: nudge, p: { ...P.sit, y: YSIT, la1: 40, la2: 70, ra1: 50, ra2: 60 } },
    { f: nudge + 5, p: { ...P.sit, y: YSIT, lean: -22, head: -14, la1: -60, la2: -40, ra1: 40, ra2: 40 }, e: SNAP }, // poked
    { f: nudge + 30, p: { ...P.sit, y: YSIT, la1: 40, la2: 70, ra1: 50, ra2: 60 } },
    { f: W(12, 6) - 2, p: { ...P.sit, y: YSIT, la1: 40, la2: 70, ra1: 50, ra2: 60 } },
    { f: W(12, 6) + 8, p: { ...P.cheer, y: YSIT - 60, ll1: -12, ll2: 4, rl1: 12, rl2: -4, lean: 0 }, e: SNAP }, // stands, stretches
    { f: end + 4, p: { ...P.cheer, y: YSIT - 60, ll1: -12, ll2: 4, rl1: 12, rl2: -4, lean: 0 } },
    { f: end + 18, p: { ...P.sit, y: YSIT, la1: 40, la2: 70, ra1: 50, ra2: 60 } }, // flops back down (loop)
  ];

  const sparkMood = (t: number): Mood =>
    t >= W(1, 1) && t < C(2) ? "shock" : t >= stop && t < proof ? "angry" : t >= b82 && t < twist ? "shock" : t >= twist && t < nudge ? "neutral" : t >= nudge && t < fix ? "smug" : "happy";
  const bulb = (t: number) => Math.max(bulbPulse(t, nudge, 45), bulbPulse(t, flip, 18) * 0.6);
  const sparkKeys: Key[] = [
    { f: 0, p: { ...P.pointR, ra1: 120 } },
    { f: W(0, 10) - 2, p: { ...P.pointR, ra1: 120 } },
    { f: W(0, 10) + 4, p: { ...P.shrug }, e: SNAP }, // "episode four?"
    { f: W(1, 1) - 2, p: { ...P.shrug } },
    { f: W(1, 1) + 4, p: { ...P.shock }, e: SNAP }, // "never"
    { f: C(2) + 4, p: { ...P.shock } },
    { f: C(2) + 12, p: { ...P.pointR, ra1: 105 } }, // at the countdown
    { f: auto - 2, p: { ...P.pointR, ra1: 105 } },
    { f: auto + 4, p: { ra1: 150, ra2: -10, la1: -18 }, e: SNAP }, // up at the flip card
    { f: flip - 2, p: { ra1: 150, ra2: -10 } },
    { f: flip + 4, p: { ra1: 130, ra2: 60, la1: -18 }, e: SNAP },
    { f: keep + 2, p: { ...P.pointR, ra1: 120 } },
    { f: stop - 2, p: { ...P.pointR, ra1: 120 } },
    { f: stop + 4, p: { ...P.pointR, ra1: 80 }, e: SNAP }, // at YOU
    { f: proof - 2, p: { ...P.pointR, ra1: 80 } },
    { f: proof + 6, p: { ...P.think } },
    { f: b42 - 2, p: { ...P.think } },
    { f: b42 + 4, p: { ...P.pointR, ra1: 110 }, e: SNAP },
    { f: b82 - 2, p: { ...P.pointR, ra1: 110 } },
    { f: b82 + 4, p: { ...P.shock }, e: SNAP },
    { f: twist - 2, p: { ...P.shock } },
    { f: twist + 6, p: { ...P.think } },
    { f: nudge - 2, p: { ...P.think } },
    { f: nudge + 3, p: { ra1: 150, ra2: -10, la1: -18 }, e: SNAP }, // finger up: "nudge"
    { f: fix - 2, p: { ra1: 150, ra2: -10 } },
    { f: fix + 6, p: { ra1: 95, ra2: -10, la1: -18 } }, // remote at the TV
    { f: last - 2, p: { ra1: 95, ra2: -10 } },
    { f: last + 4, p: { ...P.pointR, ra1: 120 }, e: SNAP },
    { f: end - 2, p: { ...P.pointR, ra1: 120 } },
    { f: end + 6, p: { ...P.shrug } },
  ];
  const sparkX = (t: number) => lerp(150, 170, ease(t, fix, fix + 10));

  const z = punch(f, [W(0, 10), W(1, 1), flip, W(4, 2), W(5, 0), b82, nudge, off, last], 0.035);

  return (
    <Stage
      bg={<Room f={f} glow={autoplayUI > 0 ? 0.6 : 1} dim={dim} />}
      hits={[W(0, 10), b82, nudge]}
      power={11}
      cam={{ z }}
      svg={
        <>
          <g opacity={setO}>
            {/* wall clock */}
            <rect x={380} y={690} width={200} height={70} rx={10} fill="#05070f" stroke="#2a3366" strokeWidth={5} />
            <text x={480} y={741} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={44} fill={COL.red} letterSpacing={2}>
              {clock}
            </text>
            <Couch />
            <TV f={f} ep={ep} cd={cd} autoplay={autoplayUI} note={note} />
            {/* conveyor belt */}
            {(() => {
              const pts = Array.from({ length: 21 }, (_, i) => beltPt(i / 20));
              const d = pts.map(([x, y], i) => `${i ? "L" : "M"} ${x} ${y}`).join(" ");
              const beltO = f < proof ? 1 : interpolate(f, [fix - 10, fix], [1, 0], clamp);
              return (
                <g opacity={beltO}>
                  <path d={d} stroke="#3c3c55" strokeWidth={30} fill="none" strokeLinecap="round" />
                  <path d={d} stroke="#8a8ab0" strokeWidth={8} fill="none" strokeDasharray="18 22" strokeDashoffset={-f * 4} strokeLinecap="round" />
                </g>
              );
            })()}
            {/* cases riding the belt and dropping */}
            {D.map((t, i) => {
              const t0 = t - (i === 3 ? 44 : 22);
              if (f < t0 || f >= t + 14) return null;
              const k = interpolate(f, [t0, t], [0, 1], clamp);
              const [bx, by] = beltPt(k);
              const fallK = interpolate(f, [t, t + 14], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
              const y = by - 30 + fallK * (1150 - 26 * i - by + 30);
              return (
                <g key={i} transform={`translate(${bx} ${y}) rotate(${k * 20 - 10})`}>
                  <EpCase n={i + 2} s={0.9} />
                </g>
              );
            })}
            {/* stack in the lap */}
            {D.map((t, i) =>
              f >= t + 14 && !(standUp || (f >= end && f < end + 18)) ? (
                <g key={i} transform={`translate(${YX + 95} ${1150 - 26 * i}) rotate(${(i % 2 ? 1 : -1) * 4})`}>
                  <EpCase n={i + 2} s={0.9} />
                </g>
              ) : null,
            )}
            {/* YOU */}
            <Actor
              f={f}
              color={YOU}
              scale={YS}
              label="YOU"
              face={f >= nudge && f < nudge + 30 ? "sad" : standUp ? "happy" : "eyes"}
              base={{ x: YX, y: YSIT }}
              keys={youKeys}
              mod={(t, p) => addPose(p, idle(t, 3))}
            />
            {f >= W(5, 0) && f < proof + 4 && (
              <g transform={`translate(800 ${GROUND - 12})`}>
                <Remote />
              </g>
            )}
            {/* the nudge hand */}
            {handK > 0.01 && (
              <g>
                <path d={`M ${TVX - 150} ${TVY + 20} L ${handX} ${1030}`} stroke="#f4c9a0" strokeWidth={46} strokeLinecap="round" />
                <path d={`M ${TVX - 150} ${TVY + 20} L ${handX} ${1030}`} stroke={COL.ink} strokeWidth={4} fill="none" opacity={0.0} />
                <g transform={`translate(${handX} 1030) rotate(-160)`}>
                  <circle r={42} fill="#f4c9a0" {...K} strokeWidth={5} />
                  <rect x={30} y={-12} width={70} height={24} rx={12} fill="#f4c9a0" {...K} strokeWidth={5} />
                </g>
              </g>
            )}
            {f >= nudge && f < nudge + 20 && <Burst x={YX + 60} y={1020} at={nudge} f={f} size={150} color={COL.yellow} />}
          </g>

          {/* proof: default effect bars */}
          {dim > 0.02 && (
            <g opacity={dim}>
              {[
                { x: 520, v: 42, at: b42, col: "#8a8ab0", lab: ["HAD TO", "OPT IN"] },
                { x: 800, v: 82, at: b82, col: COL.green, lab: ["YES WAS", "DEFAULT"] },
              ].map((b) => {
                const h = 520 * (countUp(f, b.at, b.at + 16, b.v) / 100);
                return (
                  <g key={b.x}>
                    <rect x={b.x - 90} y={1200 - h} width={180} height={h} rx={10} fill={b.col} {...K} strokeWidth={5} />
                    {f >= b.at && (
                      <text x={b.x} y={1200 - h - 24} textAnchor="middle" fontFamily={FONT.comic} fontSize={96} fill="#fff" stroke={COL.ink} strokeWidth={6} paintOrder="stroke">
                        {countUp(f, b.at, b.at + 16, b.v)}%
                      </text>
                    )}
                    {b.lab.map((l, i) => (
                      <text key={l} x={b.x} y={1246 + i * 40} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={38} fill="#fff" letterSpacing={2}>
                        {l}
                      </text>
                    ))}
                  </g>
                );
              })}
              <line x1={400} x2={920} y1={1200} y2={1200} stroke="#fff" strokeWidth={5} />
              {f >= b82 && <Burst x={800} y={760} at={b82} f={f} size={220} color={COL.green} />}
            </g>
          )}

          {/* SPARK */}
          <Spark
            f={f}
            scale={SS}
            base={{ x: 150, y: SGY }}
            talk={(t) => mouthAt(t)}
            bulb={bulb}
            mood={sparkMood}
            look={1}
            keys={sparkKeys}
            mod={(t, p) => {
              const q = { ...p, x: sparkX(t) };
              if (Math.abs(sparkX(t) - sparkX(t - 1)) > 1.2) return addPose(q, walkCycle(t, 0.3));
              return addPose(q, idle(t, 8));
            }}
          >
            {(j) =>
              f >= fix && f < last ? (
                <g transform={`translate(${j.rHand[0]} ${j.rHand[1]}) rotate(60)`}>
                  <Remote />
                </g>
              ) : null
            }
          </Spark>
          {f >= fix && f < last && f >= off - 6 && (
            <path
              d={`M 330 ${SGY - 150} Q 560 ${SGY - 330} ${TVX - 160} ${TVY}`}
              stroke="#ffe66d"
              strokeWidth={5}
              strokeDasharray="14 14"
              fill="none"
              opacity={interpolate(f, [off - 6, off, off + 14, off + 24], [0, 1, 1, 0], clamp)}
            />
          )}
        </>
      }
      html={
        <>
          {/* hook layer (frame 0) */}
          <div
            style={{
              position: "absolute",
              left: 540,
              top: 400,
              transform: "translate(-50%,-50%) rotate(-2deg)",
              opacity: interpolate(f, [C(2) - 6, C(2)], [1, 0], clamp),
              background: COL.red,
              color: "#fff",
              border: `6px solid ${COL.ink}`,
              boxShadow: `8px 8px 0 ${COL.ink}`,
              borderRadius: 16,
              padding: "12px 34px",
              fontFamily: FONT.comic,
              fontSize: 96,
              letterSpacing: 3,
              whiteSpace: "nowrap",
            }}
          >
            YOU NEVER PRESSED PLAY.
          </div>
          <Slam f={f} at={W(0, 10)} out={C(2) - 6} x={540} y={545} size={70} font={FONT.title} weight={900} color="#ffe66d" spacing={4}>
            PLANNED: 1 · WATCHED: 4
          </Slam>
          <Slam f={f} at={W(2, 5)} out={auto - 4} x={540} y={420} size={110} color="#fff" stroke={`8px ${COL.ink}`}>
            A TINY COUNTDOWN
          </Slam>

          {/* flip card: the default flips */}
          {f >= auto && f < proof && (
            <div
              style={{
                position: "absolute",
                left: 540,
                top: 430,
                width: 860,
                height: 250,
                transform: `translate(-50%,-50%) scale(${pop(f, auto)}) perspective(1200px) rotateX(${interpolate(f, [flip, flip + 12], [0, 180], { ...clamp, easing: Easing.inOut(Easing.cubic) })}deg)`,
                transformStyle: "preserve-3d",
                opacity: interpolate(f, [proof - 8, proof], [1, 0], clamp),
              }}
            >
              {[
                { rows: ["BEFORE AUTOPLAY", "KEEP WATCHING → YOU ACT", "STOP → AUTOMATIC"], bg: "#fff", back: false },
                { rows: ["WITH AUTOPLAY", "KEEP WATCHING → AUTOMATIC", "STOP → YOUR JOB"], bg: "#fff", back: true },
              ].map((side) => (
                <div
                  key={side.rows[0]}
                  style={{
                    position: "absolute",
                    inset: 0,
                    backfaceVisibility: "hidden",
                    transform: side.back ? "rotateX(180deg)" : undefined,
                    background: side.bg,
                    border: `6px solid ${COL.ink}`,
                    borderRadius: 20,
                    boxShadow: `8px 8px 0 ${COL.ink}`,
                    padding: "18px 34px",
                    fontFamily: FONT.title,
                    fontWeight: 900,
                    color: COL.ink,
                  }}
                >
                  <div style={{ fontSize: 40, letterSpacing: 6, color: COL.grey }}>{side.rows[0]}</div>
                  {side.rows.slice(1).map((r, i) => {
                    const lit = side.back && ((i === 0 && f >= keep) || (i === 1 && f >= stop));
                    return (
                      <div
                        key={r}
                        style={{
                          fontSize: 58,
                          marginTop: 8,
                          padding: "0 12px",
                          borderRadius: 10,
                          background: lit ? (i === 0 ? "#bff0c9" : "#ffc9c4") : "transparent",
                          transform: `scale(${lit ? pop(f, i === 0 ? keep : stop) : 1})`,
                          transformOrigin: "left center",
                        }}
                      >
                        {r}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          <Slam f={f} at={proof} out={twist - 6} x={540} y={400} size={110} color="#fff" stroke={`8px ${COL.ink}`}>
            THE DEFAULT EFFECT
          </Slam>
          {f >= b42 && f < twist && (
            <div
              style={{
                position: "absolute",
                left: 540,
                top: 520,
                transform: "translate(-50%,-50%)",
                opacity: interpolate(f, [b42, b42 + 8, twist - 6, twist], [0, 1, 1, 0], clamp),
                fontFamily: FONT.body,
                fontWeight: 700,
                fontSize: 30,
                color: "#c9cdf0",
                whiteSpace: "nowrap",
                textAlign: "center",
              }}
            >
              “Be an organ donor?” · same question, different default
              <br />
              Johnson &amp; Goldstein, online study (2003)
            </div>
          )}

          {/* twist */}
          <Slam f={f} at={W(9, 3)} out={nudge - 2} x={540} y={420} size={120} color="#fff" stroke={`8px ${COL.ink}`}>
            NOT A TIMER…
          </Slam>
          <Slam f={f} at={nudge} out={fix - 6} x={540} y={420} size={170} color={COL.yellow} stroke={`10px ${COL.ink}`} rotate={-4}>
            IT'S A NUDGE
          </Slam>

          {/* fix */}
          <Slam f={f} at={off} out={last - 4} x={540} y={420} size={110} color={COL.green} stroke={`8px #fff`}>
            AUTOPLAY: OFF
          </Slam>
          <Slam f={f} at={last} out={end - 4} x={540} y={420} size={86} color="#ffe66d" stroke={`8px ${COL.ink}`}>
            PICK YOUR LAST EPISODE
          </Slam>
          <Slam f={f} at={W(13, 6)} x={540} y={420} size={190} color="#fff" stroke={`10px ${COL.ink}`}>
            5…
          </Slam>

          <VoiceCaptions f={f} cues={VOICE_CUES} hi={["episode", "four", "never", "countdown", "autoplay", "default", "fortytwo", "eightytwo", "nudge", "off", "last"]} />
        </>
      }
    />
  );
};
