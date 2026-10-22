import React from "react";
import { useCurrentFrame } from "remotion";
import { Stage } from "../stickman/common";
import { COL, FONT } from "../stickman/fx";
import { Spark } from "./mascot";
import { G } from "./gestures";
import { Transition, camAt, drift, sparkAt, type TransitionKind } from "./camera";

// Reference/demo for shared/camera.tsx (16:9): camera push-ins, Spark walking to the camera, the 5 transitions.
//   node stickman-sheet.mjs CameraDemo out/camera-demo.png 0-200:20
const KINDS: [number, TransitionKind][] = [[30, "slice"], [70, "whip"], [110, "iris"], [150, "flash"], [185, "shutter"]];

export const CameraDemo: React.FC = () => {
  const f = useCurrentFrame();
  const cam = camAt(f, [
    { f: 0, z: 1 },
    { f: 40, z: 1.7, at: [420, 560], e: "snap" },
    { f: 90, z: 1, e: "smooth" },
    { f: 150, z: 1.35, at: [1300, 500], e: "snap" },
  ]);
  const sp = sparkAt(f, [
    { f: 0, x: 300, s: 1.5 },
    { f: 60, x: 520, s: 3.2 },
    { f: 120, x: 1500, s: 1.5, e: "snap" },
  ]);
  const scene = KINDS.filter(([at]) => f >= at).length;
  return (
    <Stage
      bg={<div style={{ position: "absolute", inset: 0, background: ["#0b1030", "#123a5a", "#3a1250", "#0f3d3a", "#20124a", "#1d1550"][scene] }} />}
      cam={{ ...cam, z: cam.z * drift(f) }}
      svg={
        <>
          <rect x={900} y={300} width={600} height={400} rx={30} fill="#fff" stroke={COL.ink} strokeWidth={8} />
          <line x1={0} y1={880} x2={1920} y2={880} stroke="#3fe0ff" strokeWidth={6} />
          <Spark f={f} scale={sp.s} base={{ x: sp.x, y: sp.y }} keys={[{ f: 0, p: G.present }]} mood={() => "excited"} />
        </>
      }
      html={
        <>
          <div style={{ position: "absolute", left: 1200, top: 500, transform: "translate(-50%,-50%)", fontFamily: FONT.comic, fontSize: 90 }}>SCENE {scene + 1}</div>
          {KINDS.map(([at, k]) => (
            <Transition key={at} f={f} at={at} kind={k} irisAt={[sp.x, 500]} />
          ))}
        </>
      }
    />
  );
};
