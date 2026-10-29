import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import { FONT } from "../stickman/fx";
import { SPARK_COLOR, Spark, type Mood } from "../shared/mascot";
import { G, gestureKeys, wave } from "../shared/gestures";
import { addPose, idle, type Pose } from "../stickman/stick";

// "INTRODUCING" — 15 s channel-launch film in the style of a frontier-model keynote launch.
// Dark stage, aurora light, particles, thin type, one line at a time, a single orb of light that becomes Spark's bulb.
// 0.0  orb of light breathing in the dark          · "Something is pulling your strings."
// 1.6  eight everyday signals orbit on light-strings · "Prices. Feeds. Habits."
// 4.0  they fold into a neural constellation (brain) · "Every country. One brain."
// 6.6  constellation collapses into a lightbulb     · (bloom, no text)
// 8.2  the bulb flies onto Spark's antenna          · "Meet Spark."
// 10.6 INTRODUCING → THE HIDDEN MECHANISM (gradient, shimmer) · tagline · "Now live" pill. Fades back to the orb (loop).

export const KEYNOTE_FRAMES = 450;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const e = (f: number, a: number, b: number, x: number, y: number, ease = Easing.inOut(Easing.cubic)) => interpolate(f, [a, b], [x, y], { ...clamp, easing: ease });

const BG = "#05060f";
const TEAL = SPARK_COLOR; // #0fb5a6
const CYAN = "#5ef2e0";
const VIOLET = "#7b5cff";
const PINKV = "#ff6ad5";
const AMBER = "#ffcf6b";
const CX = 540;
const CY = 880;

// beats
const ORBIT = 48;
const BRAIN = 120;
const COLLAPSE = 198;
const SPARKIN = 246;
const TITLE = 318;
const LIVE = 384;
const OUT = 432;

// deterministic pseudo-random
const rnd = (i: number, k = 1) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// brain constellation points (two hemispheres) and bulb outline points
const N = 46;
const BRAIN_PTS: [number, number][] = Array.from({ length: N }, (_, i) => {
  const left = i % 2 === 0;
  const a = rnd(i, 2) * Math.PI * 2;
  const r = Math.sqrt(rnd(i, 3));
  const x = (left ? -1 : 1) * (18 + Math.abs(Math.cos(a)) * r * 190);
  const y = Math.sin(a) * r * 165 - 10 + (Math.abs(x) > 150 ? 20 : 0);
  return [CX + x, CY + y];
});
const BULB_PTS: [number, number][] = Array.from({ length: N }, (_, i) => {
  if (i < 34) {
    const a = -Math.PI / 2 + ((i / 34) * 2 - 1) * Math.PI * 0.82;
    return [CX + Math.cos(a) * 120, CY - 40 + Math.sin(a) * 120];
  }
  const k = i - 34; // base: 3 rows of 4
  return [CX - 54 + (k % 4) * 36, CY + 92 + Math.floor(k / 4) * 26];
});
const EDGES: [number, number][] = (() => {
  const out: [number, number][] = [];
  BRAIN_PTS.forEach((p, i) => {
    const d = BRAIN_PTS.map((q, j) => [j, (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2] as [number, number]).filter(([j]) => j !== i);
    d.sort((a, b) => a[1] - b[1]);
    d.slice(0, 2).forEach(([j]) => {
      if (!out.some(([a, b]) => (a === j && b === i) || (a === i && b === j))) out.push([i, j]);
    });
  });
  return out;
})();

// orbiting signal icons (thin white line art)
const ICONS = ["$", "€", "¥", "₹", "bell", "play", "cart", "heart"] as const;
const Icon: React.FC<{ k: (typeof ICONS)[number] }> = ({ k }) => {
  const st = { fill: "none", stroke: "#eaf6ff", strokeWidth: 3.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (k.length === 1)
    return (
      <text y={17} textAnchor="middle" fontFamily={FONT.body} fontWeight={300} fontSize={50} fill="#eaf6ff">
        {k}
      </text>
    );
  if (k === "bell")
    return (
      <g {...st}>
        <path d="M -20 12 L -20 -6 C -20 -22 -10 -28 0 -28 C 10 -28 20 -22 20 -6 L 20 12 L 26 18 L -26 18 Z" />
        <path d="M -6 24 C -4 30 4 30 6 24" />
        <circle cx={20} cy={-22} r={8} fill="#ff4f6d" stroke="none" />
      </g>
    );
  if (k === "play")
    return (
      <g {...st}>
        <rect x={-30} y={-22} width={60} height={44} rx={12} />
        <path d="M -6 -10 L 10 0 L -6 10 Z" fill="#eaf6ff" />
      </g>
    );
  if (k === "cart")
    return (
      <g {...st}>
        <path d="M -30 -20 L -20 -20 L -12 12 L 20 12 L 26 -10 L -16 -10" />
        <circle cx={-8} cy={22} r={4} />
        <circle cx={16} cy={22} r={4} />
      </g>
    );
  return <path d="M0 18 C -30 -2, -26 -28, -7 -25 C -2 -24, 0 -20, 0 -16 C 0 -20, 2 -24, 7 -25 C 26 -28, 30 -2, 0 18 Z" {...st} />;
};

// soft particles
const Particles: React.FC<{ f: number; o: number }> = ({ f, o }) => (
  <g opacity={o}>
    {Array.from({ length: 80 }, (_, i) => {
      const x = rnd(i, 7) * 1080;
      const sp = 0.4 + rnd(i, 8) * 1.2;
      const y = (((rnd(i, 9) * 1920 - f * sp) % 1920) + 1920) % 1920;
      const r = 1 + rnd(i, 10) * 2.6;
      const tw = 0.35 + 0.65 * Math.abs(Math.sin(f / (12 + rnd(i, 11) * 20) + i));
      return <circle key={i} cx={x + Math.sin(f / 40 + i) * 10} cy={y} r={r} fill={i % 5 === 0 ? CYAN : "#cfe8ff"} opacity={0.5 * tw} />;
    })}
  </g>
);

const Line: React.FC<{ f: number; at: number; out: number; children: React.ReactNode; size?: number; weight?: number; y?: number; grad?: boolean }> = ({ f, at, out, children, size = 64, weight = 300, y = 1460, grad = false }) => {
  if (f < Math.max(0, at) || f > out) return null;
  const k = Math.min(e(f, at, at + 14, 0, 1), e(f, out - 10, out, 1, 0));
  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        right: 60,
        top: y,
        textAlign: "center",
        fontFamily: FONT.body,
        fontWeight: weight,
        fontSize: size,
        letterSpacing: -0.5,
        lineHeight: 1.15,
        color: "#f2f6ff",
        opacity: k,
        filter: `blur(${(1 - k) * 12}px)`,
        transform: `translateY(${(1 - k) * 18}px)`,
        ...(grad ? { background: `linear-gradient(90deg, ${CYAN}, ${VIOLET}, ${PINKV})`, WebkitBackgroundClip: "text", color: "transparent" } : {}),
      }}
    >
      {children}
    </div>
  );
};

export const LaunchKeynote: React.FC<{ music?: number }> = ({ music = 0.95 }) => {
  const f = useCurrentFrame();

  // camera: slow continuous push + a pull-back on the reveal
  const camZ = f < TITLE ? 1 + f * 0.00045 : e(f, TITLE, TITLE + 40, 1.14, 1.0);

  // orb
  const orbOn = f < SPARKIN + 20 || f >= OUT;
  const breathe = 1 + 0.08 * Math.sin(f / 7);
  const orbR = (f < COLLAPSE ? 34 : 0) * breathe * (f >= OUT ? e(f, OUT, OUT + 14, 0, 1) : 1);

  // orbit icons + strings (ORBIT → BRAIN), then icons dissolve into nodes
  const orbitK = e(f, ORBIT, ORBIT + 24, 0, 1);
  const toBrain = e(f, BRAIN - 6, BRAIN + 30, 0, 1);
  const toBulb = e(f, COLLAPSE, COLLAPSE + 22, 0, 1, Easing.in(Easing.cubic));
  const nodesOut = e(f, SPARKIN - 4, SPARKIN + 6, 1, 0);
  const rot = f * 0.012;

  // node positions: start on the orbit ring → brain → bulb
  const node = (i: number): [number, number] => {
    const a = (i / N) * Math.PI * 2 + rot;
    const ring: [number, number] = [CX + Math.cos(a) * 340, CY + Math.sin(a) * 340];
    const b = BRAIN_PTS[i];
    const wob = [Math.sin(f / 15 + i) * 4, Math.cos(f / 17 + i) * 4];
    const p1: [number, number] = [ring[0] + (b[0] - ring[0]) * toBrain + wob[0], ring[1] + (b[1] - ring[1]) * toBrain + wob[1]];
    const q = BULB_PTS[i];
    return [p1[0] + (q[0] - p1[0]) * toBulb, p1[1] + (q[1] - p1[1]) * toBulb];
  };

  // bloom on collapse
  const bloom = Math.max(0, 1 - Math.abs(f - (COLLAPSE + 24)) / 16);
  const bulbGlow = f >= COLLAPSE + 18 && f < SPARKIN + 26 ? e(f, COLLAPSE + 18, COLLAPSE + 30, 0, 1) : 0;
  const fly = e(f, SPARKIN, SPARKIN + 22, 0, 1, Easing.inOut(Easing.quad)); // bulb flies onto Spark

  // Spark
  const sparkK = f >= SPARKIN - 4 && f < OUT + 6 ? Math.min(e(f, SPARKIN - 4, SPARKIN + 12, 0, 1), e(f, OUT - 6, OUT + 6, 1, 0)) : 0;
  const sScale = f < TITLE ? 2.3 : e(f, TITLE, TITLE + 30, 2.3, 1.75);
  const ground = f < TITLE ? 1330 : e(f, TITLE, TITLE + 30, 1330, 1470);
  const sKeys = gestureKeys([
    [0, G.rest],
    [SPARKIN + 20, G.rest],
    [SPARKIN + 24, G.wave1, "snap"],
    [SPARKIN + 32, G.wave2, "snap"],
    [SPARKIN + 40, G.wave1, "snap"],
    [SPARKIN + 48, G.wave2, "snap"],
    [SPARKIN + 58, G.present, "snap"],
    [TITLE + 6, G.pointUp, "snap"],
    [LIVE, G.celebrate, "snap"],
  ]);
  const mood = (t: number): Mood => (t < SPARKIN + 20 ? "curious" : t < TITLE ? "happy" : t < LIVE ? "excited" : "wink");
  const sMod = (t: number, p: Pose) => addPose(addPose(p, idle(t, 4)), t >= SPARKIN + 20 && t < SPARKIN + 60 ? wave(t, SPARKIN + 20, 40) : {});

  // aurora blobs
  const blob = (x: number, y: number, r: number, c: string, o: number) => <circle cx={x} cy={y} r={r} fill={c} opacity={o} />;
  const aur = 0.55 + 0.25 * Math.sin(f / 30) + (f >= TITLE ? e(f, TITLE, TITLE + 20, 0, 0.3) : 0);

  // title shimmer
  const shimmer = interpolate(f, [TITLE, OUT], [100, 0], clamp);

  return (
    <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
      <Audio src={staticFile("launch-15/keynote.mp3")} volume={(t) => music * interpolate(t, [0, 3, KEYNOTE_FRAMES - 10, KEYNOTE_FRAMES], [0.2, 1, 1, 0.5], clamp)} />
      {/* aurora */}
      <AbsoluteFill style={{ filter: "blur(90px)", opacity: aur }}>
        <svg width={1080} height={1920}>
          {blob(260 + Math.sin(f / 50) * 80, 520 + Math.cos(f / 60) * 60, 330, VIOLET, 0.55)}
          {blob(820 + Math.cos(f / 45) * 70, 760 + Math.sin(f / 55) * 80, 300, TEAL, 0.6)}
          {blob(540 + Math.sin(f / 35) * 60, 1380 + Math.cos(f / 40) * 50, 360, f >= TITLE ? PINKV : "#1d2a7a", 0.45)}
        </svg>
      </AbsoluteFill>
      {/* stage */}
      <AbsoluteFill style={{ transform: `scale(${camZ})`, transformOrigin: `${CX}px ${CY}px` }}>
        <svg width={1080} height={1920}>
          <defs>
            <radialGradient id="orb">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.35" stopColor={CYAN} />
              <stop offset="1" stopColor={TEAL} stopOpacity={0} />
            </radialGradient>
            <radialGradient id="warm">
              <stop offset="0" stopColor="#fffaf0" />
              <stop offset="0.4" stopColor={AMBER} />
              <stop offset="1" stopColor={AMBER} stopOpacity={0} />
            </radialGradient>
            <radialGradient id="halo">
              <stop offset="0" stopColor={TEAL} stopOpacity={0.35} />
              <stop offset="1" stopColor={TEAL} stopOpacity={0} />
            </radialGradient>
            <linearGradient id="str" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={CYAN} />
              <stop offset="1" stopColor={VIOLET} />
            </linearGradient>
          </defs>
          <Particles f={f} o={0.9} />
          {/* rings from the orb */}
          {f < BRAIN &&
            [0, 1, 2].map((k) => {
              const t = ((f + k * 16) % 48) / 48;
              return <circle key={k} cx={CX} cy={CY} r={40 + t * 300} fill="none" stroke={CYAN} strokeWidth={2} opacity={(1 - t) * 0.35} />;
            })}
          {/* strings + icons */}
          {f >= ORBIT && f < BRAIN + 30 &&
            ICONS.map((k, i) => {
              const a = (i / ICONS.length) * Math.PI * 2 + rot - Math.PI / 2;
              const R = 340 * orbitK;
              const x = CX + Math.cos(a) * R;
              const y = CY + Math.sin(a) * R;
              const fade = 1 - toBrain;
              return (
                <g key={k} opacity={fade}>
                  <line x1={CX} y1={CY} x2={x} y2={y} stroke="url(#str)" strokeWidth={2.5} strokeDasharray="10 9" strokeDashoffset={-f * 2} opacity={0.8} />
                  <g transform={`translate(${x} ${y}) scale(${orbitK})`}>
                    <circle r={56} fill="#0b1030" stroke={CYAN} strokeWidth={2} opacity={0.9} />
                    <Icon k={k} />
                  </g>
                </g>
              );
            })}
          {/* faint brain outline behind the constellation */}
          {f >= BRAIN && f < COLLAPSE + 10 && (
            <g transform={`translate(${CX} ${CY}) scale(0.82)`} opacity={0.35 * e(f, BRAIN, BRAIN + 30, 0, 1) * (1 - toBulb)}>
              <path
                d="M -250 40 C -300 -60 -230 -170 -140 -170 C -110 -240 0 -250 30 -200 C 90 -260 220 -230 230 -140 C 320 -110 310 20 250 60 C 260 140 160 190 90 160 C 40 210 -80 210 -110 160 C -200 190 -290 120 -250 40 Z"
                fill="none"
                stroke="url(#str)"
                strokeWidth={4}
                strokeDasharray="6 10"
                strokeDashoffset={-f}
              />
              <path d="M 0 -200 C -20 -100 30 -20 0 160" fill="none" stroke="url(#str)" strokeWidth={3} strokeDasharray="6 10" />
            </g>
          )}
          {/* constellation */}
          {f >= BRAIN - 6 && f < SPARKIN + 8 && (
            <g opacity={nodesOut * e(f, BRAIN - 6, BRAIN + 10, 0, 1)}>
              {EDGES.map(([a, b], k) => {
                const p = node(a);
                const q = node(b);
                return <line key={k} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke="url(#str)" strokeWidth={2} opacity={0.55 * (1 - toBulb * 0.7)} />;
              })}
              {Array.from({ length: N }, (_, i) => {
                const [x, y] = node(i);
                const pulse = 0.6 + 0.4 * Math.sin(f / 6 + i);
                return <circle key={i} cx={x} cy={y} r={4 + pulse * 3} fill={i % 3 ? CYAN : "#ffffff"} opacity={0.9} />;
              })}
            </g>
          )}
          {/* orb */}
          {orbOn && orbR > 0.5 && (
            <>
              <circle cx={CX} cy={CY} r={orbR * 5} fill="url(#orb)" opacity={0.35} />
              <circle cx={CX} cy={CY} r={orbR} fill="url(#orb)" />
            </>
          )}
          {/* bulb glow at the centre of the collapsed bulb, before it flies */}
          {bulbGlow > 0 && fly < 0.02 && (
            <>
              <circle cx={CX} cy={CY - 40} r={260 * bulbGlow} fill="url(#warm)" opacity={0.55} />
              <circle cx={CX} cy={CY - 40} r={70} fill="url(#warm)" />
            </>
          )}
          {/* Spark (the flying bulb is drawn at his antenna using his joints) */}
          {sparkK > 0 && (
            <g opacity={sparkK}>
              <ellipse cx={CX} cy={ground + 6} rx={220 * (sScale / 2.3)} ry={22} fill={TEAL} opacity={0.35} />
              <circle cx={CX} cy={ground - 230 * (sScale / 2.3)} r={360 * (sScale / 2.3)} fill="url(#halo)" />
              <Spark
                f={f}
                scale={sScale}
                base={{ x: CX, y: ground - 92.5 * sScale }}
                facing={1}
                keys={sKeys}
                mod={sMod}
                mood={mood}
                bulb={(t) => (t >= SPARKIN + 20 ? 1 : 0)}
              >
                {(j) => {
                  if (fly >= 1 || bulbGlow === 0) return null;
                  // target ≈ above the head along the neck→head direction
                  const ux = j.headC[0] - j.neck[0];
                  const uy = j.headC[1] - j.neck[1];
                  const L = Math.hypot(ux, uy) || 1;
                  const tx = j.headC[0] + (ux / L) * (j.headR + 28 * sScale);
                  const ty = j.headC[1] + (uy / L) * (j.headR + 28 * sScale);
                  const x = CX + (tx - CX) * fly;
                  const y = CY - 40 + (ty - (CY - 40)) * fly - Math.sin(fly * Math.PI) * 120;
                  const r = 70 * (1 - fly) + 18 * fly;
                  return (
                    <g>
                      <circle cx={x} cy={y} r={r * 3} fill="url(#warm)" opacity={0.5} />
                      <circle cx={x} cy={y} r={r} fill="url(#warm)" />
                    </g>
                  );
                }}
              </Spark>
            </g>
          )}
          {/* bloom */}
          {bloom > 0 && <circle cx={CX} cy={CY - 40} r={900} fill="url(#warm)" opacity={bloom * 0.45} />}
        </svg>
      </AbsoluteFill>

      {/* film grain */}
      <AbsoluteFill style={{ opacity: 0.07, mixBlendMode: "screen" }}>
        <svg width={1080} height={1920}>
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={f % 30} />
          </filter>
          <rect width={1080} height={1920} filter="url(#grain)" />
        </svg>
      </AbsoluteFill>

      {/* one text line at a time */}
      <Line f={f} at={-14} out={ORBIT - 2} size={60}>
        Something is pulling
        <br />
        your strings.
      </Line>
      <Line f={f} at={ORBIT + 6} out={BRAIN - 4} size={66}>
        Prices. Feeds. Habits.
      </Line>
      <Line f={f} at={BRAIN + 10} out={COLLAPSE - 2} size={66}>
        Every country.
        <br />
        <span style={{ fontWeight: 700 }}>One brain.</span>
      </Line>
      <Line f={f} at={SPARKIN + 18} out={TITLE - 2} size={84} weight={700} y={300}>
        Meet Spark.
      </Line>
      {f >= TITLE && f < OUT + 4 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 470, textAlign: "center", opacity: e(f, OUT - 8, OUT + 4, 1, 0) }}>
          <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 34, letterSpacing: 14, color: "#b9c7ff", opacity: e(f, TITLE, TITLE + 14, 0, 1), filter: `blur(${e(f, TITLE, TITLE + 14, 10, 0)}px)` }}>
            INTRODUCING
          </div>
          <div style={{ marginTop: 26, opacity: e(f, TITLE + 10, TITLE + 26, 0, 1), filter: `blur(${e(f, TITLE + 10, TITLE + 26, 16, 0)}px)`, transform: `scale(${e(f, TITLE + 10, TITLE + 40, 1.08, 1)})` }}>
          <div
            style={{
              display: "inline-block",
              fontFamily: FONT.body,
              fontWeight: 800,
              fontSize: 118,
              lineHeight: 0.98,
              letterSpacing: -3,
              background: `linear-gradient(100deg, ${CYAN} 0%, #ffffff 12%, ${CYAN} 22%, ${VIOLET} 45%, ${PINKV} 60%, ${VIOLET} 78%, ${CYAN} 100%)`,
              backgroundSize: "220% 100%",
              backgroundPosition: `${shimmer}% 0`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
              padding: "0 10px 10px",
            }}
          >
            The Hidden
            <br />
            Mechanism
          </div>
          </div>
          <div style={{ marginTop: 34, fontFamily: FONT.body, fontWeight: 400, fontSize: 42, color: "#dfe6ff", opacity: e(f, TITLE + 30, TITLE + 44, 0, 1) }}>
            Why you do the weird things you do.
          </div>
          <div style={{ marginTop: 14, fontFamily: FONT.body, fontWeight: 500, fontSize: 30, letterSpacing: 4, color: "#8f9bd6", opacity: e(f, TITLE + 40, TITLE + 54, 0, 1) }}>
            DAILY SHORTS · YOUTUBE · INSTAGRAM
          </div>
        </div>
      )}
      {f >= LIVE && f < OUT + 4 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1540, textAlign: "center", opacity: Math.min(e(f, LIVE, LIVE + 12, 0, 1), e(f, OUT - 8, OUT + 4, 1, 0)) }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 14, padding: "14px 34px", borderRadius: 999, border: "2px solid rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.08)", fontFamily: FONT.body, fontWeight: 600, fontSize: 36, color: "#ffffff", letterSpacing: 1 }}>
            <span style={{ width: 16, height: 16, borderRadius: 8, background: "#3dff9a", boxShadow: `0 0 ${10 + 8 * Math.sin(f / 4)}px #3dff9a` }} />
            Now live · Follow
          </div>
        </div>
      )}
      {/* vignette */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)", pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
