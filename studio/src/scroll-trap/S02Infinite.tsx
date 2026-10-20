import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Actor, P, SMOOTH, addPose, idle, walkCycle } from "../stickman/stick";
import { Burst, COL, Slam } from "../stickman/fx";
import { Stage, Stamp, WordBlock } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { DayBg, GY, Heart, K, Kinetic, S, punch, type Page } from "./kit";

// 2006: a designer kicks the NEXT PAGE button off the page. The page loses its bottom and the
// feed starts streaming forever, faster and faster.

const PX0 = 170;
const PX1 = 730;
const PTOP = 640;
const KICK = 54;
const EXTEND = 90;

const PAGES: Page[] = [
  { at: 10, text: "In 2006, a designer deleted", hi: ["2006"] },
  { at: 52, text: 'the "next page" button.', hi: ['"next', 'page"'] },
  { at: 100, text: "Your feed lost its bottom.", hi: ["bottom"] },
  { at: 160, text: "No bottom = no reason to stop.", hi: ["stop"] },
];

export const S02_SFX: SfxCue[] = [
  [0, "slam", 0.8],
  [8, "whoosh", 0.3],
  [KICK, "punch", 1],
  [KICK + 2, "impact", 0.8],
  [KICK + 4, "whoosh", 0.5],
  [100, "slam", 0.7],
  [104, "whoosh_long", 0.5],
  [186, "stamp", 1],
];

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// a feed card (image post / text post), local origin = top-left
const Card: React.FC<{ i: number; y: number }> = ({ i, y }) => {
  const kind = i % 3;
  return (
    <g transform={`translate(${PX0 + 30} ${y})`}>
      <rect width={PX1 - PX0 - 60} height={150} rx={14} fill="#fff" {...K} strokeWidth={4} />
      <circle cx={34} cy={32} r={16} fill={["#ffb4a2", "#a2d2ff", "#bde0a8"][kind]} stroke={COL.ink} strokeWidth={3} />
      <rect x={60} y={22} width={150} height={14} rx={7} fill="#d9d9d9" />
      {kind === 0 ? (
        <>
          <rect x={20} y={60} width={PX1 - PX0 - 100} height={74} rx={8} fill="#cfe8ff" />
          <path d={`M 40 130 L 120 80 L 180 118 L 240 70 L 320 130 Z`} fill="#7fb77e" />
        </>
      ) : (
        <>
          <rect x={20} y={62} width={PX1 - PX0 - 120} height={12} rx={6} fill="#e3e3e3" />
          <rect x={20} y={86} width={PX1 - PX0 - 180} height={12} rx={6} fill="#e3e3e3" />
          <rect x={20} y={110} width={PX1 - PX0 - 240} height={12} rx={6} fill="#e3e3e3" />
        </>
      )}
      <g transform={`translate(${PX1 - PX0 - 100} 34) scale(0.45)`}>
        <Heart />
      </g>
    </g>
  );
};

export const S02Infinite: React.FC<SceneProps> = ({ dur }) => {
  const f = useCurrentFrame();
  // page bottom: fixed with a button, then it stretches away after the kick
  const bottom = interpolate(f, [EXTEND, EXTEND + 18], [1180, 1300], { ...clamp, easing: SMOOTH });
  // feed offset accelerates once the page is endless
  const t = Math.max(0, f - EXTEND);
  const scroll = t * 3 + t * t * 0.09;
  const CARD = 170;
  const first = Math.floor(scroll / CARD);
  const cards = Array.from({ length: 6 }, (_, k) => {
    const i = first + k;
    return <Card key={i} i={i} y={PTOP + 70 + i * CARD - scroll} />;
  });
  // the button flies off after the kick
  const bt = Math.max(0, f - KICK);
  const btnX = 590 - bt * 34;
  const btnY = 1110 - bt * 22 + bt * bt * 0.9;
  const btnR = -bt * 21;
  const fast = f > 150;

  return (
    <Stage
      bg={<DayBg />}
      hits={[KICK + 2, 100, 186]}
      power={16}
      cam={{ z: punch(f, [0, KICK + 2, 100, 160, 186], 0.06) }}
      svg={
        <>
          {/* browser page */}
          <defs>
            <clipPath id="page">
              <rect x={PX0} y={PTOP + 54} width={PX1 - PX0} height={bottom - PTOP - 54} />
            </clipPath>
            <linearGradient id="pageFade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0.75" stopColor="#f7f5ef" stopOpacity={0} />
              <stop offset="1" stopColor="#f7f5ef" stopOpacity={f > EXTEND ? 1 : 0} />
            </linearGradient>
          </defs>
          <rect x={PX0} y={PTOP} width={PX1 - PX0} height={bottom - PTOP} rx={18} fill="#f1f3f7" {...K} />
          <rect x={PX0} y={PTOP} width={PX1 - PX0} height={54} rx={18} fill="#dfe3ea" {...K} />
          {[0, 1, 2].map((i) => (
            <circle key={i} cx={PX0 + 34 + i * 30} cy={PTOP + 27} r={9} fill={["#ff6b6b", "#ffd166", "#06d6a0"][i]} stroke={COL.ink} strokeWidth={3} />
          ))}
          <g clipPath="url(#page)">
            {cards}
            {fast &&
              Array.from({ length: 5 }, (_, i) => (
                <line
                  key={i}
                  x1={PX0 + 60 + i * 110}
                  y1={PTOP + 120}
                  x2={PX0 + 60 + i * 110}
                  y2={bottom - 40}
                  stroke="#bfc6d4"
                  strokeWidth={4}
                  strokeDasharray="30 50"
                  strokeDashoffset={-f * 40}
                  opacity={0.7}
                />
              ))}
          </g>
          {f > EXTEND && <rect x={PX0 - 4} y={bottom - 160} width={PX1 - PX0 + 8} height={170} fill="url(#pageFade)" />}
          {/* NEXT PAGE button: in place, then kicked away */}
          {f < KICK + 30 && <WordBlock x={btnX} y={btnY} r={btnR} text="NEXT PAGE >" bg={COL.blue} color="#fff" size={40} />}
          <Burst x={640} y={1110} at={KICK + 1} f={f} size={230} />
          <Actor
            f={f}
            color={COL.purple}
            scale={S}
            label="DESIGNER, 2006"
            accessory="glasses"
            facing={-1}
            base={{ x: 1260, y: GY }}
            keys={[
              { f: 6, p: {} },
              { f: 34, p: { x: 900 }, e: (x) => x },
              { f: 44, p: { lean: 18, rl1: -40, rl2: 30, la1: -60, ra1: 40 } }, // wind-up (anticipation)
              { f: KICK, p: { ...P.kickR } },
              { f: KICK + 14, p: { ...P.kickR } },
              { f: KICK + 24, p: { ...P.stand, lean: 0, rl1: 12, rl2: -4, ll1: -12, ll2: 4, la1: -18, ra1: 18 } },
              { f: 104, p: { ...P.cheer } },
              { f: 150, p: { ...P.cheer } },
              { f: 162, p: { ...P.shock } },
            ]}
            mod={(tt, p) => (tt > 6 && tt < 34 ? addPose(p, walkCycle(tt)) : addPose(p, idle(tt, 3)))}
          />
        </>
      }
      html={
        <>
          <Slam f={f} at={0} out={92} x={540} y={350} size={200} color={COL.purple} stroke={`10px ${COL.ink}`}>
            2006
          </Slam>
          <Slam f={f} at={100} x={540} y={350} size={128} color={COL.red} rotate={-3} stroke={`9px ${COL.ink}`}>
            INFINITE SCROLL
          </Slam>
          <Stamp f={f} at={186} x={540} y={520} text="NO STOPPING CUE" size={66} r={-6} />
          <Kinetic f={f} pages={PAGES} end={dur} />
        </>
      }
    />
  );
};

