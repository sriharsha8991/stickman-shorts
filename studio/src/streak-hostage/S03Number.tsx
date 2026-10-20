import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Burst, COL, Dust, FONT, Slam } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SceneProps } from "./Video";
import { range, type SfxCue } from "./sfx";
import { GROUND, Kinetic, punch, type Page } from "../shared/kit";
import { GainChip, LossBlock, Scale, WarmBg } from "./parts";

// THE WOW (number reveal): a balance scale, +1 DAY vs -247. The multiplier counts up with a riser
// and lands "2×" on the bar line (local 120 = global 420), slamming the loss pan down.

const DROP = 6;
const TEASE = 60;
const HIT = 120;
const PX = 540;
const PY = 800;

const PAGES: Page[] = [
  { at: 4, text: "Your brain doesn't weigh these equally.", hi: ["equally"] },
  { at: TEASE, text: "Losing feels about…" },
  { at: HIT, text: "2× stronger", hi: ["2×"] },
  { at: 150, text: "than an equal gain.", hi: ["gain"] },
  { at: 192, text: "That's loss aversion.", hi: ["loss", "aversion"] },
];

export const S03_SFX: SfxCue[] = [
  [DROP, "thud", 0.7],
  [TEASE, "riser", 0.8],
  ...range(TEASE + 2, 14, 4, "tick", 0.25),
  [HIT, "explosion", 0.4],
  [HIT, "impact", 0.75],
  [HIT + 2, "crash", 0.5],
  [192, "slam", 0.8],
];

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const S03Number: React.FC<SceneProps> = ({ dur }) => {
  const f = useCurrentFrame();
  const enter = interpolate(f, [0, DROP], [-900, 0], { ...clamp, easing: (t) => t * t });
  const wobble = f < HIT ? Math.sin(f * 0.25) * interpolate(f, [TEASE, HIT], [2, 7], clamp) : 0;
  const tilt =
    f < HIT
      ? wobble
      : interpolate(f, [HIT, HIT + 4, HIT + 9, HIT + 14], [0, 25, 19, 22], clamp) + Math.sin((f - HIT) * 0.5) * interpolate(f, [HIT, HIT + 40], [3, 0], clamp);
  const mult = interpolate(f, [TEASE + 4, HIT - 2], [1, 1.95], { ...clamp, easing: (t) => t * t * t });
  const flash = f < HIT ? 0 : interpolate(f, [HIT, HIT + 7], [0.8, 0], clamp);
  const panR: [number, number] = [PX + 300 * Math.cos((22 * Math.PI) / 180), PY + 300 * Math.sin((22 * Math.PI) / 180) + 200];
  return (
    <Stage
      bg={<WarmBg />}
      hits={[DROP, HIT, 192]}
      power={24}
      cam={{ z: punch(f, [DROP, TEASE, HIT, 192], 0.07) }}
      svg={
        <g transform={`translate(0 ${enter})`}>
          <Scale x={PX} y={PY} tilt={tilt} left={<GainChip />} right={<LossBlock />} />
          <Burst x={panR[0]} y={panR[1]} at={HIT} f={f} size={360} color={COL.red} />
          <Dust x={PX} y={GROUND} at={DROP} f={f} spread={180} />
        </g>
      }
      html={
        <>
          <div style={{ position: "absolute", top: 262, width: 1080, textAlign: "center", fontFamily: FONT.body, fontWeight: 700, fontSize: 28, color: "#7a6a58" }}>
            Tversky &amp; Kahneman 1992 · meta-analysis of 607 estimates, 2024
          </div>
          {f >= TEASE && f < HIT && (
            <div
              style={{
                position: "absolute",
                top: 330,
                width: 1080,
                textAlign: "center",
                fontFamily: FONT.comic,
                fontSize: 210 + (mult - 1) * 60,
                color: COL.ink,
                transform: `translate(${Math.sin(f * 2.1) * (mult - 1) * 10}px, 0)`,
              }}
            >
              {mult.toFixed(1)}×
            </div>
          )}
          <Slam f={f} at={HIT} x={540} y={450} size={300} color={COL.red} stroke={`10px ${COL.ink}`}>
            2×
          </Slam>
          <Slam f={f} at={192} x={540} y={630} size={84} color={COL.purple} rotate={-3} stroke={`6px ${COL.ink}`}>
            LOSS AVERSION
          </Slam>
          <Kinetic f={f} pages={PAGES} end={dur} />
          {flash > 0 && <AbsoluteFill style={{ background: "#fff", opacity: flash }} />}
        </>
      }
    />
  );
};
