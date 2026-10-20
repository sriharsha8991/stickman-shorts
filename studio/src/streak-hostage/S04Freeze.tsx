import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Actor, P, addPose, idle } from "../stickman/stick";
import { Burst, COL, FONT, Slam } from "../stickman/fx";
import { Stage, Stamp, fall } from "../stickman/common";
import { At, Coin, Ice } from "../stickman/props";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, GY, Kinetic, S, punch, type Page } from "../shared/kit";
import { COLD, Flame, IceForSale, Leash, Stall, WarmBg, YOU, collar } from "./parts";

// THE TWIST: 11:58 PM, the streak is flickering out. A stall sells STREAK FREEZE for gems:
// YOU pays, the ice block flies over and encases the flame. "PAY TO KEEP IT".

const SIGN = 34;
const PAY = 92;
const FREEZE = 112;
const STAMP = 136;
const STALL_X = 790;
const YOU_X = 470;
const FLAME_X = 190;

const PAGES: Page[] = [
  { at: 2, text: "And the twist?", hi: ["twist"] },
  { at: 34, text: "Some apps sell “freezes”…", hi: ["sell"] },
  { at: 86, text: "to rescue the streak", hi: ["rescue"] },
  { at: 128, text: "they taught you to fear losing.", hi: ["fear", "losing"] },
];

export const S04_SFX: SfxCue[] = [
  [2, "swish", 0.5],
  [SIGN + 14, "thud", 0.7],
  [PAY - 6, "whoosh", 0.5],
  [PAY + 8, "kaching", 0.9],
  [FREEZE - 6, "whoosh", 0.6],
  [FREEZE, "freeze", 1],
  [FREEZE, "impact", 0.7],
  [STAMP, "stamp", 0.9],
];

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const S04Freeze: React.FC<SceneProps> = ({ dur }) => {
  const f = useCurrentFrame();
  const signY = f < SIGN ? -400 : fall(f, SIGN, -300, 760, 14);
  // the ice flies from the counter to the flame
  const it = interpolate(f, [FREEZE - 10, FREEZE], [0, 1], clamp);
  const iceX = interpolate(it, [0, 1], [STALL_X - 40, FLAME_X]);
  const iceY = interpolate(it, [0, 1], [1040, GROUND - 150]) - Math.sin(it * Math.PI) * 300;
  const frozen = f >= FREEZE;
  const flicker = frozen ? 1 : 0.55 + 0.45 * Math.abs(Math.sin(f * 0.37) * Math.cos(f * 0.13));
  const fs = frozen ? 0.95 : 0.8 + 0.1 * Math.sin(f * 0.5);
  const coins = [0, 1, 2].map((i) => {
    const t = interpolate(f, [PAY - 6 + i * 3, PAY + 6 + i * 3], [0, 1], clamp);
    if (t <= 0 || t >= 1) return null;
    return (
      <At key={i} x={interpolate(t, [0, 1], [YOU_X + 130, STALL_X - 60])} y={interpolate(t, [0, 1], [1010, 1030]) - Math.sin(t * Math.PI) * 140} s={0.45}>
        <Coin sym="◆" color="#3fc1c9" />
      </At>
    );
  });
  return (
    <Stage
      bg={<WarmBg tint={COLD} />}
      hits={[SIGN + 14, FREEZE, STAMP]}
      power={16}
      cam={{ z: punch(f, [0, SIGN + 14, FREEZE, STAMP], 0.06) }}
      svg={
        <>
          <Stall x={STALL_X} sign={1} signY={signY} />
          {f < FREEZE - 10 && <IceForSale x={STALL_X - 70} y={1042} />}
          <Flame f={f} x={FLAME_X} s={fs} n={247} look={1} mood={frozen ? "happy" : "weak"} dim={flicker} />
          <Actor
            f={f}
            color={YOU}
            scale={S}
            label="YOU"
            trails={false}
            keys={[
              { f: 0, p: { x: YOU_X, y: GY, ...P.shock, la1: -70, la2: -10 } },
              { f: 20, p: { ...P.shock, la1: -70, la2: -10 } },
              { f: 28, p: { ...P.stand, la1: -60, la2: -6, ra1: 30, ra2: -20, head: 14 } },
              { f: PAY - 8, p: {} },
              { f: PAY - 2, p: { ra1: 96, ra2: -4, lean: 10 } },
              { f: PAY + 14, p: {} },
              { f: PAY + 22, p: { ra1: 30, ra2: -20, lean: 0 } },
              { f: FREEZE + 2, p: {} },
              { f: FREEZE + 8, p: { ...P.shrug, la1: -60, la2: -6 } },
            ]}
            mod={(t, p) => addPose(p, idle(t, 7))}
          >
            {(j) => <Leash a={j.lHand} b={collar(FLAME_X, fs, 1)} sag={50} />}
          </Actor>
          {coins}
          {f >= FREEZE - 10 && (
            <At x={iceX} y={iceY} s={frozen ? interpolate(f, [FREEZE, FREEZE + 4, FREEZE + 8], [1.15, 0.95, 1], clamp) : 0.4 + it * 0.6}>
              <Ice w={250} h={300} />
            </At>
          )}
          <Burst x={FLAME_X} y={GROUND - 150} at={FREEZE} f={f} size={320} color="#bfe6ff" />
        </>
      }
      html={
        <>
          <div
            style={{
              position: "absolute",
              top: 280,
              width: 1080,
              textAlign: "center",
              fontFamily: FONT.title,
              fontWeight: 900,
              fontSize: 120,
              color: f % 30 < 20 || frozen ? "#d6263b" : "rgba(214,38,59,0.35)",
              letterSpacing: 6,
            }}
          >
            11:58 PM
          </div>
          <Stamp f={f} at={STAMP} x={540} y={500} text="PAY TO KEEP IT" color="#1f6fa8" size={78} r={-6} />
          <Slam f={f} at={FREEZE} x={250} y={760} size={70} color="#4aa3d8" rotate={-6} stroke={`5px ${COL.ink}`} out={FREEZE + 24}>
            FROZEN!
          </Slam>
          <Kinetic f={f} pages={PAGES} end={dur} />
        </>
      }
    />
  );
};
