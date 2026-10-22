import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { COL, FONT } from "../stickman/fx";
import { Stage } from "../stickman/common";
import { punch } from "../shared/kit";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { Big, C, CARD_COLS, CE, CYAN, HOT, NEON, Phone, Pill, Room, SparkHost, Src, VCard, W, clamp, pop, soft, vis, type Act } from "./world";

// CH5 · Retrain it (3:44–4:21). "Can you vote back? YES. 3 TAPS." A generic phone UI (no real app art):
// TAP 1 history → PAUSE / EDIT / DELETE, regret rows swipe away · TAP 2 ⋮ menu → "Not interested", the card
// puffs out · TAP 3 same-channel cards → "Don't recommend channel", all three vanish · BONUS: a search bar types
// what you actually want = a signal too. Checklist ticks on the right; "It's all in your hands".

const PX = 1120;
const PY = 520;

export const S06_SFX: SfxCue[] = [
  [W(68, 5), "slam", 0.45],
  [W(68, 7), "impact", 0.35],
  [C(69), "pop", 0.4],
  [W(69, 3), "tick", 0.45],
  [W(70, 3), "pop", 0.35],
  [W(70, 5), "pop", 0.35],
  [W(70, 8), "pop", 0.35],
  ...[0, 1, 2].map((i): SfxCue => [C(71) + 6 + i * 8, "swish", 0.35]),
  [C(72), "swish", 0.35],
  [W(72, 6), "tick", 0.45],
  [W(73, 1), "whoosh", 0.3],
  [W(73, 4), "ding", 0.4],
  [W(73, 4) + 10, "swirl", 0.35],
  [C(74), "swish", 0.35],
  [W(75, 1), "ding", 0.4],
  [W(75, 1) + 8, "shatter", 0.3],
  [C(76), "pop", 0.4],
  ...Array.from({ length: 6 }, (_, i): SfxCue => [W(76, 2) + i * 4, "tick", 0.2]),
  [C(77), "swirl", 0.35],
  [W(78, 6), "kaching", 0.35],
];

const Ripple: React.FC<{ f: number; at: number; x: number; y: number }> = ({ f, at, x, y }) => {
  const d = f - at;
  if (d < 0 || d > 18) return null;
  return (
    <g>
      <circle cx={x} cy={y} r={10 + d * 3} fill="none" stroke={HOT} strokeWidth={5} opacity={1 - d / 18} />
      <circle cx={x} cy={y} r={12} fill={HOT} opacity={1 - d / 18} />
    </g>
  );
};

const Menu: React.FC<{ f: number; at: number; hi: number; hiAt: number }> = ({ f, at, hi, hiAt }) => {
  const k = interpolate(f, [at, at + 8], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const items = ["Save", "Not interested", "Don't recommend channel", "Share"];
  return (
    <g transform={`translate(0 ${(1 - k) * 300})`} opacity={k}>
      <rect x={-150} y={20} width={300} height={260} rx={16} fill="#fff" stroke={COL.ink} strokeWidth={4} />
      {items.map((t, i) => (
        <g key={t}>
          {i === hi && f >= hiAt && <rect x={-142} y={34 + i * 60} width={284} height={52} rx={10} fill="#ffd23f" />}
          <text x={-126} y={68 + i * 60} fontFamily={FONT.body} fontWeight={700} fontSize={i === 2 ? 21 : 25} fill={COL.ink}>
            {t}
          </text>
        </g>
      ))}
    </g>
  );
};

export const S06Retrain: React.FC<SceneProps> = ({ from }) => {
  const g = from + useCurrentFrame();
  const mode = g < C(72) ? 1 : g < C(74) ? 2 : g < C(76) ? 3 : 4;
  const query = "learn guitar";
  const typed = query.slice(0, Math.max(0, Math.floor((g - W(76, 2)) / 2.5)));
  const goneAt = W(73, 4) + 10;
  const chanGone = W(75, 1) + 8;

  const rows: Act[] = [
    [from, "thinkChin", "curious"],
    [W(68, 5), "fistPump", "determined", "hop"],
    [C(69), "count1", "happy"],
    [C(70), "present", "neutral"],
    [C(71), "pointDown", "wink"],
    [C(72), "count2", "curious"],
    [C(73), "pointSide", "excited"],
    [C(74), "armsCrossed", "skeptical"],
    [C(75), "doublePoint", "determined"],
    [C(76), "pointUp", "excited", "hop"],
    [C(77), "leanIn", "wink"],
    [C(78), "presentBoth", "happy", "nod"],
  ];

  const zp = punch(g - from, [W(68, 5), C(69), W(70, 8), W(73, 4), W(75, 1), C(76), W(78, 6)].map((x) => x - from), 0.025);
  // camera step-ins on TAP 1 (held), back out on EDIT: clear whole-frame changes for the retention gate
  const z = zp * (1 + 0.06 * soft(g, W(69, 3), W(69, 3) + 10) - 0.06 * soft(g, W(70, 5), W(70, 5) + 10));
  const checks: [string, number, number][] = [
    ["1 · HISTORY", C(69), W(71, 2)],
    ["2 · NOT INTERESTED", C(72), goneAt],
    ["3 · DON'T RECOMMEND", C(74), chanGone],
    ["+ SEARCH", C(76), C(77)],
  ];

  return (
    <Stage
      bg={<Room f={g} hue="#0f3d3a" />}
      hits={[W(68, 5) - from]}
      power={6}
      cam={{ z }}
      svg={
        <>
          <Phone id="l1rt" x={PX} y={PY} s={1.0 * pop(g, C(69))} o={g >= C(69) ? 1 : 0}>
            {/* header */}
            <rect x={-150} y={-280} width={300} height={56} fill={mode === 1 ? "#222a55" : mode === 4 ? "#fff" : "#f5f7ff"} />
            {mode === 1 && (
              <g>
                <text x={-130} y={-242} fontFamily={FONT.title} fontWeight={900} fontSize={34} fill="#fff">
                  WATCH HISTORY
                </text>
                {["PAUSE", "EDIT", "DELETE"].map((b, i) => {
                  const at = W(70, [3, 5, 8][i]);
                  return (
                    <g key={b} transform={`translate(${-100 + i * 100} -190) scale(${g >= at ? pop(g, at) : 1})`}>
                      <rect x={-44} y={-20} width={88} height={40} rx={20} fill={g >= at ? (i === 2 ? HOT : CYAN) : "#e0e3f0"} stroke={COL.ink} strokeWidth={3} />
                      <text y={9} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={24} fill={COL.ink}>
                        {b}
                      </text>
                    </g>
                  );
                })}
                {Array.from({ length: 5 }, (_, i) => {
                  const regret = i === 0 || i === 2 || i === 3;
                  const ri = [0, -1, 1, 2, -1][i];
                  const sw = regret ? interpolate(g, [C(71) + 6 + ri * 8, C(71) + 16 + ri * 8], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) }) : 0;
                  return (
                    <g key={i} transform={`translate(${sw * 420} ${-110 + i * 80})`} opacity={1 - sw}>
                      <rect x={-140} y={-32} width={280} height={66} rx={10} fill={regret && g >= C(71) ? "#ffe0e6" : "#fff"} stroke="#ccd" strokeWidth={2} />
                      <rect x={-130} y={-24} width={90} height={50} rx={6} fill={CARD_COLS[(i * 3) % 10]} />
                      <rect x={-30} y={-14} width={140} height={10} rx={5} fill="#c9cde0" />
                      <rect x={-30} y={4} width={90} height={10} rx={5} fill="#dde0ee" />
                    </g>
                  );
                })}
              </g>
            )}
            {mode === 2 && (
              <g>
                <text x={-130} y={-242} fontFamily={FONT.title} fontWeight={900} fontSize={34} fill={COL.ink}>
                  HOME
                </text>
                <g opacity={1 - soft(g, goneAt, goneAt + 10)} transform={`scale(${1 - soft(g, goneAt, goneAt + 10) * 0.4})`}>
                  <VCard x={0} y={-110} s={1.3} color="#ff006e" icon="bait" />
                  <text x={120} y={-12} fontFamily={FONT.title} fontWeight={900} fontSize={40} fill={COL.ink}>
                    ⋮
                  </text>
                </g>
                <VCard x={0} y={soft(g, goneAt, goneAt + 12) * -0 + 120} s={1.0} color={CARD_COLS[6]} icon="ball" o={0.9} />
                <Menu f={g} at={W(73, 1)} hi={1} hiAt={W(73, 4)} />
              </g>
            )}
            {mode === 3 && (
              <g>
                <text x={-130} y={-242} fontFamily={FONT.title} fontWeight={900} fontSize={34} fill={COL.ink}>
                  HOME
                </text>
                {[0, 1, 2].map((i) => {
                  const k = soft(g, chanGone + i * 3, chanGone + 10 + i * 3);
                  return (
                    <g key={i} opacity={1 - k} transform={`translate(${k * -300} 0)`}>
                      <VCard x={-20} y={-170 + i * 125} s={0.85} color="#7b2ff7" icon="game" />
                      <circle cx={120} cy={-195 + i * 125} r={18} fill="#7b2ff7" stroke={COL.ink} strokeWidth={3} />
                      <text x={120} y={-188 + i * 125} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={20} fill="#fff">
                        X
                      </text>
                    </g>
                  );
                })}
                <Menu f={g} at={C(75) - 4} hi={2} hiAt={W(75, 1)} />
              </g>
            )}
            {mode === 4 && (
              <g>
                <rect x={-135} y={-270} width={270} height={40} rx={20} fill="#eef0fa" stroke={COL.ink} strokeWidth={3} />
                <circle cx={-110} cy={-250} r={9} fill="none" stroke={COL.ink} strokeWidth={3} />
                <text x={-90} y={-241} fontFamily={FONT.body} fontWeight={700} fontSize={24} fill={COL.ink}>
                  {typed}
                  {Math.floor(g / 8) % 2 ? "|" : ""}
                </text>
                {g >= C(77) &&
                  [0, 1, 2].map((i) => <VCard key={i} x={0} y={-130 + i * 140} s={1.05 * pop(g, C(77) + i * 4)} color={["#06d6a0", "#118ab2", "#8ac926"][i]} icon="music" />)}
              </g>
            )}
          </Phone>
          {/* taps */}
          <Ripple f={g} at={W(69, 3)} x={PX - 60} y={PY - 250} />
          <Ripple f={g} at={W(72, 6)} x={PX + 125} y={PY - 25} />
          <Ripple f={g} at={W(73, 4)} x={PX} y={PY + 100} />
          <Ripple f={g} at={W(75, 1)} x={PX} y={PY + 160} />
          {g >= W(78, 6) && <circle cx={PX} cy={PY} r={360} fill="none" stroke={COL.green} strokeWidth={10} opacity={0.6 * soft(g, W(78, 6), W(78, 6) + 8)} />}
          <SparkHost f={g} rows={rows} bulbs={[W(78, 6)]} />
        </>
      }
      html={
        <>
          <Big f={g} at={from + 2} out={W(68, 5) - 4} x={1150} y={420} size={110} color="#fff" r={-2}>
            VOTE <span style={{ color: CYAN }}>BACK?</span>
          </Big>
          <Pill f={g} at={W(78, 0)} out={W(78, 6) - 2} x={PX} y={160} size={46} bg="#fff">
            NOTHING HIDDEN
          </Pill>
          <Big f={g} at={W(68, 5)} out={C(69) + 4} x={1050} y={330} size={140} color={COL.green} r={-4}>
            YES.
          </Big>
          <Big f={g} at={W(68, 7)} out={C(69) + 4} x={1150} y={560} size={170} color="#fff" r={2}>
            3 <span style={{ color: HOT }}>TAPS</span>
          </Big>
          {[
            ["TAP 1", C(69) + 2, C(72) - 4],
            ["TAP 2", C(72) + 2, C(74) - 4],
            ["TAP 3", C(74) + 2, C(76) - 4],
          ].map(([t, a, b]) => (
            <Big key={t as string} f={g} at={a as number} out={b as number} x={760} y={260} size={110} color={HOT} r={-4}>
              {t}
            </Big>
          ))}
          {[
            ["PAUSE", W(70, 3), CYAN],
            ["EDIT", W(70, 5), CYAN],
            ["DELETE", W(70, 8), HOT],
          ].map(([t, a, c], i) => (
            <Big key={t as string} f={g} at={a as number} out={C(72) - 4} x={760} y={420 + i * 110} size={80} color={c as string} r={-2}>
              {t}
            </Big>
          ))}
          {checks.map(([t, at, done], i) =>
            g >= at ? (
              <div
                key={t}
                style={{
                  position: "absolute",
                  left: 1400,
                  top: 250 + i * 120,
                  transform: `scale(${pop(g, at)})`,
                  transformOrigin: "left center",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  whiteSpace: "nowrap",
                  fontFamily: FONT.title,
                  fontWeight: 900,
                  fontSize: 40,
                }}
              >
                <span style={{ width: 52, height: 52, borderRadius: 12, background: g >= done ? COL.green : "#fff", border: `5px solid ${COL.ink}`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 40 }}>
                  {g >= done ? "✓" : ""}
                </span>
                <span style={{ background: i === 3 ? "#ffd23f" : "#fff", border: `5px solid ${COL.ink}`, borderRadius: 14, padding: "0 16px", color: COL.ink }}>{t}</span>
              </div>
            ) : null,
          )}
          <Pill f={g} at={C(71)} out={C(72) - 2} x={PX} y={130} size={44} bg={HOT} color="#fff">
            CLEAR THE REGRETS
          </Pill>
          <Pill f={g} at={W(72, 6)} out={C(74) - 2} x={PX} y={130} size={44} bg="#fff">
            ⋮ MENU → “NOT INTERESTED”
          </Pill>
          <Pill f={g} at={C(74) + 4} out={C(76) - 2} x={PX} y={130} size={44} bg="#fff">
            WHOLE CHANNEL → “DON'T RECOMMEND”
          </Pill>
          <Pill f={g} at={C(76)} out={C(77) - 2} x={PX} y={130} size={50} bg="#ffd23f">
            BONUS: SEARCH ON PURPOSE
          </Pill>
          <Big f={g} at={C(77) + 4} out={C(78) - 2} x={PX} y={160} size={90} color={CYAN} r={-2}>
            SEARCH = SIGNAL
          </Big>
          <Big f={g} at={W(78, 6)} out={CE(78) + 30} x={PX} y={160} size={96} color={COL.green} r={-2}>
            IN YOUR HANDS
          </Big>
          <Src f={g} at={C(69)} out={CE(78) + 20}>
            YouTube Help + How YouTube Works: pause, edit or delete history; “Not interested”; “Don't recommend channel”
          </Src>
          <div style={{ position: "absolute", left: 1400, top: 760, opacity: vis(g, C(69), CE(78)) * 0.9, fontFamily: FONT.body, fontWeight: 700, fontSize: 22, color: "#cfe9ff", whiteSpace: "nowrap" }}>
            Illustration · menus vary by app version
          </div>
          {g < 0 && <span style={{ color: NEON }} />}
        </>
      }
    />
  );
};
