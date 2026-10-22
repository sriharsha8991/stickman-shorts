import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { P, SNAP, type Key } from "../stickman/stick";
import { Burst, COL, FONT } from "../stickman/fx";
import { Stage } from "../stickman/common";
import { punch } from "../shared/kit";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { Big, C, CARD_COLS, CE, CYAN, HOT, Machine, Phone, Pill, Room, SparkHost, VCard, W, You, clamp, pop, soft, vis, type Act } from "./world";

// HOOK + PROMISE (0:00–0:24). Frame 1: "WHO PICKED THIS?" over a giant phone scrolling a feed; YOU taps it.
// "last ten videos" → 10 mini cards; "a machine" → a red eye opens INSIDE the phone screen (wow 1), 8 cards get
// PICKED tags. "Let's open that machine up" → the phone splits in two and the control-room machine is revealed.
// Promise checklist pops line by line (reads / picks / shrinks / 3 taps).

const ICONS = ["play", "cat", "car", "music", "ball", "pan", "game", "play", "cat", "car"] as const;

export const S01_SFX: SfxCue[] = [
  [2, "swirl", 0.35],
  ...Array.from({ length: 10 }, (_, i): SfxCue => [W(1, 4) + i * 4, "pop", 0.22]),
  [W(2, 1), "impact", 0.5],
  ...Array.from({ length: 8 }, (_, i): SfxCue => [W(2, 3) + 4 + i * 3, "stamp", 0.16]),
  [C(3), "ding", 0.3],
  [W(3, 4), "whoosh_long", 0.5],
  [W(3, 4) + 12, "slam", 0.35],
  [C(4), "pop", 0.45],
  [C(5), "pop", 0.45],
  [C(6), "pop", 0.45],
  [C(7), "pop", 0.45],
  [C(7) + 10, "kaching", 0.25],
];

export const S01Hook: React.FC<SceneProps> = ({ from }) => {
  const g = from + useCurrentFrame();
  const cardsAt = W(1, 4);
  const eyeAt = W(2, 1);
  const pickedAt = W(2, 3) + 4;
  const openAt = W(3, 4);
  const split = interpolate(g, [openAt, openAt + 16], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const machS = interpolate(g, [openAt + 2, openAt + 18], [0.55, 0.92], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
  const scroll = g * 2.2;
  const eyeK = soft(g, eyeAt - 2, eyeAt + 8);

  const rows: Act[] = [
    [0, "pointSide", "worried"],
    [W(0, 4), "handsHips", "skeptical", "nod"],
    [W(1, 0), "pointUp", "curious"],
    [eyeAt, "recoil", "shock", "shake"],
    [C(3), "wave1", "happy", "wave"],
    [openAt, "presentBoth", "excited", "hop"],
    [C(4), "count1", "curious"],
    [C(5), "present", "thinking"],
    [C(6), "shrugBig", "worried"],
    [C(7), "fistPump", "determined", "nod"],
  ];

  // YOU points at the phone, flinches at the eye, then walks off when the phone opens
  const youKeys: Key[] = [
    { f: 0, p: { ...P.pointR, ra2: 20 } },
    { f: eyeAt - 2, p: { ...P.pointR, ra2: 20 } },
    { f: eyeAt + 4, p: { ...P.shock, lean: -12 }, e: SNAP },
    { f: openAt - 2, p: { ...P.shock, lean: -12, x: 1720 } },
    { f: openAt + 26, p: { x: 2150, lean: -8 } },
  ];

  const z = punch(g - from, [cardsAt, eyeAt, openAt + 10, C(6)].map((x) => x - from), 0.03);

  return (
    <Stage
      bg={<Room f={g} />}
      hits={[eyeAt - from, openAt + 12 - from]}
      power={7}
      cam={{ z }}
      svg={
        <>
          <Machine f={g} x={1440} y={510} s={machS} o={soft(g, openAt - 4, openAt + 8)} look={g < C(4) ? 0 : -0.8} heat={vis(g, C(6), CE(6)) * 0.8} />
          <Phone id="l1hk" x={1440} y={540} s={1.02} split={split} o={1 - soft(g, openAt + 10, openAt + 22)}>
            {/* the feed scrolling */}
            {Array.from({ length: 8 }, (_, i) => {
              const y = ((i * 150 - scroll) % 1200) + 600 - 600;
              const yy = y < -360 ? y + 1200 : y;
              return <VCard key={i} x={0} y={yy - 200} s={1.2} color={CARD_COLS[i % 10]} icon={ICONS[i % 10]} o={1 - eyeK} />;
            })}
            {eyeK > 0.01 && (
              <g opacity={eyeK}>
                <rect x={-150} y={-280} width={300} height={560} fill="#0d1538" />
                <ellipse rx={110 * eyeK} ry={66 * eyeK * (g % 90 > 84 ? 0.1 : 1)} fill="#fff" stroke={COL.ink} strokeWidth={6} />
                <circle cx={0} r={40 * eyeK} fill={HOT} />
                <circle cx={0} r={19 * eyeK} fill="#1a0008" />
                <circle cx={12} cy={-12} r={8 * eyeK} fill="#fff" />
              </g>
            )}
          </Phone>
          {/* last ten videos */}
          {Array.from({ length: 10 }, (_, i) => {
            const at = cardsAt + i * 4;
            const fly = interpolate(g, [openAt, openAt + 14], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
            return (
              <VCard
                key={i}
                x={650 + i * 128}
                y={185 - fly * 300}
                s={0.56 * pop(g, at)}
                r={((i % 3) - 1) * 4}
                color={CARD_COLS[i]}
                icon={ICONS[i]}
                o={g >= at ? 1 : 0}
                tag={g >= pickedAt + i * 3 && i !== 3 && i !== 7 ? "PICKED" : undefined}
                tagCol={HOT}
              />
            );
          })}
          <You f={g} x={1720} keys={youKeys} face={g >= eyeAt && g < openAt ? "sad" : "eyes"} />
          {g >= openAt + 8 && g < openAt + 40 && <Burst x={1440} y={510} at={openAt + 10} f={g} color={CYAN} size={300} />}
          <SparkHost f={g} rows={rows} x={300} bulbs={[]} look={1} />
        </>
      }
      html={
        <>
          <Big f={g} at={-14} out={C(1) - 6} x={1000} y={150} size={120} color="#fff" r={-2}>
            WHO PICKED <span style={{ color: HOT }}>THIS?</span>
          </Big>
          <Pill f={g} at={cardsAt - 4} out={openAt} x={1220} y={92} size={30} bg={CYAN}>
            YOUR LAST 10 VIDEOS
          </Pill>
          <Big f={g} at={eyeAt + 2} out={C(3) + 10} x={700} y={420} size={92} color={HOT} r={-4}>
            A MACHINE?
          </Big>
          <Pill f={g} at={C(3) + 4} out={C(4) + 20} x={300} y={330} size={38} bg="#fff">
            HI, I'M SPARK
          </Pill>
          {g >= C(4) - 4 && (
            <div style={{ position: "absolute", left: 790, top: 300, transform: `translate(-50%,-50%) scale(${pop(g, C(4) - 4)})`, fontFamily: FONT.title, fontWeight: 900, fontSize: 54, color: CYAN, letterSpacing: 6, whiteSpace: "nowrap" }}>
              BY THE END:
            </div>
          )}
          {[
            ["1", "WHAT IT READS", C(4)],
            ["2", "HOW IT PICKS", C(5)],
            ["3", "WHY YOUR FEED SHRINKS", C(6)],
            ["4", "3 TAPS TO RETRAIN IT", C(7)],
          ].map(([n, t, at], i) =>
            g >= (at as number) ? (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 520,
                  top: 380 + i * 112,
                  transform: `scale(${pop(g, at as number)})`,
                  transformOrigin: "left center",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ width: 66, height: 66, borderRadius: 33, background: i === 3 ? HOT : CYAN, border: `5px solid ${COL.ink}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT.title, fontWeight: 900, fontSize: 44, color: COL.ink }}>
                  {n}
                </span>
                <span style={{ background: "#fff", border: `5px solid ${COL.ink}`, borderRadius: 16, padding: "2px 20px", fontFamily: FONT.title, fontWeight: 900, fontSize: 48, color: COL.ink }}>{t}</span>
              </div>
            ) : null,
          )}
        </>
      }
    />
  );
};
