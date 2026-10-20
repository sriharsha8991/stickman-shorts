import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Actor, P, addPose, idle } from "../stickman/stick";
import { Burst, COL, Slam } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, GY, Kinetic, S, punch, type Page } from "../shared/kit";
import { Flame, Leash, Notif, WarmBg, YOU, collar } from "./parts";
import { DRAG, HOOK_FLAME_S, HOOK_FLAME_X, HOOK_YOU_X } from "./S01Hook";

// LOOP: calm walk... then the 11 PM notification. The flame swells, knocks YOU back, the leash
// snaps back on and the last frames match S01's frame 0 (DAY 247, same positions) for the loop.

const NOTIF = 22;
const SWELL = 50;
const HOOK = 64;
const TITLE = 94;
const YOU_X = 470;
const FLAME_X = 720;

const PAGES: Page[] = [
  { at: 2, text: "Easy to say…", hi: ["easy"] },
  { at: 36, text: "until the 11 PM notification.", hi: ["11", "PM"] },
];

export const S06_SFX: SfxCue[] = [
  [NOTIF, "ding", 0.9],
  [SWELL - 4, "whoosh_long", 0.6],
  [SWELL, "impact", 0.9],
  [HOOK, "clink", 0.9],
  [HOOK + 2, "chains", 0.5],
  [TITLE, "slam", 0.7],
];

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const S06Loop: React.FC<SceneProps> = ({ dur }) => {
  const f = useCurrentFrame();
  const fs = interpolate(f, [SWELL - 6, SWELL, SWELL + 5, SWELL + 9], [0.6, 1.65, 1.42, HOOK_FLAME_S], clamp);
  const fx = interpolate(f, [SWELL - 6, SWELL], [FLAME_X, HOOK_FLAME_X], clamp);
  const trot = f < SWELL - 6 ? -Math.abs(Math.sin(f * 0.32)) * 14 : 0;
  const hookT = interpolate(f, [HOOK - 6, HOOK], [0, 1], clamp);
  const notifO = interpolate(f, [TITLE - 14, TITLE - 4], [1, 0], clamp);
  return (
    <Stage
      bg={<WarmBg />}
      hits={[SWELL, HOOK]}
      power={18}
      cam={{ z: punch(f, [NOTIF, SWELL, HOOK], 0.06) }}
      svg={
        <>
          <Flame f={f} x={fx} y={GROUND + trot} s={fs} n={f >= SWELL ? 247 : undefined} look={-1} mood={f < SWELL ? "happy" : f < HOOK + 10 ? "angry" : "smug"} />
          <Burst x={HOOK_FLAME_X - 60} y={GROUND - 220} at={SWELL} f={f} size={380} color={COL.orange} />
          <Actor
            f={f}
            color={YOU}
            scale={S}
            label="YOU"
            trails
            keys={[
              { f: 0, p: { x: YOU_X, y: GY, ...P.stand, lean: 4, la1: -24, ra1: 24 } },
              { f: NOTIF, p: {} },
              { f: NOTIF + 6, p: { head: -14, ra1: 60, ra2: 90 } },
              { f: SWELL, p: {} },
              { f: SWELL + 6, p: { ...P.shock, x: HOOK_YOU_X, y: GY + 10, lean: -30 } },
              { f: HOOK - 2, p: {} },
              { f: HOOK + 6, p: { x: HOOK_YOU_X, y: GY + 10, ...DRAG } },
            ]}
            mod={(t, p) => addPose(p, idle(t, 3))}
          >
            {(j) => {
              if (hookT <= 0) return null;
              const c = collar(fx, fs, -1);
              return <Leash a={[c[0] + (j.rHand[0] - c[0]) * hookT, c[1] + (j.rHand[1] - c[1]) * hookT]} b={c} />;
            }}
          </Actor>
        </>
      }
      html={
        <>
          <div style={{ opacity: notifO }}>
            <Notif f={f} at={NOTIF} text="Your 247-day streak ends in 1 hour!" />
          </div>
          <Slam f={f} at={TITLE} x={540} y={330} size={150} color={COL.ink}>
            DAY 247.
          </Slam>
          <Kinetic f={f} pages={PAGES} end={dur} />
        </>
      }
    />
  );
};
