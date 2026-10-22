import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { P, SNAP, type Key } from "../stickman/stick";
import { COL, FONT } from "../stickman/fx";
import { Stage } from "../stickman/common";
import { punch } from "../shared/kit";
import { VOICE_FRAMES } from "./voice";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { Big, C, CARD_COLS, CE, CYAN, HOT, Machine, NEON, Pill, Room, SparkHost, VCard, W, You, clamp, pop, soft, vis, type Act } from "./world";

// RECAP + END (4:21–4:55). A 4-line recap board (reads · scores a few hundred · keeps you watching · every tap
// teaches it). Callback to the opening conveyor: "You're training it" (aha) — YOU gets a TRAINER badge; three
// taps; the belt slows, cards turn green ✓, YOU steps off. End card: Spark waves, "Stay curious".

const E = VOICE_FRAMES;

export const S07_SFX: SfxCue[] = [
  [C(79), "page", 0.4],
  [C(80), "pop", 0.4],
  [C(81), "pop", 0.4],
  [C(82), "pop", 0.4],
  [C(83), "pop", 0.4],
  [C(84), "whoosh", 0.4],
  [W(85, 2), "impact", 0.45],
  [W(86, 1), "tick", 0.4],
  [W(86, 1) + 6, "tick", 0.4],
  [W(86, 1) + 12, "tick", 0.4],
  [W(87, 4), "ding", 0.4],
  [C(88), "stinger", 0.35],
  [C(88) + 60, "pop", 0.35],
  [C(88) + 120, "swirl", 0.3],
];

export const S07Recap: React.FC<SceneProps> = ({ from }) => {
  const g = from + useCurrentFrame();
  const boardK = vis(g, C(79), C(84) - 4, 8);
  const beltK = vis(g, C(84), C(88) - 4, 8);
  const slow = interpolate(g, [C(87), W(87, 4) + 10], [1, 0.1], clamp);
  const greenAt = W(87, 4);
  const endAt = C(88);

  const rows: Act[] = [
    [from, "present", "neutral"],
    [C(80), "count1", "curious"],
    [C(81), "count2", "thinking"],
    [C(82), "pointSide", "excited"],
    [C(83), "pointUp", "determined"],
    [C(84), "doublePoint", "curious"],
    [C(85), "celebrate", "excited", "hop"],
    [C(86), "fistPump", "determined"],
    [C(87), "presentBoth", "happy"],
    [endAt, "wave1", "happy", "wave"],
    [endAt + 60, "celebrate", "laugh", "hop"],
    [endAt + 120, "wave2", "happy", "wave"],
  ];

  const youKeys: Key[] = [
    { f: C(84), p: { x: 1250, ...P.hold } },
    { f: W(85, 2) - 2, p: { x: 1250, ...P.hold } },
    { f: W(85, 2) + 4, p: { x: 1250, ...P.pointR, ra1: 130 }, e: SNAP },
    { f: greenAt - 2, p: { x: 1250, ...P.pointR, ra1: 130 } },
    { f: greenAt + 16, p: { x: 1560, ...P.cheer } },
  ];

  const z = punch(g - from, [C(80), C(81), C(82), C(83), W(85, 2), greenAt, endAt].map((x) => x - from), 0.025);
  const lines: [string, string, number][] = [
    ["READS", "your history, searches, likes & taps", C(80)],
    ["SCORES", "a few hundred videos for you", C(81)],
    ["SHOWS", "what it thinks will keep you watching", C(82)],
    ["LEARNS", "from every tap", C(83)],
  ];

  return (
    <Stage
      bg={<Room f={g} hue={g < endAt ? "#1d1550" : "#0f2f5a"} />}
      hits={[W(85, 2) - from]}
      power={5}
      cam={{ z }}
      svg={
        <>
          {/* the opening conveyor, callback */}
          {beltK > 0 && (
            <g opacity={beltK}>
              <rect x={620} y={300} width={1200} height={24} rx={12} fill="#2a3470" stroke={CYAN} strokeWidth={3} />
              {Array.from({ length: 7 }, (_, i) => {
                const x = 1820 - ((((g - C(84)) * 4 * slow + i * 180) % 1260) + 0);
                const green = g >= greenAt + i * 2;
                return <VCard key={i} x={x} y={250} s={0.5} color={green ? COL.green : CARD_COLS[i % 10]} icon={green ? "play" : (["cat", "car", "music", "ball", "pan", "game", "play"] as const)[i]} tag={green ? "✓ YOURS" : undefined} tagCol={COL.green} o={x > 640 && x < 1800 ? 1 : 0} />;
              })}
              <Machine f={g} x={1640} y={640} s={0.42 * pop(g, W(85, 2))} o={g >= W(85, 2) ? 1 : 0} label={false} look={-1} />
              <You f={g} x={1250} keys={youKeys} face="happy" />
            </g>
          )}
          {/* end card logo */}
          {g >= endAt + 54 && (
            <g transform={`translate(1150 470) scale(${pop(g, endAt + 60)})`}>
              <Machine f={g} x={0} y={0} s={0.5} label={false} />
            </g>
          )}
          <SparkHost f={g} rows={rows} x={g >= endAt ? interpolate(g, [endAt, endAt + 14], [300, 420], { ...clamp, easing: Easing.out(Easing.cubic) }) : 300} bulbs={[W(85, 2)]} />
        </>
      }
      html={
        <>
          {boardK > 0 && (
            <div style={{ position: "absolute", left: 640, top: 140, width: 1180, opacity: boardK, transform: `scale(${pop(g, C(79))})`, transformOrigin: "center top" }}>
              <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 64, color: CYAN, letterSpacing: 10, marginBottom: 18 }}>QUICK RECAP</div>
              {lines.map(([k, t, at], i) =>
                g >= at ? (
                  <div key={k} style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 22, transform: `scale(${pop(g, at)})`, transformOrigin: "left center", whiteSpace: "nowrap" }}>
                    <span style={{ minWidth: 190, textAlign: "center", background: [CYAN, "#ffd23f", HOT, NEON][i], border: `5px solid ${COL.ink}`, borderRadius: 14, padding: "2px 14px", fontFamily: FONT.title, fontWeight: 900, fontSize: 52, color: COL.ink }}>{k}</span>
                    <span style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 44, color: "#fff" }}>{t}</span>
                  </div>
                ) : null,
              )}
            </div>
          )}
          <Pill f={g} at={C(84)} out={W(85, 2) - 2} x={1200} y={130} size={50} bg="#fff">
            YOU'RE NOT JUST WATCHING…
          </Pill>
          <Big f={g} at={W(85, 2)} out={W(86, 1) - 8} x={1200} y={140} size={110} color={HOT} r={-3}>
            YOU'RE TRAINING IT
          </Big>
          <Pill f={g} at={W(85, 2) + 6} out={greenAt} x={1250} y={480} size={34} bg="#ffd23f">
            TRAINER
          </Pill>
          {g >= W(86, 1) && g < C(88) && (
            <div style={{ position: "absolute", left: 1200, top: 140, transform: "translate(-50%,-50%)", display: "flex", gap: 24, opacity: vis(g, W(86, 1), C(88) - 6) }}>
              {[0, 1, 2].map((i) => (
                <span key={i} style={{ transform: `scale(${g >= W(86, 1) + i * 6 ? pop(g, W(86, 1) + i * 6) : 0})`, background: i === 2 ? HOT : CYAN, border: `5px solid ${COL.ink}`, borderRadius: 40, padding: "4px 30px", fontFamily: FONT.comic, fontSize: 70, color: "#fff", WebkitTextStroke: `3px ${COL.ink}` }}>
                  TAP
                </span>
              ))}
            </div>
          )}
          <Pill f={g} at={greenAt} out={C(88) - 4} x={1200} y={430} size={48} bg={COL.green} color="#fff">
            THE FEED WORKS FOR YOU
          </Pill>
          {/* end card */}
          <Big f={g} at={endAt + 6} out={E} x={1150} y={190} size={120} color="#fff" r={-2}>
            STAY <span style={{ color: CYAN }}>CURIOUS</span>
          </Big>
          {g >= endAt + 60 && (
            <div style={{ position: "absolute", left: 1150, top: 760, transform: `translate(-50%,-50%) scale(${pop(g, endAt + 60)})`, fontFamily: FONT.title, fontWeight: 900, fontSize: 72, color: "#fff", letterSpacing: 6, whiteSpace: "nowrap", textShadow: `0 0 26px ${NEON}` }}>
              THE HIDDEN MECHANISM
            </div>
          )}
          {g >= endAt + 120 && (
            <div style={{ position: "absolute", left: 1150, top: 850, transform: `translate(-50%,-50%) scale(${pop(g, endAt + 120)})`, fontFamily: FONT.body, fontWeight: 700, fontSize: 36, color: "#cfe9ff", whiteSpace: "nowrap" }}>
              how AI, money &amp; your brain quietly work
            </div>
          )}
          {g >= endAt && (
            <div style={{ position: "absolute", left: 420, top: 300, transform: `translate(-50%,-50%) scale(${pop(g, endAt + 2)})`, opacity: soft(g, endAt, endAt + 6), background: "#fff", border: `5px solid ${COL.ink}`, borderRadius: 18, padding: "4px 20px", fontFamily: FONT.title, fontWeight: 900, fontSize: 40, whiteSpace: "nowrap" }}>
              I'M SPARK
            </div>
          )}
          {g < 0 && <span>{CE(0)}</span>}
        </>
      }
    />
  );
};
