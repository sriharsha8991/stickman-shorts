import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { addPose, idle, walkCycle } from "../stickman/stick";
import { Burst, COL, FONT, Slam } from "../stickman/fx";
import { Stage, Stamp } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, K, VoiceCaptions, punch } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { G, gestureKeys, hop, nod, shake } from "../shared/gestures";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// H13 · 21 days to form a habit is a myth. Myth vs Reality on a bright morning road (sky blue, mint hills).
// A "HABIT LOADING" bar sits at 21/21 (MYTH). The 21 traces to a 1960 self-help book (a surgeon on
// adjusting to a new face: book + hand mirror). REALITY: 12 weeks of tracking; the bar STRETCHES — 21 slides
// left, the median lands at 66 (wow), then the scale stretches again into a road: 18 … 254 (projected).
// Water quick vs 50 sit-ups slow; caveat pill (small study, simple habits); one missed day barely matters
// (week strip with an X). The 21 flag topples; Spark walks on; DAY 1 again (loop).
// Lally et al. 2010, Eur J Soc Psychol 40:998–1009; Maltz 1960 (via UCL BSH blog, 2012).

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pop = (f: number, at: number) => interpolate(f, [at, at + 5, at + 9], [0, 1.12, 1], clamp);

const SS = 1.8;
const SGY = GROUND - 92.5 * SS;
const MINT = "#2fbf71";
const SKY = "#2b7de9";
const SUN = "#ffcf3f";
const PINK = "#ff5d8f";

// bar geometry
const BX0 = 290;
const BX1 = 900;
const BY = 840;
const BH = 70;

// --- anchors ----------------------------------------------------------------------------------------
const T = {
  quit: W(0, 1),
  d22: W(0, 7),
  rule: W(1, 1),
  never: W(1, 5),
  traces: C(2),
  y1960: W(2, 5),
  book: W(2, 7),
  surgeon: W(3, 1),
  days21: W(3, 6),
  adjust: C(4),
  face: W(4, 4),
  when: C(5),
  tracked: W(5, 3),
  weeks: W(5, 7),
  median: W(6, 1),
  s66: W(6, 3),
  range: W(7, 2),
  e18: W(7, 3),
  h254: W(7, 6),
  water: W(8, 1),
  quick: W(8, 4),
  situps: W(8, 5),
  slow: W(8, 7),
  small: C(9),
  simple: W(9, 2),
  best: W(9, 4),
  missing: C(10),
  barely: W(10, 3),
  stop: W(11, 1),
  t21: W(11, 4),
  missed: C(12),
  show: W(12, 4),
  next: W(12, 7),
};
const LOOP = VOICE_FRAMES - 20;

// --- background: bright morning road -----------------------------------------------------------------
const Morning: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill>
    <svg width={1080} height={1920} style={{ position: "absolute" }}>
      <defs>
        <linearGradient id="h13sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9fdcff" />
          <stop offset="100%" stopColor="#e8fff5" />
        </linearGradient>
      </defs>
      <rect width={1080} height={1920} fill="url(#h13sky)" />
      {/* drifting clouds */}
      {[
        [200, 330, 1],
        [760, 260, 0.8],
        [520, 560, 0.6],
      ].map(([x, y, s], i) => {
        const cx = ((x + f * (0.4 + i * 0.15)) % 1300) - 110;
        return (
          <g key={i} transform={`translate(${cx} ${y}) scale(${s})`} opacity={0.85}>
            <ellipse cx={0} cy={0} rx={90} ry={34} fill="#fff" />
            <ellipse cx={-50} cy={8} rx={60} ry={28} fill="#fff" />
            <ellipse cx={55} cy={10} rx={64} ry={26} fill="#fff" />
          </g>
        );
      })}
      {/* hills */}
      <path d="M 0 1060 Q 300 960 620 1050 T 1080 1010 L 1080 1290 L 0 1290 Z" fill="#a8e6b8" />
      <path d="M 0 1160 Q 260 1100 540 1150 T 1080 1130 L 1080 1290 L 0 1290 Z" fill="#7fd39a" />
      {/* grass + road strip */}
      <rect x={0} y={GROUND} width={1080} height={1920 - GROUND} fill="#5cb874" />
      <rect x={0} y={GROUND + 40} width={1080} height={90} fill="#5b6270" />
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x={((i * 160 - f * 2) % 1280) - 100} y={GROUND + 80} width={80} height={10} rx={5} fill="#fff" opacity={0.85} />
      ))}
      <line x1={0} y1={GROUND} x2={1080} y2={GROUND} stroke={COL.ink} strokeWidth={6} />
    </svg>
  </AbsoluteFill>
);

// --- sfx ----------------------------------------------------------------------------------------------
export const S01_SFX: SfxCue[] = [
  [0, "pop", 0.4],
  [T.d22, "page", 0.5],
  [T.never, "stamp", 0.65],
  [T.y1960, "thud", 0.5],
  [T.surgeon, "pop", 0.35],
  [T.face, "boing", 0.45],
  [T.when, "whoosh_long", 0.45],
  ...Array.from({ length: 12 }, (_, i): SfxCue => [T.tracked + i * 2, "tick", 0.2]),
  [T.s66 - 20, "riser", 0.45],
  [T.s66, "impact", 0.75],
  [T.range, "whoosh", 0.45],
  [T.e18, "clink", 0.4],
  [T.h254, "slam", 0.6],
  [T.quick, "swish", 0.45],
  [T.slow, "boing", 0.35],
  [T.small, "page", 0.35],
  [T.barely, "ding", 0.5],
  [T.t21 - 4, "crash", 0.45],
  [T.next, "kaching", 0.35],
  [LOOP, "swirl", 0.35],
];

export const S01Road: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();

  // days shown across the bar (the stretch)
  const span =
    f < T.when
      ? 21
      : f < T.range
        ? interpolate(f, [T.tracked, T.tracked + 16], [21, 84], { ...clamp, easing: Easing.inOut(Easing.cubic) })
        : f < LOOP
          ? interpolate(f, [T.range, T.range + 18], [84, 260], { ...clamp, easing: Easing.inOut(Easing.cubic) })
          : interpolate(f, [LOOP, LOOP + 12], [260, 21], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const dx = (d: number) => BX0 + (Math.min(d, span) / span) * (BX1 - BX0);
  const fillDays =
    f < T.when
      ? 21
      : f < T.median
        ? 21
        : f < LOOP
          ? interpolate(f, [T.s66 - 20, T.s66], [21, 66], { ...clamp, easing: Easing.out(Easing.cubic) })
          : interpolate(f, [LOOP, LOOP + 12], [66, 21], clamp);
  const roadK = interpolate(f, [T.range, T.range + 14], [0, 1], clamp) * interpolate(f, [LOOP, LOOP + 10], [1, 0], clamp);
  const barK = interpolate(f, [T.traces - 4, T.traces + 6, T.when - 6, T.when + 4], [1, 0.25, 0.25, 1], clamp);

  // props: book + mirror (myth origin)
  const bookK = interpolate(f, [T.y1960 - 4, T.y1960 + 6, T.when - 6, T.when + 2], [0, 1, 1, 0], clamp);
  const bookY = interpolate(f, [T.y1960 - 4, T.y1960 + 6], [-700, 0], { ...clamp, easing: Easing.in(Easing.quad) });
  const mirrorK = interpolate(f, [T.surgeon, T.surgeon + 8, T.when - 6, T.when + 2], [0, 1, 1, 0], clamp);
  const nose = interpolate(f, [T.face, T.face + 4, T.face + 8], [1.6, 0.8, 1], clamp);

  // calendar
  const day = f < T.d22 ? 21 : f < T.next ? 22 : 1;
  const flip = Math.max(pop(f, T.d22), f >= T.next ? pop(f, T.next) : 0);
  const calK = interpolate(f, [T.traces - 4, T.traces + 4, T.missed - 4, T.missed + 4], [1, 0, 0, 1], clamp);

  // flag on day 21 topples
  const flagRot = interpolate(f, [T.t21 - 4, T.t21 + 6], [0, 96], { ...clamp, easing: Easing.in(Easing.quad) }) * (f < LOOP ? 1 : interpolate(f, [LOOP, LOOP + 10], [1, 0], clamp));

  // racers (cue 8)
  const raceK = interpolate(f, [T.water - 4, T.water + 4, T.small, T.small + 8], [0, 1, 1, 0], clamp);
  const waterD = interpolate(f, [T.water, T.quick + 8], [0, 0.42], { ...clamp, easing: Easing.out(Easing.quad) });
  const sitD = interpolate(f, [T.situps, T.small + 8], [0, 0.12], clamp);

  // week strip (cue 10)
  const weekK = interpolate(f, [T.missing - 4, T.missing + 6, T.stop - 4, T.stop + 4], [0, 1, 1, 0], clamp);

  // SPARK walks on at the end
  const walkX = (t: number) => interpolate(t, [T.show, T.next + 10, LOOP, LOOP + 12], [0, 70, 70, 0], clamp);
  const walking = (t: number) => t >= T.show && t < T.next + 10;
  const sparkKeys = gestureKeys([
    [0, G.rest],
    [T.quit, G.pointSide],
    [T.d22, G.shrugBig, "snap"],
    [T.never, G.armsCrossed, "snap"],
    [T.book, G.pointSide, "snap"],
    [T.surgeon, G.thinkChin, "snap"],
    [T.face, G.facepalm, "snap"],
    [T.tracked, G.pointUp, "snap"],
    [T.s66, G.mindBlown, "snap"],
    [T.e18, G.pointSide, "snap"],
    [T.h254, G.recoil, "snap"],
    [T.water, G.count1, "snap"],
    [T.situps, G.count2, "snap"],
    [T.small, G.stop, "snap"],
    [T.best, G.whisper, "snap"],
    [T.barely, G.celebrate, "snap"],
    [T.stop, G.stop, "snap"],
    [T.t21, G.pointDown, "snap"],
    [T.missed, G.beckon, "snap"],
    [T.next, G.pointUp, "snap"],
    [LOOP + 4, G.rest],
  ]);
  const sparkMood = (t: number): Mood =>
    t < T.rule
      ? "worried"
      : t < T.traces
        ? "skeptical"
        : t < T.surgeon
          ? "curious"
          : t < T.face
            ? "thinking"
            : t < T.when
              ? "laugh"
              : t < T.s66
                ? "determined"
                : t < T.e18
                  ? "mindblown"
                  : t < T.water
                    ? "shock"
                    : t < T.small
                      ? "happy"
                      : t < T.best
                        ? "skeptical"
                        : t < T.stop
                          ? "excited"
                          : t < T.missed
                            ? "determined"
                            : t < LOOP
                              ? "wink"
                              : "worried";
  const bulb = (t: number) => Math.max(bulbPulse(t, T.s66, 34), bulbPulse(t, T.barely, 24) * 0.8);

  const z = punch(f, [T.never, T.s66, T.h254, T.barely], 0.035);
  const hookK = Math.max(interpolate(f, [T.d22 - 4, T.d22 + 2], [1, 0], clamp), interpolate(f, [LOOP + 2, LOOP + 10], [0, 1], clamp));

  const marker = (d: number, label: string, color: string, k: number, up = true, sub?: string) =>
    k > 0.01 ? (
      <g key={label} transform={`translate(${dx(d)} ${BY + (up ? -BH / 2 : BH / 2)})`} opacity={k}>
        <line x1={0} y1={0} x2={0} y2={up ? -56 : 56} stroke={COL.ink} strokeWidth={6} />
        <g transform={`translate(0 ${up ? -92 : 92}) scale(${k})`}>
          <rect x={-label.length * 17 - 20} y={-34} width={label.length * 34 + 40} height={68} rx={18} fill={color} {...K} strokeWidth={5} />
          <text y={18} textAnchor="middle" fontFamily={FONT.comic} fontSize={54} fill="#fff" stroke={COL.ink} strokeWidth={2}>
            {label}
          </text>
          {sub && (
            <text y={up ? -48 : 66} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={28} fill={COL.ink}>
              {sub}
            </text>
          )}
        </g>
      </g>
    ) : null;

  const fillColor = f >= T.when ? MINT : "#9be36d";
  const showReal = f >= T.when && f < LOOP + 10;

  return (
    <Stage
      bg={<Morning f={f} />}
      hits={[T.never, T.s66, T.h254]}
      power={9}
      cam={{ z }}
      svg={
        <>
          {/* the loading bar → road */}
          <g opacity={barK}>
            <rect x={BX0 - 8} y={BY - BH / 2 - 8} width={BX1 - BX0 + 16} height={BH + 16} rx={22} fill="#fff" {...K} />
            <rect x={BX0} y={BY - BH / 2} width={Math.max(0, dx(fillDays) - BX0)} height={BH} rx={14} fill={fillColor} />
            {/* asphalt overlay when the bar becomes a road */}
            {roadK > 0.01 && (
              <g opacity={roadK}>
                <rect x={BX0} y={BY - BH / 2} width={BX1 - BX0} height={BH} rx={14} fill="#5b6270" />
                {Array.from({ length: 8 }, (_, i) => (
                  <rect key={i} x={BX0 + 18 + i * ((BX1 - BX0) / 8)} y={BY - 4} width={44} height={8} rx={4} fill="#fff" />
                ))}
                <rect x={BX0} y={BY - BH / 2} width={Math.max(0, dx(fillDays) - BX0)} height={BH} rx={14} fill={MINT} opacity={0.55} />
              </g>
            )}
            {/* water vs sit-ups racers */}
            {raceK > 0.01 && (
              <g opacity={raceK}>
                <g transform={`translate(${BX0 + 60 + waterD * (BX1 - BX0)} ${BY - BH / 2 - 70})`}>
                  <path d="M -26 -60 L 26 -60 L 20 30 L -20 30 Z" fill="#cfefff" {...K} strokeWidth={5} />
                  <path d="M -22 -20 L 22 -20 L 20 30 L -20 30 Z" fill="#5fc3ff" />
                  <path d="M -26 -60 L 26 -60 L 20 30 L -20 30 Z" fill="none" {...K} strokeWidth={5} />
                </g>
                <g transform={`translate(${BX0 + 90 + sitD * (BX1 - BX0)} ${BY + BH / 2 + 215})`}>
                  <rect x={-70} y={-30} width={140} height={60} rx={14} fill={PINK} {...K} strokeWidth={5} />
                  <text y={14} textAnchor="middle" fontFamily={FONT.comic} fontSize={38} fill="#fff">
                    50 SIT-UPS
                  </text>
                </g>
              </g>
            )}
            {/* markers */}
            {showReal && marker(66, "66", MINT, f >= T.s66 ? pop(f, T.s66) : 0, true, "MEDIAN")}
            {showReal && marker(18, "18", SKY, f >= T.e18 ? pop(f, T.e18) * interpolate(f, [LOOP, LOOP + 8], [1, 0], clamp) : 0, false)}
            {showReal && marker(254, "254", PINK, f >= T.h254 ? pop(f, T.h254) * interpolate(f, [LOOP, LOOP + 8], [1, 0], clamp) : 0, false, "PROJECTED")}
            {/* the 21 flag */}
            <g transform={`translate(${dx(21)} ${BY - BH / 2}) rotate(${flagRot})`}>
              <line x1={0} y1={0} x2={0} y2={-150} stroke={COL.ink} strokeWidth={7} />
              <path d="M 0 -150 L 96 -124 L 0 -98 Z" fill={f >= T.never ? "#e5322d" : SUN} {...K} strokeWidth={5} />
              <text x={34} y={-114} textAnchor="middle" fontFamily={FONT.comic} fontSize={34} fill={COL.ink}>
                21
              </text>
            </g>
          </g>
          {f >= T.s66 && f < T.s66 + 16 && <Burst x={dx(66)} y={BY} at={T.s66} f={f} size={300} color={MINT} />}

          {/* the 1960 book */}
          {bookK > 0.01 && (
            <g transform={`translate(610 ${GROUND + bookY})`} opacity={bookK}>
              <rect x={-110} y={-250} width={220} height={250} rx={10} fill="#f2a541" {...K} />
              <rect x={-110} y={-250} width={30} height={250} fill="#c97a1e" {...K} strokeWidth={5} />
              <rect x={-66} y={-210} width={150} height={60} rx={8} fill="#fff6dd" {...K} strokeWidth={4} />
              <text x={9} y={-170} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={32} fill={COL.ink}>
                SELF-HELP
              </text>
              <text x={9} y={-60} textAnchor="middle" fontFamily={FONT.comic} fontSize={64} fill={COL.ink}>
                1960
              </text>
            </g>
          )}
          {/* hand mirror with a new face */}
          {mirrorK > 0.01 && (
            <g transform={`translate(860 ${1080}) scale(${mirrorK})`}>
              <rect x={-14} y={60} width={28} height={130} rx={10} fill="#b07a3c" {...K} strokeWidth={5} />
              <circle r={92} fill="#d9f2ff" {...K} />
              <circle r={70} fill="#ffe0bd" {...K} strokeWidth={5} />
              <circle cx={-24} cy={-14} r={7} fill={COL.ink} />
              <circle cx={24} cy={-14} r={7} fill={COL.ink} />
              <ellipse cx={0} cy={10} rx={10 * nose} ry={14 * nose} fill="#f4a989" {...K} strokeWidth={4} />
              <path d="M -22 36 Q 0 50 22 36" fill="none" {...K} strokeWidth={5} />
              {f >= T.days21 && (
                <g transform={`translate(70 -96) scale(${pop(f, T.days21)})`}>
                  <rect x={-70} y={-30} width={140} height={60} rx={14} fill={SUN} {...K} strokeWidth={5} />
                  <text y={14} textAnchor="middle" fontFamily={FONT.comic} fontSize={40} fill={COL.ink}>
                    ~21 DAYS
                  </text>
                </g>
              )}
            </g>
          )}

          {/* SPARK */}
          <Spark
            f={f}
            scale={SS}
            base={{ x: 150, y: SGY }}
            talk={(t) => mouthAt(t)}
            bulb={bulb}
            mood={sparkMood}
            look={1}
            keys={sparkKeys}
            mod={(t, p) => {
              let q = addPose(p, idle(t, 9));
              if (walking(t)) q = addPose(q, walkCycle(t));
              q = addPose(q, { x: walkX(t) });
              q = addPose(addPose(q, hop(t, T.barely, 50)), hop(t, T.next + 10, 36));
              q = addPose(addPose(q, shake(t, T.d22)), nod(t, T.e18));
              return q;
            }}
          />
        </>
      }
      html={
        <>
          {/* bar title */}
          <div style={{ position: "absolute", left: (BX0 + BX1) / 2, top: BY + 2, transform: "translate(-50%,-50%)", fontFamily: FONT.title, fontWeight: 900, fontSize: 40, color: "#fff", WebkitTextStroke: `7px ${COL.ink}`, paintOrder: "stroke fill", letterSpacing: 3, opacity: barK * (1 - roadK), whiteSpace: "nowrap" }}>
            {f < T.when ? "HABIT LOADING… 21/21 ✓" : `DAY ${Math.round(fillDays)}`}
          </div>
          {/* calendar */}
          {calK > 0.01 && (
            <div style={{ position: "absolute", left: 180, top: 640, transform: `translate(-50%,-50%) scale(${0.9 + 0.1 * flip}) rotate(-4deg)`, opacity: calK, width: 170, background: "#fff", border: `6px solid ${COL.ink}`, borderRadius: 16, overflow: "hidden", textAlign: "center" }}>
              <div style={{ background: day === 22 ? "#e5322d" : MINT, fontFamily: FONT.title, fontWeight: 900, fontSize: 30, color: "#fff", letterSpacing: 3, padding: "2px 0" }}>DAY</div>
              <div style={{ fontFamily: FONT.comic, fontSize: 96, lineHeight: 1.05, color: COL.ink }}>{day}</div>
            </div>
          )}
          {/* hook overlay (frame 1 + loop) */}
          {hookK > 0.01 && (
            <div style={{ position: "absolute", left: 470, top: 440, transform: "translate(-50%,-50%) rotate(-3deg)", opacity: hookK, background: COL.ink, color: "#fff", borderRadius: 20, padding: "10px 46px", fontFamily: FONT.comic, fontSize: 150, letterSpacing: 4, lineHeight: 1, whiteSpace: "nowrap" }}>
              21 <span style={{ color: SUN }}>DAYS?</span>
            </div>
          )}
          <Slam f={f} at={T.d22} out={T.rule - 4} x={470} y={440} size={96} color="#fff" stroke={`9px ${COL.ink}`} rotate={2}>
            DAY 22… STILL HARD?
          </Slam>
          {f >= T.never && f < T.traces + 4 && <Stamp f={f} at={T.never} x={520} y={440} text="MYTH" size={120} color="#e5322d" r={-8} />}
          <Slam f={f} at={T.traces} out={T.surgeon - 4} x={540} y={440} size={100} color={SUN} stroke={`9px ${COL.ink}`} rotate={-2}>
            FROM A 1960 BOOK
          </Slam>
          <Slam f={f} at={T.face} out={T.when - 4} x={540} y={440} size={92} color="#fff" stroke={`9px ${COL.ink}`} rotate={2}>
            NEW FACE ≠ NEW HABIT
          </Slam>
          {f >= T.when && f < T.median && <Stamp f={f} at={T.when} x={540} y={440} text="REALITY" size={110} color={MINT} r={-4} />}
          {f >= T.weeks && f < T.median && (
            <div style={{ position: "absolute", left: 540, top: 600, transform: `translate(-50%,-50%) scale(${pop(f, T.weeks)})`, fontFamily: FONT.title, fontWeight: 900, fontSize: 44, color: COL.ink, background: "rgba(255,255,255,0.85)", borderRadius: 12, padding: "2px 18px", whiteSpace: "nowrap" }}>
              TRACKED DAILY · 84 DAYS
            </div>
          )}
          {f >= T.median - 20 && f < T.range && (
            <div style={{ position: "absolute", left: 540, top: 440, transform: `translate(-50%,-50%) scale(${f >= T.s66 ? pop(f, T.s66) : 0.92})`, textAlign: "center" }}>
              <div style={{ fontFamily: FONT.comic, fontSize: 200, color: MINT, WebkitTextStroke: `12px ${COL.ink}`, paintOrder: "stroke fill", lineHeight: 1, whiteSpace: "nowrap" }}>{Math.round(fillDays)} DAYS</div>
              <div style={{ fontFamily: FONT.title, fontWeight: 800, fontSize: 44, color: COL.ink, opacity: f >= T.s66 ? 1 : 0 }}>MEDIAN TO AUTOMATIC</div>
            </div>
          )}
          <Slam f={f} at={T.e18} out={T.water - 4} x={540} y={440} size={120} color="#fff" stroke={`10px ${COL.ink}`} rotate={-2}>
            {f >= T.h254 ? "18 → 254 DAYS" : "18 →"}
          </Slam>
          {raceK > 0.01 && (
            <>
              <Slam f={f} at={T.quick} out={T.small - 4} x={330} y={560} size={96} color={SKY} stroke={`8px #fff`} rotate={-4}>
                QUICK
              </Slam>
              <Slam f={f} at={T.slow} out={T.small - 4} x={760} y={560} size={96} color={PINK} stroke={`8px #fff`} rotate={4}>
                SLOW
              </Slam>
            </>
          )}
          {f >= T.small && f < T.missing && (
            <div style={{ position: "absolute", left: 540, top: 440, transform: `translate(-50%,-50%) scale(${pop(f, T.small)}) rotate(-2deg)`, fontFamily: FONT.title, fontWeight: 900, fontSize: 60, color: "#fff", background: COL.ink, borderRadius: 16, padding: "8px 26px", whiteSpace: "nowrap", opacity: interpolate(f, [T.missing - 6, T.missing], [1, 0], clamp) }}>
              CAVEAT: SMALL STUDY · SIMPLE HABITS
            </div>
          )}
          {/* week strip with one miss */}
          {weekK > 0.01 && (
            <div style={{ position: "absolute", left: 540, top: 440, transform: `translate(-50%,-50%) scale(${0.9 + 0.1 * weekK})`, opacity: weekK, textAlign: "center" }}>
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                {["✓", "✓", "✓", "✗", "✓", "✓", "✓"].map((m, i) => {
                  const k = pop(f, T.missing + i * 3);
                  return (
                    <div key={i} style={{ width: 96, height: 96, borderRadius: 16, border: `5px solid ${COL.ink}`, background: m === "✗" ? "#ffd6d6" : "#d9f8e4", fontFamily: FONT.comic, fontSize: 70, lineHeight: "96px", color: m === "✗" ? "#e5322d" : "#1f8f4f", transform: `scale(${k})` }}>
                      {m}
                    </div>
                  );
                })}
              </div>
              {f >= T.barely && (
                <div style={{ marginTop: 18, fontFamily: FONT.comic, fontSize: 84, color: SUN, WebkitTextStroke: `8px ${COL.ink}`, paintOrder: "stroke fill", transform: `scale(${pop(f, T.barely)})`, whiteSpace: "nowrap" }}>
                  BARELY A BLIP
                </div>
              )}
            </div>
          )}
          <Slam f={f} at={T.stop} out={T.missed - 4} x={540} y={440} size={96} color="#fff" stroke={`9px ${COL.ink}`} rotate={-2}>
            STOP COUNTING TO 21
          </Slam>
          <Slam f={f} at={T.show} out={LOOP} x={540} y={440} size={110} color={MINT} stroke={`9px ${COL.ink}`} rotate={2}>
            JUST SHOW UP
          </Slam>
          {/* source line */}
          <div style={{ position: "absolute", left: 540, top: 1600, transform: "translate(-50%,-50%)", fontFamily: FONT.body, fontWeight: 700, fontSize: 25, color: "#1d4d33", whiteSpace: "nowrap", background: "rgba(255,255,255,0.7)", borderRadius: 10, padding: "2px 12px" }}>
            Lally et al. 2010, Eur J Soc Psychol · 96 volunteers · 254 = projected
          </div>
          <VoiceCaptions f={f} y={1480} cues={VOICE_CUES} hi={["twenty-two?", "twenty-one", "never", "1960", "surgeon", "face.", "twelve", "median", "sixty-six", "eighteen", "fifty-four.", "quick.", "slow.", "small", "simple", "one", "barely", "next."]} />
        </>
      }
    />
  );
};
