import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Actor, P, addPose, idle, walkCycle } from "../stickman/stick";
import { Burst, COL } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, GY, Kinetic, S, punch, type Page } from "../shared/kit";
import { Choice, Flame, GroundDashes, Leash, WarmBg, YOU, collar } from "./parts";

// PAYOFF: one question. Cards THE HABIT vs THE NUMBER. YOU unclips the leash (UNCLIP), the flame
// shrinks back to a friendly size, the NUMBER card greys out, and they walk on side by side.

const CARD1 = 50;
const CARD2 = 100;
const UNCLIP = 132;
const WALK = 176;
const YOU_X = 470;
const FLAME_X = 830;

const PAGES: Page[] = [
  { at: 2, text: "So next time, ask:", hi: ["ask"] },
  { at: 46, text: "Do I want the habit…", hi: ["habit"] },
  { at: 96, text: "or just the number?", hi: ["number"] },
  { at: 170, text: "Send this to your streak buddy.", hi: ["streak", "buddy"] },
];

export const S05_SFX: SfxCue[] = [
  [CARD1, "pop", 0.8],
  [CARD2, "pop", 0.8],
  [UNCLIP, "clink", 0.9],
  [UNCLIP + 4, "swirl", 0.5],
  [UNCLIP + 10, "ding", 0.8],
  [WALK, "boing", 0.4],
];

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const S05Choice: React.FC<SceneProps> = ({ dur }) => {
  const f = useCurrentFrame();
  const free = f >= UNCLIP;
  const fs = interpolate(f, [UNCLIP, UNCLIP + 6, UNCLIP + 10, UNCLIP + 14], [1.2, 0.5, 0.66, 0.6], clamp);
  const fx = interpolate(f, [UNCLIP, UNCLIP + 14], [FLAME_X, 720], clamp);
  const walking = f >= WALK;
  const trot = walking ? -Math.abs(Math.sin(f * 0.32)) * 16 : f < UNCLIP ? -Math.abs(Math.sin(f * 0.18)) * 8 : 0;
  // the dropped leash end falls to the ground
  const dropT = interpolate(f, [UNCLIP, UNCLIP + 10], [0, 1], { ...clamp, easing: (t) => t * t });
  return (
    <Stage
      bg={<WarmBg />}
      hits={[UNCLIP]}
      power={10}
      cam={{ z: punch(f, [0, CARD1, CARD2, UNCLIP, 170], 0.05) }}
      svg={
        <>
          {walking && <GroundDashes f={f - WALK} speed={6} />}
          <Flame f={f} x={fx} y={GROUND + trot} s={fs} n={free ? undefined : 247} look={-1} mood={free ? "happy" : "smug"} />
          <Burst x={fx} y={GROUND - 120} at={UNCLIP} f={f} size={260} color={COL.yellow} />
          <Actor
            f={f}
            color={YOU}
            scale={S}
            label="YOU"
            trails={false}
            keys={[
              { f: 0, p: { x: YOU_X, y: GY, ...P.stand, ra1: 80, ra2: -6, lean: -8 } },
              { f: CARD1 - 6, p: {} },
              { f: CARD1, p: { ...P.think, ra1: 80, ra2: -6, lean: 0, la1: -30, la2: -140, head: -10 } },
              { f: UNCLIP - 6, p: {} },
              { f: UNCLIP, p: { ra1: 120, ra2: 30, head: 0 } },
              { f: UNCLIP + 12, p: { ...P.cheer } },
              { f: WALK - 4, p: { ...P.cheer } },
              { f: WALK + 4, p: { ...P.stand, lean: 6, la1: -24, ra1: 24 } },
            ]}
            mod={(t, p) => (walking ? addPose(p, walkCycle(t, 0.24)) : addPose(p, idle(t, 2)))}
          >
            {(j) =>
              !free ? (
                <Leash a={j.rHand} b={collar(fx, fs, -1, GROUND + trot)} sag={10} />
              ) : dropT < 1 ? (
                <Leash a={[j.rHand[0] + (fx - 100 - j.rHand[0]) * dropT, j.rHand[1] + (GROUND - 10 - j.rHand[1]) * dropT]} b={[fx - 100, GROUND - 10]} sag={20} />
              ) : (
                <path d={`M ${fx - 100} ${GROUND - 6} q 60 -18 120 0`} stroke="#d6263b" strokeWidth={6} fill="none" opacity={walking ? 0 : 1} />
              )
            }
          </Actor>
        </>
      }
      html={
        <>
          <Choice f={f} at={CARD1} x={300} title="THE HABIT" sub="PRACTICE" color={COL.green} check={free} />
          <Choice f={f} at={CARD2} x={780} title="THE NUMBER" sub="247" color={COL.red} dim={free ? 0.35 : 1} />
          <Kinetic f={f} pages={PAGES} end={dur} />
        </>
      }
    />
  );
};
