import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Actor, SMOOTH, addPose, runCycle, walkCycle } from "../stickman/stick";
import { Burst, COL, Dust, Slam, SpeedLines } from "../stickman/fx";
import { Stage, Stamp } from "../stickman/common";
import type { SceneProps } from "./Video";
import { range, type SfxCue } from "./sfx";
import { GROUND, GY, Kinetic, S, punch, type Page } from "../shared/kit";
import { Flame, GroundDashes, Leash, WarmBg, YOU, collar } from "./parts";

// Day 1 you walk a tiny flame. The day counter races to 247, the flame grows, then leaps
// over YOU (FLIP) and starts dragging him the other way round.

const COUNT_A = 56;
const COUNT_B = 124;
const FLIP = 135;
const YOU_X = 560;
const BEHIND_X = 250;
const AHEAD_X = 840;

const PAGES: Page[] = [
  { at: 0, text: "Day 1: you walk the streak.", hi: ["you"] },
  { at: 56, text: "Every day, it grows…", hi: ["grows"] },
  { at: 128, text: "Day 247: it walks YOU.", hi: ["YOU"] },
];

export const S02_SFX: SfxCue[] = [
  [0, "pop", 0.6],
  [COUNT_A, "riser", 0.6],
  ...range(COUNT_A, 18, 4, "tick", 0.22),
  [FLIP - 8, "whoosh_long", 0.6],
  [FLIP, "impact", 0.9],
  [FLIP + 12, "stamp", 0.8],
];

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const S02Origin: React.FC<SceneProps> = ({ dur }) => {
  const f = useCurrentFrame();
  const day = Math.round(interpolate(f, [COUNT_A, COUNT_B], [1, 247], { ...clamp, easing: (t) => t * t }));
  const fs = interpolate(day, [1, 247], [0.38, 1.25]);
  // the leap: arc from behind YOU to ahead of him
  const t = interpolate(f, [FLIP - 10, FLIP], [0, 1], { ...clamp, easing: SMOOTH });
  const flipped = f >= FLIP - 10;
  const fx = flipped ? interpolate(t, [0, 1], [BEHIND_X, AHEAD_X]) : BEHIND_X;
  const trot = f < FLIP - 10 ? -Math.abs(Math.sin(f * 0.32)) * 22 * fs : f >= FLIP ? -Math.abs(Math.sin(f * 0.4)) * 18 : -Math.sin(t * Math.PI) * 520;
  const side: -1 | 1 = f >= FLIP - 5 ? -1 : 1;
  const walking = f < FLIP;
  return (
    <Stage
      bg={<WarmBg />}
      hits={[FLIP]}
      power={20}
      cam={{ z: punch(f, [0, COUNT_A, FLIP, 160], 0.06) }}
      svg={
        <>
          <GroundDashes f={f} speed={f < FLIP ? 7 : 16} />
          {f >= FLIP && <SpeedLines f={f} from={FLIP} to={dur} dir={-1} />}
          <Flame f={f} x={fx} y={GROUND + trot} s={fs} n={day} look={side === 1 ? 1 : -1} mood={f >= FLIP ? "angry" : "happy"} />
          <Burst x={AHEAD_X - 60} y={GROUND - 200} at={FLIP} f={f} size={340} color={COL.yellow} />
          <Dust x={AHEAD_X} y={GROUND} at={FLIP} f={f} spread={160} />
          <Actor
            f={f}
            color={YOU}
            scale={S}
            label="YOU"
            trails={f >= FLIP}
            keys={[
              { f: 0, p: { x: YOU_X, y: GY, lean: 6, la1: -48, la2: -6, ra1: 22, ra2: -10, head: -4 } },
              { f: FLIP - 1, p: {} },
              { f: FLIP + 5, p: { x: YOU_X - 60, lean: 34, la1: 110, la2: 0, ra1: 95, ra2: -6, head: 10 } },
              { f: FLIP + 16, p: { x: YOU_X - 40, lean: 26 } },
            ]}
            mod={(tt, p) => (walking ? addPose(p, walkCycle(tt, 0.24)) : addPose(p, runCycle(tt, 0.6, 0.8)))}
          >
            {(j) => <Leash a={walking ? j.lHand : j.rHand} b={collar(fx, fs, side, GROUND + trot)} sag={walking ? 40 : 0} />}
          </Actor>
        </>
      }
      html={
        <>
          <div
            style={{
              position: "absolute",
              top: 270,
              width: 1080,
              textAlign: "center",
              fontFamily: "Bangers",
              fontSize: 190 + (f >= COUNT_A && f < COUNT_B ? 14 * Math.sin(f) : 0),
              color: f >= COUNT_B ? COL.red : COL.ink,
              letterSpacing: 4,
              transform: `rotate(${f >= COUNT_B ? -3 : 0}deg)`,
            }}
          >
            DAY {day}
          </div>
          <Stamp f={f} at={FLIP + 12} x={540} y={560} text="HOSTAGE" color={COL.red} size={96} r={-8} />
          <Slam f={f} at={FLIP} x={850} y={760} size={80} color={COL.orange} rotate={8} stroke={`6px ${COL.ink}`} out={FLIP + 40}>
            YOINK!
          </Slam>
          <Kinetic f={f} pages={PAGES} end={dur} />
        </>
      }
    />
  );
};
