import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { P, SNAP, type Key } from "../stickman/stick";
import { COL, FONT } from "../stickman/fx";
import { Stage } from "../stickman/common";
import { punch } from "../shared/kit";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { Big, C, CE, CYAN, HOT, Machine, NEON, Phone, Pill, Room, SparkHost, VCard, W, You, clamp, pop, soft, vis, type Act } from "./world";

// CH4 · The loop (2:59–3:44). The big re-hook near 3:00: the room dims, "the part nobody tells you". The race
// re-runs every visit (RACE #1, #2, #3…). YOU watches three cooking videos → more cooking cards; a gauge tips
// towards COOKING; WATCH → LEARN → OFFER draws a loop around YOU and it TIGHTENS (wow, bulb). Two people, same
// app, two different worlds. Fair caveat: not evil, doesn't trap everyone. Your quick taps are votes (ballot box),
// even the OOPS ones.

const OX = 1200;
const OY = 560;

export const S05_SFX: SfxCue[] = [
  [C(55), "freeze", 0.3],
  ...[2, 4, 6, 8].map((w): SfxCue => [W(56, w), "tick", 0.35]),
  [C(57), "swish", 0.35],
  [W(58, 1), "pop", 0.4],
  [W(58, 1) + 6, "pop", 0.4],
  [W(58, 1) + 12, "pop", 0.4],
  ...Array.from({ length: 6 }, (_, i): SfxCue => [W(58, 6) + i * 3, "pop", 0.2]),
  [W(59, 6), "swirl", 0.35],
  [W(60, 1), "ding", 0.3],
  [W(60, 3), "ding", 0.3],
  [W(60, 5), "ding", 0.3],
  [C(61), "riser", 0.35],
  [W(61, 5), "impact", 0.45],
  [C(62), "whoosh", 0.4],
  [W(63, 3), "pop", 0.4],
  [C(64), "stamp", 0.35],
  [W(64, 5), "stamp", 0.35],
  [W(65, 4), "ding", 0.35],
  [W(66, 5), "clink", 0.4],
  [W(66, 5) + 6, "clink", 0.4],
  [W(66, 5) + 12, "clink", 0.4],
  [W(67, 3), "boing", 0.4],
];

export const S05Loop: React.FC<SceneProps> = ({ from }) => {
  const g = from + useCurrentFrame();
  const dim = interpolate(g, [from, from + 8, C(56), C(56) + 12], [0, 0.5, 0.5, 0.15], clamp);
  const raceN = 1 + [2, 4, 6, 8].filter((w) => g >= W(56, w)).length;
  const cookK = vis(g, C(57), C(62) - 4, 8);
  const loopK = vis(g, C(60), C(62) - 4, 8);
  const tight = interpolate(g, [W(61, 2), W(61, 5) + 6], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const R = 330 - 160 * tight;
  const draw = interpolate(g, [W(60, 0), W(60, 7)], [0, 1], clamp);
  const twoK = vis(g, C(62), C(64) - 2, 8);
  const gauge = interpolate(g, [C(58), W(58, 6), W(59, 6), W(59, 6) + 14], [0, 0.35, 0.35, 0.85], { ...clamp, easing: Easing.out(Easing.cubic) });
  const ballotK = vis(g, C(66), CE(67) + 30, 8);

  const rows: Act[] = [
    [from, "whisper", "worried"],
    [C(56), "pointSide", "thinking"],
    [C(57), "pointDown", "curious"],
    [C(58), "present", "happy"],
    [W(58, 6), "doublePoint", "excited"],
    [C(59), "leanIn", "worried"],
    [C(60), "pointUp", "curious"],
    [C(61), "mindBlown", "mindblown", "shake"],
    [C(62), "presentBoth", "curious"],
    [C(63), "shrugBig", "excited"],
    [C(64), "stop", "determined"],
    [C(65), "handsHips", "smug", "nod"],
    [C(66), "pointSide", "worried"],
    [C(67), "facepalm", "laugh"],
  ];

  const youKeys: Key[] = [
    { f: C(57), p: { x: OX, ...P.hold } },
    { f: W(61, 2), p: { x: OX, ...P.hold } },
    { f: W(61, 5), p: { x: OX, ...P.shock }, e: SNAP },
    { f: C(62) - 2, p: { x: OX, ...P.shock } },
    { f: C(62) + 10, p: { x: 950, ...P.hold }, e: SNAP },
    { f: C(66) - 2, p: { x: 950, ...P.hold } },
    { f: C(66) + 8, p: { x: 1580, ...P.pointL } },
    { f: W(67, 3) - 2, p: { x: 1580, ...P.pointL } },
    { f: W(67, 3) + 4, p: { x: 1580, ...P.facepalm }, e: SNAP },
  ];
  const friendKeys: Key[] = [
    { f: C(62), p: { x: 2100, ...P.hold } },
    { f: C(62) + 12, p: { x: 1560, ...P.hold }, e: SNAP },
  ];

  const z = punch(g - from, [C(55), W(58, 6), C(59), C(59) + 22, W(59, 6), W(61, 5), C(62), W(63, 3), W(66, 5)].map((x) => x - from), 0.03);
  const nodes: [string, number][] = [
    ["WATCH", W(60, 1)],
    ["LEARN", W(60, 3)],
    ["OFFER", W(60, 5)],
  ];

  return (
    <Stage
      bg={<Room f={g} hue={g < C(62) ? "#4a1030" : "#163a4a"} dim={dim} />}
      hits={[W(61, 5) - from]}
      power={7}
      cam={{ z }}
      svg={
        <>
          {/* spotlight on Spark for the whisper */}
          {dim > 0.2 && <ellipse cx={300} cy={600} rx={260} ry={420} fill="#fff6c8" opacity={(dim - 0.15) * 0.3} />}
          {/* race counter tiles (small machines) */}
          {g >= C(56) && g < C(57) + 10 && (
            <g opacity={vis(g, C(56), C(57) + 2)}>
              {Array.from({ length: raceN }, (_, i) => (
                <Machine key={i} f={g + i * 20} x={760 + i * 260} y={500} s={0.36 * pop(g, i === 0 ? C(56) : W(56, [2, 4, 6, 8][i - 1]))} label={false} />
              ))}
            </g>
          )}
          {/* cooking cards around YOU */}
          {cookK > 0 && (
            <g opacity={cookK}>
              {[0, 1, 2].map((i) => {
                const at = W(58, 1) + i * 6;
                const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
                const rr = g >= C(60) ? R : 300;
                return g >= at ? <VCard key={i} x={OX + Math.cos(a) * rr} y={OY + Math.sin(a) * rr * 0.8} s={0.55 * pop(g, at)} color="#ff9f1c" icon="pan" tag={g < W(58, 6) ? "WATCHED" : undefined} tagCol={CYAN} /> : null;
              })}
              {Array.from({ length: 6 }, (_, i) => {
                const at = W(58, 6) + i * 3;
                const a = ((i + 0.5) / 6) * Math.PI * 2 - Math.PI / 2;
                const rr = (g >= C(60) ? R : 300) + 30;
                return g >= at ? <VCard key={i} x={OX + Math.cos(a) * rr} y={OY + Math.sin(a) * rr * 0.8} s={0.45 * pop(g, at)} color={["#ffbe0b", "#fb5607", "#ff9f1c"][i % 3]} icon="pan" r={(i - 3) * 4} /> : null;
              })}
            </g>
          )}
          {/* the loop */}
          {loopK > 0 && (
            <g opacity={loopK}>
              <ellipse cx={OX} cy={OY} rx={R} ry={R * 0.8} fill="none" stroke={tight > 0.5 ? HOT : CYAN} strokeWidth={10} strokeDasharray={`${draw * 2 * Math.PI * R} 9999`} transform={`rotate(-90 ${OX} ${OY})`} />
              {tight > 0 && <ellipse cx={OX} cy={OY} rx={R} ry={R * 0.8} fill={HOT} opacity={0.12 * tight} />}
            </g>
          )}
          {g >= C(57) && g < C(64) && (
            <You
              f={g}
              x={OX}
              keys={youKeys}
              o={Math.min(soft(g, C(57), C(57) + 8), 1 - soft(g, C(64) - 6, C(64)) * 0)}
              face={g >= W(61, 5) && g < C(62) ? "sad" : "eyes"}
              facing={g >= C(62) ? 1 : -1}
            />
          )}
          {/* two people, two worlds */}
          {twoK > 0 && (
            <g opacity={twoK}>
              <You f={g} x={1560} keys={friendKeys} label="FRIEND" color={COL.purple} />
              {[
                [950, "pan", ["#ff9f1c", "#ffbe0b", "#fb5607"]],
                [1560, "car", ["#3a86ff", "#118ab2", "#06d6a0"]],
              ].map(([x, ic, cols], k) => (
                <Phone key={k} id={`l1w${k}`} x={x as number} y={380} s={0.5 * pop(g, k === 0 ? C(62) + 6 : C(62) + 14)}>
                  {[0, 1, 2].map((i) => (
                    <VCard key={i} x={0} y={-180 + i * 175} s={1.15} color={g >= W(63, 3) ? (cols as string[])[i] : "#c9cde0"} icon={g >= W(63, 3) ? (ic as "pan" | "car") : "play"} />
                  ))}
                </Phone>
              ))}
            </g>
          )}
          {g >= C(64) && g < C(66) + 6 && <Machine f={g} x={1200} y={500} s={0.6 * pop(g, C(64))} o={vis(g, C(64), C(66) - 4)} label={false} />}
          {/* ballot box: taps are votes */}
          {ballotK > 0 && (
            <g opacity={ballotK}>
              <You f={g} x={1580} keys={youKeys} />
              {[0, 1, 2, 3].map((i) => {
                const at = i < 3 ? W(66, 5) + i * 6 : W(67, 3);
                const y = interpolate(g, [at - 12, at], [260, 560], { ...clamp, easing: Easing.in(Easing.quad) });
                return g >= at - 12 && g < at + 4 ? (
                  <g key={i} transform={`translate(1100 ${y})`}>
                    <rect x={-80} y={-30} width={160} height={60} rx={10} fill={i === 3 ? HOT : "#fff"} stroke={COL.ink} strokeWidth={5} />
                    <text y={14} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={38} fill={i === 3 ? "#fff" : COL.ink}>
                      {i === 3 ? "OOPS" : "TAP"}
                    </text>
                  </g>
                ) : null;
              })}
              <g transform={`translate(1100 700) scale(${pop(g, C(66))})`}>
                <rect x={-170} y={-120} width={340} height={240} rx={16} fill="#e9ecff" stroke={COL.ink} strokeWidth={7} />
                <rect x={-90} y={-128} width={180} height={18} rx={9} fill={COL.ink} />
                <text y={40} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={80} fill={NEON}>
                  VOTES
                </text>
              </g>
            </g>
          )}
          <SparkHost f={g} rows={rows} bulbs={[W(61, 5)]} />
        </>
      }
      html={
        <>
          <Big f={g} at={from + 4} out={C(56) - 4} x={1150} y={460} size={96} color="#fff" r={-2}>
            THE PART <span style={{ color: HOT }}>NOBODY</span> TELLS YOU
          </Big>
          <Pill f={g} at={C(56) + 2} out={C(57) - 2} x={1150} y={200} size={56} bg={CYAN}>
            RACE #{raceN} · EVERY VISIT
          </Pill>
          <Pill f={g} at={C(57)} out={C(58) - 2} x={1200} y={150} size={44} bg="#fff">
            USES WHAT YOU DID LAST TIME
          </Pill>
          {g >= C(58) && g < C(60) && (
            <div style={{ position: "absolute", left: 1200, top: 130, transform: `translate(-50%,-50%) scale(${pop(g, C(58))})`, opacity: vis(g, C(58), C(60) - 4), whiteSpace: "nowrap", fontFamily: FONT.title, fontWeight: 900, fontSize: 36, color: "#fff", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "space-between", width: 600 }}>
                <span>MIXED</span>
                <span style={{ color: "#ffbe0b" }}>COOKING</span>
              </div>
              <div style={{ position: "relative", width: 600, height: 26, background: "#2a3470", border: `4px solid ${COL.ink}`, borderRadius: 13 }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${gauge * 100}%`, background: "#ffbe0b", borderRadius: 10 }} />
                <div style={{ position: "absolute", left: `${gauge * 100}%`, top: -14, width: 12, height: 46, background: "#fff", border: `3px solid ${COL.ink}`, transform: "translateX(-50%)" }} />
              </div>
            </div>
          )}
          {nodes.map(([t, at], i) => {
            if (g < at || g >= C(62)) return null;
            const a = (i / 3) * Math.PI * 2 - Math.PI / 2 + Math.PI / 3;
            return (
              <div key={t} style={{ position: "absolute", left: OX + Math.cos(a) * R, top: OY + Math.sin(a) * R * 0.8, transform: `translate(-50%,-50%) scale(${pop(g, at)})`, opacity: loopK, background: [CYAN, NEON, "#ffd23f"][i], border: `5px solid ${COL.ink}`, borderRadius: 16, padding: "2px 18px", fontFamily: FONT.title, fontWeight: 900, fontSize: 42, color: COL.ink }}>
                {t}
              </div>
            );
          })}
          <Big f={g} at={W(58, 6)} out={C(59) + 20} x={1200} y={150} size={90} color="#ffbe0b" r={-3}>
            MORE COOKING!
          </Big>
          <Big f={g} at={C(59) + 22} out={C(60) - 4} x={1200} y={230} size={84} color="#fff" r={2}>
            WATCH → IT LEANS <span style={{ color: "#ffbe0b" }}>HARDER</span>
          </Big>
          <Big f={g} at={W(61, 5)} out={C(62) - 4} x={1200} y={170} size={100} color={HOT} r={-3}>
            SMALLER… AND SMALLER
          </Big>
          <Pill f={g} at={C(62) + 4} out={C(64) - 4} x={1250} y={130} size={44} bg="#fff">
            SAME APP
          </Pill>
          <Pill f={g} at={W(63, 3)} out={C(64) - 4} x={770} y={450} size={36} bg="#ffbe0b">
            WORLD A
          </Pill>
          <Pill f={g} at={W(63, 3) + 4} out={C(64) - 4} x={1740} y={450} size={36} bg={CYAN}>
            WORLD B
          </Pill>
          <Pill f={g} at={C(64)} out={C(66) - 4} x={1200} y={170} size={50} bg="#fff">
            NOT EVIL
          </Pill>
          <Pill f={g} at={W(64, 5)} out={C(66) - 4} x={1200} y={260} size={42} bg="#fff">
            DOESN'T TRAP EVERYONE
          </Pill>
          <Pill f={g} at={W(65, 4)} out={C(66) - 4} x={1200} y={820} size={48} bg={COL.green} color="#fff">
            ITS JOB: GUESS WELL ✓
          </Pill>
          <Big f={g} at={C(66) + 6} out={CE(67) + 24} x={1150} y={180} size={92} color="#fff" r={-2}>
            QUICK TAPS = <span style={{ color: NEON }}>VOTES</span>
          </Big>
        </>
      }
    />
  );
};
