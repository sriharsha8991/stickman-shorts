import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { P, SNAP, type Key } from "../stickman/stick";
import { COL, FONT } from "../stickman/fx";
import { Stage, Stamp } from "../stickman/common";
import { punch } from "../shared/kit";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { Big, C, CE, CYAN, HOT, Machine, NEON, Pill, Room, SparkHost, Src, W, You, clamp, pop, soft, vis, type Act } from "./world";

// CH2 · What it reads (1:04–2:02). Misconception first: two MYTH cards (popular / only views) get X'd by YouTube's
// own help page. Then the 8 signals plug into the machine one pipe per beat (watch history, searches,
// subscriptions, likes, dislikes, Not interested, Don't recommend channel, ?). The 8th is the sneaky one: a
// survey card pops out (wow), "an hour and hate it", the survey slots into pipe 8 = SATISFACTION SURVEYS (aha).
// "Not your mind — what you do": all pipes pulse.

const MX = 1450;
const MY = 500;
const MS = 0.85;
const pipeY = (i: number) => MY - (520 * MS) / 2 + 42 + i * 51;
const PIPE_X0 = 640;
const PIPE_X1 = MX - (560 * MS) / 2;

export const S03_SFX: SfxCue[] = [
  [C(20) + 4, "stamp", 0.35],
  [C(21) + 2, "stamp", 0.35],
  [W(22, 0) + 2, "shatter", 0.35],
  [W(22, 3), "page", 0.4],
  [C(23), "pop", 0.35],
  [W(24, 2), "pop", 0.45],
  [W(25, 3), "pop", 0.45],
  [W(26, 4), "pop", 0.45],
  [W(27, 4), "pop", 0.45],
  [W(27, 6), "pop", 0.45],
  [W(28, 5), "pop", 0.45],
  [W(29, 1), "pop", 0.45],
  [C(30), "buzz", 0.25],
  [W(31, 4), "ding", 0.45],
  ...Array.from({ length: 5 }, (_, i): SfxCue => [W(31, 6) + i * 4, "tick", 0.2]),
  [C(32) + 4, "boing", 0.3],
  [C(33), "pop", 0.35],
  [W(34, 7), "thud", 0.4],
  [C(35), "whoosh", 0.4],
  [W(35, 3) + 6, "clink", 0.45],
  [C(36), "buzz", 0.3],
  [C(37), "swirl", 0.4],
  [W(37, 3), "kaching", 0.3],
];

const PIPES: [string, number][] = [
  ["WATCH HISTORY", W(24, 2)],
  ["SEARCHES", W(25, 3)],
  ["SUBSCRIPTIONS", W(26, 4)],
  ["LIKES", W(27, 4)],
  ["DISLIKES", W(27, 6)],
  ["“NOT INTERESTED”", W(28, 5)],
  ["“DON'T RECOMMEND CHANNEL”", W(29, 1)],
  ["?", C(30)],
];

export const S03Signals: React.FC<SceneProps> = ({ from }) => {
  const g = from + useCurrentFrame();
  const mythOut = W(22, 3) + 2;
  const machAt = C(23) - 2;
  const surveyAt = W(31, 4);
  const slotAt = C(35);
  const flyK = interpolate(g, [slotAt, W(35, 3) + 6], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const allPulse = g >= C(37) ? 0.5 + 0.5 * Math.sin((g - C(37)) * 0.35) : 0;
  const stars = Math.floor(interpolate(g, [W(31, 6), W(31, 6) + 20], [0, 5], clamp));

  const rows: Act[] = [
    [from, "armsCrossed", "skeptical"],
    [C(21), "handsHips", "smug"],
    [C(22), "stop", "determined"],
    [C(23), "present", "happy"],
    [C(24), "count1", "excited"],
    [C(25), "count2", "curious"],
    [C(26), "pointSide", "neutral"],
    [C(27), "doublePoint", "excited"],
    [C(28), "pointDown", "determined"],
    [C(29), "stop", "skeptical"],
    [C(30), "whisper", "wink"],
    [C(31), "pointUp", "curious"],
    [C(32), "thinkChin", "thinking"],
    [C(33), "shrugBig", "worried"],
    [C(34), "facepalm", "laugh"],
    [C(35), "celebrate", "excited", "hop"],
    [C(36), "stop", "skeptical", "shake"],
    [C(37), "presentBoth", "happy", "nod"],
  ];

  const youKeys: Key[] = [
    { f: C(23), p: { x: 1785, ...P.stand } },
    { f: C(34) - 2, p: { x: 1785 } },
    { f: C(34) + 4, p: { x: 1785, ...P.sad }, e: SNAP },
    { f: C(35) - 2, p: { x: 1785, ...P.sad } },
    { f: C(35) + 6, p: { x: 1785, ...P.cheer } },
  ];

  const z = punch(g - from, [W(22, 0), W(24, 2), W(27, 4), surveyAt, W(35, 3) + 6, C(37)].map((x) => x - from), 0.025);

  // survey card position: pops above the machine, then flies into pipe 8's mouth
  const sx = interpolate(flyK, [0, 1], [MX, PIPE_X0 + 150]);
  const sy = interpolate(flyK, [0, 1], [175, pipeY(7)]);
  const ss = interpolate(flyK, [0, 1], [1, 0.25]);

  return (
    <Stage
      bg={<Room f={g} hue="#123a5a" />}
      hits={[W(22, 0) + 2 - from, W(35, 3) + 6 - from]}
      power={6}
      cam={{ z }}
      svg={
        <>
          <Machine f={g} x={MX} y={MY} s={MS * pop(g, machAt)} o={g >= machAt ? 1 : 0} look={g < C(30) ? -0.9 : g < C(35) ? 0 : -0.9} heat={allPulse * 0.6} label={false} />
          {/* help-page document */}
          {g >= W(22, 3) && g < C(24) + 8 && (
            <g transform={`translate(1150 500) rotate(-4) scale(${pop(g, W(22, 3) + 4)})`} opacity={vis(g, W(22, 3) + 4, C(23) - 4)}>
              <rect x={-150} y={-190} width={300} height={380} rx={14} fill="#fff" stroke={COL.ink} strokeWidth={6} />
              <rect x={-150} y={-190} width={300} height={60} rx={14} fill={CYAN} stroke={COL.ink} strokeWidth={6} />
              <text y={-150} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={34} fill={COL.ink}>
                HELP PAGE
              </text>
              {Array.from({ length: 8 }, (_, i) => (
                <g key={i}>
                  <circle cx={-110} cy={-90 + i * 36} r={8} fill={HOT} />
                  <rect x={-90} y={-98 + i * 36} width={160 + ((i * 37) % 50)} height={14} rx={7} fill="#c9cde0" />
                </g>
              ))}
            </g>
          )}
          {/* the 8 pipes */}
          {PIPES.map(([, at], i) => {
            if (g < at - 2) return null;
            const y = pipeY(i);
            const len = PIPE_X1 - PIPE_X0;
            const drawK = interpolate(g, [at - 2, at + 8], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
            const lit = i === 7 && g < slotAt ? 0.3 + 0.3 * Math.sin(g * 0.5) : 1;
            const col = i === 7 ? (g >= slotAt ? "#ffd23f" : "#888") : i % 2 ? NEON : CYAN;
            return (
              <g key={i} opacity={lit}>
                <line x1={PIPE_X0} y1={y} x2={PIPE_X0 + len * drawK} y2={y} stroke="#0a0f2a" strokeWidth={22} strokeLinecap="round" />
                <line x1={PIPE_X0} y1={y} x2={PIPE_X0 + len * drawK} y2={y} stroke={col} strokeWidth={12 + allPulse * 6} strokeLinecap="round" />
                {drawK >= 1 &&
                  Array.from({ length: 5 }, (_, k) => {
                    const p = ((g * 0.02 + k / 5 + i * 0.13) % 1) * len;
                    return <circle key={k} cx={PIPE_X0 + p} cy={y} r={6} fill="#fff" opacity={i === 7 && g < slotAt ? 0 : 0.9} />;
                  })}
              </g>
            );
          })}
          {/* myth cards */}
          {g < mythOut + 10 && (
            <g opacity={vis(g, from, mythOut)}>
              {[
                ["MYTH: IT SHOWS WHAT'S POPULAR", C(20) + 4, 360],
                ["MYTH: IT ONLY COUNTS VIEWS", C(21) + 2, 560],
              ].map(([t, at, y], i) =>
                g >= (at as number) ? (
                  <g key={i} transform={`translate(1150 ${y}) rotate(${i ? 2 : -2}) scale(${pop(g, at as number)})`}>
                    <rect x={-420} y={-62} width={840} height={124} rx={18} fill="#fff" stroke={COL.ink} strokeWidth={6} />
                    <text y={18} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={56} fill={COL.ink}>
                      {t as string}
                    </text>
                    {g >= W(22, 0) + 2 && (
                      <g opacity={soft(g, W(22, 0) + 2, W(22, 0) + 6)} stroke={HOT} strokeWidth={18} strokeLinecap="round">
                        <line x1={-380} y1={-50} x2={380} y2={50} />
                        <line x1={-380} y1={50} x2={380} y2={-50} />
                      </g>
                    )}
                  </g>
                ) : null,
              )}
            </g>
          )}
          {/* survey card */}
          {g >= surveyAt && g < W(35, 3) + 8 && (
            <g transform={`translate(${sx} ${sy}) scale(${ss * pop(g, surveyAt)})`}>
              <rect x={-230} y={-80} width={460} height={160} rx={20} fill="#fff" stroke={COL.ink} strokeWidth={6} />
              <text y={-24} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={40} fill={COL.ink}>
                HOW WAS THIS VIDEO?
              </text>
              {Array.from({ length: 5 }, (_, k) => (
                <text key={k} x={-140 + k * 70} y={50} textAnchor="middle" fontSize={58} fill={k < stars ? "#ffd23f" : "#ccc"} stroke={COL.ink} strokeWidth={2}>
                  ★
                </text>
              ))}
            </g>
          )}
          {/* brain (not your mind) */}
          {g >= C(36) && g < C(37) + 6 && (
            <g transform={`translate(1000 180) scale(${pop(g, C(36))})`} opacity={vis(g, C(36), C(37) - 2)}>
              <path d="M -70 10 C -100 -40 -50 -80 -10 -60 C 10 -95 70 -80 70 -40 C 110 -20 90 40 50 45 C 30 70 -40 70 -50 45 C -90 50 -95 25 -70 10 Z" fill="#ffb3c6" stroke={COL.ink} strokeWidth={6} />
              <path d="M -30 -40 q 20 20 0 40 M 20 -50 q -15 25 10 45" stroke={COL.ink} strokeWidth={4} fill="none" />
              <g stroke={HOT} strokeWidth={14} strokeLinecap="round">
                <line x1={-90} y1={-80} x2={90} y2={70} />
                <line x1={-90} y1={70} x2={90} y2={-80} />
              </g>
            </g>
          )}
          <You f={g} x={1785} s={1.0} keys={youKeys} o={soft(g, C(23), C(23) + 8)} face={g >= C(34) && g < C(35) ? "angry" : "happy"} />
          <SparkHost f={g} rows={rows} bulbs={[W(35, 3) + 6]} />
        </>
      }
      html={
        <>
          <Big f={g} at={W(22, 3) + 4} out={C(23) - 2} x={1150} y={190} size={84} color={CYAN} r={-2}>
            YOUTUBE'S OWN LIST
          </Big>
          <Pill f={g} at={C(23) + 4} out={C(24) - 2} x={1650} y={330} size={40} bg={YOU_BG}>
            ABOUT YOU
          </Pill>
          {PIPES.map(([t, at], i) => {
            if (g < at) return null;
            const label = i === 7 && g >= slotAt + 10 ? "SATISFACTION SURVEYS" : t;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: PIPE_X0 - 10,
                  top: pipeY(i),
                  transform: `translate(0,-50%) scale(${pop(g, i === 7 && g >= slotAt + 10 ? slotAt + 10 : at)})`,
                  transformOrigin: "left center",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ width: 40, height: 40, borderRadius: 20, background: i === 7 ? "#ffd23f" : CYAN, border: `4px solid ${COL.ink}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT.title, fontWeight: 900, fontSize: 28 }}>
                  {i + 1}
                </span>
                <span style={{ background: i === 7 ? "#ffd23f" : "#fff", border: `4px solid ${COL.ink}`, borderRadius: 12, padding: "0 12px", fontFamily: FONT.title, fontWeight: 900, fontSize: 30, color: COL.ink, boxShadow: `0 0 ${allPulse * 24}px ${CYAN}` }}>
                  {label}
                </span>
              </div>
            );
          })}
          <Big f={g} at={C(30) + 4} out={surveyAt - 2} x={1450} y={180} size={96} color="#ffd23f" r={-3}>
            THE SNEAKY ONE
          </Big>
          <Big f={g} at={C(32) + 4} out={C(33) - 2} x={1000} y={170} size={90} color="#fff" r={3}>
            WHY ASK?
          </Big>
          <Pill f={g} at={C(33)} out={C(35) - 2} x={940} y={130} size={40} bg={CYAN}>
            WATCH TIME ✓
          </Pill>
          <Pill f={g} at={W(33, 6)} out={C(35) - 2} x={940} y={215} size={40} bg={HOT} color="#fff">
            HAPPY? ???
          </Pill>
          <Pill f={g} at={W(34, 6)} out={C(35) + 4} x={1640} y={300} size={36} bg="#fff">
            1 HOUR… HATED IT
          </Pill>
          {g >= W(35, 3) + 6 && g < C(36) && <Stamp f={g} at={W(35, 3) + 6} x={1000} y={190} text="GUESS CHECKED" size={60} color={COL.green} r={-5} />}
          <Big f={g} at={C(37)} out={CE(37) + 30} x={1000} y={175} size={96} color={CYAN} r={-2}>
            WHAT YOU <span style={{ color: HOT }}>DO</span>
          </Big>
          <Src f={g} at={C(22)} out={CE(37) + 20}>
            YouTube Help: recommendation signals · support.google.com/youtube/answer/16089387
          </Src>
        </>
      }
    />
  );
};

const YOU_BG = COL.orange;
