import React from "react";
import { AbsoluteFill, interpolate, spring } from "remotion";
import { COL, FONT, Paper } from "../stickman/fx";
import { GROUND, K } from "../shared/kit";

// V003 props: the streak flame (a pet on a leash), the leash, the loss-aversion balance scale,
// the "streak freeze" stall and the lock-screen notification. All original drawings.

export const WARM = "#fbe6c8";
export const COLD = "#dbe8f2";
export const YOU = COL.blue;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const WarmBg: React.FC<{ tint?: string }> = ({ tint = WARM }) => (
  <AbsoluteFill>
    <Paper ground={GROUND} tint={tint} />
    <svg width={1080} height={1920} style={{ position: "absolute" }}>
      {/* low sun behind everything */}
      <circle cx={540} cy={GROUND} r={420} fill="#ffcf8a" opacity={tint === WARM ? 0.35 : 0} />
      <rect x={0} y={GROUND} width={1080} height={1920 - GROUND} fill="#e9c79c" opacity={tint === WARM ? 0.55 : 0} />
      <rect x={0} y={GROUND} width={1080} height={1920 - GROUND} fill="#b9cfe0" opacity={tint === COLD ? 0.55 : 0} />
    </svg>
  </AbsoluteFill>
);

// ground dashes that scroll left: sells "walking" while the figures walk in place
export const GroundDashes: React.FC<{ f: number; speed?: number }> = ({ f, speed = 9 }) => (
  <g>
    {Array.from({ length: 9 }, (_, i) => {
      const x = ((((i * 150 - f * speed) % 1350) + 1350) % 1350) - 135;
      return <line key={i} x1={x} y1={GROUND + 34} x2={x + 60} y2={GROUND + 34} stroke="#c49a6c" strokeWidth={6} strokeLinecap="round" />;
    })}
  </g>
);

const FW = 100;
const FH = 260;

// where the leash clips on (side -1 = left side of the flame, 1 = right)
export const collar = (x: number, s: number, side: -1 | 1, y = GROUND): [number, number] => [x + side * FW * 0.86 * s, y - FH * 0.3 * s];

export type Mood = "smug" | "angry" | "happy" | "weak";

// the streak: a flame creature standing on the ground at (x, y), number on its belly
export const Flame: React.FC<{ f: number; x: number; s: number; n?: number | string; y?: number; look?: number; mood?: Mood; dim?: number; squash?: number }> = ({
  f,
  x,
  s,
  n,
  y = GROUND,
  look = -1,
  mood = "smug",
  dim = 1,
  squash = 1,
}) => {
  const fl = Math.sin(f * 0.45) * 14 + Math.sin(f * 0.21) * 8;
  const W = FW;
  const H = FH * (0.97 + 0.03 * Math.sin(f * 0.6)) * squash;
  const outer = `M ${-W} ${-H * 0.28} C ${-W} ${-H * 0.62}, ${-W * 0.35 + fl * 0.5} ${-H * 0.72}, ${fl} ${-H}
    C ${W * 0.2 + fl * 0.3} ${-H * 0.78}, ${W * 0.55} ${-H * 0.8}, ${W * 0.62} ${-H * 0.66}
    C ${W * 0.95} ${-H * 0.55}, ${W} ${-H * 0.45}, ${W} ${-H * 0.28}
    C ${W} ${-H * 0.06}, ${W * 0.55} 0, 0 0 C ${-W * 0.55} 0, ${-W} ${-H * 0.06}, ${-W} ${-H * 0.28} Z`;
  const inner = `M ${-W * 0.6} ${-H * 0.2} C ${-W * 0.6} ${-H * 0.45}, ${-W * 0.1} ${-H * 0.5}, ${fl * 0.6} ${-H * 0.7}
    C ${W * 0.3} ${-H * 0.5}, ${W * 0.6} ${-H * 0.42}, ${W * 0.6} ${-H * 0.2}
    C ${W * 0.6} ${-H * 0.04}, ${W * 0.3} ${-H * 0.02}, 0 ${-H * 0.02} C ${-W * 0.3} ${-H * 0.02}, ${-W * 0.6} ${-H * 0.04}, ${-W * 0.6} ${-H * 0.2} Z`;
  const ey = -H * 0.5;
  const brow = mood === "angry" ? 1 : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={dim}>
      <path d={outer} fill={mood === "weak" ? "#f0a35e" : "#ff7a1a"} {...K} />
      <path d={inner} fill={mood === "weak" ? "#f7d59a" : "#ffd23f"} />
      {/* eyes */}
      {[-30, 30].map((dx) => (
        <g key={dx} transform={`translate(${dx} ${ey})`}>
          <ellipse rx={17} ry={mood === "happy" ? 6 : 21} fill="#fff" stroke={COL.ink} strokeWidth={5} />
          {mood !== "happy" && <circle cx={look * 7} cy={3} r={8} fill={COL.ink} />}
          {brow > 0 && <line x1={-20} y1={dx < 0 ? -34 : -22} x2={20} y2={dx < 0 ? -22 : -34} stroke={COL.ink} strokeWidth={7} strokeLinecap="round" />}
        </g>
      ))}
      {/* mouth */}
      {mood === "happy" ? (
        <path d={`M -22 ${ey + 34} Q 0 ${ey + 56} 22 ${ey + 34}`} fill="none" stroke={COL.ink} strokeWidth={6} strokeLinecap="round" />
      ) : mood === "weak" ? (
        <path d={`M -16 ${ey + 46} Q 0 ${ey + 36} 16 ${ey + 46}`} fill="none" stroke={COL.ink} strokeWidth={6} strokeLinecap="round" />
      ) : (
        <path d={`M -24 ${ey + 36} Q 4 ${ey + 50} 26 ${ey + 30}`} fill="none" stroke={COL.ink} strokeWidth={6} strokeLinecap="round" />
      )}
      {/* collar */}
      <path d={`M ${-W * 0.9} ${-H * 0.3} Q 0 ${-H * 0.22} ${W * 0.9} ${-H * 0.3}`} fill="none" stroke="#7a3b16" strokeWidth={12} strokeLinecap="round" />
      {n !== undefined && (
        <text y={-H * 0.07} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={62} fill={COL.ink}>
          {n}
        </text>
      )}
    </g>
  );
};

// leash between a hand and a collar; sag 0 = taut
export const Leash: React.FC<{ a: [number, number]; b: [number, number]; sag?: number }> = ({ a, b, sag = 0 }) => {
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2 + sag;
  return (
    <g>
      <path d={`M ${a[0]} ${a[1]} Q ${mx} ${my} ${b[0]} ${b[1]}`} fill="none" stroke={COL.ink} strokeWidth={12} strokeLinecap="round" />
      <path d={`M ${a[0]} ${a[1]} Q ${mx} ${my} ${b[0]} ${b[1]}`} fill="none" stroke="#d6263b" strokeWidth={6} strokeLinecap="round" />
      <circle cx={b[0]} cy={b[1]} r={9} fill="#9a9a9a" {...K} strokeWidth={4} />
    </g>
  );
};

// balance scale; tilt > 0 = right pan down
export const Scale: React.FC<{ x: number; y: number; tilt: number; left: React.ReactNode; right: React.ReactNode }> = ({ x, y, tilt, left, right }) => {
  const L = 300;
  const rad = (tilt * Math.PI) / 180;
  const ends: [number, number][] = [
    [x - L * Math.cos(rad), y - L * Math.sin(rad)],
    [x + L * Math.cos(rad), y + L * Math.sin(rad)],
  ];
  const HANG = 170;
  return (
    <g>
      {/* post + base */}
      <rect x={x - 16} y={y} width={32} height={GROUND - y - 20} fill="#8a5a33" {...K} />
      <rect x={x - 120} y={GROUND - 34} width={240} height={34} rx={10} fill="#6b4226" {...K} />
      {ends.map(([ex, ey], i) => (
        <g key={i}>
          <line x1={ex} y1={ey} x2={ex - 90} y2={ey + HANG} stroke={COL.ink} strokeWidth={4} />
          <line x1={ex} y1={ey} x2={ex + 90} y2={ey + HANG} stroke={COL.ink} strokeWidth={4} />
          <path d={`M ${ex - 110} ${ey + HANG} Q ${ex} ${ey + HANG + 60} ${ex + 110} ${ey + HANG} Z`} fill="#c9c9c9" {...K} />
          <g transform={`translate(${ex} ${ey + HANG - 8})`}>{i === 0 ? left : right}</g>
        </g>
      ))}
      <line x1={ends[0][0]} y1={ends[0][1]} x2={ends[1][0]} y2={ends[1][1]} stroke={COL.ink} strokeWidth={22} strokeLinecap="round" />
      <line x1={ends[0][0]} y1={ends[0][1]} x2={ends[1][0]} y2={ends[1][1]} stroke="#d9a441" strokeWidth={12} strokeLinecap="round" />
      <circle cx={x} cy={y} r={26} fill={COL.gold} {...K} />
    </g>
  );
};

// what sits on each pan (drawn with the bottom at y = 0)
export const GainChip: React.FC = () => (
  <g>
    <rect x={-80} y={-80} width={160} height={80} rx={16} fill={COL.green} {...K} />
    <text y={-26} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={48} fill="#fff">
      +1 DAY
    </text>
  </g>
);
export const LossBlock: React.FC = () => (
  <g>
    <rect x={-95} y={-120} width={190} height={120} rx={14} fill={COL.red} {...K} />
    <text y={-62} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={58} fill="#fff">
      −247
    </text>
    <text y={-20} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={30} fill="#fff">
      DAYS
    </text>
  </g>
);

// gem icon used as the in-app price
export const Gem: React.FC<{ s?: number }> = ({ s = 1 }) => (
  <g transform={`scale(${s})`}>
    <polygon points="0,-22 20,-6 0,22 -20,-6" fill="#3fc1c9" {...K} strokeWidth={4} />
    <line x1={-20} y1={-6} x2={20} y2={-6} stroke={COL.ink} strokeWidth={3} />
  </g>
);

// the shop stall; `sign` 0..1 = the sign has dropped in
export const Stall: React.FC<{ x: number; sign: number; signY: number }> = ({ x, signY }) => {
  const W = 360;
  const top = 1060;
  return (
    <g>
      {/* poles */}
      <rect x={x - W / 2} y={820} width={18} height={top - 820} fill="#8a5a33" {...K} strokeWidth={4} />
      <rect x={x + W / 2 - 18} y={820} width={18} height={top - 820} fill="#8a5a33" {...K} strokeWidth={4} />
      {/* awning */}
      {Array.from({ length: 6 }, (_, i) => (
        <path
          key={i}
          d={`M ${x - W / 2 - 20 + i * ((W + 40) / 6)} ${signY + 60} h ${(W + 40) / 6} v 50 q ${-(W + 40) / 12} 26 ${-(W + 40) / 6} 0 Z`}
          fill={i % 2 ? "#ffffff" : "#4aa3d8"}
          {...K}
          strokeWidth={4}
        />
      ))}
      {/* sign */}
      <rect x={x - W / 2 - 10} y={signY - 70} width={W + 20} height={124} rx={18} fill="#e8f5ff" {...K} />
      <text x={x} y={signY - 20} textAnchor="middle" fontFamily={FONT.comic} fontSize={54} fill="#1f6fa8" letterSpacing={2}>
        STREAK
      </text>
      <text x={x} y={signY + 34} textAnchor="middle" fontFamily={FONT.comic} fontSize={54} fill="#1f6fa8" letterSpacing={2}>
        FREEZE
      </text>
      {/* counter */}
      <rect x={x - W / 2 - 20} y={top} width={W + 40} height={GROUND - top} rx={10} fill="#a8d4f0" {...K} />
      <rect x={x - W / 2 - 30} y={top - 18} width={W + 60} height={30} rx={8} fill="#ffffff" {...K} strokeWidth={5} />
    </g>
  );
};

// little ice cube for sale on the counter, with a gem price tag
export const IceForSale: React.FC<{ x: number; y: number; o?: number }> = ({ x, y, o = 1 }) => (
  <g transform={`translate(${x} ${y})`} opacity={o}>
    <rect x={-46} y={-92} width={92} height={92} rx={14} fill="rgba(160,215,245,0.85)" stroke="#4aa3d8" strokeWidth={6} />
    <polyline points="-30,-70 -10,-80" stroke="#fff" strokeWidth={7} strokeLinecap="round" />
    <g transform="translate(96 -50)">
      <rect x={-46} y={-26} width={92} height={52} rx={10} fill="#fff" {...K} strokeWidth={4} />
      <Gem s={0.8} />
      <text x={30} y={11} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={32} fill={COL.ink}>
        ×
      </text>
    </g>
  </g>
);

// lock-screen style notification (HTML), slides down at `at`
export const Notif: React.FC<{ f: number; at: number; text: string; y?: number }> = ({ f, at, text, y = 300 }) => {
  if (f < at) return null;
  const p = spring({ frame: f - at, fps: 30, config: { damping: 12, mass: 0.6, stiffness: 170 } });
  const ty = interpolate(p, [0, 1], [-260, 0]);
  return (
    <div
      style={{
        position: "absolute",
        left: 110,
        width: 860,
        top: y,
        transform: `translateY(${ty}px)`,
        opacity: interpolate(f - at, [0, 4], [0, 1], clamp),
        background: "rgba(255,255,255,0.96)",
        border: `6px solid ${COL.ink}`,
        borderRadius: 34,
        padding: "24px 30px",
        display: "flex",
        alignItems: "center",
        gap: 26,
        boxShadow: "0 12px 0 rgba(0,0,0,0.18)",
      }}
    >
      <div style={{ width: 96, height: 96, borderRadius: 24, background: "#ff7a1a", border: `5px solid ${COL.ink}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width={70} height={80} viewBox="-110 -270 220 280">
          <path d="M -100 -70 C -100 -160 -40 -190 0 -260 C 40 -190 100 -160 100 -70 C 100 -10 55 0 0 0 C -55 0 -100 -10 -100 -70 Z" fill="#ffd23f" stroke={COL.ink} strokeWidth={14} />
        </svg>
      </div>
      <div>
        <div style={{ fontFamily: FONT.title, fontWeight: 800, fontSize: 34, color: "#777", letterSpacing: 1 }}>NOW · 11:00 PM</div>
        <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 44, color: COL.ink, lineHeight: 1.15 }}>{text}</div>
      </div>
    </div>
  );
};

// a big two-line label card for the payoff (HTML)
export const Choice: React.FC<{ f: number; at: number; x: number; title: string; sub: string; color: string; dim?: number; check?: boolean }> = ({
  f,
  at,
  x,
  title,
  sub,
  color,
  dim = 1,
  check,
}) => {
  if (f < at) return null;
  const p = spring({ frame: f - at, fps: 30, config: { damping: 10, mass: 0.6, stiffness: 190 } });
  return (
    <div
      style={{
        position: "absolute",
        left: x - 200,
        top: 330,
        width: 400,
        height: 250,
        transform: `scale(${interpolate(p, [0, 1], [0.3, 1])}) rotate(${x < 540 ? -3 : 3}deg)`,
        opacity: dim,
        filter: dim < 1 ? "grayscale(1)" : undefined,
        background: color,
        border: `7px solid ${COL.ink}`,
        borderRadius: 28,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 10px 0 rgba(0,0,0,0.2)",
      }}
    >
      <div style={{ fontFamily: FONT.title, fontWeight: 800, fontSize: 44, color: "#fff", WebkitTextStroke: `2px ${COL.ink}` }}>{title}</div>
      <div style={{ fontFamily: FONT.comic, fontSize: 96, color: "#fff", WebkitTextStroke: `4px ${COL.ink}`, lineHeight: 1 }}>{sub}</div>
      {check && (
        <div style={{ position: "absolute", right: -26, top: -30, width: 84, height: 84, borderRadius: 42, background: COL.green, border: `6px solid ${COL.ink}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 54, color: "#fff", fontFamily: FONT.title, fontWeight: 900 }}>
          ✓
        </div>
      )}
    </div>
  );
};
