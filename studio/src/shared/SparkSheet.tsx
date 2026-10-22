import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { addPose, idle } from "../stickman/stick";
import { FONT, COL } from "../stickman/fx";
import { Spark, type Mood } from "./mascot";
import { G, type GestureName } from "./gestures";

// Reference sheet (1920x1080): every Spark expression paired with a gesture. Render with
//   npx remotion still SparkSheet out/spark-sheet.png --frame=20
const CELLS: [Mood, GestureName][] = [
  ["neutral", "present"], ["happy", "celebrate"], ["excited", "fistPump"], ["laugh", "clap1"], ["wink", "pointSide"],
  ["curious", "thinkChin"], ["thinking", "pointUp"], ["skeptical", "armsCrossed"], ["smug", "handsHips"], ["determined", "doublePoint"],
  ["shock", "recoil"], ["mindblown", "mindBlown"], ["worried", "shrugBig"], ["sad", "facepalm"], ["angry", "stop"],
];

export const SparkSheet: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#f4f1ea" }}>
      <svg width={1920} height={1080}>
        {CELLS.map(([m, g], i) => {
          const col = i % 5;
          const row = Math.floor(i / 5);
          const x = 200 + col * 380;
          const gy = 330 + row * 355;
          return (
            <g key={i}>
              <Spark f={f} scale={1.0} base={{ x, y: gy - 92.5 * 1.0 }} keys={[{ f: 0, p: G[g] }]} mood={() => m} mod={(t, p) => addPose(p, idle(t, i))} />
              <text x={x} y={gy + 30} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={30} fill={COL.ink}>
                {m} · {g}
              </text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
