import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Actor } from "../stickman/stick";
import { COL } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { Bed, Blanket, Glow, Kinetic, NightBg, Nightstand, Phone, S, type Page } from "./kit";
import { BED_POSE } from "./S01Night";

// LOOP. Same framing as frame 0. The phone buzzes on the blanket, YOU grabs it and settles into the
// exact pose of S1's first frame. Clock 2:46 -> the cut to S1 reads "2:47 AM." (sentence loop).

const GRAB = 70;
const SETTLE = 100;
const PHONE_REST: [number, number] = [575, 1112];

const PAGES: Page[] = [{ at: 12, text: "But tonight, around…" }];

export const S06_SFX: SfxCue[] = [
  [8, "buzz", 0.22],
  [32, "buzz", 0.22],
  [GRAB, "swish", 0.4],
];

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const S06Loop: React.FC<SceneProps> = ({ dur }) => {
  const f = useCurrentFrame();
  const buzz = f < GRAB && (f % 24 < 8) ? Math.sin(f * 3) * 4 : 0;
  const lit = interpolate(f, [GRAB, SETTLE], [0, 0.5], clamp);
  return (
    <Stage
      bg={<NightBg f={f} />}
      svg={
        <>
          <Bed />
          <Nightstand clock="2:46" f={f} />
          {lit > 0 && <Glow x={400} y={1010} r={280} o={lit} />}
          <Actor
            f={f}
            color={COL.orange}
            scale={S}
            label="YOU"
            trails={false}
            keys={[
              { f: 0, p: { ...BED_POSE, la1: 10, la2: 10, ra1: 20, ra2: 10, head: 30, lean: -10 } }, // lying back, eyes on the buzz
              { f: 40, p: { head: 30 } },
              { f: GRAB, p: { lean: 34, head: 10, la1: 75, la2: 10, ra1: 85, ra2: 0 } }, // reach
              { f: SETTLE, p: { ...BED_POSE } },
            ]}
            mod={(t, p) => ({ ...p, lean: p.lean + Math.sin(t * 0.1) * 1.2 })}
          >
            {(j) =>
              f >= GRAB ? <Phone x={(j.lHand[0] + j.rHand[0]) / 2 + 6} y={(j.lHand[1] + j.rHand[1]) / 2 - 30} s={0.95} r={-12} /> : null
            }
          </Actor>
          <Blanket />
          {f < GRAB && <Phone x={PHONE_REST[0] + buzz} y={PHONE_REST[1]} s={0.8} r={80} glow={f % 24 < 8 ? 1 : 0.3} />}
        </>
      }
      html={<Kinetic f={f} pages={PAGES} end={dur + 4} />}
    />
  );
};
