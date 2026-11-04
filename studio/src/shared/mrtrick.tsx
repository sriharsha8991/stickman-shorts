// Mr. Trick: Spark's small rival in the series "Spark Got Tricked" (slate v4, PIPELINE §5.10). He sets the trap and never speaks.
// A thin graphite doodle: a tall crooked hat, a narrow head, one raised brow, a sly side grin, a hooked cane. An original character,
// drawn inside the pencil filter like the rest of the world. Usage (inside <g filter="url(#pencil)">):
//   <MrTrick x={900} ground={1440} scale={1.05} facing={-1} pose={{ ra1: 60 }} mood="sly" cane="down" />
// `children` gets his joints, for props in his hands.
import React from "react";
import { solve, STAND, type Joints, type Pose } from "../stickman/stick";
import { GRAPHITE, Hatch, PAPER } from "./doodle";

export type TrickMood = "sly" | "smug" | "surprised";

export const MrTrick: React.FC<{
  x?: number;
  ground?: number;
  scale?: number;
  facing?: number;
  pose?: Partial<Pose>;
  mood?: TrickMood;
  cane?: "down" | "none";
  children?: (j: Joints) => React.ReactNode;
}> = ({ x = 0, ground = 0, scale = 1.05, facing = 1, pose = {}, mood = "sly", cane = "down", children }) => {
  const p: Pose = { ...STAND, ...pose, x, y: ground - 92.5 * scale };
  const j = solve(p, scale, facing);
  const [hx, hy] = j.headC;
  const R = j.headR * 1.12;
  const w = 4.4 * scale;
  const st = { fill: "none", stroke: GRAPHITE, strokeWidth: w, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const line = (pts: number[][]) => pts.map((q) => q.join(",")).join(" ");
  const ex = facing * 5 * scale;
  const brimY = hy - R * 0.62;
  const tilt = facing * 10 * scale;
  return (
    <g>
      <polyline points={line([j.lFoot, j.lKnee, j.hip, j.rKnee, j.rFoot])} {...st} />
      <line x1={j.neck[0]} y1={j.neck[1]} x2={j.hip[0]} y2={j.hip[1]} {...st} strokeWidth={w * 1.5} />
      <polyline points={line([j.lHand, j.lElbow, j.neck, j.rElbow, j.rHand])} {...st} />
      {cane === "down" && (
        <path
          d={`M ${j.rHand[0]} ${j.rHand[1] + 58 * scale} L ${j.rHand[0]} ${j.rHand[1] - 8 * scale} q 0 -13 ${facing * 12 * scale} -13 q ${facing * 12 * scale} 0 ${facing * 11 * scale} 11`}
          {...st}
          strokeWidth={w * 0.85}
        />
      )}
      {/* head: narrow, paper white */}
      <ellipse cx={hx} cy={hy} rx={R * 0.86} ry={R * 1.08} {...st} fill="#fffaf0" />
      {/* the tall crooked hat */}
      <path
        d={`M ${hx - R * 0.72} ${brimY} L ${hx - R * 0.5 + tilt} ${brimY - 62 * scale} L ${hx + R * 0.72 + tilt} ${brimY - 66 * scale} L ${hx + R * 0.72} ${brimY} Z`}
        fill={GRAPHITE}
        stroke={GRAPHITE}
        strokeWidth={w * 0.7}
        strokeLinejoin="round"
      />
      <path d={`M ${hx - R * 0.64} ${brimY - 9 * scale} L ${hx + R * 0.72} ${brimY - 11 * scale}`} stroke={PAPER} strokeWidth={4.5 * scale} />
      <line x1={hx - R * 1.28} y1={brimY + 2} x2={hx + R * 1.28} y2={brimY - 2} stroke={GRAPHITE} strokeWidth={w * 1.15} strokeLinecap="round" />
      {/* eyes + one raised brow */}
      <g fill={GRAPHITE}>
        <circle cx={hx + ex - 4.5 * scale} cy={hy + 1 * scale} r={2 * scale} />
        <circle cx={hx + ex + 5 * scale} cy={hy + 1 * scale} r={2 * scale} />
      </g>
      <g fill="none" stroke={GRAPHITE} strokeWidth={1.9 * scale} strokeLinecap="round">
        <path d={`M ${hx + ex - 9 * scale} ${hy - 3 * scale} L ${hx + ex - 1 * scale} ${hy - (mood === "surprised" ? 6 : 2) * scale}`} />
        <path d={`M ${hx + ex + 2 * scale} ${hy - (mood === "surprised" ? 7 : 3) * scale} Q ${hx + ex + 6 * scale} ${hy - 9 * scale} ${hx + ex + 10 * scale} ${hy - (mood === "surprised" ? 6 : 5) * scale}`} />
        {mood === "sly" && <path d={`M ${hx + ex - 5 * scale} ${hy + 10 * scale} Q ${hx + ex + 2 * scale} ${hy + 11 * scale} ${hx + ex + 8 * scale} ${hy + 6 * scale}`} />}
        {mood === "smug" && <path d={`M ${hx + ex - 6 * scale} ${hy + 8 * scale} Q ${hx + ex + 1 * scale} ${hy + 15 * scale} ${hx + ex + 9 * scale} ${hy + 6 * scale}`} />}
        {mood === "surprised" && <ellipse cx={hx + ex + 1 * scale} cy={hy + 10 * scale} rx={2.5 * scale} ry={3.5 * scale} />}
      </g>
      <Hatch x={j.hip[0] - 7 * scale} y={j.neck[1]} w={14 * scale} h={j.hip[1] - j.neck[1]} gap={5 * scale} o={0.5} width={1.6} />
      {children?.(j)}
    </g>
  );
};
