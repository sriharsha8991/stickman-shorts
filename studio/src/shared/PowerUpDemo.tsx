import React from "react";
import { useCurrentFrame } from "remotion";
import { Stage } from "../stickman/common";
import { COL, FONT } from "../stickman/fx";
import { groundY } from "../stickman/stick";
import { Spark, bulbPulse, type Mood } from "./mascot";
import { G } from "./gestures";
import { POWER_KINDS, POWER_PEAK, PowerUp, powerHits, type PowerKind } from "./powerup";

// Reference for shared/powerup.tsx (1080×1920): the six hook presets back to back, 80 frames each,
// with a hook overlay in the title zone to check it stays readable.
//   node stickman-sheet.mjs PowerUpDemo out/powerup.png 0-470:16
export const POWERUP_SEG = 80;
export const POWERUP_DEMO_FRAMES = POWERUP_SEG * POWER_KINDS.length;

const GROUND = 1290;
const SC = 1.9;
const HOOK: Record<PowerKind, string> = {
  charge: "AI USERS: −19 POINTS",
  impact: "₹0. AGAIN.",
  beam: "MYTH: 75% AUTO-REJECTED",
  dash: "ESTIMATE: 2 DAYS",
  clash: "1 THUMB vs 1,000 TESTS",
  meter: "LOSE ₹500 vs FIND ₹500",
};
const POSE: Record<PowerKind, [Partial<import("../stickman/stick").Pose>, Partial<import("../stickman/stick").Pose>, Mood, Mood]> = {
  charge: [G.handsHips, G.celebrate, "determined", "mindblown"],
  impact: [G.recoil, G.pointSide, "shock", "skeptical"],
  beam: [G.stop, G.pointSide, "determined", "smug"],
  dash: [G.leanIn, G.doublePoint, "worried", "shock"],
  clash: [G.fistPump, G.stop, "angry", "determined"],
  meter: [G.handsHips, G.mindBlown, "excited", "mindblown"],
};

export const PowerUpDemo: React.FC = () => {
  const g = useCurrentFrame();
  const i = Math.min(POWER_KINDS.length - 1, Math.floor(g / POWERUP_SEG));
  const kind = POWER_KINDS[i];
  const at = i * POWERUP_SEG + 4;
  const f = g;
  const peak = at + POWER_PEAK[kind];
  const h = 185 * SC;
  const dashX = kind === "dash" ? Math.min(540, 120 + Math.max(0, f - at) * 60) : kind === "clash" ? 300 : kind === "beam" ? 260 : 540;
  const [p1, p2, m1, m2] = POSE[kind];
  const target = kind === "beam" ? { tx: 840, ty: 980 } : kind === "impact" ? { tx: 760, ty: 900 } : kind === "clash" ? { tx: 780, ty: 0 } : kind === "meter" ? { tx: 540, ty: 700 } : {};
  return (
    <Stage
      hits={powerHits(kind, at)}
      power={22}
      bg={<div style={{ position: "absolute", inset: 0, background: ["#fdf3d8", "#e8f0fe", "#fde8e8", "#eaf6ec", "#f3e8fd", "#fef3e2"][i] }} />}
      svg={
        <>
          <line x1={0} y1={GROUND} x2={1080} y2={GROUND} stroke={COL.ink} strokeWidth={6} />
          <PowerUp kind={kind} f={f} at={at} x={dashX} y={GROUND} h={h} {...target} layer="back" />
          {kind === "impact" && f >= peak - 2 && (
            <g transform={`translate(760 900) scale(${f < peak ? 2.2 : 1 + 0.06 * Math.max(0, 8 - (f - peak))})`}>
              <rect x={-150} y={-90} width={300} height={180} rx={18} fill="#fff" stroke={COL.ink} strokeWidth={8} />
              <text x={0} y={30} textAnchor="middle" fontFamily={FONT.comic} fontSize={110} fill={COL.red}>₹0</text>
            </g>
          )}
          {kind === "beam" && (
            <g transform="translate(840 980)">
              <rect x={-120} y={-150} width={240} height={300} fill="#fff" stroke={COL.ink} strokeWidth={7} />
              <text x={0} y={10} textAnchor="middle" fontFamily={FONT.comic} fontSize={64} fill={COL.ink}>75%</text>
            </g>
          )}
          {kind === "clash" && (
            <g>
              <circle cx={780} cy={GROUND - 300} r={34} fill="none" stroke={COL.red} strokeWidth={8} />
              <line x1={780} y1={GROUND - 266} x2={780} y2={GROUND - 120} stroke={COL.red} strokeWidth={8} />
              <line x1={780} y1={GROUND - 120} x2={740} y2={GROUND} stroke={COL.red} strokeWidth={8} />
              <line x1={780} y1={GROUND - 120} x2={820} y2={GROUND} stroke={COL.red} strokeWidth={8} />
              <line x1={780} y1={GROUND - 230} x2={700} y2={GROUND - 200} stroke={COL.red} strokeWidth={8} />
            </g>
          )}
          <Spark
            f={f}
            scale={SC}
            base={{ x: dashX, y: groundY(SC, GROUND) }}
            keys={[
              { f: 0, p: p1 },
              { f: peak - 3, p: p1 },
              { f: peak, p: p2 },
            ]}
            mood={(t) => (t < peak ? m1 : m2)}
            bulb={(t) => bulbPulse(t, peak, 24)}
            trails={kind === "dash"}
          />
          <PowerUp kind={kind} f={f} at={at} x={dashX} y={GROUND} h={h} {...target} layer="front" />
        </>
      }
      html={
        <>
          <div
            style={{
              position: "absolute",
              left: 90,
              right: 90,
              top: 300,
              textAlign: "center",
              fontFamily: FONT.comic,
              fontSize: 112,
              lineHeight: 1,
              color: COL.ink,
              WebkitTextStroke: "3px #fff",
              textShadow: "0 6px 0 #fff, 0 0 18px #fff",
            }}
          >
            {HOOK[kind]}
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 1480, textAlign: "center", fontFamily: FONT.title, fontWeight: 900, fontSize: 52, color: COL.ink }}>
            {kind.toUpperCase()}
          </div>
        </>
      }
    />
  );
};
