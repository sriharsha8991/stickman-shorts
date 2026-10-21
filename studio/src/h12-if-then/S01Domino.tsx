import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Actor, P, SNAP, addPose, idle, walkCycle, type Joints, type Key } from "../stickman/stick";
import { Burst, COL, FONT, Slam } from "../stickman/fx";
import { Stage, Stamp } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, K, VoiceCaptions, punch } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { VOICE_CUES, mouthAt } from "./voice";

// H12 · The if-then trick. Mechanism Reveal on a navy blueprint at dawn (Premium, smooth motion).
// 7:00 AM: YOU plays tug-of-war with SLEEPY YOU over a vague plan ("I'll exercise more"); every day is a fresh
// decision and snooze wins. The fix: two dominoes, IF (7 AM + coffee made) and THEN (walk 10 min). The alarm
// tips a trigger domino → IF → THEN, and YOU walks off without deciding (wow). Willpower isn't added, a decision
// is removed (aha). Proof: 94 tiny dominoes fall in a wave (94 tests, d = .65), then 91% vs about 1 in 3 bars.
// Caveat card: short-term, self-reported, a nudge not magic. Ends on blank IF ___ THEN ___ (loops to frame 1).

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pop = (f: number, at: number) => interpolate(f, [at, at + 5, at + 9], [0, 1.12, 1], clamp);

const SS = 1.85;
const SGY = GROUND - 92.5 * SS;
const YS = 1.5;
const YGY = GROUND - 92.5 * YS;
const NAVY = "#10264a";
const LINE = "#6fb3ff";
const WARM = "#ff9f43";
const CREAM = "#fff4e0";
const GOOD = "#2fd39a";

// --- background: blueprint at dawn -------------------------------------------------------
const Blueprint: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill>
    <svg width={1080} height={1920} style={{ position: "absolute" }}>
      <defs>
        <linearGradient id="h12bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0b1b38" />
          <stop offset="70%" stopColor={NAVY} />
          <stop offset="100%" stopColor="#1d3a6b" />
        </linearGradient>
        <radialGradient id="h12sun" cx="0.85" cy="0.08" r="0.6">
          <stop offset="0%" stopColor="#ffb86b" stopOpacity={0.35} />
          <stop offset="100%" stopColor="#ffb86b" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={1080} height={1920} fill="url(#h12bg)" />
      <rect width={1080} height={1920} fill="url(#h12sun)" opacity={0.7 + 0.3 * Math.sin(f * 0.02)} />
      {Array.from({ length: 19 }, (_, i) => (
        <line key={`v${i}`} x1={i * 60} y1={0} x2={i * 60} y2={GROUND} stroke={LINE} strokeWidth={i % 5 === 0 ? 2 : 1} opacity={0.18} />
      ))}
      {Array.from({ length: 22 }, (_, i) => (
        <line key={`h${i}`} x1={0} y1={i * 60} x2={1080} y2={i * 60} stroke={LINE} strokeWidth={i % 5 === 0 ? 2 : 1} opacity={0.18} />
      ))}
      {/* dimension marks */}
      <path d="M 60 1240 L 60 1280 M 60 1260 L 200 1260 M 200 1240 L 200 1280" stroke={LINE} strokeWidth={2} opacity={0.35} />
      <rect x={0} y={GROUND} width={1080} height={1920 - GROUND} fill="#0a1830" />
      <line x1={0} y1={GROUND} x2={1080} y2={GROUND} stroke={LINE} strokeWidth={4} opacity={0.9} />
    </svg>
  </AbsoluteFill>
);

// --- a domino that falls to the right around its bottom-right corner --------------------------
const Domino: React.FC<{ x: number; w: number; h: number; ang: number; label: string; fill?: string; size?: number; o?: number }> = ({ x, w, h, ang, label, fill = CREAM, size = 64, o = 1 }) => (
  <g opacity={o} transform={`translate(${x + w / 2} ${GROUND}) rotate(${ang}) translate(${-w / 2 - w} ${-h})`}>
    <rect x={0} y={0} width={w} height={h} rx={14} fill={fill} {...K} />
    <line x1={14} y1={h / 2} x2={w - 14} y2={h / 2} stroke={COL.ink} strokeWidth={5} />
    <circle cx={w / 2} cy={h * 0.75} r={9} fill={COL.ink} />
    <text x={w / 2} y={h * 0.25 + size * 0.36} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={size} fill={COL.ink}>
      {label}
    </text>
  </g>
);

// --- alarm clock (title zone) ---------------------------------------------------------------------
const Clock: React.FC<{ f: number; ring: number; o: number }> = ({ f, ring, o }) => {
  const sh = ring > 0 ? Math.sin(f * 2.2) * 6 * ring : 0;
  return (
    <g opacity={o} transform={`translate(${540 + sh} 330) rotate(${sh * 0.6})`}>
      <circle cx={-150} cy={-62} r={34} fill={WARM} {...K} strokeWidth={5} />
      <circle cx={150} cy={-62} r={34} fill={WARM} {...K} strokeWidth={5} />
      <rect x={-210} y={-70} width={420} height={150} rx={40} fill="#16213b" {...K} />
      <text y={42} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={112} fill="#ff5c5c">
        7:00 AM
      </text>
      {ring > 0 &&
        [-1, 1].map((d) => (
          <path key={d} d={`M ${d * 236} -40 q ${d * 20} 20 0 40 M ${d * 260} -56 q ${d * 30} 36 0 72`} stroke="#fff" strokeWidth={5} fill="none" opacity={ring} strokeLinecap="round" />
        ))}
    </g>
  );
};

const Mug: React.FC<{ f: number }> = ({ f }) => (
  <g>
    {[0, 1].map((i) => (
      <path key={i} d={`M ${-14 + i * 22} -66 q 10 -16 0 -32 q -10 -16 0 -32`} stroke="#fff" strokeWidth={4} fill="none" opacity={0.5 + 0.3 * Math.sin(f * 0.15 + i)} />
    ))}
    <rect x={-40} y={-56} width={80} height={56} rx={10} fill="#fff" {...K} strokeWidth={5} />
    <path d="M 40 -44 q 26 0 26 16 q 0 16 -26 16" fill="none" stroke={COL.ink} strokeWidth={5} />
    <rect x={-32} y={-48} width={64} height={12} fill="#6b3f1f" />
  </g>
);

// --- sfx --------------------------------------------------------------------------------------
export const S01_SFX: SfxCue[] = [
  ...[0, 8, 16, 24].map((t): SfxCue => [t, "tick", 0.35]),
  [W(0, 5), "punch", 0.4],
  [W(1, 1), "page", 0.5],
  [W(2, 5), "boing", 0.35],
  [W(2, 6), "whoosh", 0.45],
  [W(2, 7), "crash", 0.45],
  [C(3), "whoosh_long", 0.45],
  [W(3, 3), "thud", 0.5],
  [W(4, 6), "clink", 0.45],
  [W(5, 2), "pop", 0.4],
  [W(6, 4) - 6, "tick", 0.5],
  [W(6, 4), "thud", 0.6],
  [W(6, 4) + 8, "thud", 0.6],
  [W(6, 4) + 16, "impact", 0.6],
  [W(7, 3), "buzz", 0.4],
  [W(8, 1), "pop", 0.5],
  [W(8, 1) + 2, "ding", 0.45],
  ...Array.from({ length: 10 }, (_, i): SfxCue => [W(9, 1) + i * 4, "tick", 0.25]),
  [W(9, 5), "stinger", 0.4],
  [C(10), "riser", 0.35],
  [W(10, 3), "impact", 0.7],
  [W(11, 4), "thud", 0.45],
  [W(12, 2), "stamp", 0.55],
  [W(12, 5), "swish", 0.4],
  [W(13, 3), "scribble", 0.4],
  [W(13, 5), "scribble", 0.4],
];

export const S01Domino: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const fight = W(0, 5);
  const plan = W(1, 1);
  const decide = W(2, 5);
  const snooze = W(2, 6);
  const fix = C(3);
  const ifAt = C(4);
  const coffee = W(4, 6);
  const thenAt = C(5);
  const pulls = W(6, 4);
  const willpower = W(7, 3);
  const removing = W(8, 1);
  const tests = C(9);
  const boost = W(9, 5);
  const study = C(10);
  const ninety = W(10, 3);
  const caveat = C(12);
  const nudge = W(12, 3);
  const write = C(13);

  // phases
  const fightK = interpolate(f, [fix - 6, fix + 4], [1, 0], clamp);
  const domK = interpolate(f, [fix, fix + 10, tests - 6, tests + 2], [0, 1, 1, 0], clamp);
  const waveK = interpolate(f, [tests - 2, tests + 6, study - 6, study + 2], [0, 1, 1, 0], clamp);
  const barsK = interpolate(f, [study - 2, study + 8, write - 6, write + 2], [0, 1, 1, 0], clamp);
  const endK = interpolate(f, [write - 2, write + 8], [0, 1], clamp);
  const ring = Math.max(interpolate(f, [0, 2, 26, 32], [0, 1, 1, 0], clamp), interpolate(f, [pulls - 10, pulls - 6, pulls + 14, pulls + 20], [0, 1, 1, 0], clamp));
  const clockO = Math.max(interpolate(f, [plan - 6, plan + 2], [1, 0], clamp), interpolate(f, [fix + 4, fix + 12, willpower - 8, willpower], [0, 1, 1, 0], clamp));

  // dominoes fall: trigger → IF → THEN
  const fall = (at: number, to: number) => interpolate(f, [at, at + 8], [0, to], { ...clamp, easing: Easing.in(Easing.quad) });
  const angT = fall(pulls, 32);
  const angIf = fall(pulls + 6, 30);
  const angThen = fall(pulls + 13, 84);

  // YOU: tug-of-war, falls on snooze; stands by the dominoes; walks off when THEN falls; returns at the end
  const walkOff = pulls + 18;
  const youX = (t: number) =>
    t < fix ? interpolate(t, [snooze, snooze + 6], [470, 560], clamp) : t < write ? interpolate(t, [walkOff, walkOff + 40], [940, 1250], clamp) : interpolate(t, [write, write + 30], [1250, 820], clamp);
  const youWalking = (t: number) => (t >= walkOff && t < walkOff + 40) || (t >= write && t < write + 30);
  const youKeys: Key[] = [
    { f: 0, p: { lean: -14, ra1: 80, ra2: 10, la1: 70, la2: 20, ll1: -20, rl1: 25 } },
    { f: snooze - 2, p: { lean: -14, ra1: 80, ra2: 10, la1: 70, la2: 20, ll1: -20, rl1: 25 } },
    { f: snooze + 4, p: { rot: 70, lean: 0, y: YGY + 70, ra1: 120, la1: 120 }, e: SNAP },
    { f: fix - 2, p: { rot: 70, lean: 0, y: YGY + 70, ra1: 120, la1: 120 } },
    { f: fix + 6, p: { rot: 0, y: YGY, ra1: 0, la1: 0, ll1: 0, rl1: 0 } },
    { f: pulls + 12, p: { rot: 0, y: YGY, ra1: 0, la1: 0 } },
    { f: walkOff, p: { ...P.cheer, ra1: 40, la1: -40 } },
    { f: write + 30, p: { ra1: 0, la1: 0, ra2: 0, la2: 0, head: 0 } },
    { f: write + 34, p: { ...P.think } },
  ];
  // SLEEPY YOU (tug-of-war opponent, only in the first act)
  const sleepyKeys: Key[] = [
    { f: 0, p: { lean: -10, ra1: 80, ra2: 10, la1: 70, la2: 20 } },
    { f: snooze - 2, p: { lean: -10, ra1: 80, ra2: 10, la1: 70, la2: 20 } },
    { f: snooze + 4, p: { lean: -28, ra1: 70, ra2: 20, la1: 60, la2: 30 }, e: SNAP },
    { f: snooze + 18, p: { ...P.cheer } },
  ];
  const knotX = interpolate(f, [snooze - 2, snooze + 6], [690, 760], clamp) + (f < snooze ? Math.sin(f * 0.22) * 14 : 0);
  const rope = (j: Joints) =>
    f < fix ? (
      <line x1={j.rHand[0]} y1={j.rHand[1]} x2={knotX} y2={1060} stroke="#d9b38c" strokeWidth={9} strokeLinecap="round" opacity={fightK} />
    ) : null;

  const sparkMood = (t: number): Mood =>
    t >= snooze && t < fix ? "sad" : t >= pulls + 14 && t < willpower ? "shock" : t >= removing && t < tests ? "happy" : t >= ninety && t < caveat ? "shock" : t >= caveat && t < write ? "smug" : "neutral";
  const bulb = (t: number) => Math.max(bulbPulse(t, removing, 44), bulbPulse(t, fix, 16) * 0.5);
  const sparkKeys: Key[] = [
    { f: 0, p: { ...P.pointR, ra1: 120 } },
    { f: plan - 2, p: { ...P.pointR, ra1: 120 } },
    { f: plan + 4, p: { ...P.pointR, ra1: 150 } },
    { f: snooze - 2, p: { ...P.pointR, ra1: 150 } },
    { f: snooze + 4, p: { ...P.facepalm }, e: SNAP },
    { f: fix - 2, p: { ...P.facepalm } },
    { f: fix + 6, p: { ra1: 160, ra2: -10, la1: -18 }, e: SNAP },
    { f: ifAt - 2, p: { ra1: 160, ra2: -10, la1: -18 } },
    { f: ifAt + 6, p: { ...P.pointR, ra1: 110 } },
    { f: pulls + 12, p: { ...P.pointR, ra1: 110 } },
    { f: pulls + 18, p: { ...P.shock }, e: SNAP },
    { f: willpower - 2, p: { ...P.shock } },
    { f: willpower + 4, p: { ...P.shrug } },
    { f: removing - 2, p: { ...P.shrug } },
    { f: removing + 3, p: { ra1: 160, ra2: -10, la1: -18 }, e: SNAP }, // aha
    { f: tests - 2, p: { ra1: 160, ra2: -10, la1: -18 } },
    { f: tests + 6, p: { ...P.pointR, ra1: 120 } },
    { f: ninety - 2, p: { ...P.pointR, ra1: 120 } },
    { f: ninety + 3, p: { ...P.cheer }, e: SNAP },
    { f: caveat - 2, p: { ...P.cheer } },
    { f: caveat + 6, p: { ...P.shrug } },
    { f: write - 2, p: { ...P.shrug } },
    { f: write + 6, p: { ...P.pointR, ra1: 140 } },
  ];

  const z = punch(f, [fight, snooze, fix, pulls + 13, removing, boost, ninety, nudge], 0.03);

  // bar chart
  const BX = 470;
  const BB = 1240;
  const BH = 480;
  const grow = (at: number, to: number) => interpolate(f, [at, at + 18], [0, to], { ...clamp, easing: Easing.out(Easing.cubic) });
  const withH = grow(W(10, 1), 0.91);
  const noH = grow(C(11) + 4, 0.38);
  const pct = Math.round(withH * 100);

  return (
    <Stage
      bg={<Blueprint f={f} />}
      hits={[snooze, pulls + 13, ninety]}
      power={9}
      cam={{ z }}
      svg={
        <>
          <Clock f={f} ring={ring} o={clockO} />

          {/* act 1: tug-of-war with yourself */}
          {fightK > 0.01 && (
            <g opacity={fightK}>
              <Actor f={f} color="#9b8cd6" scale={YS} label="SLEEPY YOU" face="happy" base={{ x: 880, y: YGY }} facing={-1} keys={sleepyKeys} mod={(t, p) => addPose(p, idle(t, 2))}>
                {(j) => rope(j)}
              </Actor>
              {/* pillow */}
              <g transform={`translate(${960} ${1180}) rotate(-12)`}>
                <rect x={-50} y={-30} width={100} height={60} rx={26} fill="#e8ecf8" {...K} strokeWidth={5} />
              </g>
              <circle cx={knotX} cy={1060} r={12} fill="#e5322d" {...K} strokeWidth={4} />
            </g>
          )}

          {/* act 2: the dominoes */}
          {domK > 0.01 && (
            <g opacity={domK}>
              <g transform="translate(320 1290)" opacity={interpolate(f, [coffee - 4, coffee + 2], [0, 1], clamp)}>
                <rect x={-70} y={-12} width={140} height={12} fill="#2a4a80" />
                <g transform="translate(0 -12)">
                  <Mug f={f} />
                </g>
              </g>
              <Domino x={480} w={70} h={190} ang={angT} label="7:00" size={30} fill="#ffd166" />
              <Domino x={610} w={130} h={330} ang={angIf} label="IF" size={84} fill={f >= ifAt ? CREAM : "#c8d6ea"} />
              <Domino x={785} w={130} h={330} ang={angThen} label="THEN" size={56} fill={f >= thenAt ? CREAM : "#c8d6ea"} />
            </g>
          )}
          {f >= pulls + 13 && f < pulls + 30 && <Burst x={900} y={1250} at={pulls + 21} f={f} size={200} color={WARM} />}

          {/* act 3a: 94 tiny dominoes fall in a wave */}
          {waveK > 0.01 && (
            <g opacity={waveK}>
              {Array.from({ length: 94 }, (_, i) => {
                const col = i % 10;
                const row = Math.floor(i / 10);
                const x = 400 + col * 60;
                const y = 700 + row * 58;
                const at = W(9, 1) + (col + row) * 2;
                const a = interpolate(f, [at, at + 6], [0, 75], { ...clamp, easing: Easing.in(Easing.quad) });
                return (
                  <g key={i} transform={`translate(${x + 14} ${y + 44}) rotate(${a}) translate(${-28} ${-44})`}>
                    <rect width={28} height={44} rx={5} fill={a > 60 ? WARM : CREAM} stroke={COL.ink} strokeWidth={3} />
                  </g>
                );
              })}
            </g>
          )}

          {/* act 3b: bars 91% vs about 1 in 3 */}
          {barsK > 0.01 && (
            <g opacity={barsK * (f >= caveat ? 0.45 : 1)}>
              <line x1={BX - 30} y1={BB} x2={1010} y2={BB} stroke="#fff" strokeWidth={5} />
              <rect x={BX} y={BB - BH * withH} width={200} height={BH * withH} rx={12} fill={WARM} {...K} />
              <rect x={BX + 270} y={BB - BH * noH} width={200} height={BH * noH} rx={12} fill="#8a9bb8" {...K} />
              {withH > 0.05 && (
                <text x={BX + 100} y={BB - BH * withH - 24} textAnchor="middle" fontFamily={FONT.comic} fontSize={110} fill={WARM} stroke={COL.ink} strokeWidth={5} paintOrder="stroke">
                  {pct}%
                </text>
              )}
              {noH > 0.05 && (
                <text x={BX + 370} y={BB - BH * noH - 24} textAnchor="middle" fontFamily={FONT.comic} fontSize={84} fill="#c9d6ee" stroke={COL.ink} strokeWidth={5} paintOrder="stroke">
                  ~1 IN 3
                </text>
              )}
            </g>
          )}
          {f >= ninety && f < ninety + 16 && <Burst x={BX + 100} y={BB - BH * 0.91 - 60} at={ninety} f={f} size={220} color={WARM} />}

          {/* the end: blank dominoes */}
          {endK > 0.01 && (
            <g opacity={endK}>
              <Domino x={470} w={130} h={330} ang={0} label="IF" size={84} />
              <Domino x={640} w={130} h={330} ang={0} label="THEN" size={56} />
            </g>
          )}

          {/* YOU */}
          <Actor
            f={f}
            color={COL.orange}
            scale={YS}
            label="YOU"
            face={f >= snooze && f < fix ? "sad" : f >= pulls && f < write ? "happy" : "eyes"}
            base={{ x: 470, y: YGY }}
            keys={youKeys}
            opacity={f >= study - 6 && f < write ? 0 : 1}
            mod={(t, p) => {
              const q = { ...p, x: youX(t) };
              return youWalking(t) ? addPose(q, walkCycle(t, 0.3)) : addPose(q, idle(t, 4));
            }}
          >
            {(j) => (f < fix ? rope(j) : null)}
          </Actor>

          {/* SPARK */}
          <Spark f={f} scale={SS} base={{ x: 170, y: SGY }} talk={(t) => mouthAt(t)} bulb={bulb} mood={sparkMood} look={1} keys={sparkKeys} mod={(t, p) => addPose(p, idle(t, 8))} />
        </>
      }
      html={
        <>
          {/* hook layer (frame 0) + loop */}
          <div
            style={{
              position: "absolute",
              left: 540,
              top: 560,
              transform: "translate(-50%,-50%) rotate(-2deg)",
              opacity: Math.max(interpolate(f, [plan - 6, plan + 2], [1, 0], clamp), endK),
              background: CREAM,
              color: COL.ink,
              border: `6px solid ${COL.ink}`,
              borderRadius: 18,
              padding: "4px 34px",
              fontFamily: FONT.comic,
              fontSize: 104,
              letterSpacing: 4,
              whiteSpace: "nowrap",
            }}
          >
            IF ___ THEN ___
          </div>
          {/* the vague plan */}
          {f >= plan && f < fix && (
            <div
              style={{
                position: "absolute",
                left: 540,
                top: 380,
                transform: `translate(-50%,-50%) rotate(-3deg) scale(${pop(f, plan)})`,
                background: "#ffe66d",
                border: `6px solid ${COL.ink}`,
                borderRadius: 10,
                padding: "18px 40px",
                fontFamily: FONT.comic,
                fontSize: 80,
                color: COL.ink,
                whiteSpace: "nowrap",
                filter: f >= decide ? "blur(2px)" : "none",
                opacity: interpolate(f, [fix - 6, fix], [1, 0], clamp),
              }}
            >
              PLAN: “EXERCISE MORE”
            </div>
          )}
          {f >= W(2, 1) && f < fix &&
            ["MON", "TUE", "WED"].map((d, i) => {
              const at = W(2, 1) + i * 10;
              return f >= at ? (
                <div
                  key={d}
                  style={{
                    position: "absolute",
                    left: 300 + i * 240,
                    top: 560,
                    transform: `translate(-50%,-50%) scale(${pop(f, at)})`,
                    fontFamily: FONT.title,
                    fontWeight: 900,
                    fontSize: 56,
                    color: "#fff",
                    background: "#22355e",
                    border: `4px solid ${LINE}`,
                    borderRadius: 12,
                    padding: "2px 18px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {d} {f >= snooze ? <span style={{ color: "#ff5c5c" }}>✗</span> : "?"}
                </div>
              ) : null;
            })}
          <Slam f={f} at={snooze} out={fix - 2} x={540} y={680} size={118} color="#ff5c5c" stroke={`9px #fff`} rotate={-3}>
            SNOOZE WINS
          </Slam>
          {/* the plan cards */}
          {f >= ifAt && f < willpower - 4 && (
            <div style={{ position: "absolute", left: 540, top: 520, transform: `translate(-50%,-50%) scale(${pop(f, ifAt)})`, display: "flex", flexDirection: "column", gap: 14, alignItems: "flex-start" }}>
              <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 58, color: COL.ink, background: CREAM, border: `5px solid ${COL.ink}`, borderRadius: 14, padding: "0 24px", whiteSpace: "nowrap" }}>
                <span style={{ color: WARM }}>IF</span> 7 AM + COFFEE MADE
              </div>
              {f >= thenAt && (
                <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 58, color: COL.ink, background: CREAM, border: `5px solid ${COL.ink}`, borderRadius: 14, padding: "0 24px", whiteSpace: "nowrap", transform: `scale(${pop(f, thenAt)})`, transformOrigin: "left center" }}>
                  <span style={{ color: GOOD }}>THEN</span> WALK 10 MIN
                </div>
              )}
            </div>
          )}
          <Slam f={f} at={W(6, 0)} out={willpower - 4} x={540} y={700} size={66} color="#fff" stroke={`7px ${COL.ink}`}>
            THE MOMENT PULLS THE TRIGGER
          </Slam>
          {/* willpower vs decision */}
          {f >= willpower && f < tests && (
            <div style={{ position: "absolute", left: 540, top: 400, transform: `translate(-50%,-50%) scale(${pop(f, willpower)})`, display: "flex", gap: 30, alignItems: "center", fontFamily: FONT.title, fontWeight: 900, fontSize: 70, whiteSpace: "nowrap" }}>
              <span style={{ background: "#22355e", color: "#fff", border: `5px solid ${LINE}`, borderRadius: 14, padding: "0 22px", textDecoration: "line-through", textDecorationColor: "#ff5c5c", textDecorationThickness: 8 }}>+ WILLPOWER</span>
              {f >= removing && (
                <span style={{ background: CREAM, color: COL.ink, border: `5px solid ${COL.ink}`, borderRadius: 14, padding: "0 22px", transform: `scale(${pop(f, removing)})` }}>
                  − 1 DECISION
                </span>
              )}
            </div>
          )}
          {f >= willpower && f < tests && (
            <div style={{ position: "absolute", left: 700, top: 780, transform: `translate(-50%,-50%) scale(${interpolate(f, [willpower, willpower + 6, removing, removing + 8], [0, 1.2, 1.2, 0], clamp)})`, fontFamily: FONT.comic, fontSize: 200, color: "#ffe66d", WebkitTextStroke: `8px ${COL.ink}`, paintOrder: "stroke fill" }}>
              ?
            </div>
          )}
          <Slam f={f} at={W(9, 1)} out={study - 4} x={540} y={420} size={130} color="#fff" stroke={`9px ${COL.ink}`}>
            94 TESTS
          </Slam>
          <Slam f={f} at={boost} out={study - 4} x={540} y={570} size={72} color={WARM} stroke={`7px ${COL.ink}`} rotate={-2}>
            MEDIUM-TO-LARGE BOOST (d = .65)
          </Slam>
          {/* bar labels */}
          {barsK > 0.02 && (
            <>
              <div style={{ position: "absolute", left: BX + 100, top: BB + 40, transform: "translate(-50%,-50%)", opacity: barsK, fontFamily: FONT.title, fontWeight: 900, fontSize: 40, color: "#fff", whiteSpace: "nowrap" }}>WITH IF-THEN</div>
              <div style={{ position: "absolute", left: BX + 370, top: BB + 40, transform: "translate(-50%,-50%)", opacity: barsK, fontFamily: FONT.title, fontWeight: 900, fontSize: 40, color: "#c9d6ee", whiteSpace: "nowrap" }}>NO PLAN</div>
            </>
          )}
          <Slam f={f} at={study} out={caveat - 4} x={540} y={330} size={80} color="#fff" stroke={`8px ${COL.ink}`}>
            ONE STUDY · EXERCISED
          </Slam>
          {f >= caveat && f < write && <Stamp f={f} at={W(12, 2)} x={540} y={360} text="SHORT-TERM · SELF-REPORTED" size={58} color="#ff8a5c" r={-4} />}
          <Slam f={f} at={nudge} out={write - 4} x={540} y={540} size={104} color={GOOD} stroke={`9px ${COL.ink}`} rotate={-3}>
            A NUDGE, NOT MAGIC
          </Slam>
          {/* sources */}
          {f >= tests && f < write && (
            <div style={{ position: "absolute", left: 540, top: 1590, transform: "translate(-50%,-50%)", fontFamily: FONT.body, fontWeight: 700, fontSize: 25, color: "#bcd3f5", whiteSpace: "nowrap", opacity: 0.9 }}>
              {f < study ? "Gollwitzer & Sheeran (2006) meta-analysis, 94 tests" : "Milne, Orbell & Sheeran (2002), N = 248 students: 91% vs 35–38%"}
            </div>
          )}
          <VoiceCaptions f={f} cues={VOICE_CUES} hi={["seven", "fight", "fresh", "decision", "snooze", "if-then", "trigger", "willpower", "removing", "ninety-four", "ninety-one", "three", "nudge", "magic", "blank"]} />
        </>
      }
    />
  );
};
