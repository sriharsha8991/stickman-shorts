import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Actor, P, SMOOTH, addPose, idle, walkCycle } from "../stickman/stick";
import { Burst, COL, Caption, Dust, FONT, Slam } from "../stickman/fx";
import { Stage, fall } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { DayBg, GROUND, K, Phone, VoiceCaptions, punch } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { VOICE_CUES, mouthAt } from "./voice";

// V000 · Meet Spark — channel trailer. Spark introduces himself; phone, price tag and AI hang from
// puppet strings ("the hidden mechanism"); he cuts the strings; CTA "start seeing the strings".
// Every beat is anchored to a spoken word (VOICE_CUES), so re-voicing keeps the sync.

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;

const SPARK_X = 540;
const SS = 2.0;
const SGY = GROUND - 92.5 * SS;
const ITEMS = [
  { at: () => W(1, 1), x: 200, y: 980, lift: 640 }, // phone ("app")
  { at: () => W(2, 1), x: 880, y: 980, lift: 640 }, // price tag ("price")
  { at: () => W(3, 1), x: 540, y: 640, lift: 520 }, // AI ("AI")
];
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const S01_SFX: SfxCue[] = [
  [0, "pop", 0.6],
  [W(0, 2), "ding", 0.7],
  ...ITEMS.map((it): SfxCue => [it.at(), "pop", 0.8]),
  [W(4, 2), "riser", 0.4],
  [W(4, 2) + 8, "stinger", 0.7],
  [W(4, 3), "whoosh", 0.5],
  [C(5) + 4, "swish", 0.4],
  [W(5, 3), "boing", 0.5],
  [W(6, 4), "swish", 0.5],
  [W(6, 6), "shatter", 0.6],
  [W(6, 6) + 4, "thud", 0.6],
  [W(7, 1), "slam", 0.6],
  [C(8), "pop", 0.6],
  [W(8, 6), "ding", 0.5],
];

// --- props -------------------------------------------------------------------
const PriceTag: React.FC = () => (
  <g>
    <path d="M -70 -40 L 50 -40 L 85 0 L 50 40 L -70 40 Z" fill="#fff6d6" {...K} />
    <circle cx={58} cy={0} r={8} fill={COL.paper} {...K} strokeWidth={4} />
    <text x={-12} y={14} textAnchor="middle" fontFamily={FONT.comic} fontSize={46} fill={COL.red}>₹999</text>
  </g>
);

const AiBot: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <line x1={0} y1={-62} x2={0} y2={-42} stroke={COL.ink} strokeWidth={5} />
    <circle cx={0} cy={-66} r={7} fill={COL.red} {...K} strokeWidth={4} />
    <rect x={-58} y={-42} width={116} height={84} rx={22} fill="#dfe9ff" {...K} />
    <rect x={-42} y={-26} width={84} height={44} rx={12} fill={COL.ink} />
    <circle cx={-16} cy={-4} r={7} fill="#7ef0e4" opacity={0.7 + 0.3 * Math.sin(f * 0.3)} />
    <circle cx={16} cy={-4} r={7} fill="#7ef0e4" opacity={0.7 + 0.3 * Math.sin(f * 0.3 + 1)} />
    <text x={0} y={36} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={18} fill={COL.ink}>AI</text>
  </g>
);

const Scissors: React.FC<{ open: number }> = ({ open }) => (
  <g>
    <g transform={`rotate(${-open * 18})`}>
      <path d="M 0 0 L 70 -6 L 0 6 Z" fill="#c9d1d9" {...K} strokeWidth={3} />
      <circle cx={-16} cy={-10} r={10} fill="none" stroke={COL.red} strokeWidth={6} />
    </g>
    <g transform={`rotate(${open * 18})`}>
      <path d="M 0 0 L 70 6 L 0 -6 Z" fill="#c9d1d9" {...K} strokeWidth={3} />
      <circle cx={-16} cy={10} r={10} fill="none" stroke={COL.red} strokeWidth={6} />
    </g>
  </g>
);

// puppet control bar ("the hidden hand") with strings to targets
const Puppeteer: React.FC<{ y: number; targets: [number, number][]; cut: number; sway: number }> = ({ y, targets, cut, sway }) => (
  <g>
    {targets.map(([tx, ty], i) => {
      const bx = 300 + i * 240 + sway;
      const keep = 1 - cut; // cut strings retract upwards
      const ey = y + (ty - y) * keep;
      const ex = bx + (tx - bx) * keep;
      return <line key={i} x1={bx} y1={y} x2={ex} y2={ey} stroke="#555" strokeWidth={3} strokeDasharray={cut > 0 ? "10 8" : undefined} opacity={0.85} />;
    })}
    <rect x={240 + sway} y={y - 14} width={600} height={28} rx={10} fill="#8b5a2b" {...K} />
    <rect x={520 + sway} y={y - 70} width={40} height={140} rx={10} fill="#8b5a2b" {...K} />
  </g>
);

export const S01Trailer: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const aha = W(4, 2); // "hidden"
  const youIn = C(5);
  const cutAt = W(6, 6); // "apart"
  const strings = interpolate(f, [aha, aha + 14], [-200, 200], { ...clamp, easing: SMOOTH });
  const lift = interpolate(f, [aha + 10, aha + 30], [0, 1], { ...clamp, easing: SMOOTH });
  const cut = interpolate(f, [cutAt, cutAt + 10], [0, 1], clamp);
  const sway = Math.sin(f * 0.12) * 18 * lift * (1 - cut);
  const barY = strings + (cut > 0 ? -cut * 400 : 0);

  // item positions: pop in, get lifted by strings, jiggle like puppets, fall when cut
  const itemPos = ITEMS.map((it, i) => {
    const s = interpolate(f, [it.at(), it.at() + 5, it.at() + 9, it.at() + 13], [0, 1.2, 0.95, 1], clamp);
    const jig = Math.sin(f * 0.35 + i * 2) * 14 * lift * (1 - cut);
    const yUp = it.y + (it.lift - it.y) * lift + jig;
    const y = cut > 0 ? fall(f, cutAt + 2 + i * 3, yUp, GROUND - 50, 14) : yUp;
    const r = cut > 0 ? interpolate(f, [cutAt, cutAt + 20], [0, (i - 1) * 25], clamp) : jig * 0.6;
    // when cut loose, drift away from the characters so nothing lands on Spark or YOU
    const drift = [-30, 60, -230][i] * cut;
    return { x: it.x + sway * 0.6 + drift, y, s, r };
  });
  const youX = interpolate(f, [youIn, youIn + 36], [1300, 800], { ...clamp, easing: (t) => t });
  const youStrung = f > W(5, 3) && cut === 0;
  const youJerk = youStrung ? Math.sin(f * 0.6) * 40 : 0;

  const mood = (t: number): Mood =>
    t >= W(5, 2) && t < cutAt ? "shock" : t >= W(7, 0) && t < C(8) ? "smug" : "happy";
  const bulb = (t: number) => Math.max(bulbPulse(t, W(0, 2), 22), bulbPulse(t, aha, 50), bulbPulse(t, W(8, 4), 40));

  return (
    <Stage
      bg={<DayBg />}
      hits={[aha + 8, cutAt]}
      power={14}
      cam={{ z: punch(f, [0, ...ITEMS.map((i) => i.at()), aha + 8, youIn, cutAt, W(7, 1), C(8)], 0.05) }}
      svg={
        <>
          {/* strings + puppeteer bar */}
          {f >= aha && (
            <Puppeteer
              y={barY}
              sway={sway}
              cut={cut}
              targets={[
                [itemPos[0].x, itemPos[0].y - 70],
                [itemPos[2].x, itemPos[2].y - 70],
                [itemPos[1].x, itemPos[1].y - 45],
              ]}
            />
          )}
          {/* items */}
          {f >= ITEMS[0].at() && <Phone x={itemPos[0].x} y={itemPos[0].y} s={1.5 * itemPos[0].s} r={itemPos[0].r} scroll={f * 2} />}
          {f >= ITEMS[1].at() && (
            <g transform={`translate(${itemPos[1].x} ${itemPos[1].y}) rotate(${itemPos[1].r}) scale(${itemPos[1].s})`}>
              <PriceTag />
            </g>
          )}
          {f >= ITEMS[2].at() && (
            <g transform={`translate(${itemPos[2].x} ${itemPos[2].y}) rotate(${itemPos[2].r}) scale(${itemPos[2].s * 1.2})`}>
              <AiBot f={f} />
            </g>
          )}
          {cut > 0 && <Burst x={540} y={460} at={cutAt} f={f} size={260} color={COL.yellow} />}
          {cut > 0 && <Dust x={540} y={GROUND} at={cutAt + 16} f={f} spread={380} />}
          {/* YOU, puppeted on strings, then freed */}
          {f >= youIn && (
            <Actor
              f={f}
              color={COL.orange}
              scale={1.4}
              label="YOU"
              base={{ x: 1300, y: GROUND - 92.5 * 1.4 }}
              facing={-1}
              keys={[
                { f: youIn, p: {} },
                { f: W(5, 3), p: { ...P.armsUp } },
                { f: cutAt, p: { ...P.armsUp } },
                { f: cutAt + 6, p: { ...P.cheer } },
              ]}
              mod={(t, p) => {
                const q = { ...p, x: youX };
                if (t < youIn + 36) return addPose(q, walkCycle(t));
                if (youStrung) return { ...q, la1: q.la1 + youJerk, ra1: q.ra1 - youJerk, head: Math.sin(t * 0.5) * 12 };
                return addPose(q, idle(t, 4));
              }}
            >
              {(j) =>
                youStrung ? (
                  <g opacity={0.85}>
                    {[j.lHand, j.rHand, j.headC].map(([x, y], i) => (
                      <line key={i} x1={x} y1={y} x2={x + (i - 1) * 30} y2={-40} stroke="#555" strokeWidth={3} />
                    ))}
                  </g>
                ) : null
              }
            </Actor>
          )}
          {/* SPARK, the host */}
          <Spark
            f={f}
            scale={SS}
            label={false}
            base={{ x: SPARK_X, y: SGY }}
            talk={(t) => mouthAt(t)}
            bulb={bulb}
            mood={mood}
            look={f >= C(1) && f < C(2) ? -1 : f >= C(2) && f < C(3) ? 1 : 0}
            keys={[
              { f: 0, p: { ra1: 150, ra2: 20, la1: -18, la2: 8 } }, // wave
              { f: C(1) - 4, p: { ra1: 150, ra2: 20 } },
              { f: C(1) + 2, p: { ...P.pointL } },
              { f: C(2) - 4, p: { ...P.pointL } },
              { f: C(2) + 2, p: { ...P.pointR } },
              { f: C(3) - 4, p: { ...P.pointR } },
              { f: C(3) + 2, p: { ra1: 160, ra2: 10, la1: -18 } },
              { f: aha - 4, p: { ra1: 160, ra2: 10 } },
              { f: aha + 2, p: { ...P.shrug } },
              { f: W(5, 2) - 2, p: { ...P.shrug } },
              { f: W(5, 2) + 4, p: { ...P.shock } },
              { f: W(6, 4) - 4, p: { ...P.shock } },
              { f: W(6, 4) + 2, p: { ra1: 125, ra2: -10, la1: -20, la2: 10, lean: 0, head: 0 } }, // scissors up
              { f: cutAt + 12, p: { ra1: 125, ra2: -10 } },
              { f: W(7, 0), p: { ...P.pointR, ra1: 70 } }, // "one stick figure at a time" -> points at YOU
              { f: C(8) - 4, p: { ...P.pointR, ra1: 70 } },
              { f: C(8) + 2, p: { ...P.cheer } },
            ]}
            mod={(t, p) => {
              const wave = t < C(1) - 4 ? Math.sin(t * 0.45) * 22 : 0;
              return addPose({ ...p, ra2: p.ra2 + wave }, idle(t, 9));
            }}
          >
            {(j) =>
              f >= W(6, 4) - 2 && f < cutAt + 14 ? (
                <g transform={`translate(${j.rHand[0]} ${j.rHand[1]}) rotate(-60)`}>
                  <Scissors open={Math.abs(Math.sin((f - W(6, 4)) * 0.5))} />
                </g>
              ) : null
            }
          </Spark>
          {/* "you start seeing the strings": faint strings at the frame edges */}
          {f >= W(8, 4) && (
            <g opacity={interpolate(f, [W(8, 4), W(8, 6) + 6], [0, 0.6], clamp)}>
              {[70, 180, 900, 1010].map((x, i) => (
                <line key={x} x1={x} y1={0} x2={x + Math.sin(f * 0.08 + i) * 14} y2={1920} stroke="#777" strokeWidth={2.5} strokeDasharray="14 12" />
              ))}
            </g>
          )}
        </>
      }
      html={
        <>
          <Slam f={f} at={0} out={C(1) - 6} x={540} y={330} size={150} color={COL.ink}>
            MEET
          </Slam>
          <Slam f={f} at={W(0, 2)} out={C(1) - 6} x={540} y={490} size={190} color={"#0fb5a6"} stroke={`10px ${COL.ink}`} rotate={-3}>
            SPARK
          </Slam>
          <Slam f={f} at={aha + 8} out={cutAt - 8} x={540} y={330} size={100} color={COL.red} stroke={`8px ${COL.ink}`}>
            THE HIDDEN MECHANISM
          </Slam>
          <Slam f={f} at={W(7, 1)} out={C(8) - 4} x={540} y={330} size={84} font={FONT.title} weight={900} spacing={4} color={COL.ink}>
            ONE STICK FIGURE AT A TIME
          </Slam>
          <Slam f={f} at={C(8)} x={540} y={300} size={96} color={COL.red} stroke={`8px ${COL.ink}`}>
            THE HIDDEN MECHANISM
          </Slam>
          <Caption f={f} at={C(8) + 10} x={540} y={420} size={44} bg={"#0fb5a6"}>
            with SPARK · follow to see the strings
          </Caption>
          <VoiceCaptions f={f} cues={VOICE_CUES} hi={["Spark", "hidden", "mechanism", "apart", "strings"]} />
        </>
      }
    />
  );
};
