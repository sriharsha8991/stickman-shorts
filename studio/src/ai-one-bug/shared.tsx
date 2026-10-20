import React from "react";
import { COL, Paper } from "../stickman/fx";
import { groundY } from "../stickman/stick";

// Vertical 1080x1920 layout constants
export const CX = 540;
export const GROUND = 1290;
export const S = 1.7; // character scale (bigger reads better on a phone)
export const GY = groundY(S, GROUND);

export const YOU_COLOR = COL.orange;
export const AI_COLOR = COL.blue;

export const Bg: React.FC = () => <Paper ground={GROUND} />;

const K = { stroke: COL.ink, strokeWidth: 5, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

// the bug: red beetle with googly eyes, legs wiggle while walking.
// (x, y) = point where the bug touches the ground; dir 1 = faces right.
export const Bug: React.FC<{ f: number; x: number; y?: number; s?: number; walking?: boolean; dir?: number; look?: number }> = ({
  f,
  x,
  y = GROUND,
  s = 1,
  walking = false,
  dir = 1,
  look = 0,
}) => {
  const w = walking ? Math.sin(f * 0.9) * 14 : Math.sin(f * 0.25) * 3;
  const bob = walking ? Math.abs(Math.sin(f * 0.9)) * 4 : 0;
  const legs = [-22, 0, 22].map((lx, i) => {
    const a = (i % 2 === 0 ? w : -w) * 0.8;
    return (
      <g key={i}>
        <path d={`M ${lx} -18 L ${lx - 14 + a} -6 L ${lx - 20 + a} 0`} fill="none" {...K} strokeWidth={4} />
        <path d={`M ${lx} -18 L ${lx + 14 - a} -6 L ${lx + 20 - a} 0`} fill="none" {...K} strokeWidth={4} />
      </g>
    );
  });
  return (
    <g transform={`translate(${x} ${y - bob}) scale(${s * dir} ${s})`}>
      {legs}
      {/* body */}
      <ellipse cx={0} cy={-30} rx={38} ry={24} fill={COL.red} {...K} />
      <line x1={0} y1={-54} x2={0} y2={-8} stroke={COL.ink} strokeWidth={4} />
      <circle cx={-14} cy={-36} r={5} fill={COL.ink} />
      <circle cx={14} cy={-26} r={4} fill={COL.ink} />
      {/* head */}
      <circle cx={44} cy={-34} r={17} fill={COL.ink} />
      {/* antennae */}
      <path d={`M 50 -48 Q 58 -72 ${70 + w * 0.3} -76`} fill="none" {...K} strokeWidth={4} />
      <path d={`M 40 -50 Q 40 -74 ${48 - w * 0.3} -82`} fill="none" {...K} strokeWidth={4} />
      {/* googly eyes (look: 0 = forward, 1 = at the camera) */}
      <circle cx={42} cy={-40} r={10} fill="#fff" {...K} strokeWidth={3} />
      <circle cx={58} cy={-38} r={9} fill="#fff" {...K} strokeWidth={3} />
      <circle cx={45 - look * 3} cy={-38 + look * 1} r={4} fill={COL.ink} />
      <circle cx={60 - look * 3} cy={-36 + look * 1} r={4} fill={COL.ink} />
    </g>
  );
};
