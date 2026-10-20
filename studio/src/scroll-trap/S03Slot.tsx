import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { Actor, P, STAND, addPose, idle, solve, type Pose } from "../stickman/stick";
import { Burst, COL, Slam } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SceneProps } from "./Video";
import { range, type SfxCue } from "./sfx";
import { DayBg, GY, Heart, K, Kinetic, Phone, S, SlotMachine, punch, type Page } from "./kit";

// THE WOW: pull-to-refresh is revealed as a slot machine. Spin 1 = nothing, spin 2 = jackpot
// (lands on the bar line at local 180), then he grabs the lever again before the cut.

const REVEAL = 60;
const MX = 420; // machine centre (reels)
const MY = 930;
const MS = 0.95;
const PIVOT: [number, number] = [MX + 250 * MS, MY + 20];
const YOU_X = 885;
const GRIPS: [number, number][] = [
  [70, 96],
  [132, 158],
  [206, 999],
];
const ARM_UP: Partial<Pose> = { ra1: 122, ra2: 18, la1: -25, la2: 12, lean: 0 };
const PULL: Partial<Pose> = { ra1: 58, ra2: -4, lean: 12 };
const REST = solve({ ...STAND, x: YOU_X, y: GY, ...ARM_UP } as Pose, S, -1).rHand;

const SPINS = [
  { start: 82, stops: [108, 114, 120] as [number, number, number], land: ["bubble", "none", "heart"] as ["bubble", "none", "heart"] },
  { start: 142, stops: [166, 173, 180] as [number, number, number], land: ["heart", "heart", "heart"] as ["heart", "heart", "heart"] },
  { start: 218, stops: [400, 400, 400] as [number, number, number], land: ["heart", "none", "bubble"] as ["heart", "none", "bubble"] },
];

const PAGES: Page[] = [
  { at: 4, text: "Pull to refresh…", hi: ["refresh"] },
  { at: 36, text: "Ever notice what it really is?" },
  { at: 64, text: "A slot machine lever.", hi: ["slot", "machine"] },
  { at: 104, text: "Sometimes nothing.", hi: ["nothing"] },
  { at: 160, text: "Sometimes a jackpot.", hi: ["jackpot"] },
  { at: 200, text: "So you pull again.", hi: ["again"] },
];

export const S03_SFX: SfxCue[] = [
  [12, "swish", 0.4],
  [40, "riser", 0.6],
  [REVEAL, "explosion", 0.55],
  [REVEAL, "stinger", 0.8],
  [80, "clink", 0.7],
  ...range(84, 9, 4, "tick", 0.28),
  [120, "buzz", 0.6],
  [140, "clink", 0.7],
  ...range(144, 9, 4, "tick", 0.28),
  [180, "kaching", 1],
  [182, "gold", 0.8],
  [216, "clink", 0.6],
  ...range(220, 5, 4, "tick", 0.28),
];

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const gripping = (f: number) => GRIPS.some(([a, b]) => f >= a && f < b);

export const S03Slot: React.FC<SceneProps> = ({ dur }) => {
  const f = useCurrentFrame();
  const revealed = f >= REVEAL;
  const machineScale = MS * interpolate(f, [REVEAL, REVEAL + 5, REVEAL + 9, REVEAL + 13], [0.2, 1.08, 0.97, 1], clamp);
  const shake = f > 44 && f < REVEAL ? Math.sin(f * 2.3) * (f - 44) * 0.6 : 0;
  const flash = f < REVEAL ? 0 : interpolate(f, [REVEAL, REVEAL + 6], [0.85, 0], clamp);

  const hearts = Array.from({ length: 16 }, (_, i) => {
    const t = f - 180;
    if (t < 0) return null;
    const vx = (random(`hx${i}`) - 0.5) * 26;
    const vy = -26 - random(`hy${i}`) * 18;
    const x = MX + vx * t;
    const y = MY + 120 + vy * t + 0.9 * t * t;
    if (y > 1500) return null;
    return (
      <g key={i} transform={`translate(${x} ${y}) rotate(${vx * t * 0.8}) scale(${0.6 + random(`hs${i}`) * 0.5})`}>
        <Heart />
      </g>
    );
  });

  return (
    <Stage
      bg={<DayBg />}
      hits={[REVEAL, 120, 180]}
      power={18}
      cam={{ z: punch(f, [0, REVEAL, 120, 180, 212], 0.07) }}
      svg={
        <>
          {revealed && (
            <>
              <rect x={MX - 170} y={MY + 210 * MS} width={340} height={1290 - (MY + 210 * MS)} fill="#9e1b2c" {...K} />
              <SlotMachine f={f} x={MX} y={MY} s={machineScale} spins={SPINS} />
            </>
          )}
          <Burst x={MX + 100} y={MY - 40} at={REVEAL} f={f} size={420} color={COL.yellow} />
          <Burst x={MX} y={MY - 10} at={180} f={f} size={380} color={COL.gold} />
          <Actor
            f={f}
            color={COL.orange}
            scale={S}
            label="YOU"
            facing={(t) => (t < REVEAL ? 1 : -1)}
            trails={false}
            keys={[
              { f: 0, p: { x: 540, y: GY, ...P.hold, head: 12 } },
              { f: 14, p: { ra2: 20 } }, // thumb drags down the screen
              { f: 30, p: { ra2: 40 } },
              { f: 58, p: { ra2: 40 } },
              { f: REVEAL, p: { x: YOU_X, ...ARM_UP, head: 0 } },
              { f: 74, p: { ...ARM_UP } },
              { f: 80, p: { ...PULL } },
              { f: 92, p: { ...ARM_UP } },
              { f: 120, p: { ...ARM_UP } },
              { f: 126, p: { ...ARM_UP, head: 26, lean: 8 } }, // nothing... slump
              { f: 136, p: { ...ARM_UP, head: 0 } },
              { f: 142, p: { ...PULL } },
              { f: 154, p: { ...ARM_UP } },
              { f: 180, p: { ...ARM_UP } },
              { f: 186, p: { ...P.cheer } }, // JACKPOT
              { f: 202, p: { ...P.cheer } },
              { f: 210, p: { ...ARM_UP } },
              { f: 216, p: { ...PULL } },
            ]}
            mod={(t, p) => addPose(p, idle(t, 4))}
            behind={(j) => {
              if (!revealed) return null;
              const ball = gripping(f) ? j.rHand : REST;
              return (
                <g>
                  <line x1={PIVOT[0]} y1={PIVOT[1]} x2={ball[0]} y2={ball[1]} stroke="#9a9a9a" strokeWidth={14} strokeLinecap="round" />
                  <line x1={PIVOT[0]} y1={PIVOT[1]} x2={ball[0]} y2={ball[1]} stroke={COL.ink} strokeWidth={4} strokeLinecap="round" opacity={0.4} />
                  <circle cx={PIVOT[0]} cy={PIVOT[1]} r={20} fill="#777" {...K} strokeWidth={5} />
                  <circle cx={ball[0]} cy={ball[1]} r={30} fill={COL.red} {...K} />
                </g>
              );
            }}
          >
            {(j) =>
              !revealed ? (
                <Phone
                  x={(j.lHand[0] + j.rHand[0]) / 2 + shake}
                  y={(j.lHand[1] + j.rHand[1]) / 2 - 70}
                  s={1.9}
                  r={shake * 0.4}
                  scroll={-interpolate(f, [14, 30], [0, 40], clamp)}
                  spinner={interpolate(f, [16, 44], [0, 1], clamp)}
                />
              ) : null
            }
          </Actor>
          {hearts}
        </>
      }
      html={
        <>
          <Slam f={f} at={120} x={540} y={340} size={112} color={COL.purple} stroke={`8px ${COL.ink}`}>
            VARIABLE REWARDS
          </Slam>
          <Slam f={f} at={180} x={540} y={480} size={104} color={COL.gold} rotate={-4} stroke={`8px ${COL.ink}`}>
            JACKPOT!
          </Slam>
          <Kinetic f={f} pages={PAGES} end={dur} />
          {flash > 0 && <AbsoluteFill style={{ background: "#fff", opacity: flash }} />}
        </>
      }
    />
  );
};
