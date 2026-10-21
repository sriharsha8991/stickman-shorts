import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { Actor, P, SNAP, addPose, idle, walkCycle, type Key } from "../stickman/stick";
import { COL, Dust, FONT, Slam } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, K, VoiceCaptions, punch } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// V005 · POV: demo day. A conference stage: projector screen, podium, laptop, a wall clock.
// 2:55 rehearsal = flawless. 3:00 live = frozen, spinning, smoke, and a storm cloud (the "demo gods")
// zaps the laptop. The demo ends and it works perfectly. Spark (stage tech in the wings) holds up
// BACKUP.mp4. Loops back to 2:55. Every beat is anchored to a spoken word (VOICE_CUES).

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });

const PX = 690; // podium / presenter x
const YS = 1.55;
const YGY = GROUND - 92.5 * YS;
const SS = 1.8;
const SGY = GROUND - 92.5 * SS;
const SCR = { x: 240, y: 470, w: 600, h: 340 };

// --- set ---------------------------------------------------------------------
const StageBg: React.FC = () => (
  <svg width={1080} height={1920} style={{ position: "absolute" }}>
    <rect width={1080} height={1920} fill="#efe4d0" />
    {/* back wall panels */}
    {Array.from({ length: 9 }, (_, i) => (
      <rect key={i} x={i * 120} y={0} width={118} height={GROUND} fill={i % 2 ? "#e8dcc5" : "#ecdfca"} />
    ))}
    {/* wooden stage floor */}
    <rect x={0} y={GROUND} width={1080} height={1920 - GROUND} fill="#a8723f" />
    {Array.from({ length: 10 }, (_, i) => (
      <line key={i} x1={0} y1={GROUND + 18 + i * 64} x2={1080} y2={GROUND + 18 + i * 64} stroke="#8d5d31" strokeWidth={3} />
    ))}
    <line x1={0} y1={GROUND} x2={1080} y2={GROUND} stroke={COL.ink} strokeWidth={6} />
  </svg>
);

const Curtains: React.FC<{ f: number }> = ({ f }) => (
  <g>
    {[0, 1].map((side) => (
      <g key={side} transform={side ? "translate(1080 0) scale(-1 1)" : undefined}>
        <path d={`M 0 0 L 120 0 Q ${100 + Math.sin(f * 0.04 + side) * 6} 700 135 ${GROUND} L 0 ${GROUND} Z`} fill="#a3262a" stroke={COL.ink} strokeWidth={5} />
        {[30, 65, 98].map((x) => (
          <path key={x} d={`M ${x} 0 Q ${x - 10} 700 ${x + 8} ${GROUND}`} stroke="#7a1a1d" strokeWidth={6} fill="none" />
        ))}
      </g>
    ))}
    <path d="M 0 0 L 1080 0 L 1080 170 Q 945 225 810 170 Q 675 225 540 170 Q 405 225 270 170 Q 135 225 0 170 Z" fill="#a3262a" stroke={COL.ink} strokeWidth={5} />
    <path d="M 0 150 Q 135 205 270 150 Q 405 205 540 150 Q 675 205 810 150 Q 945 205 1080 150" stroke="#e0b341" strokeWidth={6} fill="none" />
  </g>
);

const Clock: React.FC<{ min: number; s: number }> = ({ min, s }) => {
  // min = minutes after 2:00 (55 → 2:55, 60 → 3:00)
  const mAng = (min % 60) * 6;
  const hAng = (2 + min / 60) * 30;
  const label = min >= 60 ? "3:00" : `2:${String(Math.round(min)).padStart(2, "0")}`;
  return (
    <g transform={`translate(872 900) scale(${s})`}>
      <circle r={62} fill="#fff" {...K} />
      {Array.from({ length: 12 }, (_, i) => (
        <line key={i} x1={0} y1={-50} x2={0} y2={-42} stroke={COL.ink} strokeWidth={4} transform={`rotate(${i * 30})`} />
      ))}
      <line x1={0} y1={0} x2={0} y2={-30} stroke={COL.ink} strokeWidth={7} strokeLinecap="round" transform={`rotate(${hAng})`} />
      <line x1={0} y1={0} x2={0} y2={-46} stroke={COL.red} strokeWidth={5} strokeLinecap="round" transform={`rotate(${mAng})`} />
      <circle r={6} fill={COL.ink} />
      <rect x={-52} y={74} width={104} height={46} rx={10} fill={COL.ink} />
      <text y={108} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={38} fill={min >= 60 ? COL.red : "#7ef0a0"}>
        {label}
      </text>
    </g>
  );
};

const Spinner: React.FC<{ f: number; s?: number }> = ({ f, s = 1 }) => (
  <g transform={`scale(${s}) rotate(${f * 14})`}>
    <circle r={46} fill="none" stroke="#ffffff" strokeWidth={14} strokeDasharray="200 90" strokeLinecap="round" />
  </g>
);

const Flame: React.FC<{ f: number; s: number }> = ({ f, s }) => (
  <g transform={`scale(${s})`}>
    {[
      { c: COL.red, w: 1, d: 0 },
      { c: "#ff8a1d", w: 0.75, d: 1.3 },
      { c: COL.yellow, w: 0.45, d: 2.1 },
    ].map(({ c, w, d }, i) => {
      const fl = 1 + Math.sin(f * 0.9 + d) * 0.12;
      return (
        <path
          key={i}
          d={`M ${-40 * w} 0 Q ${-46 * w} ${-60 * w * fl} ${-6 * w} ${-120 * w * fl} Q ${4 * w} ${-80 * w} ${20 * w} ${-100 * w * fl} Q ${50 * w} ${-50 * w} ${40 * w} 0 Z`}
          fill={c}
          stroke={i === 0 ? COL.ink : "none"}
          strokeWidth={4}
        />
      );
    })}
  </g>
);

const Cloud: React.FC<{ f: number; s: number }> = ({ f, s }) => (
  <g transform={`scale(${s}) translate(${Math.sin(f * 0.3) * 6} 0)`}>
    {[
      [-80, 10, 50],
      [-30, -20, 62],
      [35, -10, 58],
      [85, 12, 46],
      [0, 22, 60],
    ].map(([x, y, r], i) => (
      <circle key={i} cx={x} cy={y} r={r} fill="#4a4f63" stroke={COL.ink} strokeWidth={5} />
    ))}
    {[-30, 30].map((x) => (
      <g key={x}>
        <path d={`M ${x - 18} -6 L ${x + 14} 4`} stroke={COL.ink} strokeWidth={7} strokeLinecap="round" transform={x > 0 ? `scale(-1 1) translate(${-2 * x} 0)` : undefined} />
        <circle cx={x} cy={14} r={9} fill="#ffe27a" stroke={COL.ink} strokeWidth={3} />
      </g>
    ))}
  </g>
);

const Sparkle: React.FC<{ s: number }> = ({ s }) => (
  <path transform={`scale(${s})`} d="M 0 -26 Q 4 -4 26 0 Q 4 4 0 26 Q -4 4 -26 0 Q -4 -4 0 -26 Z" fill={COL.yellow} stroke={COL.ink} strokeWidth={3} />
);

// what the projector shows
type ScreenState = "works" | "click" | "frozen" | "spin" | "dead" | "thanks";
const Screen: React.FC<{ f: number; st: ScreenState; cursor: [number, number]; pressed: boolean; flash: number }> = ({ f, st, cursor, pressed, flash }) => {
  const { x, y, w, h } = SCR;
  const shake = st === "frozen" ? Math.sin(f * 3) * 3 : 0;
  const dead = st === "dead";
  return (
    <g>
      {/* stand */}
      <line x1={x + w / 2} y1={y + h} x2={x + w / 2} y2={y + h + 40} stroke={COL.ink} strokeWidth={8} />
      <rect x={x - 14} y={y - 14} width={w + 28} height={h + 28} rx={10} fill="#2b2b2b" stroke={COL.ink} strokeWidth={6} />
      <g transform={`translate(${shake} 0)`}>
        <rect x={x} y={y} width={w} height={h} fill={dead ? "#1d1d24" : st === "frozen" || st === "spin" ? "#d9dde3" : "#f7fbff"} />
        {!dead && (
          <>
            {/* window title bar */}
            <rect x={x} y={y} width={w} height={46} fill={st === "frozen" || st === "spin" ? "#a9b0ba" : "#2b7de9"} />
            {[0, 1, 2].map((i) => (
              <circle key={i} cx={x + 26 + i * 26} cy={y + 23} r={8} fill={["#ff5f57", "#febc2e", "#28c840"][i]} />
            ))}
            <text x={x + w / 2} y={y + 32} textAnchor="middle" fontFamily={FONT.body} fontWeight={700} fontSize={24} fill="#fff">
              {st === "frozen" || st === "spin" ? "MyApp (Not Responding)" : st === "thanks" ? "slides.pdf" : "MyApp · LIVE DEMO"}
            </text>
          </>
        )}
        {st === "works" && (
          <g>
            <circle cx={x + w / 2} cy={y + 150} r={66} fill={COL.green} {...K} />
            <path d={`M ${x + w / 2 - 32} ${y + 152} L ${x + w / 2 - 8} ${y + 176} L ${x + w / 2 + 36} ${y + 124}`} stroke="#fff" strokeWidth={16} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <text x={x + w / 2} y={y + 290} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={64} fill={COL.ink}>
              IT WORKS
            </text>
          </g>
        )}
        {(st === "click" || st === "frozen" || st === "spin") && (
          <g opacity={st === "click" ? 1 : 0.55}>
            <rect x={x + w / 2 - 150} y={y + 140} width={300} height={100} rx={20} fill={pressed ? "#1f5fb8" : "#2b7de9"} stroke={COL.ink} strokeWidth={5} />
            <text x={x + w / 2} y={y + 205} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={52} fill="#fff">
              RUN DEMO
            </text>
          </g>
        )}
        {st === "spin" && (
          <g transform={`translate(${x + w / 2} ${y + 190})`}>
            <Spinner f={f} s={1.4} />
          </g>
        )}
        {st === "thanks" && (
          <text x={x + w / 2} y={y + 230} textAnchor="middle" fontFamily={FONT.comic} fontSize={96} fill={COL.ink}>
            THANK YOU!
          </text>
        )}
        {(st === "click" || st === "frozen") && (
          <g transform={`translate(${cursor[0]} ${cursor[1]}) scale(${pressed ? 1.5 : 1.7})`}>
            <path d="M0,0 L0,34 L8,26 L14,40 L20,37 L14,24 L25,24 Z" fill="#fff" stroke="#000" strokeWidth={2.4} strokeLinejoin="round" />
          </g>
        )}
        {flash > 0 && <rect x={x} y={y} width={w} height={h} fill="#fff" opacity={flash} />}
      </g>
    </g>
  );
};

const Podium: React.FC = () => (
  <g>
    <path d={`M ${PX - 110} 1080 L ${PX + 110} 1080 L ${PX + 90} ${GROUND} L ${PX - 90} ${GROUND} Z`} fill="#6b4423" stroke={COL.ink} strokeWidth={6} />
    <rect x={PX - 130} y={1066} width={260} height={26} rx={6} fill="#83552e" stroke={COL.ink} strokeWidth={5} />
    <circle cx={PX} cy={1180} r={30} fill="#e0b341" stroke={COL.ink} strokeWidth={4} />
    <rect x={PX - 8} y={1010} width={6} height={60} fill={COL.ink} transform={`rotate(-20 ${PX} 1066)`} />
    <circle cx={PX - 26} cy={1006} r={10} fill="#555" stroke={COL.ink} strokeWidth={3} />
  </g>
);

// laptop lid (back side, facing the audience)
const Laptop: React.FC<{ glow: string }> = ({ glow }) => (
  <g transform={`translate(${PX + 40} 1066)`}>
    <path d="M -80 0 L 80 0 L 70 -96 L -70 -96 Z" fill="#b9bec7" stroke={COL.ink} strokeWidth={5} />
    <circle cx={0} cy={-50} r={14} fill={glow} stroke={COL.ink} strokeWidth={3} />
  </g>
);

export const S01_SFX: SfxCue[] = [
  [0, "slam", 0.5],
  [W(1, 1), "tick", 0.5],
  [W(1, 3), "ding", 0.6],
  [W(2, 0), "clink", 0.6],
  [W(2, 3), "whoosh", 0.4],
  [W(2, 5) + 6, "pop", 0.7],
  [W(3, 0), "freeze", 0.6],
  [W(3, 1), "swirl", 0.5],
  [W(3, 2), "buzz", 0.5],
  [W(4, 2), "explosion", 0.5],
  [W(4, 2) + 2, "shatter", 0.4],
  [W(5, 3), "page", 0.5],
  [W(5, 6), "ding", 0.8],
  [W(5, 7), "boing", 0.4],
  [W(6, 3), "ding", 0.6],
  [W(6, 3) + 2, "pop", 0.5],
  [W(7, 1), "whoosh", 0.4],
  [VOICE_FRAMES - 10, "tick", 0.4],
];

export const S01Stage: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const live = W(2, 0); // "Three"
  const zap = W(4, 2); // "gods"
  const ends = W(5, 3); // "ends"
  const works = W(5, 6); // "works"
  const aha = W(6, 3); // "backup"
  const next = C(7);

  // clock: 2:55 → 3:00 on "Three", back to 2:55 for the loop
  const min = f < C(1) ? 55 : f < live ? 55 : f < next ? lerp(55, 60, ease(f, live - 6, live + 4)) : lerp(60, 55, ease(f, next + 10, next + 26));
  const clockS = interpolate(f, [W(1, 0), W(1, 0) + 6, C(1) + 30, C(1) + 38, live - 2, live + 4, live + 20, live + 28], [1, 1.35, 1.35, 1, 1, 1.35, 1.35, 1], clamp);

  // house lights down while live, up after the demo ends, down again for "who's next" then back up (loop)
  const dim = Math.min(ease(f, live, live + 10) * (1 - ease(f, ends, ends + 10)), 1);
  const audience = ease(f, live + 2, live + 12) * (1 - ease(f, ends, ends + 14));

  const st: ScreenState =
    f < live ? "works" : f < W(3, 0) ? "click" : f < W(3, 1) ? "frozen" : f < W(3, 2) ? "spin" : f < ends ? "dead" : f < works ? "thanks" : "works";
  const cursorT = ease(f, W(2, 2), W(2, 5));
  const cursor: [number, number] = [lerp(SCR.x + 480, SCR.x + 300, cursorT), lerp(SCR.y + 330, SCR.y + 200, cursorT)];
  const pressed = f >= W(2, 5) + 6 && f < W(2, 5) + 12;
  const flash = interpolate(f, [zap, zap + 2, zap + 8], [0, 0.9, 0], clamp) + interpolate(f, [works, works + 2, works + 8], [0, 0.6, 0], clamp);

  const smoke = f >= W(3, 2) && f < ends + 10;
  const fire = interpolate(f, [zap, zap + 6, ends, ends + 10], [0, 1, 1, 0], clamp);
  const cloud = interpolate(f, [C(4), C(4) + 8, ends - 4, ends + 6], [0, 1, 1, 0], clamp);

  const youKeys: Key[] = [
    { f: 0, p: { la1: -40, la2: -70, ra1: 40, ra2: 70 } }, // hands on laptop
    { f: W(1, 3) - 3, p: { la1: -40, la2: -70, ra1: 40, ra2: 70 } },
    { f: W(1, 3) + 3, p: { ...P.cheer }, e: SNAP }, // "Flawless."
    { f: live - 2, p: { ...P.cheer } },
    { f: live + 6, p: { la1: -40, la2: -70, ra1: 40, ra2: 70 } },
    { f: W(2, 5) + 2, p: { la1: -40, la2: -70, ra1: 40, ra2: 70 } },
    { f: W(2, 5) + 6, p: { la1: -40, la2: -70, ra1: 60, ra2: 40 }, e: SNAP }, // click
    { f: W(3, 0) - 2, p: { la1: -40, la2: -70, ra1: 60, ra2: 40 } },
    { f: W(3, 0) + 3, p: { ...P.shock }, e: SNAP },
    { f: zap - 2, p: { ...P.shock } },
    { f: zap + 3, p: { ...P.armsUp, lean: -12 }, e: SNAP },
    { f: ends - 2, p: { ...P.armsUp, lean: -12 } },
    { f: ends + 6, p: { ...P.sad } },
    { f: works - 2, p: { ...P.sad } },
    { f: works + 4, p: { ...P.shrug }, e: SNAP }, // works NOW?!
    { f: next - 2, p: { ...P.shrug } },
    { f: next + 10, p: { la1: -40, la2: -70, ra1: 40, ra2: 70 } }, // back to the start
  ];

  const sparkX = (u: number) => lerp(200, 330, ease(u, C(6) - 6, C(6) + 14)) - lerp(0, 130, ease(u, next + 4, next + 24));
  const sparkKeys: Key[] = [
    { f: 0, p: { ...P.pointR, ra1: 120 } }, // points at the screen
    { f: C(1) - 3, p: { ...P.pointR, ra1: 120 } },
    { f: C(1) + 3, p: { ra1: 140, ra2: 40, la1: -18 }, e: SNAP }, // thumbs up
    { f: live - 2, p: { ra1: 140, ra2: 40 } },
    { f: live + 4, p: { ...P.think } }, // nervous
    { f: W(3, 0) - 2, p: { ...P.think } },
    { f: W(3, 0) + 3, p: { ...P.shock }, e: SNAP },
    { f: ends - 2, p: { ...P.shock } },
    { f: ends + 4, p: { ...P.facepalm } },
    { f: C(6) - 4, p: { ...P.facepalm } },
    { f: aha - 4, p: { ra1: 120, ra2: -20, la1: -18 } },
    { f: aha + 2, p: { ra1: 125, ra2: -15, la1: -18 }, e: SNAP }, // holds up BACKUP.mp4
    { f: next - 2, p: { ra1: 125, ra2: -15 } },
    { f: next + 24, p: { ...P.pointR, ra1: 120 } }, // loop pose
  ];
  const sparkMood = (t: number): Mood =>
    t >= W(3, 0) && t < ends ? "shock" : t >= works && t < C(6) ? "smug" : t >= live && t < W(3, 0) ? "neutral" : "happy";

  const z = punch(f, [0, W(1, 3), live, W(2, 5) + 6, W(3, 0), W(3, 1), W(3, 2), zap, works, aha, next], 0.045);

  return (
    <Stage
      bg={<StageBg />}
      hits={[W(3, 0), zap, works]}
      power={13}
      cam={{ z }}
      svg={
        <>
          <Clock min={min} s={clockS} />
          {/* lights down (everything behind the screen) */}
          <rect x={0} y={0} width={1080} height={1920} fill="#120c1c" opacity={0.62 * dim} />
          <Screen f={f} st={st} cursor={cursor} pressed={pressed} flash={flash} />
          {/* spotlight on the presenter */}
          {dim > 0.02 && <path d={`M ${PX - 50} 0 L ${PX + 50} 0 L ${PX + 230} ${GROUND} L ${PX - 230} ${GROUND} Z`} fill="#fff6d0" opacity={0.16 * dim} />}
          {dim > 0.02 && <ellipse cx={PX} cy={GROUND} rx={240} ry={34} fill="#fff6d0" opacity={0.3 * dim} />}

          {/* the demo gods */}
          {cloud > 0 && (
            <g transform={`translate(${PX - 210} 860)`} opacity={cloud}>
              <Cloud f={f} s={0.9 * cloud} />
            </g>
          )}
          {f >= zap && f < zap + 10 && (
            <path d={`M ${PX - 160} 910 L ${PX - 70} 960 L ${PX - 80} 980 L ${PX + 30} 1040`} stroke={COL.yellow} strokeWidth={14} fill="none" strokeLinejoin="round" />
          )}

          <Actor
            f={f}
            color={COL.orange}
            scale={YS}
            label="YOU"
            face={f >= W(3, 0) && f < ends ? "sad" : f >= works && f < next ? "angry" : "happy"}
            base={{ x: PX - 40, y: YGY - 30 }}
            keys={youKeys}
            mod={(t, p) => addPose(p, idle(t, 4))}
          />
          <Podium />
          <Laptop glow={st === "dead" ? "#555" : "#cfe9ff"} />
          {/* smoke + fire on the laptop */}
          {smoke &&
            Array.from({ length: 6 }, (_, i) => {
              const ph = ((f - W(3, 2)) * 1.6 + i * 18) % 110;
              return <circle key={i} cx={PX + 40 + Math.sin(ph * 0.08 + i) * 24} cy={960 - ph * 1.6} r={14 + ph * 0.3} fill="#8a8a8a" opacity={0.55 * (1 - ph / 110)} />;
            })}
          {fire > 0 && (
            <g transform={`translate(${PX + 40} 975)`}>
              <Flame f={f} s={1.1 * fire} />
            </g>
          )}
          {f >= ends && f < ends + 24 && <Dust x={PX + 40} y={980} at={ends} f={f} spread={90} />}
          {f >= works &&
            f < next &&
            [
              [-130, -80],
              [120, -120],
              [150, 10],
              [-150, 30],
            ].map(([dx, dy], i) => (
              <g key={i} transform={`translate(${PX + 40 + dx} ${980 + dy}) rotate(${f * 3})`}>
                <Sparkle s={interpolate(f, [works + i * 2, works + i * 2 + 6, works + 14], [0, 1.3, 1], clamp)} />
              </g>
            ))}

          {/* SPARK, stage tech in the wings */}
          <Spark
            f={f}
            scale={SS}
            base={{ x: 200, y: SGY }}
            talk={(t) => mouthAt(t)}
            bulb={(t) => bulbPulse(t, aha, 40)}
            mood={sparkMood}
            look={1}
            keys={sparkKeys}
            mod={(t, p) => {
              const q = { ...p, x: sparkX(t) };
              if (Math.abs(sparkX(t) - sparkX(t - 1)) > 1.2) return addPose(q, walkCycle(t, 0.3));
              return addPose(q, idle(t, 9));
            }}
          >
            {(j) =>
              f >= aha - 4 && f < next + 10 ? (
                <g transform={`translate(${j.rHand[0] + 60} ${j.rHand[1] - 95}) scale(${interpolate(f, [aha - 4, aha + 4], [0.3, 1], clamp)})`}>
                  <rect x={-150} y={-56} width={300} height={112} rx={16} fill="#fff" {...K} />
                  <path d="M -124 -24 L -124 24 L -88 0 Z" fill={COL.red} stroke={COL.ink} strokeWidth={4} strokeLinejoin="round" />
                  <text x={28} y={13} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={40} fill={COL.ink}>
                    BACKUP.mp4
                  </text>
                </g>
              ) : null
            }
          </Spark>

          {/* audience heads in front */}
          {audience > 0.01 &&
            Array.from({ length: 10 }, (_, i) => {
              const x = 60 + i * 108;
              const y = 1400 - audience * 70 + (i % 2) * 14 + Math.sin(f * 0.1 + i) * 2;
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r={44} fill="#1a1424" />
                  <rect x={x - 60} y={y + 30} width={120} height={120} rx={40} fill="#1a1424" />
                </g>
              );
            })}
          <Curtains f={f} />
        </>
      }
      html={
        <>
          <Slam f={f} at={0} out={C(1) - 4} x={540} y={290} size={100} color={COL.ink}>
            POV:
          </Slam>
          <Slam f={f} at={W(0, 2)} out={C(1) - 4} x={540} y={385} size={62} font={FONT.title} weight={900} color={COL.red} spacing={2}>
            IT WORKED 5 MINUTES AGO.
          </Slam>
          <Slam f={f} at={W(1, 2)} out={live - 4} x={540} y={320} size={64} font={FONT.title} weight={900} color={COL.ink} spacing={4}>
            REHEARSAL
          </Slam>
          <Slam f={f} at={live} out={W(3, 0) - 2} x={540} y={320} size={90} color={COL.red} stroke={`7px #fff`}>
            ● LIVE
          </Slam>
          {[
            { at: W(3, 0), text: "FROZEN." },
            { at: W(3, 1), text: "SPINNING." },
            { at: W(3, 2), text: "SMOKE." },
          ].map((w, i, a) => (
            <Slam key={w.text} f={f} at={w.at} out={(a[i + 1]?.at ?? C(4)) - 2} x={540} y={320} size={110} color="#fff" stroke={`9px ${COL.ink}`}>
              {w.text}
            </Slam>
          ))}
          <Slam f={f} at={C(4)} out={ends - 4} x={540} y={320} size={96} color={COL.yellow} stroke={`8px ${COL.ink}`} rotate={-3}>
            THE DEMO GODS
          </Slam>
          <Slam f={f} at={works} out={C(6) - 2} x={540} y={320} size={100} color={COL.green} stroke={`8px ${COL.ink}`} rotate={3}>
            NOW IT WORKS?!
          </Slam>
          <Slam f={f} at={aha} out={next - 2} x={540} y={320} size={80} font={FONT.title} weight={900} color="#fff" stroke={`8px ${COL.ink}`} spacing={2}>
            RECORD A BACKUP DEMO
          </Slam>
          <Slam f={f} at={W(7, 1)} out={VOICE_FRAMES - 8} x={540} y={320} size={90} color={COL.ink}>
            NEXT!
          </Slam>
          <VoiceCaptions f={f} cues={VOICE_CUES} hi={["pov", "worked", "flawless", "frozen", "spinning", "smoke", "gods", "perfectly", "backup"]} />
        </>
      }
    />
  );
};
