import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { addPose, idle } from "../stickman/stick";
import { Stage } from "../stickman/common";
import { FONT } from "../stickman/fx";
import { Spark } from "../shared/mascot";
import { G, gestureKeys } from "../shared/gestures";
import { CaptionBand, Doodle, GRAPHITE, Hatch, Paper, PencilDefs, SketchBox, SketchLine } from "../shared/doodle";

// Style test: a morning office in pencil, doodle people around, Spark in colour.
const GROUND = 1440;
export const DoodleDemo: React.FC = () => {
  const f = useCurrentFrame();
  const keys = gestureKeys([[0, G.present], [20, { ...G.pointSide, head: -6 }, "snap"]]);
  const svg = (
    <>
      <PencilDefs f={f} />
      <Paper />
      <g filter="url(#pencil)">
        {/* window + city */}
        <SketchBox x={120} y={340} w={420} h={420} fill="#fbf6ea" />
        <SketchLine x1={330} y1={340} x2={330} y2={760} />
        <SketchLine x1={120} y1={550} x2={540} y2={550} />
        <SketchBox x={175} y={610} w={70} h={150} hatch={0.5} />
        <SketchBox x={385} y={570} w={90} h={190} hatch={0.35} />
        {/* wall clock */}
        <circle cx={800} cy={470} r={92} fill="#fbf6ea" stroke={GRAPHITE} strokeWidth={6} />
        <SketchLine x1={800} y1={470} x2={800} y2={405} />
        <SketchLine x1={800} y1={470} x2={848} y2={495} />
        {/* floor + skirting */}
        <SketchLine x1={-100} y1={GROUND} x2={1200} y2={GROUND} w={7} />
        <Hatch x={-100} y={GROUND + 4} w={1300} h={80} gap={26} o={0.28} />
        <SketchLine x1={-100} y1={1080} x2={1200} y2={1080} w={3} />
        {/* desk + laptop */}
        <SketchBox x={620} y={1120} w={400} h={26} fill="#fbf6ea" hatch={0.4} />
        <SketchLine x1={650} y1={1146} x2={650} y2={GROUND} />
        <SketchLine x1={990} y1={1146} x2={990} y2={GROUND} />
        <SketchBox x={710} y={1010} w={180} h={110} fill="#fbf6ea" />
        <path d="M 930 1120 l 8 -56 l 56 0 l 6 56 Z" fill="#fbf6ea" stroke={GRAPHITE} strokeWidth={5} />
        <path d="M 996 1076 q 22 4 2 28" fill="none" stroke={GRAPHITE} strokeWidth={5} />
        {/* doodle people around */}
        <Doodle x={830} ground={GROUND} scale={1.7} hair="bun" glasses face="bored" pose={{ ra1: 70, ra2: 60, la1: -40, la2: -60 }} facing={-1} />
        <Doodle x={1010} ground={GROUND} scale={1.5} hair="short" face="happy" pose={{ ra1: 40, ra2: 110 }} facing={-1} />
        <Doodle x={60} ground={GROUND} scale={1.45} hair="curly" face="plain" pose={{ la1: -60, la2: -90 }} />
      </g>
      <Spark f={f} trails={false} scale={2.5} base={{ x: 400, y: GROUND - 92.5 * 2.5 }} talk={(t) => Math.max(0, Math.sin(t * 0.7)) * 0.7} bulb={() => 0.5} mood={() => "shock"} look={1} keys={keys} mod={(t, p) => addPose(p, idle(t, 3))} />
    </>
  );
  const html = (
    <>
      <div style={{ position: "absolute", left: 30, right: 30, top: 150, textAlign: "center", fontFamily: FONT.title, fontWeight: 900, fontSize: 118, lineHeight: 1, color: GRAPHITE }}>
        YOUR VOICE?
      </div>
      <CaptionBand />
      <div style={{ position: "absolute", left: 90, right: 90, top: 1560, textAlign: "center", fontFamily: FONT.title, fontWeight: 800, fontSize: 60, color: "#fff" }}>
        Why does your voice sound wrong on every recording?
      </div>
    </>
  );
  return <Stage bg={<AbsoluteFill style={{ background: "#f6efdf" }} />} svg={svg} html={html} />;
};
