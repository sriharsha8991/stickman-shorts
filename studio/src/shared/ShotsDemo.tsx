import React from "react";
import { useCurrentFrame } from "remotion";
import { Stage } from "../stickman/common";
import { COL, FONT } from "../stickman/fx";
import { addPose, idle } from "../stickman/stick";
import { DayBg, K } from "./kit";
import { Spark, bulbPulse, type Mood } from "./mascot";
import { G, gestureKeys } from "./gestures";
import { camAt, Transition, VERTICAL, type Shot } from "./camera";
import { popIn, squash, wobble, arc } from "./motion";

// Reference for Shorts shot grammar (1080×1920, added 2026-10-27): wide → close-up on Spark's face →
// insert on the object → whip cut → wide reveal, plus the motion.ts helpers (wind-up pop, squash on landing,
// arc throw, follow-through wobble).  node stickman-sheet.mjs ShotsDemo out/shots.png 0-170:10
export const SHOTS_DEMO_FRAMES = 180;
const GROUND = 1290;
const SS = 1.9;
const SX = 300;
const SGY = GROUND - 92.5 * SS;
const TAG: [number, number] = [760, 900];

const SHOTS: Shot[] = [
  { f: 0, z: 1, e: "cut" }, // wide establishing
  { f: 24, z: 2.1, at: [SX, SGY - 130], e: "snap" }, // push to a close-up of Spark's face (reaction)
  { f: 60, z: 2.0, at: TAG, e: "cut" }, // hard cut: insert on the object
  { f: 100, z: 1, e: "cut" }, // whip-cut back to the wide (Transition covers it)
  { f: 140, z: 1.25, at: [600, 1000], e: "slow" }, // slow push-in for the payoff
];

export const ShotsDemo: React.FC = () => {
  const f = useCurrentFrame();
  const cam = camAt(f, SHOTS, VERTICAL);
  const mood = (t: number): Mood => (t < 24 ? "curious" : t < 60 ? "shock" : t < 100 ? "thinking" : "mindblown");
  const [sx, sy] = squash(f, 118);
  const coin = arc((f - 100) / 18, [SX + 60, SGY - 40], [760, 1180], 380);
  return (
    <Stage
      bg={<DayBg />}
      cam={cam}
      svg={
        <>
          <g transform={`translate(${TAG[0]} ${TAG[1]}) rotate(${wobble(f, 64, 12)}) scale(${popIn(f, 60)})`}>
            <line x1={0} y1={-260} x2={0} y2={-150} stroke={COL.ink} strokeWidth={5} />
            <rect x={-200} y={-150} width={400} height={300} rx={20} fill="#fff6e6" {...K} strokeWidth={8} />
            <text y={40} textAnchor="middle" fontFamily={FONT.comic} fontSize={130} fill={COL.red}>
              ₹999
            </text>
          </g>
          {f >= 100 && (
            <g transform={`translate(${coin[0]} ${coin[1]}) scale(${sx} ${sy})`}>
              <circle r={44} fill="#f4b942" {...K} strokeWidth={6} />
              <text y={18} textAnchor="middle" fontFamily={FONT.comic} fontSize={52} fill={COL.ink}>
                ₹
              </text>
            </g>
          )}
          <Spark
            f={f}
            scale={SS}
            base={{ x: SX, y: SGY }}
            facing={1}
            talk={(t) => (t % 10 < 5 ? 0.6 : 0.1)}
            mood={mood}
            bulb={(t) => bulbPulse(t, 118, 30)}
            look={1}
            keys={gestureKeys([
              [0, G.pointSide],
              [24, G.recoil, "snap"],
              [60, G.thinkChin, "snap"],
              [100, G.present, "snap"],
              [118, G.mindBlown, "snap"],
            ])}
            mod={(t, p) => addPose(p, idle(t, 2))}
          />
        </>
      }
      html={<Transition f={f} at={100} kind="whip" size={VERTICAL} />}
    />
  );
};
