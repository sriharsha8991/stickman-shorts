import React from "react";
import { useCurrentFrame } from "remotion";
import { Actor, type Key } from "../stickman/stick";
import { COL, FONT, Slam, ease } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { BED, Bed, Blanket, Glow, Kinetic, NightBg, Nightstand, Phone, S, punch, type Page } from "./kit";

// HOOK. Night, 2:47 AM, YOU sitting up in bed, face lit by the phone, thumb flicking.
// Three hook layers: first frame (lit face + clock) · overlay (2:47 AM. STILL SCROLLING.) ·
// caption line (the scored hook).

export const BED_HIP = { x: 330, y: BED.top - 6 };

// sitting up in bed, legs under the blanket, phone held at chest height
export const BED_POSE = {
  x: BED_HIP.x,
  y: BED_HIP.y,
  lean: -6,
  head: 14,
  ll1: 88,
  ll2: 0,
  rl1: 92,
  rl2: 0,
  la1: 48,
  la2: 70,
  ra1: 62,
  ra2: 58,
};

export const FLICKS = [14, 40, 62, 88, 108];
export const flickScroll = (f: number) => FLICKS.reduce((s, at) => s + ease(f, at, at + 6, 0, 34), 0);

const PAGES: Page[] = [
  { at: 6, text: "If you lose hours" },
  { at: 34, text: "to your feed every night…", hi: ["night"] },
  { at: 66, text: "one 2006 design decision is why.", hi: ["2006", "why"] },
];

export const S01_SFX: SfxCue[] = [
  [0, "slam", 0.6],
  [8, "whoosh", 0.4],
  ...FLICKS.map((f): SfxCue => [f, "swish", 0.25]),
  [66, "impact", 0.5],
];

export const S01Night: React.FC<SceneProps> = ({ dur }) => {
  const f = useCurrentFrame();
  const keys: Key[] = [{ f: 0, p: BED_POSE }];
  return (
    <Stage
      bg={<NightBg f={f} />}
      hits={[66]}
      power={8}
      cam={{ z: punch(f, [0, 66], 0.06) }}
      svg={
        <>
          <Bed />
          <Nightstand clock="2:47" f={f} />
          <Glow x={400} y={1010} r={280} o={0.5} />
          <Actor
            f={f}
            color={COL.orange}
            scale={S}
            label="YOU"
            keys={keys}
            trails={false}
            mod={(t, p) => {
              // thumb flicks on the beats + slow breathing
              const flick = FLICKS.reduce((a, at) => a + (t >= at && t < at + 8 ? Math.sin(((t - at) / 8) * Math.PI) * 26 : 0), 0);
              return { ...p, ra2: p.ra2 - flick, lean: p.lean + Math.sin(t * 0.1) * 1.2 };
            }}
          >
            {(j) => (
              <Phone x={(j.lHand[0] + j.rHand[0]) / 2 + 6} y={(j.lHand[1] + j.rHand[1]) / 2 - 30} s={0.95} r={-12} scroll={flickScroll(f)} />
            )}
          </Actor>
          <Blanket />
        </>
      }
      html={
        <>
          <Slam f={f} at={0} x={540} y={330} size={170} color="#ffffff" stroke={`10px ${COL.ink}`}>
            2:47 AM.
          </Slam>
          <Slam f={f} at={8} x={540} y={480} size={84} font={FONT.title} weight={900} spacing={6} color={COL.yellow}>
            STILL SCROLLING.
          </Slam>
          <Kinetic f={f} pages={PAGES} end={dur} />
        </>
      }
    />
  );
};
