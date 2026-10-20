import React from "react";
import { COL, FONT } from "./fx";

// SVG props centred on (0,0): position them with <At>
export const At: React.FC<{ x: number; y: number; s?: number; r?: number; o?: number; children: React.ReactNode }> = ({ x, y, s = 1, r = 0, o = 1, children }) => (
  <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} opacity={o}>
    {children}
  </g>
);

const K = { stroke: COL.ink, strokeWidth: 6, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

export const Barrel: React.FC<{ label?: string }> = ({ label = "OIL" }) => (
  <g>
    <rect x={-50} y={-70} width={100} height={140} rx={14} fill="#2b2b2b" {...K} />
    <rect x={-50} y={-38} width={100} height={10} fill="#555" />
    <rect x={-50} y={28} width={100} height={10} fill="#555" />
    <ellipse cx={0} cy={-70} rx={50} ry={10} fill="#3b3b3b" {...K} />
    <text x={0} y={12} textAnchor="middle" fontFamily={FONT.comic} fontSize={34} fill={COL.yellow}>
      {label}
    </text>
  </g>
);

export const Bill: React.FC<{ w?: number; sym?: string; color?: string }> = ({ w = 150, sym = "$", color = COL.dollar }) => (
  <g>
    <rect x={-w / 2} y={-w * 0.23} width={w} height={w * 0.46} rx={6} fill="#cfe8c8" stroke={color} strokeWidth={5} />
    <rect x={-w / 2 + 8} y={-w * 0.23 + 8} width={w - 16} height={w * 0.46 - 16} rx={3} fill="none" stroke={color} strokeWidth={2} />
    <circle cx={0} cy={0} r={w * 0.15} fill={color} />
    <text x={0} y={w * 0.075} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={w * 0.22} fill="#cfe8c8">
      {sym}
    </text>
  </g>
);

export const GoldBar: React.FC<{ label?: string }> = ({ label }) => (
  <g>
    <polygon points="-70,30 70,30 50,-25 -50,-25" fill={COL.gold} {...K} />
    <polygon points="-50,-25 50,-25 40,-34 -40,-34" fill="#ffe27a" {...K} strokeWidth={4} />
    <line x1={-35} y1={-12} x2={-10} y2={-12} stroke="#fff6c8" strokeWidth={6} strokeLinecap="round" />
    {label && (
      <text x={0} y={18} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={26} fill={COL.ink}>
        {label}
      </text>
    )}
  </g>
);

export const Coin: React.FC<{ sym: string; color?: string; r?: number }> = ({ sym, color = COL.gold, r = 60 }) => (
  <g>
    <circle r={r} fill={color} {...K} />
    <circle r={r * 0.78} fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth={4} />
    <text y={r * 0.33} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={r * 0.95} fill={COL.ink}>
      {sym}
    </text>
  </g>
);

export const Shield: React.FC<{ crack?: number; color?: string }> = ({ crack = 0, color = COL.blue }) => (
  <g>
    <path d="M0,-90 L75,-62 Q75,40 0,95 Q-75,40 -75,-62 Z" fill={color} {...K} />
    <path d="M0,-66 L52,-46 Q52,28 0,68 Q-52,28 -52,-46 Z" fill="none" stroke="#fff" strokeWidth={6} opacity={0.6} />
    <text y={22} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={70} fill="#fff">
      ★
    </text>
    {crack > 0 && (
      <polyline
        points="-10,-90 6,-50 -14,-20 12,10 -6,40 8,95"
        fill="none"
        stroke={COL.ink}
        strokeWidth={7}
        strokeDasharray={260}
        strokeDashoffset={260 * (1 - crack)}
        strokeLinejoin="round"
      />
    )}
  </g>
);

export const Missile: React.FC = () => (
  <g>
    <path d="M-80,-14 L50,-14 Q90,0 50,14 L-80,14 Z" fill="#d9d9d9" {...K} />
    <polygon points="-80,-14 -110,-36 -96,0 -110,36 -80,14" fill={COL.red} {...K} />
    <circle cx={-118} cy={0} r={14} fill={COL.orange} opacity={0.9} />
    <circle cx={-140} cy={0} r={9} fill={COL.yellow} opacity={0.8} />
  </g>
);

export const Printer: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <rect x={-110} y={-60} width={220} height={110} rx={16} fill="#e8e6df" {...K} />
    <rect x={-80} y={-95} width={160} height={40} rx={6} fill="#fff" {...K} />
    <rect x={-90} y={30} width={180} height={14} rx={7} fill={COL.ink} />
    <circle cx={80} cy={-25} r={10} fill={Math.floor(f / 6) % 2 ? COL.green : "#9ad59f"} />
    <text x={-30} y={0} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={34} fill={COL.ink}>
      FED
    </text>
  </g>
);

export const Bank: React.FC<{ label: string; color?: string; w?: number }> = ({ label, color = "#e8e6df", w = 220 }) => (
  <g>
    <polygon points={`${-w / 2 - 15},-70 0,-140 ${w / 2 + 15},-70`} fill={color} {...K} />
    <rect x={-w / 2} y={-70} width={w} height={20} fill={color} {...K} />
    {[-0.36, -0.12, 0.12, 0.36].map((k) => (
      <rect key={k} x={w * k - 11} y={-50} width={22} height={110} fill="#fff" {...K} strokeWidth={4} />
    ))}
    <rect x={-w / 2 - 15} y={60} width={w + 30} height={22} fill={color} {...K} />
    <text y={120} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={34} fill={COL.ink}>
      {label}
    </text>
  </g>
);

export const Box: React.FC<{ label?: string; color?: string }> = ({ label, color = "#d9a066" }) => (
  <g>
    <rect x={-48} y={-42} width={96} height={84} rx={4} fill={color} {...K} />
    <line x1={-48} y1={-14} x2={48} y2={-14} stroke={COL.ink} strokeWidth={4} />
    {label && (
      <text y={24} textAnchor="middle" fontSize={40}>
        {label}
      </text>
    )}
  </g>
);

export const Ship: React.FC<{ color?: string }> = ({ color = "#555" }) => (
  <g>
    <path d="M-160,0 L160,0 L130,50 L-140,50 Z" fill={color} {...K} />
    <rect x={60} y={-60} width={60} height={60} fill="#e8e6df" {...K} />
    <rect x={80} y={-90} width={16} height={30} fill={COL.ink} />
    <rect x={-120} y={-34} width={160} height={34} rx={4} fill={COL.red} {...K} strokeWidth={4} />
  </g>
);

export const Ice: React.FC<{ w: number; h: number }> = ({ w, h }) => (
  <g>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={18} fill="rgba(160,215,245,0.6)" stroke="#4aa3d8" strokeWidth={6} />
    <polyline points={`${-w / 2 + 20},${-h / 2 + 30} ${-w / 2 + 60},${-h / 2 + 15}`} stroke="#fff" strokeWidth={8} strokeLinecap="round" />
    <polyline points={`${w / 2 - 50},${h / 2 - 20} ${w / 2 - 20},${h / 2 - 40}`} stroke="#fff" strokeWidth={6} strokeLinecap="round" />
  </g>
);

export const Chain: React.FC<{ x1: number; y1: number; x2: number; y2: number; t: number; color?: string }> = ({ x1, y1, x2, y2, t, color = COL.blue }) => {
  const n = 9;
  const ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  const shown = Math.floor(n * t);
  return (
    <g>
      {Array.from({ length: shown }).map((_, i) => {
        const k = (i + 0.5) / n;
        return (
          <rect
            key={i}
            x={-22}
            y={-11}
            width={44}
            height={22}
            rx={11}
            fill="none"
            stroke={color}
            strokeWidth={7}
            transform={`translate(${x1 + (x2 - x1) * k} ${y1 + (y2 - y1) * k}) rotate(${ang + (i % 2) * 0})`}
          />
        );
      })}
    </g>
  );
};

// simple flag with label
export const Flag: React.FC<{ colors: string[]; label?: string; vertical?: boolean }> = ({ colors, label, vertical }) => (
  <g>
    <line x1={0} y1={0} x2={0} y2={-150} stroke={COL.ink} strokeWidth={7} strokeLinecap="round" />
    {colors.map((c, i) =>
      vertical ? (
        <rect key={i} x={(i * 90) / colors.length} y={-150} width={90 / colors.length} height={60} fill={c} />
      ) : (
        <rect key={i} x={0} y={-150 + (i * 60) / colors.length} width={90} height={60 / colors.length} fill={c} />
      ),
    )}
    <rect x={0} y={-150} width={90} height={60} fill="none" stroke={COL.ink} strokeWidth={4} />
    {label && (
      <text x={45} y={30} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={30} fill={COL.ink}>
        {label}
      </text>
    )}
  </g>
);
