import React from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from "remotion";
import { Actor, P, SNAP, addPose, idle, type Key } from "../stickman/stick";
import { Burst, COL, FONT, Slam } from "../stickman/fx";
import { Stage, Stamp } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, K, VoiceCaptions, punch } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// V009 · POV: the smartest AI can't count the r's in strawberry. POV Meme in a pink toy room.
// The AI (blue) answers "2 r's". Spark sends the strawberry up into the title zone, where it pops into
// 10 letter tiles that SNAP into three toy bricks (str · aw · berry): what the model actually sees.
// An x-ray sweep shows the r's hiding inside the bricks (wow). Newer models get it right (3 ✓). The old
// trick: spell it first; the bricks break into single letters, each lights up as Spark spells it, the
// r's drop into a counter (1, 2, 3). Tiles fall back into the strawberry, which bounces (loop).

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pop = (f: number, at: number) => interpolate(f, [at, at + 5, at + 9], [0, 1.12, 1], clamp);

const SS = 1.9;
const SGY = GROUND - 92.5 * SS;
const AS = 1.5;
const AGY = GROUND - 92.5 * AS;
const PINK = "#ff5c8a";
const MINT = "#3cc9a0";
const RED = "#e5322d";

const LETTERS = "strawberry".split("");
const BRICKS = [
  { label: "str", id: "496", color: "#ff6b6b", from: 0, n: 3 },
  { label: "aw", id: "675", color: "#4dabf7", from: 3, n: 2 },
  { label: "berry", id: "15717", color: "#9775fa", from: 5, n: 5 },
];
const TY = 470; // tile row centre (title zone)
const TW = 78;
const tileX = (i: number) => 153 + i * 86;
const brickX = (i: number) => 116 + 39 + i * TW + ((i >= 3 ? 1 : 0) + (i >= 5 ? 1 : 0)) * 34;
const brickLeft = (b: number) => brickX(BRICKS[b].from) - TW / 2;
const brickW = (b: number) => BRICKS[b].n * TW;

// --- background: pink toy room ---------------------------------------------------------
const Room: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill>
    <svg width={1080} height={1920} style={{ position: "absolute" }}>
      <defs>
        <linearGradient id="v9wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffd3df" />
          <stop offset="100%" stopColor="#fff0f4" />
        </linearGradient>
      </defs>
      <rect width={1080} height={1920} fill="url(#v9wall)" />
      {/* polka dots drift very slowly */}
      {Array.from({ length: 40 }, (_, i) => {
        const x = ((i % 8) * 150 + (Math.floor(i / 8) % 2) * 75 + f * 0.3) % 1200 - 60;
        const y = 120 + Math.floor(i / 8) * 230;
        return <circle key={i} cx={x} cy={y} r={14} fill="#ffffff" opacity={0.55} />;
      })}
      {/* floor: mint play mat */}
      <rect x={0} y={GROUND} width={1080} height={1920 - GROUND} fill="#bdeedd" />
      {Array.from({ length: 7 }, (_, i) => (
        <rect key={i} x={i * 160 - 20} y={GROUND + 10} width={80} height={600} fill="#a6e6cf" opacity={0.6} />
      ))}
      <line x1={0} y1={GROUND} x2={1080} y2={GROUND} stroke={COL.ink} strokeWidth={5} />
    </svg>
  </AbsoluteFill>
);

// --- a generic cartoon strawberry ------------------------------------------------------
const Strawberry: React.FC<{ s?: number }> = ({ s = 1 }) => (
  <g transform={`scale(${s})`}>
    <path d="M 0 110 C -70 90 -105 10 -95 -35 C -88 -70 -50 -80 0 -78 C 50 -80 88 -70 95 -35 C 105 10 70 90 0 110 Z" fill={RED} {...K} />
    {Array.from({ length: 14 }, (_, i) => (
      <ellipse key={i} cx={-60 + (i % 5) * 30 + (Math.floor(i / 5) % 2) * 15} cy={-40 + Math.floor(i / 5) * 38} rx={4} ry={7} fill="#ffe08a" />
    ))}
    <path d="M -60 -74 L -30 -100 L -14 -80 L 0 -112 L 14 -80 L 30 -100 L 60 -74 Q 0 -60 -60 -74 Z" fill="#37b24d" {...K} strokeWidth={5} />
    <circle cx={-26} cy={0} r={5} fill={COL.ink} />
    <circle cx={26} cy={0} r={5} fill={COL.ink} />
    <path d="M -14 22 Q 0 34 14 22" stroke={COL.ink} strokeWidth={5} fill="none" strokeLinecap="round" />
  </g>
);

// --- speech bubble from the AI -----------------------------------------------------------
const Say: React.FC<{ x: number; y: number; t: number; text: string; color?: string; size?: number }> = ({ x, y, t, text, color = COL.ink, size = 72 }) => {
  if (t <= 0.01) return null;
  const w = text.length * size * 0.5 + 70;
  return (
    <g transform={`translate(${x} ${y}) scale(${t})`}>
      <rect x={-w / 2} y={-58} width={w} height={116} rx={30} fill="#fff" {...K} />
      <path d={`M 30 56 L 60 104 L 64 54`} fill="#fff" {...K} />
      <rect x={28} y={46} width={40} height={12} fill="#fff" />
      <text y={size * 0.36} textAnchor="middle" fontFamily={FONT.comic} fontSize={size} fill={color} letterSpacing={2}>
        {text}
      </text>
    </g>
  );
};

// --- sfx --------------------------------------------------------------------------------------
export const S01_SFX: SfxCue[] = [
  [0, "boing", 0.45],
  [W(1, 3), "pop", 0.5],
  [W(1, 4) + 10, "buzz", 0.5],
  [C(2) + 2, "whoosh", 0.45],
  [W(2, 3), "pop", 0.55],
  [W(2, 5), "slam", 0.6],
  [W(3, 3), "clink", 0.45],
  [W(3, 4), "clink", 0.45],
  [W(3, 5), "clink", 0.45],
  [C(4), "swirl", 0.4],
  [W(4, 2), "ding", 0.4],
  [W(5, 0), "swish", 0.4],
  [W(5, 5), "ding", 0.5],
  [W(6, 4), "shatter", 0.5],
  ...VOICE_CUES[7].words.map((w, i): SfxCue => [w.s, LETTERS[i] === "r" ? "kaching" : "tick", LETTERS[i] === "r" ? 0.4 : 0.3]),
  [C(8), "riser", 0.35],
  [W(8, 1), "impact", 0.75],
  [VOICE_FRAMES - 20, "boing", 0.45],
];

export const S01Bricks: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const two = W(1, 3);
  const wrong = W(1, 4) + 10;
  const hop = C(2);
  const letters = W(2, 3);
  const chunks = W(2, 5);
  const tok = [W(3, 3), W(3, 4), W(3, 5)];
  const xray = C(4);
  const newer = C(5);
  const right = W(5, 5);
  const trick = C(6);
  const spell = W(6, 4);
  const sp = VOICE_CUES[7].words.map((w) => w.s);
  const three = W(8, 0);
  const hit = W(8, 1);
  const home = VOICE_FRAMES - 12;

  // strawberry: centre-floor, hops up and pops into tiles; tiles fall back into it at the end
  const berryOut = interpolate(f, [hop, letters], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const berryBack = interpolate(f, [home - 10, home], [0, 1], clamp);
  const berryX = 540;
  const berryY0 = 1150 - Math.abs(Math.sin(f * 0.18)) * 26 * (f < hop ? 1 : 0);
  const berryY = f < hop ? berryY0 : f < letters ? interpolate(berryOut, [0, 1], [1150, TY]) - Math.sin(berryOut * Math.PI) * 260 : 1150 - Math.abs(Math.sin((f - home) * 0.25)) * 40;
  const berryS = f < hop ? 1 : f < letters ? 1 - 0.5 * berryOut : berryBack;
  const berryVisible = f < letters || f >= home - 10;

  // tiles: 0 = loose letters, 1 = bricks
  const brickK = f < chunks ? 0 : f < spell ? interpolate(f, [chunks, chunks + 6], [0, 1], { ...clamp, easing: SNAP }) : interpolate(f, [spell, spell + 8], [1, 0], { ...clamp, easing: SNAP });
  const tilesOn = f >= letters && f < home;
  const tilesFall = interpolate(f, [home - 14, home - 3], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const xrayK = interpolate(f, [xray + 4, W(4, 2), newer - 6, newer + 4], [0, 1, 1, 0], clamp);
  const scanX = interpolate(f, [xray, W(4, 5)], [60, 1020], clamp);
  const spoken = (i: number) => f >= sp[i];
  const rCount = [2, 7, 8].filter((i) => spoken(i)).length;
  const counterK = interpolate(f, [C(7) - 6, C(7) + 4, home - 14, home - 6], [0, 1, 1, 0], clamp);

  const aiKeys: Key[] = [
    { f: 0, p: {} },
    { f: two - 3, p: {} },
    { f: two + 3, p: { ...P.cheer }, e: SNAP },
    { f: hop - 2, p: { ...P.cheer } },
    { f: hop + 8, p: { ...P.think } },
    { f: xray + 2, p: { ...P.think } },
    { f: W(4, 2) + 2, p: { ...P.shock }, e: SNAP },
    { f: newer - 2, p: { ...P.shock } },
    { f: right - 2, p: { ...P.shock } },
    { f: right + 4, p: { ...P.pointL, la1: -150 }, e: SNAP },
    { f: trick + 4, p: { ...P.pointL, la1: -150 } },
    { f: trick + 12, p: { ...P.think } },
    { f: hit - 2, p: { ...P.think } },
    { f: hit + 4, p: { ...P.cheer }, e: SNAP },
  ];

  const sparkMood = (t: number): Mood =>
    t >= two + 6 && t < hop ? "shock" : t >= W(4, 2) && t < newer ? "shock" : t >= newer && t < trick ? "happy" : t >= trick && t < hit ? "smug" : t >= hit ? "happy" : "neutral";
  const bulb = (t: number) => Math.max(bulbPulse(t, spell, 40), bulbPulse(t, W(4, 2), 18) * 0.6);
  const sparkKeys: Key[] = [
    { f: 0, p: { ...P.pointR, ra1: 120 } },
    { f: two + 2, p: { ...P.pointR, ra1: 120 } },
    { f: two + 8, p: { ...P.shock }, e: SNAP },
    { f: hop - 2, p: { ...P.shock } },
    { f: hop + 6, p: { ...P.pointR, ra1: 150 } }, // up at the word
    { f: chunks - 2, p: { ...P.pointR, ra1: 150 } },
    { f: chunks + 4, p: { ...P.shrug }, e: SNAP },
    { f: tok[0] - 2, p: { ...P.shrug } },
    { f: tok[0] + 4, p: { ...P.pointR, ra1: 145 } },
    { f: xray - 2, p: { ...P.pointR, ra1: 145 } },
    { f: W(4, 2) + 2, p: { ...P.shock }, e: SNAP },
    { f: newer - 2, p: { ...P.shock } },
    { f: newer + 6, p: { ...P.pointR, ra1: 100 } }, // at the AI
    { f: trick - 2, p: { ...P.pointR, ra1: 100 } },
    { f: trick + 6, p: { ...P.think } },
    { f: spell - 2, p: { ...P.think } },
    { f: spell + 3, p: { ra1: 160, ra2: -10, la1: -18 }, e: SNAP }, // aha: finger up
    { f: C(7) - 2, p: { ra1: 160, ra2: -10, la1: -18 } },
    { f: C(7) + 6, p: { ...P.pointR, ra1: 150 } },
    { f: three - 2, p: { ...P.pointR, ra1: 150 } },
    { f: hit + 2, p: { ...P.cheer }, e: SNAP },
    { f: home - 2, p: { ...P.cheer } },
    { f: home + 8, p: { ...P.pointR, ra1: 120 } },
  ];

  const z = punch(f, [two, chunks, W(4, 2), right, spell, hit], 0.035);

  return (
    <Stage
      bg={<Room f={f} />}
      hits={[chunks, spell, hit]}
      power={10}
      cam={{ z }}
      svg={
        <>
          {/* the strawberry */}
          {berryVisible && berryS > 0.02 && (
            <g transform={`translate(${berryX} ${berryY}) scale(${berryS}) rotate(${f < hop ? Math.sin(f * 0.18) * 6 : 0})`}>
              <Strawberry s={1} />
            </g>
          )}
          {f >= letters && f < letters + 14 && <Burst x={540} y={TY} at={letters} f={f} size={240} color={PINK} />}

          {/* bricks (what the model sees) */}
          {tilesOn &&
            BRICKS.map((b, k) => {
              const o = brickK * (1 - xrayK * 0.82);
              if (o < 0.02) return null;
              const lit = f >= tok[k] && f < xray;
              const x0 = brickLeft(k);
              const w = brickW(k);
              const s = lit ? interpolate(f - tok[k], [0, 4, 9], [1, 1.16, 1], clamp) : 1;
              return (
                <g key={k} opacity={o} transform={`translate(${x0 + w / 2} ${TY}) scale(${s}) translate(${-(x0 + w / 2)} ${-TY})`}>
                  {Array.from({ length: b.n }, (_, i) => (
                    <rect key={i} x={x0 + 14 + i * TW} y={TY - 82} width={TW - 28} height={22} rx={8} fill={b.color} {...K} strokeWidth={5} />
                  ))}
                  <rect x={x0} y={TY - 64} width={w} height={128} rx={14} fill={b.color} {...K} />
                  <text x={x0 + w / 2} y={TY + 30} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={88} fill="#fff" stroke={COL.ink} strokeWidth={6} paintOrder="stroke">
                    {b.label}
                  </text>
                </g>
              );
            })}

          {/* letter tiles (real letters) */}
          {tilesOn &&
            LETTERS.map((ch, i) => {
              const x = interpolate(brickK, [0, 1], [tileX(i), brickX(i)]);
              const bornAt = letters + i * 2;
              const s0 = pop(f, bornAt);
              const isR = ch === "r";
              const said = f >= C(7) && spoken(i);
              const bump = said ? interpolate(f - sp[i], [0, 4, 9], [1, 1.25, 1], clamp) : 1;
              const show = (1 - brickK) + xrayK * brickK;
              const glow = isR && (xrayK > 0.2 || (said && f >= C(7)));
              const yFall = tilesFall * (1150 - TY) + (random(`fx${i}`) - 0.5) * 40 * tilesFall;
              const xFall = interpolate(tilesFall, [0, 1], [x, 540 + (i - 4.5) * 8]);
              if (show < 0.02) return null;
              return (
                <g key={i} opacity={show * (1 - tilesFall * 0.8)} transform={`translate(${xFall} ${TY + yFall - (said ? 12 * Math.max(0, 1 - (f - sp[i]) / 10) : 0)}) scale(${s0 * bump * (1 - tilesFall * 0.6)})`}>
                  {glow && <circle r={62} fill="#ffd23f" opacity={0.45} />}
                  <rect x={-34} y={-46} width={68} height={92} rx={12} fill={glow ? RED : said ? "#fff8d6" : "#fff"} {...K} strokeWidth={5} />
                  <text y={28} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={74} fill={glow ? "#fff" : COL.ink}>
                    {ch}
                  </text>
                  {f >= spell + 6 && f < home - 14 && i < 9 && (
                    <text x={42} y={44} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={54} fill={COL.ink}>
                      ,
                    </text>
                  )}
                </g>
              );
            })}

          {/* x-ray scanner */}
          {f >= xray && f < W(4, 5) + 6 && (
            <g opacity={interpolate(f, [W(4, 5), W(4, 5) + 6], [1, 0], clamp)}>
              <rect x={scanX - 10} y={TY - 120} width={20} height={240} fill="#7ef0e4" opacity={0.8} />
              <rect x={scanX - 60} y={TY - 120} width={120} height={240} fill="#7ef0e4" opacity={0.18} />
            </g>
          )}

          {/* AI (blue, generic) */}
          <Actor
            f={f}
            color={COL.blue}
            scale={AS}
            label={f >= newer + 4 && f < trick + 10 ? "NEWER AI" : "AI"}
            face={f >= W(4, 2) && f < newer ? "sad" : f >= right ? "happy" : "eyes"}
            base={{ x: 870, y: AGY }}
            facing={-1}
            keys={aiKeys}
            mod={(t, p) => addPose(p, idle(t, 5))}
          />
          <Say x={800} y={760} t={f < hop + 6 ? pop(f, two) * interpolate(f, [hop, hop + 6], [1, 0], clamp) : 0} text="2 r's." />
          <Say x={800} y={760} t={f >= right && f < trick + 14 ? pop(f, right) * interpolate(f, [trick + 6, trick + 14], [1, 0], clamp) : 0} text="3 ✓" color={MINT} size={84} />

          {/* r counter */}
          {counterK > 0.01 && (
            <g opacity={counterK} transform={`translate(560 820) scale(${f >= hit ? pop(f, hit) : 1})`}>
              <rect x={-150} y={-70} width={300} height={140} rx={28} fill={COL.ink} />
              <rect x={-156} y={-76} width={300} height={140} rx={28} fill="#fff" {...K} />
              <text x={-80} y={26} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={76} fill={RED}>
                r ×
              </text>
              <text x={60} y={36} textAnchor="middle" fontFamily={FONT.comic} fontSize={120} fill={rCount === 3 ? MINT : COL.ink} stroke={COL.ink} strokeWidth={rCount === 3 ? 4 : 0} paintOrder="stroke">
                {rCount}
              </text>
            </g>
          )}
          {f >= hit && f < hit + 16 && <Burst x={600} y={800} at={hit} f={f} size={260} color={MINT} />}

          {/* SPARK */}
          <Spark f={f} scale={SS} base={{ x: 190, y: SGY }} talk={(t) => mouthAt(t)} bulb={bulb} mood={sparkMood} look={1} keys={sparkKeys} mod={(t, p) => addPose(p, idle(t, 8))} />
        </>
      }
      html={
        <>
          {/* hook layer, readable on frame 0 and again at the loop point */}
          <div
            style={{
              position: "absolute",
              left: 540,
              top: 380,
              transform: "translate(-50%,-50%) rotate(-3deg)",
              opacity: Math.max(interpolate(f, [hop, hop + 8], [1, 0], clamp), interpolate(f, [home - 4, home + 6], [0, 1], clamp)),
              background: COL.ink,
              color: "#fff",
              borderRadius: 18,
              padding: "8px 36px",
              fontFamily: FONT.comic,
              fontSize: 120,
              letterSpacing: 4,
              whiteSpace: "nowrap",
            }}
          >
            HOW MANY R's?
          </div>
          {f >= wrong && f < hop + 4 && <Stamp f={f} at={wrong} x={800} y={640} text="WRONG" size={96} color={RED} r={-8} />}
          <Slam f={f} at={chunks} out={tok[0] - 4} x={540} y={660} size={110} color="#fff" stroke={`9px ${COL.ink}`} rotate={-3}>
            ONLY CHUNKS
          </Slam>
          {/* token ids under the bricks */}
          {f >= tok[0] && f < xray &&
            BRICKS.map((b, k) =>
              f >= tok[k] ? (
                <div
                  key={k}
                  style={{
                    position: "absolute",
                    left: brickLeft(k) + brickW(k) / 2,
                    top: TY + 112,
                    transform: `translate(-50%,-50%) scale(${pop(f, tok[k])})`,
                    fontFamily: FONT.title,
                    fontWeight: 800,
                    fontSize: 42,
                    color: COL.ink,
                    background: "#fff",
                    border: `4px solid ${COL.ink}`,
                    borderRadius: 12,
                    padding: "0 14px",
                  }}
                >
                  #{b.id}
                </div>
              ) : null,
            )}
          {f >= tok[0] && f < xray && (
            <div style={{ position: "absolute", left: 540, top: 300, transform: "translate(-50%,-50%)", fontFamily: FONT.title, fontWeight: 800, fontSize: 42, letterSpacing: 3, color: "#7a2140", whiteSpace: "nowrap", opacity: interpolate(f, [tok[0], tok[0] + 6], [0, 1], clamp) }}>
              WHAT THE AI SEES (ONE TOKENIZER)
            </div>
          )}
          <Slam f={f} at={W(4, 2)} out={newer - 4} x={540} y={680} size={104} color={RED} stroke={`9px #fff`} rotate={-3}>
            r'S HIDE INSIDE
          </Slam>
          <Slam f={f} at={spell} out={C(7) + 10} x={540} y={680} size={104} color="#fff" stroke={`9px ${COL.ink}`} rotate={-3}>
            SPELL IT FIRST
          </Slam>
          {f >= tok[0] && f < trick && (
            <div style={{ position: "absolute", left: 540, top: 1590, transform: "translate(-50%,-50%)", fontFamily: FONT.body, fontWeight: 700, fontSize: 26, color: "#7a2140", whiteSpace: "nowrap", opacity: interpolate(f, [tok[0], tok[0] + 8], [0, 0.9], clamp) }}>
              Tokens are one reason; counting repeats is hard too · arXiv 2410.19730, 2412.18626
            </div>
          )}
          <Slam f={f} at={hit} out={home - 8} x={540} y={630} size={130} color={MINT} stroke={`9px ${COL.ink}`} rotate={-3}>
            3 R's ✓
          </Slam>
          <VoiceCaptions f={f} cues={VOICE_CUES} hi={["strawberry", "two", "letters", "chunks", "str", "aw", "berry", "inside", "newer", "spell", "three"]} />
        </>
      }
    />
  );
};
