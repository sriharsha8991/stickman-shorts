import React from "react";
import { AbsoluteFill, Still } from "remotion";
import { COL, FONT } from "../stickman/fx";
import { At, Coin } from "../stickman/props";
import { Heart, K, Phone } from "../shared/kit";
import { BULB_ON, SPARK_COLOR, SPARK_DARK, Spark } from "../shared/mascot";
import { AiBot, PriceTag } from "../v000-meet-spark/S01Trailer";
import { Bug } from "../ai-one-bug/shared";

// Channel art for YouTube + Instagram, rendered from the same Spark used in every video.
//   npx remotion still <Id> ../branding/<file>.png

const CREAM = "#f7f5ef";

// a static Spark: frame 0, happy, bulb glowing
const SparkStill: React.FC<{ x: number; hipY: number; s: number; pose?: Record<string, number>; mood?: "happy" | "smug" }> = ({
  x,
  hipY,
  s,
  pose = {},
  mood = "happy",
}) => (
  <Spark f={0} scale={s} base={{ x, y: hipY, ...pose }} keys={[{ f: 0, p: {} }]} bulb={() => 1} mood={() => mood} trails={false} />
);

// --- profile picture (circle crop on both platforms) -------------------------------------------
export const ProfilePic: React.FC = () => (
  <AbsoluteFill style={{ background: CREAM }}>
    <svg width={800} height={800}>
      <circle cx={400} cy={400} r={392} fill={SPARK_COLOR} opacity={0.14} />
      <circle cx={400} cy={400} r={380} fill="none" stroke={SPARK_COLOR} strokeWidth={16} />
      {/* head centre at (400, 470): hip = 470 + (78 + 27) * s */}
      <SparkStill x={400} hipY={470 + 105 * 6} s={6} />
    </svg>
  </AbsoluteFill>
);

// --- YouTube channel watermark (150x150, shown small in the corner) -----------------------------
export const Watermark: React.FC = () => (
  <AbsoluteFill style={{ background: CREAM, borderRadius: 75, border: `8px solid ${SPARK_COLOR}`, boxSizing: "border-box" }}>
    <svg width={150} height={150} style={{ position: "absolute", left: -8, top: -8 }}>
      <SparkStill x={75} hipY={92 + 105 * 1.15} s={1.15} />
    </svg>
  </AbsoluteFill>
);

// --- YouTube banner 2560x1440; everything important inside the 1546x423 safe area --------------
const SAFE = { x: 507, y: 508, w: 1546, h: 423 };
export const YouTubeBanner: React.FC = () => {
  const ground = SAFE.y + SAFE.h - 20;
  const strings: [number, number][] = [
    [190, 760],
    [2370, 760],
    [330, 1080],
    [2230, 1080],
  ];
  return (
    <AbsoluteFill style={{ background: CREAM }}>
      <svg width={2560} height={1440}>
        <defs>
          <radialGradient id="glowB" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor={SPARK_COLOR} stopOpacity={0.16} />
            <stop offset="1" stopColor={SPARK_COLOR} stopOpacity={0} />
          </radialGradient>
        </defs>
        <rect x={0} y={0} width={2560} height={1440} fill="url(#glowB)" />
        {/* puppet strings from the top edge to props (visible on TV/desktop full banner) */}
        {strings.map(([x, y], i) => (
          <line key={i} x1={x + (i % 2 ? -60 : 60)} y1={0} x2={x} y2={y - 90} stroke="#777" strokeWidth={4} strokeDasharray="16 12" />
        ))}
        <At x={190} y={760} s={2.1} r={-8}>
          <Phone x={0} y={0} />
        </At>
        <At x={2370} y={760} s={1.6} r={8}>
          <PriceTag />
        </At>
        <At x={330} y={1080} s={1.5} r={6}>
          <AiBot f={0} />
        </At>
        <At x={2230} y={1080} s={1.4} r={-6}>
          <Coin sym="₹" />
        </At>
        <line x1={SAFE.x} y1={ground} x2={SAFE.x + SAFE.w} y2={ground} stroke="#d9d5c8" strokeWidth={4} />
        <SparkStill x={SAFE.x + 190} hipY={ground - 92.5 * 1.55} s={1.55} pose={{ ra1: 150, ra2: 20 }} />
      </svg>
      <div style={{ position: "absolute", left: SAFE.x + 400, top: SAFE.y + 52, width: SAFE.w - 420 }}>
        <div style={{ fontFamily: FONT.comic, fontSize: 112, whiteSpace: "nowrap", lineHeight: 1, color: COL.red, WebkitTextStroke: `10px ${COL.ink}`, paintOrder: "stroke fill", letterSpacing: 2 }}>
          THE HIDDEN MECHANISM
        </div>
        <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 46, color: COL.ink, marginTop: 16 }}>
          How AI, money &amp; your brain quietly work
        </div>
        <div style={{ display: "inline-block", marginTop: 22, background: SPARK_COLOR, color: "#fff", fontFamily: FONT.body, fontWeight: 800, fontSize: 34, padding: "10px 26px", borderRadius: 16, boxShadow: "0 8px 0 rgba(0,0,0,0.12)" }}>
          New short every day · explained by Spark
        </div>
      </div>
    </AbsoluteFill>
  );
};

// --- Instagram highlight covers (1080x1920; the centre circle is what shows) --------------------
const Cover: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ background: CREAM }}>
    <svg width={1080} height={1920}>
      <circle cx={540} cy={960} r={420} fill={SPARK_COLOR} />
      <circle cx={540} cy={960} r={420} fill="none" stroke={SPARK_DARK} strokeWidth={14} />
      {children}
    </svg>
  </AbsoluteFill>
);

const BulbIcon: React.FC = () => (
  <g transform="translate(540 930) scale(5)">
    <circle cx={0} cy={-6} r={30} fill={BULB_ON} {...K} />
    <rect x={-14} y={22} width={28} height={20} rx={4} fill="#9a9a9a" {...K} />
    {Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2;
      return <line key={i} x1={Math.cos(a) * 40} y1={-6 + Math.sin(a) * 40} x2={Math.cos(a) * 54} y2={-6 + Math.sin(a) * 54} stroke="#fff" strokeWidth={5} strokeLinecap="round" />;
    })}
  </g>
);

const ClockIcon: React.FC = () => (
  <g transform="translate(540 960)">
    <circle r={230} fill="#fff" {...K} strokeWidth={16} />
    <line x1={0} y1={0} x2={0} y2={-150} stroke={COL.ink} strokeWidth={20} strokeLinecap="round" />
    <line x1={0} y1={0} x2={110} y2={60} stroke={COL.ink} strokeWidth={20} strokeLinecap="round" />
    <circle r={18} fill={COL.red} />
  </g>
);

export const HlAttention: React.FC = () => (
  <Cover>
    <At x={540} y={960} s={4.6} r={-8}>
      <Phone x={0} y={0} />
    </At>
    <circle cx={700} cy={700} r={70} fill={COL.red} stroke="#fff" strokeWidth={12} />
  </Cover>
);
export const HlMoney: React.FC = () => (
  <Cover>
    <At x={540} y={960} s={4}>
      <Coin sym="₹" />
    </At>
  </Cover>
);
export const HlAI: React.FC = () => (
  <Cover>
    <At x={540} y={990} s={3.2}>
      <AiBot f={0} />
    </At>
  </Cover>
);
export const HlUpgrade: React.FC = () => (
  <Cover>
    <BulbIcon />
  </Cover>
);
export const HlMemes: React.FC = () => (
  <Cover>
    <Bug f={0} x={470} y={1110} s={4.2} dir={1} look={1} />
  </Cover>
);
export const HlOrigins: React.FC = () => (
  <Cover>
    <ClockIcon />
  </Cover>
);
export const HlSpark: React.FC = () => (
  <Cover>
    <circle cx={540} cy={960} r={400} fill={CREAM} />
    <clipPath id="hlclip">
      <circle cx={540} cy={960} r={412} />
    </clipPath>
    <g clipPath="url(#hlclip)">
      <SparkStill x={540} hipY={1010 + 105 * 5.2} s={5.2} />
    </g>
  </Cover>
);

// silence unused-import lint for Heart (kept for future covers)
export const _unused = Heart;

export const BrandingStills: React.FC = () => (
  <>
    <Still id="ProfilePic" component={ProfilePic} width={800} height={800} />
    <Still id="Watermark" component={Watermark} width={150} height={150} />
    <Still id="YouTubeBanner" component={YouTubeBanner} width={2560} height={1440} />
    <Still id="HlAttention" component={HlAttention} width={1080} height={1920} />
    <Still id="HlMoney" component={HlMoney} width={1080} height={1920} />
    <Still id="HlAI" component={HlAI} width={1080} height={1920} />
    <Still id="HlUpgrade" component={HlUpgrade} width={1080} height={1920} />
    <Still id="HlMemes" component={HlMemes} width={1080} height={1920} />
    <Still id="HlOrigins" component={HlOrigins} width={1080} height={1920} />
    <Still id="HlSpark" component={HlSpark} width={1080} height={1920} />
  </>
);
