// Pencil + doodle look (owner, 2026-11-04). The world and everyone in it are hand-drawn in graphite on paper. Spark stays
// in full colour, so he is the one thing that pops. Usage:
//   <PencilDefs f={f} />                       once, first thing inside the svg
//   <g filter="url(#pencil)"> ...drawing... </g>   wobbles and roughens every line; it redraws a few times a second ("line boil")
//   <Paper />  <Hatch />  <SketchLine />  <SketchBox />  <Doodle />
import React from "react";
import { solve, type Pose, STAND } from "../stickman/stick";

export const GRAPHITE = "#3a3733";
export const SOFT = "#8d877d";
export const PAPER = "#f6efdf";
export const PAPER2 = "#ece2cc";

/** Filters: #pencil for lines, #paperGrain for the sheet. Line boil is 6 redraws a second; it can be stopped with still (test pictures). */
export const PencilDefs: React.FC<{ f: number; still?: boolean }> = ({ f, still }) => {
  const seed = still ? 3 : (Math.floor(f / 5) % 5) + 1;
  return (
    <defs>
      <filter id="pencil" x="-5%" y="-5%" width="110%" height="110%" filterUnits="objectBoundingBox">
        <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves={2} seed={seed} result="wob" />
        <feDisplacementMap in="SourceGraphic" in2="wob" scale={5} xChannelSelector="R" yChannelSelector="G" result="moved" />
        <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves={2} seed={9} result="grain" />
        <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.5 1.55" result="holes" />
        <feComposite in="moved" in2="holes" operator="in" />
      </filter>
      <filter id="paperGrain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={3} seed={4} />
        <feColorMatrix type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.3  0 0 0 0 0.22  0 0 0 0.09 0" />
      </filter>
    </defs>
  );
};

/** The sheet of paper. `lined` adds faint notebook lines. */
export const Paper: React.FC<{ x?: number; y?: number; w?: number; h?: number; tint?: string; lined?: boolean }> = ({ x = -800, y = -800, w = 3800, h = 3400, tint = PAPER, lined }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} fill={tint} />
    {lined &&
      Array.from({ length: Math.ceil(h / 74) }, (_, i) => <line key={i} x1={x} x2={x + w} y1={y + i * 74} y2={y + i * 74} stroke="#b9c7d6" strokeWidth={2} opacity={0.5} />)}
    <rect x={x} y={y} width={w} height={h} filter="url(#paperGrain)" />
  </g>
);

/** Pencil shading: slanted strokes filling a box. */
export const Hatch: React.FC<{ x: number; y: number; w: number; h: number; gap?: number; color?: string; o?: number; width?: number }> = ({ x, y, w, h, gap = 16, color = GRAPHITE, o = 0.55, width = 3 }) => {
  const n = Math.ceil((w + h) / gap);
  const id = `h${Math.round(x)}_${Math.round(y)}_${Math.round(w)}_${Math.round(h)}`;
  return (
    <g>
      <clipPath id={id}>
        <rect x={x} y={y} width={w} height={h} />
      </clipPath>
      <g clipPath={`url(#${id})`} opacity={o}>
        {Array.from({ length: n }, (_, i) => (
          <line key={i} x1={x + i * gap} y1={y} x2={x + i * gap - h} y2={y + h} stroke={color} strokeWidth={width} strokeLinecap="round" />
        ))}
      </g>
    </g>
  );
};

/** One hand-drawn line: two strokes that do not quite match. */
export const SketchLine: React.FC<{ x1: number; y1: number; x2: number; y2: number; w?: number; color?: string }> = ({ x1, y1, x2, y2, w = 5, color = GRAPHITE }) => (
  <g stroke={color} strokeLinecap="round" fill="none">
    <line x1={x1 - 6} y1={y1 + 1} x2={x2 + 5} y2={y2 - 1} strokeWidth={w} />
    <line x1={x1 + 3} y1={y1 - 2} x2={x2 - 7} y2={y2 + 2} strokeWidth={w * 0.5} opacity={0.65} />
  </g>
);

export const SketchBox: React.FC<{ x: number; y: number; w: number; h: number; fill?: string; lw?: number; hatch?: number }> = ({ x, y, w, h, fill = "none", lw = 5, hatch }) => (
  <g>
    {fill !== "none" && <rect x={x} y={y} width={w} height={h} fill={fill} />}
    {hatch !== undefined && <Hatch x={x} y={y} w={w} h={h} o={hatch} />}
    <SketchLine x1={x} y1={y} x2={x + w} y2={y} w={lw} />
    <SketchLine x1={x + w} y1={y} x2={x + w} y2={y + h} w={lw} />
    <SketchLine x1={x + w} y1={y + h} x2={x} y2={y + h} w={lw} />
    <SketchLine x1={x} y1={y + h} x2={x} y2={y} w={lw} />
  </g>
);

export type Hair = "short" | "long" | "bun" | "curly" | "bald" | "cap";
export type DoodleFace = "plain" | "happy" | "shock" | "bored" | "angry";

/** A doodle person: thin graphite limbs, a paper-white head, a simple shirt, one hair style. Mix people freely: every age, every look. */
export const Doodle: React.FC<{ pose?: Partial<Pose>; scale?: number; facing?: number; hair?: Hair; face?: DoodleFace; glasses?: boolean; shirt?: boolean; x?: number; ground?: number }> = ({
  pose = {},
  scale = 1.6,
  facing = 1,
  hair = "short",
  face = "plain",
  glasses,
  shirt = true,
  x = 0,
  ground = 0,
}) => {
  const p: Pose = { ...STAND, ...pose, x, y: ground - 92.5 * scale };
  const j = solve(p, scale, facing);
  const [hx, hy0] = j.headC;
  const R = j.headR * 1.22;
  const hy = hy0 - (R - j.headR) * 0.8;
  const w = 4.6 * scale;
  const limb = (pts: number[][]) => pts.map((q) => q.join(",")).join(" ");
  const st = { fill: "none", stroke: GRAPHITE, strokeWidth: w, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const ex = facing * 7 * scale;
  return (
    <g>
      <polyline points={limb([j.lFoot, j.lKnee, j.hip, j.rKnee, j.rFoot])} {...st} />
      <polyline points={limb([j.lFoot, j.lKnee, j.hip, j.rKnee, j.rFoot].map(([a, b]) => [a + 2.5, b - 1.5]))} {...st} strokeWidth={w * 0.45} opacity={0.6} />
      <line x1={j.neck[0]} y1={j.neck[1]} x2={j.hip[0]} y2={j.hip[1]} {...st} />
      {shirt && (
        <g>
          <path d={`M ${j.neck[0] - 18 * scale} ${j.neck[1] + 5 * scale} L ${j.neck[0] + 18 * scale} ${j.neck[1] + 5 * scale} L ${j.hip[0] + 21 * scale} ${j.hip[1]} L ${j.hip[0] - 21 * scale} ${j.hip[1]} Z`} {...st} fill={PAPER} />
          <Hatch x={j.hip[0] - 21 * scale} y={j.neck[1] + 5 * scale} w={42 * scale} h={j.hip[1] - j.neck[1] - 5 * scale} gap={9 * scale} o={0.32} width={2} />
        </g>
      )}
      <polyline points={limb([j.lHand, j.lElbow, j.neck, j.rElbow, j.rHand])} {...st} />
      <circle cx={hx} cy={hy} r={R} {...st} fill="#fffaf0" />
      <circle cx={hx + 1.5} cy={hy - 1} r={R + 1} {...st} strokeWidth={w * 0.4} opacity={0.5} />
      {hair === "short" && <path d={`M ${hx - R} ${hy - 3} Q ${hx - R + 2} ${hy - R - 9} ${hx} ${hy - R - 7} Q ${hx + R} ${hy - R - 8} ${hx + R} ${hy - 4} Q ${hx + 3} ${hy - R + 8} ${hx - R} ${hy - 3} Z`} fill={GRAPHITE} />}
      {hair === "long" && <path d={`M ${hx - R - 3} ${hy + R + 12} Q ${hx - R - 11} ${hy - R - 8} ${hx} ${hy - R - 7} Q ${hx + R + 11} ${hy - R - 8} ${hx + R + 3} ${hy + R + 12} L ${hx + R - 5} ${hy - 2} Q ${hx} ${hy - R + 7} ${hx - R + 5} ${hy - 2} Z`} fill={GRAPHITE} />}
      {hair === "bun" && (
        <g fill={GRAPHITE}>
          <circle cx={hx} cy={hy - R - 8} r={R * 0.42} />
          <path d={`M ${hx - R} ${hy - 4} Q ${hx} ${hy - R - 9} ${hx + R} ${hy - 4} Q ${hx} ${hy - R + 8} ${hx - R} ${hy - 4} Z`} />
        </g>
      )}
      {hair === "curly" &&
        [-1, -0.55, -0.1, 0.35, 0.8, 1.1].map((a, i) => <circle key={i} cx={hx + a * R} cy={hy - R * (1 - Math.abs(a) * 0.45) - 3} r={R * 0.3} fill={GRAPHITE} />)}
      {hair === "cap" && <path d={`M ${hx - R} ${hy - 6} Q ${hx} ${hy - R - 12} ${hx + R} ${hy - 6} L ${hx + facing * (R + 16)} ${hy - 4} L ${hx - facing * R} ${hy - 6} Z`} fill={GRAPHITE} />}
      {/* eyes + mouth */}
      <g fill={GRAPHITE}>
        <circle cx={hx + ex - 5 * scale} cy={hy - 1 * scale} r={2.1 * scale} />
        <circle cx={hx + ex + 6 * scale} cy={hy - 1 * scale} r={2.1 * scale} />
      </g>
      {glasses && (
        <g fill="none" stroke={GRAPHITE} strokeWidth={1.8 * scale}>
          <circle cx={hx + ex - 5 * scale} cy={hy - 1 * scale} r={5.2 * scale} />
          <circle cx={hx + ex + 6 * scale} cy={hy - 1 * scale} r={5.2 * scale} />
        </g>
      )}
      <g fill="none" stroke={GRAPHITE} strokeWidth={2 * scale} strokeLinecap="round">
        {face === "plain" && <line x1={hx + ex - 3 * scale} y1={hy + 10 * scale} x2={hx + ex + 5 * scale} y2={hy + 10 * scale} />}
        {face === "happy" && <path d={`M ${hx + ex - 5 * scale} ${hy + 8 * scale} Q ${hx + ex} ${hy + 14 * scale} ${hx + ex + 6 * scale} ${hy + 8 * scale}`} />}
        {face === "shock" && <ellipse cx={hx + ex} cy={hy + 11 * scale} rx={3 * scale} ry={4.5 * scale} />}
        {face === "bored" && <path d={`M ${hx + ex - 5 * scale} ${hy + 12 * scale} L ${hx + ex + 5 * scale} ${hy + 9 * scale}`} />}
        {face === "angry" && <path d={`M ${hx + ex - 5 * scale} ${hy + 13 * scale} Q ${hx + ex} ${hy + 8 * scale} ${hx + ex + 6 * scale} ${hy + 13 * scale}`} />}
      </g>
    </g>
  );
};

/** Charcoal band under the floor line, so VoiceCaptions (white) stay readable on a paper world. Use in the html layer. */
export const CaptionBand: React.FC<{ top?: number }> = ({ top = 1500 }) => <div style={{ position: "absolute", left: 0, right: 0, top, bottom: 0, background: "#2d2a26" }} />;
