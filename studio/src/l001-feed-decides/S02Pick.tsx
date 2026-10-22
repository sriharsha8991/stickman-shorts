import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { P, SNAP, type Key } from "../stickman/stick";
import { Actor } from "../stickman/stick";
import { COL, FONT } from "../stickman/fx";
import { Stage } from "../stickman/common";
import { punch } from "../shared/kit";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { Big, C, CARD_COLS, CE, CYAN, GROUND, HOT, Machine, NEON, Phone, Pill, Room, SparkHost, Src, VCard, W, You, YS, clamp, pop, soft, vis, type Act, type Icon } from "./world";

// CH1 · The pick you didn't make (0:24–1:04). YOU opens the app for ONE video (YOUR PICK ✓, CHOICES MADE: 1).
// A conveyor keeps dropping UP NEXT cards into the phone; 40 minutes pass, the watched pile grows, the counter
// still says 1 (wow). Cards get OFFERED tags; HOME FEED / UP NEXT label the two belts. Scene change: a labelled
// generic "PRODUCT CHIEF (2018)" figure + a 70% pie (reported paraphrase, source on screen). Ends on a "?" machine.

const ICONS: Icon[] = ["cat", "car", "music", "ball", "pan", "game", "play"];
const PX = 1150;
const PY = 545;
const PS = 0.85;

export const S02_SFX: SfxCue[] = [
  [W(8, 4), "pop", 0.4],
  [W(8, 8), "ding", 0.3],
  [C(9) + 4, "tick", 0.4],
  [C(10), "swish", 0.35],
  [W(10, 4), "whoosh", 0.4],
  [W(11, 1), "whoosh", 0.35],
  [W(11, 3), "whoosh", 0.35],
  ...Array.from({ length: 10 }, (_, i): SfxCue => [C(12) + i * 9, "tick", 0.22]),
  [W(13, 4), "slam", 0.5],
  ...Array.from({ length: 6 }, (_, i): SfxCue => [C(14) + 6 + i * 5, "stamp", 0.18]),
  [W(15, 2), "pop", 0.4],
  [W(15, 6), "pop", 0.4],
  [C(16), "whoosh_long", 0.4],
  [W(16, 2), "impact", 0.4],
  [W(16, 5), "page", 0.35],
  [W(17, 3), "riser", 0.35],
  [W(17, 4) + 16, "kaching", 0.35],
  [C(18), "pop", 0.35],
  [W(19, 3), "boing", 0.3],
];

const pieArc = (cx: number, cy: number, r: number, p: number) => {
  const a = Math.max(0.0001, Math.min(0.9999, p)) * Math.PI * 2;
  const x = cx + Math.sin(a) * r;
  const y = cy - Math.cos(a) * r;
  return `M ${cx} ${cy} L ${cx} ${cy - r} A ${r} ${r} 0 ${a > Math.PI ? 1 : 0} 1 ${x} ${y} Z`;
};

export const S02Pick: React.FC<SceneProps> = ({ from }) => {
  const g = from + useCurrentFrame();
  const drops = [W(10, 4), W(11, 1), W(11, 3), ...Array.from({ length: 10 }, (_, i) => C(12) + i * 9)];
  const nDone = drops.filter((d) => g >= d + 14).length;
  const shift = C(16);
  const partA = vis(g, from, shift - 6, 10);
  const partB = vis(g, shift + 4, CE(18) + 20, 10);
  const mins = Math.round(interpolate(g, [C(12), W(12, 2) + 10], [0, 40], clamp));
  const pieP = interpolate(g, [W(17, 3), W(17, 4) + 16], [0, 0.7], { ...clamp, easing: Easing.out(Easing.cubic) });

  const rows: Act[] = [
    [from, "present", "neutral"],
    [W(8, 4), "pointSide", "curious"],
    [C(9), "count1", "happy", "nod"],
    [C(10), "thinkChin", "thinking"],
    [C(11), "pointDown", "worried"],
    [C(12), "leanIn", "curious"],
    [W(13, 4), "shrugBig", "sad"],
    [C(14), "facepalm", "sad"],
    [C(15), "doublePoint", "neutral"],
    [C(16), "pointUp", "curious"],
    [W(17, 3), "recoil", "shock", "shake"],
    [C(18), "present", "excited", "nod"],
    [C(19), "handsHips", "skeptical"],
  ];

  const youKeys: Key[] = [
    { f: from, p: { x: 2050, lean: 8 } },
    { f: W(8, 3), p: { x: 1600, ...P.hold }, e: SNAP },
    { f: C(9), p: { x: 1600, ...P.hold } },
    { f: C(9) + 6, p: { x: 1600, ...P.hold, ra1: 150, ra2: 20 }, e: SNAP },
    { f: C(10) - 2, p: { x: 1600, ...P.hold, ra1: 150, ra2: 20 } },
    { f: C(10) + 6, p: { x: 1600, ...P.hold } },
    { f: W(13, 4) - 2, p: { x: 1600, ...P.hold } },
    { f: W(13, 4) + 4, p: { x: 1600, ...P.shrug }, e: SNAP },
    { f: shift - 4, p: { x: 1600, ...P.shrug } },
    { f: shift + 10, p: { x: 2150, ...P.shrug } },
  ];
  const chiefKeys: Key[] = [
    { f: shift, p: { x: 1640, ...P.hold, la1: -30 } },
    { f: W(17, 3) - 2, p: { x: 1640, ...P.hold, la1: -30 } },
    { f: W(17, 3) + 4, p: { x: 1640, ...P.pointL, ra1: 120, ra2: 30 }, e: SNAP },
  ];

  const z = punch(g - from, [W(9, 0), W(10, 4), W(13, 4), W(16, 2), W(17, 4) + 16].map((x) => x - from), 0.03);
  const cardOnScreen = Math.min(nDone, drops.length);
  const prog = cardOnScreen === 0 ? interpolate(g, [C(10), W(10, 3)], [0.15, 1], clamp) : (g * 0.02) % 1;

  return (
    <Stage
      bg={<Room f={g} hue={g < shift ? "#1d1550" : "#20124a"} />}
      hits={[W(13, 4) - from, W(16, 2) - from]}
      power={6}
      cam={{ z }}
      svg={
        <>
          {/* PART A: phone + conveyor + pile */}
          <g opacity={partA}>
            {g >= C(10) && (
              <g opacity={soft(g, C(10), C(10) + 10)}>
                <rect x={1180} y={176} width={680} height={22} rx={11} fill="#2a3470" stroke={CYAN} strokeWidth={3} />
                {Array.from({ length: 9 }, (_, i) => (
                  <circle key={i} cx={1200 + i * 80} cy={187} r={8} fill={CYAN} transform={`rotate(${-g * 6} ${1200 + i * 80} 187)`} />
                ))}
              </g>
            )}
            <Phone id="l1pk" x={PX} y={PY} s={PS * pop(g, W(8, 4))} o={g >= W(8, 4) ? 1 : 0}>
              <VCard
                x={0}
                y={-130}
                s={1.25}
                color={CARD_COLS[(cardOnScreen + 2) % 10]}
                icon={ICONS[cardOnScreen % ICONS.length]}
                progress={prog}
                glow={cardOnScreen === 0 ? soft(g, W(8, 8), W(8, 8) + 8) : 0}
              />
              {[0, 1, 2].map((k) => (
                <g key={k} transform={`translate(0 ${30 + k * 80})`}>
                  <rect x={-130} y={-30} width={90} height={56} rx={8} fill={CARD_COLS[(cardOnScreen + 3 + k) % 10]} />
                  <rect x={-28} y={-22} width={150} height={12} rx={6} fill="#c9cde0" />
                  <rect x={-28} y={0} width={100} height={12} rx={6} fill="#dde0ee" />
                </g>
              ))}
              {cardOnScreen === 0 && g >= C(9) && (
                <g transform="translate(0 -230)">
                  <rect x={-110} y={-24} width={220} height={48} rx={24} fill={COL.green} stroke={COL.ink} strokeWidth={4} />
                  <text y={12} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={34} fill="#fff">
                    YOUR PICK ✓
                  </text>
                </g>
              )}
            </Phone>
            {/* cards travelling on the belt and dropping into the phone */}
            {drops.map((d, i) => {
              const t0 = d - 22;
              if (g < t0 || g > d + 16) return null;
              const x = interpolate(g, [t0, d], [1880, PX], { ...clamp, easing: Easing.out(Easing.cubic) });
              const y = interpolate(g, [d, d + 14], [140, 380], { ...clamp, easing: Easing.in(Easing.quad) });
              const s = interpolate(g, [d, d + 14], [0.6, 0.3], clamp);
              return <VCard key={i} x={x} y={y} s={s} color={CARD_COLS[(i + 3) % 10]} icon={ICONS[(i + 1) % ICONS.length]} tag={i < 3 ? "UP NEXT" : undefined} tagCol={NEON} />;
            })}
            {/* watched pile */}
            {Array.from({ length: Math.max(0, nDone - 1) }, (_, k) => (
              <VCard
                key={k}
                x={790 + ((k * 37) % 60) - 30}
                y={830 - k * 24}
                s={0.5}
                r={((k * 53) % 20) - 10}
                color={CARD_COLS[(k + 3) % 10]}
                icon={ICONS[(k + 1) % ICONS.length]}
                tag={g >= C(14) + 6 + Math.min(k, 5) * 5 ? "OFFERED" : undefined}
                tagCol={HOT}
              />
            ))}
            <You f={g} x={1600} keys={youKeys} face={g >= C(9) && g < C(11) ? "happy" : g >= W(13, 4) ? "sad" : "eyes"} />
          </g>

          {/* PART B: 2018 */}
          <g opacity={partB}>
            <Actor
              f={g}
              color="#9aa3c7"
              scale={YS}
              label="PRODUCT CHIEF (2018)"
              face="eyes"
              base={{ x: 1640, y: GROUND - 92.5 * YS }}
              keys={chiefKeys}
              facing={-1}
              opacity={soft(g, W(16, 5), W(16, 5) + 8)}
            />
            <g transform="translate(1100 520)" opacity={soft(g, W(17, 2), W(17, 3))}>
              <circle r={210} fill="#2a3470" stroke={COL.ink} strokeWidth={6} />
              <path d={pieArc(0, 0, 210, pieP)} fill={HOT} stroke={COL.ink} strokeWidth={6} />
              <circle r={90} fill="#0d1538" stroke={COL.ink} strokeWidth={6} />
              <text y={24} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={70} fill="#fff">
                ≈{Math.round(pieP * 100)}%
              </text>
            </g>
          </g>
          {/* the question: who? */}
          <Machine f={g} x={1250} y={540} s={0.75 * pop(g, C(19))} o={g >= C(19) ? 0.85 : 0} />
          <SparkHost f={g} rows={rows} bulbs={[W(17, 4) + 16]} />
        </>
      }
      html={
        <>
          <div style={{ opacity: partA }}>
            <Pill f={g} at={C(9) + 4} out={shift - 8} x={620} y={150} size={44} bg="#fff">
              CHOICES MADE: <span style={{ color: HOT, fontSize: g >= W(13, 4) ? 64 : 44 }}>1</span>
            </Pill>
            <Pill f={g} at={C(12)} out={shift - 8} x={620} y={250} size={40} bg={CYAN}>
              ⏱ {mins} MIN
            </Pill>
            <Big f={g} at={W(13, 4)} out={C(14) + 4} x={620} y={420} size={150} color={HOT} r={-4}>
              ONE.
            </Big>
            <Big f={g} at={C(14) + 8} out={C(15) - 2} x={760} y={430} size={90} color="#fff" r={-3}>
              ALL <span style={{ color: HOT }}>OFFERED</span>
            </Big>
            <Pill f={g} at={W(15, 2)} out={shift - 8} x={1520} y={110} size={36} bg={NEON} color="#fff">
              ← UP NEXT
            </Pill>
            <Pill f={g} at={W(15, 6)} out={shift - 8} x={640} y={420} size={40} bg="#fff">
              HOME FEED + UP NEXT
            </Pill>
          </div>
          <Big f={g} at={W(16, 2)} out={CE(18) + 14} x={1100} y={170} size={120} color={CYAN} r={-3}>
            2018
          </Big>
          <Pill f={g} at={C(18)} out={CE(18) + 14} x={1100} y={800} size={40} bg="#fff">
            OF WATCH TIME ← RECOMMENDATIONS
          </Pill>
          <Pill f={g} at={W(17, 0) + 4} out={CE(18) + 14} x={1640} y={370} size={28} bg="#ffd23f">
            REPORTED · A 2018 FIGURE
          </Pill>
          <Src f={g} at={C(16)} out={CE(18) + 14}>
            Neal Mohan at CES, Jan 2018 (reported paraphrase) · tubefilter.com
          </Src>
          <Big f={g} at={W(19, 3)} out={CE(19) + 40} x={1250} y={170} size={130} color="#fff" r={4}>
            WHO<span style={{ color: HOT }}>?</span>
          </Big>
        </>
      }
    />
  );
};
