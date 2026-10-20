import React from "react";
import { useCurrentFrame } from "remotion";
import { Actor, addPose, idle, type Pose } from "../stickman/stick";
import { COL, Dust, Slam } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, GY, Kinetic, S, punch, type Page } from "../shared/kit";
import { Flame, Leash, WarmBg, YOU, collar } from "./parts";

// HOOK: frame 0 already shows the giant "247" flame yanking YOU across the ground by a leash.
// S06 ends on exactly this framing (HOOK_YOU_X / HOOK_FLAME_X / DRAG) so the video loops.

export const HOOK_YOU_X = 300;
export const HOOK_FLAME_X = 770;
export const HOOK_FLAME_S = 1.5;
export const DRAG: Partial<Pose> = { lean: -28, ra1: 100, ra2: -8, la1: 82, la2: 4, rl1: 42, rl2: -12, ll1: -14, ll2: 22, head: -8 };
const TUGS = [30, 66, 100];

const PAGES: Page[] = [
  { at: -9, text: "You open the app before coffee.", hi: ["coffee"] },
  { at: 42, text: "Why does losing a streak hurt", hi: ["losing"] },
  { at: 80, text: "more than starting one felt good?", hi: ["good"] },
];

export const S01_SFX: SfxCue[] = [
  [8, "slam", 0.85],
  ...TUGS.map((t) => [t, "whoosh", 0.55] as SfxCue),
  ...TUGS.map((t) => [t + 3, "thud", 0.6] as SfxCue),
  [100, "boing", 0.4],
];

export const S01Hook: React.FC<SceneProps> = ({ dur }) => {
  const f = useCurrentFrame();
  // each tug: YOU skids 38 px toward the flame, the flame hops
  const youKeys = [{ f: 0, p: { x: HOOK_YOU_X, y: GY + 10, ...DRAG } }];
  TUGS.forEach((t, i) => {
    youKeys.push({ f: t - 1, p: { x: HOOK_YOU_X + i * 38, y: GY + 10, ...DRAG } });
    youKeys.push({ f: t + 5, p: { x: HOOK_YOU_X + (i + 1) * 38, y: GY - 6, ...DRAG, lean: -14 } });
    youKeys.push({ f: t + 14, p: { x: HOOK_YOU_X + (i + 1) * 38, y: GY + 10, ...DRAG } });
  });
  const hop = TUGS.reduce((h, t) => (f >= t && f < t + 12 ? -Math.sin(((f - t) / 12) * Math.PI) * 40 : h), 0);
  const fx = HOOK_FLAME_X + TUGS.filter((t) => f >= t).length * 8;
  return (
    <Stage
      bg={<WarmBg />}
      hits={TUGS}
      power={10}
      cam={{ z: punch(f, [8, 42, 80], 0.06) }}
      svg={
        <>
          <Flame f={f} x={fx} y={GROUND + hop} s={HOOK_FLAME_S} n={247} look={-1} mood="smug" />
          {TUGS.map((t) => (
            <Dust key={t} x={HOOK_YOU_X + 40 + TUGS.indexOf(t) * 38} y={GROUND} at={t} f={f} spread={90} />
          ))}
          <Actor f={f} color={YOU} scale={S} label="YOU" keys={youKeys} trails={false} mod={(t, p) => addPose(p, idle(t, 3))}>
            {(j) => <Leash a={j.rHand} b={collar(fx, HOOK_FLAME_S, -1, GROUND + hop)} />}
          </Actor>
        </>
      }
      html={
        <>
          <Slam f={f} at={-14} x={540} y={330} size={150} color={COL.ink}>
            DAY 247.
          </Slam>
          <Slam f={f} at={8} x={540} y={490} size={104} color={COL.red} rotate={-3} stroke={`7px ${COL.ink}`}>
            DON'T BREAK IT.
          </Slam>
          <Kinetic f={f} pages={PAGES} end={dur} />
        </>
      }
    />
  );
};
