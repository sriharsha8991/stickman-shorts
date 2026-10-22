import React from "react";
import { Easing, interpolate, random, useCurrentFrame } from "remotion";
import { COL, FONT } from "../stickman/fx";
import { Stage, Stamp } from "../stickman/common";
import { punch } from "../shared/kit";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { Big, C, CARD_COLS, CE, CYAN, HOT, NEON, Phone, Pill, Room, SparkHost, Src, VCard, W, clamp, pop, soft, vis, type Act, type Icon } from "./world";

// CH3 · The ranking race (2:02–2:59), labelled SIMPLIFIED. "Half the job" bar → a talent show with an endless
// line of cards → the 2016 paper's two steps: a funnel shrinks an enormous pile to "a few hundred", every one
// gets a score, the top few climb a podium and fly into the phone (wow). What's the score chasing? A target:
// CLICKS ✗ (clickbait card left early) → EXPECTED WATCH TIME (arrow thuds in, aha) + SATISFACTION. The
// MOST POPULAR trophy is crossed out; banner: MOST LIKELY TO KEEP YOU WATCHING.

const CX = 1150;
const ICONS: Icon[] = ["cat", "car", "music", "ball", "pan", "game", "play"];
const SCORES = [62, 97, 41, 88, 94, 23, 91, 55];
const TOP = [1, 4, 6];

export const S04_SFX: SfxCue[] = [
  [W(38, 3), "pop", 0.4],
  [W(39, 3), "buzz", 0.3],
  [C(40) + 4, "stamp", 0.45],
  [C(41), "whoosh_long", 0.35],
  [W(41, 3), "horn", 0.2],
  [W(42, 3), "page", 0.4],
  [W(42, 8), "pop", 0.4],
  ...Array.from({ length: 12 }, (_, i): SfxCue => [C(43) + i * 4, "pop", 0.12]),
  [C(44), "swirl", 0.4],
  ...Array.from({ length: 8 }, (_, i): SfxCue => [W(45, 3) + i * 5, "tick", 0.3]),
  [C(46), "riser", 0.3],
  [W(46, 4), "impact", 0.4],
  [C(47), "whoosh", 0.45],
  [C(48), "pop", 0.35],
  [C(49), "buzz", 0.35],
  [W(49, 3), "boing", 0.3],
  [W(50, 3), "swish", 0.35],
  [W(51, 5), "thud", 0.55],
  [W(52, 5), "ding", 0.4],
  [W(53, 5), "shatter", 0.35],
  [C(54), "slam", 0.45],
];

const Target: React.FC<{ s: number }> = ({ s }) => (
  <g transform={`scale(${s})`}>
    {[150, 115, 80, 45].map((r, i) => (
      <circle key={r} r={r} fill={i % 2 ? "#fff" : HOT} stroke={COL.ink} strokeWidth={6} />
    ))}
  </g>
);

export const S04Race: React.FC<SceneProps> = ({ from }) => {
  const g = from + useCurrentFrame();
  const showK = vis(g, C(41), C(48) - 4, 10); // talent show + funnel + podium
  const targetK = vis(g, C(48), C(53) - 2, 8);
  const funnelK = vis(g, C(43) - 4, C(46) - 2, 8);
  const scoreK = vis(g, C(45) - 6, C(47) + 14, 8);
  const toPhone = interpolate(g, [C(47), C(47) + 16], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const arrowK = interpolate(g, [W(51, 5) - 10, W(51, 5)], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });

  const rows: Act[] = [
    [from, "present", "neutral"],
    [C(39), "pointUp", "determined"],
    [C(40), "leanIn", "wink"],
    [C(41), "presentBoth", "excited"],
    [C(42), "pointSide", "curious"],
    [C(43), "shrugBig", "shock"],
    [C(44), "pointDown", "thinking"],
    [C(45), "count2", "curious"],
    [C(46), "doublePoint", "excited"],
    [C(47), "celebrate", "happy", "hop"],
    [C(48), "thinkChin", "thinking"],
    [C(49), "stop", "skeptical", "shake"],
    [C(50), "facepalm", "sad"],
    [C(51), "pointUp", "excited"],
    [C(52), "present", "happy"],
    [C(53), "armsCrossed", "skeptical"],
    [C(54), "fistPump", "determined", "nod"],
  ];

  const z = punch(g - from, [W(38, 3), C(41), C(43), W(46, 4), C(47), C(49), W(49, 3), C(50) + 12, W(50, 3), W(51, 5), C(54)].map((x) => x - from), 0.025);

  return (
    <Stage
      bg={<Room f={g} hue="#3a1250" />}
      hits={[W(51, 5) - from]}
      power={6}
      cam={{ z }}
      svg={
        <>
          {/* talent show: spotlights + endless line */}
          {showK > 0 && (
            <g opacity={showK}>
              {[-1, 1].map((sd) => (
                <path key={sd} d={`M ${CX + sd * 420} 60 L ${CX - 170} 860 L ${CX + 170} 860 Z`} fill="#fff6c8" opacity={0.1 + 0.04 * Math.sin(g * 0.2 + sd)} />
              ))}
              <ellipse cx={CX} cy={870} rx={260} ry={22} fill="#fff6c8" opacity={0.25} />
              {g < C(45) &&
                Array.from({ length: 14 }, (_, i) => {
                  const x = 1880 - (((g - C(41)) * 3 + i * 70) % 980);
                  return <VCard key={i} x={x} y={850} s={0.28} color={CARD_COLS[i % 10]} icon={ICONS[i % ICONS.length]} o={x > 1300 ? 1 : 0} />;
                })}
            </g>
          )}
          {/* funnel: enormous pile → a few hundred */}
          {funnelK > 0 && (
            <g opacity={funnelK}>
              {Array.from({ length: 48 }, (_, i) => {
                const at = C(43) + i * 1;
                const x = CX + (random(`px${i}`) - 0.5) * 520;
                const y = 230 + (random(`py${i}`) - 0.5) * 120;
                const sink = interpolate(g, [C(44) + (i % 12) * 3, C(44) + (i % 12) * 3 + 18], [0, 1], clamp);
                return g >= at ? <VCard key={i} x={x + (CX - x) * sink} y={y + sink * 280} s={0.22 * (1 - sink * 0.6)} r={(random(`pr${i}`) - 0.5) * 50} color={CARD_COLS[i % 10]} icon="play" o={1 - sink} /> : null;
              })}
              <path d={`M ${CX - 300} 320 L ${CX + 300} 320 L ${CX + 60} 560 L ${CX + 60} 620 L ${CX - 60} 620 L ${CX - 60} 560 Z`} fill="rgba(63,224,255,0.25)" stroke={CYAN} strokeWidth={6} />
              {g >= C(44) &&
                Array.from({ length: 6 }, (_, i) => {
                  const p = ((g - C(44)) * 0.04 + i / 6) % 1;
                  return <VCard key={i} x={CX + (p - 0.5) * 30} y={640 + p * 160} s={0.2} color={CARD_COLS[(i + 4) % 10]} icon="play" o={1 - p} />;
                })}
            </g>
          )}
          {/* scored row → podium → phone */}
          {scoreK > 0 && (
            <g opacity={scoreK}>
              {g >= W(46, 4) && (
                <g opacity={1 - toPhone}>
                  {[
                    [CX, 760, 120],
                    [CX - 200, 800, 80],
                    [CX + 200, 820, 60],
                  ].map(([x, y, h], i) => (
                    <g key={i} transform={`translate(0 ${(1 - pop(g, W(46, 4) + i * 3)) * 100})`}>
                      <rect x={(x as number) - 90} y={y as number} width={180} height={h as number} fill={i === 0 ? "#ffd23f" : "#c9cde0"} stroke={COL.ink} strokeWidth={6} />
                      <text x={x as number} y={(y as number) + 56} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={50}>
                        {i + 1}
                      </text>
                    </g>
                  ))}
                </g>
              )}
              {SCORES.map((sc, i) => {
                const isTop = TOP.indexOf(i);
                const x0 = 720 + i * 125;
                const y0 = 560;
                const rise = g >= W(46, 4) && isTop >= 0 ? interpolate(g, [W(46, 4), W(46, 4) + 12], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.5)) }) : 0;
                const px = [CX, CX - 200, CX + 200][Math.max(0, isTop)];
                const py = [690, 730, 750][Math.max(0, isTop)];
                let x = x0 + (px - x0) * rise;
                let y = y0 + (py - y0) * rise;
                let s = 0.5 + rise * 0.25;
                if (toPhone > 0 && isTop >= 0) {
                  x = x + (CX - x) * toPhone;
                  y = y + (430 - y) * toPhone;
                  s = s * (1 - toPhone * 0.45);
                }
                const fade = g >= W(46, 4) && isTop < 0 ? 1 - soft(g, W(46, 4), W(46, 4) + 10) : 1;
                return (
                  <VCard
                    key={i}
                    x={x}
                    y={y}
                    s={s * pop(g, C(45) - 6 + i * 2)}
                    color={CARD_COLS[(i + 2) % 10]}
                    icon={ICONS[i % ICONS.length]}
                    o={fade * (toPhone > 0.95 && isTop >= 0 ? 0 : 1)}
                    score={g >= W(45, 3) + i * 5 ? String(sc) : undefined}
                  />
                );
              })}
              <Phone id="l1rc" x={CX} y={440} s={0.62 * pop(g, C(47))} o={g >= C(47) ? vis(g, C(47), C(48) - 4) : 0}>
                {TOP.map((t, k) => (
                  <VCard key={k} x={0} y={-170 + k * 160} s={1.1 * soft(g, C(47) + 12 + k * 3, C(47) + 18 + k * 3)} color={CARD_COLS[(t + 2) % 10]} icon={ICONS[t % ICONS.length]} />
                ))}
              </Phone>
            </g>
          )}
          {/* target: what the score chases */}
          {targetK > 0 && (
            <g opacity={targetK}>
              <g transform={`translate(${CX} 470)`}>
                <Target s={pop(g, C(48))} />
                {g >= W(51, 5) - 10 && (
                  <g transform={`translate(${(1 - arrowK) * 600} ${(1 - arrowK) * -240}) rotate(-22)`}>
                    <line x1={0} y1={0} x2={260} y2={0} stroke={COL.ink} strokeWidth={10} />
                    <path d="M 0 0 L 34 -16 L 34 16 Z" fill={COL.ink} />
                    <path d="M 240 0 l 30 -22 l 0 44 Z" fill={CYAN} stroke={COL.ink} strokeWidth={3} />
                  </g>
                )}
              </g>
              <VCard x={1580} y={430} s={0.9 * pop(g, W(49, 3))} color="#ff006e" icon="bait" tag="CLICKBAIT" o={g >= W(49, 3) ? vis(g, W(49, 3), C(51) - 4) : 0} progress={interpolate(g, [C(50), W(50, 3)], [0.05, 0.15], clamp)} />
            </g>
          )}
          {/* trophy */}
          {g >= C(53) && (
            <g transform={`translate(${CX} 520) scale(${pop(g, C(53))})`} opacity={vis(g, C(53), C(54) + 2)}>
              <path d="M -90 -120 L 90 -120 L 70 -10 Q 0 50 -70 -10 Z" fill="#ffd23f" stroke={COL.ink} strokeWidth={6} />
              <rect x={-20} y={30} width={40} height={60} fill="#ffd23f" stroke={COL.ink} strokeWidth={6} />
              <rect x={-80} y={90} width={160} height={36} rx={6} fill="#c9a227" stroke={COL.ink} strokeWidth={6} />
              {g >= W(53, 5) && (
                <g stroke={HOT} strokeWidth={18} strokeLinecap="round" opacity={soft(g, W(53, 5), W(53, 5) + 4)}>
                  <line x1={-150} y1={-150} x2={150} y2={150} />
                  <line x1={-150} y1={150} x2={150} y2={-150} />
                </g>
              )}
            </g>
          )}
          <SparkHost f={g} rows={rows} bulbs={[W(51, 5)]} />
        </>
      }
      html={
        <>
          {g < C(40) + 4 && (
            <div style={{ position: "absolute", left: CX, top: 420, transform: `translate(-50%,-50%) scale(${pop(g, from + 2)})`, display: "flex", border: `6px solid ${COL.ink}`, borderRadius: 18, overflow: "hidden", opacity: vis(g, from, C(40)), fontFamily: FONT.title, fontWeight: 900, fontSize: 64 }}>
              <span style={{ padding: "10px 36px", background: g >= W(38, 3) ? CYAN : "#555", color: COL.ink }}>KNOW YOU ✓</span>
              <span style={{ padding: "10px 36px", background: g >= W(39, 3) ? (Math.floor(g / 6) % 2 ? HOT : "#fff") : "#333", color: g >= W(39, 3) ? COL.ink : "#888" }}>CHOOSE ?</span>
            </div>
          )}
          {g >= C(40) + 4 && g < C(41) + 6 && <Stamp f={g} at={C(40) + 4} x={CX} y={420} text="SIMPLIFIED" size={110} color={NEON} r={-6} />}
          <Pill f={g} at={C(41) + 6} out={CE(54) + 20} x={1720} y={120} size={28} bg={NEON} color="#fff">
            SIMPLIFIED
          </Pill>
          <Big f={g} at={W(41, 3)} out={C(42) + 6} x={CX} y={190} size={110} color="#ffd23f" r={-3}>
            TALENT SHOW
          </Big>
          {g >= W(42, 3) && g < C(43) + 4 && (
            <div style={{ position: "absolute", left: CX, top: 180, transform: `translate(-50%,-50%) scale(${pop(g, W(42, 3))})`, opacity: vis(g, W(42, 3), C(43) - 2), display: "flex", gap: 20, alignItems: "center", whiteSpace: "nowrap" }}>
              <span style={{ background: "#fff", border: `5px solid ${COL.ink}`, borderRadius: 14, padding: "4px 20px", fontFamily: FONT.title, fontWeight: 900, fontSize: 50 }}>2016 PAPER:</span>
              {g >= W(42, 8) && (
                <>
                  <span style={{ background: CYAN, border: `5px solid ${COL.ink}`, borderRadius: 14, padding: "4px 20px", fontFamily: FONT.title, fontWeight: 900, fontSize: 50, transform: `scale(${pop(g, W(42, 8))})` }}>① SHORTLIST</span>
                  <span style={{ background: "#ffd23f", border: `5px solid ${COL.ink}`, borderRadius: 14, padding: "4px 20px", fontFamily: FONT.title, fontWeight: 900, fontSize: 50, transform: `scale(${pop(g, W(42, 8) + 4)})` }}>② SCORE</span>
                </>
              )}
            </div>
          )}
          <Pill f={g} at={C(43)} out={C(44) - 2} x={1600} y={470} size={40} bg={CYAN}>
            STEP 1 · AN ENORMOUS PILE
          </Pill>
          <Big f={g} at={W(44, 3)} out={C(45) - 4} x={1560} y={700} size={80} color={CYAN} r={-3}>
            ≈ A FEW HUNDRED
          </Big>
          <Pill f={g} at={C(45)} out={C(46) - 2} x={CX} y={300} size={40} bg="#ffd23f">
            STEP 2 · SCORE EVERY ONE
          </Pill>
          <Big f={g} at={W(46, 4)} out={C(47) - 2} x={CX} y={300} size={90} color="#ffd23f" r={-2}>
            TOP FEW ONLY
          </Big>
          <Big f={g} at={C(47) + 6} out={C(48) - 4} x={1500} y={200} size={84} color="#fff" r={3}>
            = YOUR SCREEN
          </Big>
          <Big f={g} at={C(48) + 4} out={C(49) - 2} x={CX} y={190} size={100} color="#fff">
            CHASING <span style={{ color: HOT }}>WHAT?</span>
          </Big>
          <Big f={g} at={C(49)} out={C(51) - 4} x={760} y={250} size={100} color={HOT} r={-4}>
            CLICKS ✗
          </Big>
          <Big f={g} at={W(49, 3)} out={C(50) + 10} x={1580} y={250} size={80} color="#ff006e" r={3}>
            CLICKBAIT!
          </Big>
          <Big f={g} at={C(50) + 12} out={C(51) - 4} x={1580} y={250} size={70} color="#fff" r={3}>
            NOBODY FINISHES
          </Big>
          <Big f={g} at={W(50, 3)} out={C(51) - 4} x={1580} y={640} size={66} color="#ffd23f" r={-3}>
            LEFT EARLY
          </Big>
          <Big f={g} at={W(51, 5)} out={C(53) - 4} x={CX} y={175} size={92} color={CYAN} r={-2}>
            EXPECTED WATCH TIME
          </Big>
          <Pill f={g} at={W(52, 5)} out={C(53) - 4} x={CX} y={720} size={44} bg="#ffd23f">
            + SATISFACTION ★ (SURVEYS)
          </Pill>
          <Big f={g} at={C(53) + 2} out={C(54) - 2} x={CX} y={190} size={90} color="#fff">
            “MOST POPULAR WINS”?
          </Big>
          {g >= C(54) && (
            <div style={{ position: "absolute", left: CX, top: 470, transform: `translate(-50%,-50%) scale(${pop(g, C(54))}) rotate(-2deg)`, opacity: vis(g, C(54), CE(54) + 24), textAlign: "center", fontFamily: FONT.comic, fontSize: 104, color: "#fff", WebkitTextStroke: `8px ${COL.ink}`, paintOrder: "stroke fill", lineHeight: 1.05, whiteSpace: "nowrap" }}>
              MOST LIKELY TO
              <br />
              <span style={{ color: HOT }}>KEEP YOU WATCHING</span>
            </div>
          )}
          <Src f={g} at={W(42, 3)} out={CE(51) + 10}>
            Covington, Adams &amp; Sargin (2016), “Deep Neural Networks for YouTube Recommendations”, RecSys
          </Src>
          <Src f={g} at={C(52)} out={CE(52) + 10}>
            YouTube Help + How YouTube Works: satisfaction surveys
          </Src>
        </>
      }
    />
  );
};
