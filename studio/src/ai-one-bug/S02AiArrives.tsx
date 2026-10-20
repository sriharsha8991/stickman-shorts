import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Actor, P, addPose, idle, runCycle } from "../stickman/stick";
import { Burst, COL, Caption, Dust, SpeedLines } from "../stickman/fx";
import { Stage, WordBlock, fall } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { AI_COLOR, Bg, Bug, GROUND, GY, S, YOU_COLOR } from "./shared";

// The AI sprints in, promises to "improve a few things", spins like a tornado and buries
// the bug under a pile of unrequested changes.

const H = 78; // WordBlock height at size 44
type Block = { at: number; x: number; r: number; text: string; bg: string; size?: number };
const BLOCKS: Block[] = [
  { at: 70, x: 610, r: -3, text: "REFACTORED AUTH", bg: "#fff" },
  { at: 86, x: 590, r: 4, text: "NEW FRAMEWORK", bg: COL.yellow },
  { at: 100, x: 620, r: -5, text: "DELETED TESTS", bg: "#ffd6d1" },
  { at: 112, x: 600, r: 3, text: "RENAMED EVERYTHING", bg: "#fff", size: 38 },
  { at: 124, x: 615, r: -2, text: "+4,812 LINES", bg: "#d8f1d4" },
];
const LAND = 12; // frames of fall before the block lands

export const S02_SFX: SfxCue[] = [
  [0, "whoosh_long", 0.6],
  [22, "thud", 0.6],
  [28, "pop", 0.6],
  [58, "swirl", 0.7],
  ...BLOCKS.map((b, i): SfxCue => [b.at + LAND, i === BLOCKS.length - 1 ? "crash" : "thud", i === BLOCKS.length - 1 ? 0.9 : 0.8]),
  [70, "boing", 0.4],
];

export const S02AiArrives: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const hits = BLOCKS.map((b) => b.at + LAND);

  return (
    <Stage
      bg={<Bg />}
      hits={hits}
      power={14}
      svg={
        <>
          <SpeedLines f={f} from={0} to={22} dir={-1} />
          {/* the bug, about to be buried */}
          <Bug f={f} x={700} s={1.4} dir={-1} look={f > 60 ? 1 : 0} walking={f > 60 && f < 82} />
          {BLOCKS.map((b, i) => {
            const landY = GROUND - H / 2 - i * (H - 4);
            const y = fall(f, b.at, -200, landY, LAND);
            const r = interpolate(f, [b.at, b.at + LAND], [b.r * 8, b.r], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return f >= b.at ? <WordBlock key={i} x={b.x} y={y} r={r} text={b.text} bg={b.bg} size={b.size ?? 44} /> : null;
          })}
          <Burst x={610} y={GROUND - 40} at={BLOCKS[0].at + LAND} f={f} size={200} />
          <Burst x={615} y={GROUND - 4 * (H - 4) - 40} at={BLOCKS[4].at + LAND} f={f} size={240} color={COL.yellow} />
          <Dust x={930} y={GROUND} at={22} f={f} spread={140} />
          <Actor
            f={f}
            color={YOU_COLOR}
            scale={S}
            label="YOU"
            base={{ x: 230, y: GY }}
            keys={[
              { f: 0, p: { ...P.pointR } },
              { f: 24, p: { ...P.stand, la1: -18, la2: 8, ra1: 18, ra2: -8, head: -8 } },
              { f: 66, p: {} },
              { f: 72, p: { ...P.shock } },
              { f: 130, p: { ...P.shock, lean: -16, head: -18 } },
            ]}
            mod={(t, p) => addPose(p, idle(t, 1))}
          />
          <Actor
            f={f}
            color={AI_COLOR}
            scale={S}
            label="AI"
            accessory="glasses"
            face="happy"
            facing={-1}
            base={{ x: 1350, y: GY }}
            keys={[
              { f: 0, p: { lean: 20 } },
              { f: 22, p: { x: 930, lean: 20 }, e: (t) => t },
              { f: 26, p: { lean: -18, ll1: -30, rl1: 30 } },
              { f: 32, p: { ...P.cheer, lean: 0, ll1: -12, rl1: 12 } },
              { f: 52, p: {} },
              { f: 58, p: { ...P.armsUp } },
              { f: 140, p: { ...P.armsUp } },
              { f: 146, p: { ...P.shrug } },
            ]}
            mod={(t, p) => {
              if (t < 22) return addPose(p, runCycle(t, 0.55));
              if (t >= 58 && t < 140) return { ...p, rot: (t - 58) * 28 };
              return addPose(p, idle(t, 2));
            }}
          />
        </>
      }
      html={
        <>
          <Caption f={f} at={28} x={540} y={330} size={46} bg={AI_COLOR}>
            AI: "Sure! Let me also
          </Caption>
          <Caption f={f} at={36} x={540} y={420} size={46} bg={AI_COLOR}>
            improve a few things"
          </Caption>
        </>
      }
    />
  );
};
