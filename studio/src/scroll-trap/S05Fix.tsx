import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Actor, P, addPose, idle, walkCycle } from "../stickman/stick";
import { COL, Caption, FONT, Slam } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { DayBg, GROUND, GY, K, Kinetic, Phone, S, punch, type Page } from "./kit";

// PAYOFF: put the stopping cue back. YOU walks the phone into another room, leaves it there,
// and comes back free. CTA bookends the hook: "Save this for 2:47 AM".

const DROP = 56;
const SHELF: [number, number] = [905, 1068];

const PAGES: Page[] = [
  { at: 4, text: "Bring back a stopping point.", hi: ["stopping"] },
  { at: 56, text: "Phone in another room.", hi: ["another", "room"] },
  { at: 96, text: "A timer on the app.", hi: ["timer"] },
  { at: 136, text: "Your thumb gets a bottom again.", hi: ["bottom"] },
];

export const S05_SFX: SfxCue[] = [
  [0, "slam", 0.8],
  [6, "whoosh", 0.3],
  [DROP, "clink", 0.6],
  [DROP + 4, "thud", 0.3],
  [64, "swish", 0.4],
  [110, "ding", 0.7],
  [128, "pop", 0.6],
];

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const S05Fix: React.FC<SceneProps> = ({ dur }) => {
  const f = useCurrentFrame();
  const sparkle = interpolate(f, [110, 130], [0, 1], clamp);

  return (
    <Stage
      bg={<DayBg tint="#f4fbef" />}
      hits={[0, 110]}
      power={10}
      cam={{ z: punch(f, [0, DROP, 110, 128], 0.06) }}
      svg={
        <>
          {/* doorway to the other room */}
          <rect x={815} y={880} width={180} height={GROUND - 880} rx={10} fill="#3b3b4f" {...K} />
          <rect x={835} y={1076} width={140} height={14} rx={4} fill="#b08050" {...K} strokeWidth={4} />
          <text x={905} y={858} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={38} fill={COL.ink} letterSpacing={2}>
            OTHER ROOM
          </text>
          {f >= DROP && <Phone x={SHELF[0]} y={SHELF[1] - 62} s={0.8} glow={interpolate(f, [DROP, DROP + 30], [1, 0], clamp)} />}
          <Actor
            f={f}
            color={COL.orange}
            scale={S}
            label="YOU"
            facing={(t) => (t < 64 ? 1 : -1)}
            base={{ x: 300, y: GY }}
            keys={[
              { f: 0, p: { ...P.hold } },
              { f: 10, p: { ...P.hold } },
              { f: 46, p: { x: 700 }, e: (x) => x },
              { f: DROP, p: { ...P.pointR, ra1: 80 } },
              { f: 62, p: { ...P.stand, la1: -18, ra1: 18, ra2: -8 } },
              { f: 68, p: {} },
              { f: 102, p: { x: 330 }, e: (x) => x },
              { f: 110, p: { ...P.cheer } },
            ]}
            mod={(t, p) => ((t > 10 && t < 46) || (t > 68 && t < 102) ? addPose(p, walkCycle(t)) : addPose(p, idle(t, 7)))}
          >
            {(j) =>
              f < DROP ? (
                <Phone x={(j.lHand[0] + j.rHand[0]) / 2 + 4} y={(j.lHand[1] + j.rHand[1]) / 2 - 28} s={0.9} r={-10} />
              ) : null
            }
          </Actor>
          {sparkle > 0 &&
            Array.from({ length: 8 }, (_, i) => {
              const a = (i / 8) * Math.PI * 2;
              const r = 160 + sparkle * 70;
              return (
                <g key={i} transform={`translate(${330 + Math.cos(a) * r} ${950 + Math.sin(a) * r * 0.8}) rotate(${f * 6})`} opacity={1 - sparkle * 0.6}>
                  <path d="M0 -18 L5 -5 L18 0 L5 5 L0 18 L-5 5 L-18 0 L-5 -5 Z" fill={COL.yellow} stroke={COL.ink} strokeWidth={3} />
                </g>
              );
            })}
        </>
      }
      html={
        <>
          <Slam f={f} at={0} x={540} y={340} size={160} color={COL.green} stroke={`10px ${COL.ink}`}>
            THE FIX:
          </Slam>
          <Caption f={f} at={128} x={540} y={510} size={46} bg={COL.orange}>
            Save this for 2:47 AM
          </Caption>
          <Kinetic f={f} pages={PAGES} end={dur} />
        </>
      }
    />
  );
};
