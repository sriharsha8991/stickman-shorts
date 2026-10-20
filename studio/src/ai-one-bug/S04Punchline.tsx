import React from "react";
import { useCurrentFrame } from "remotion";
import { Actor, P, addPose, idle, walkCycle } from "../stickman/stick";
import { COL, Caption, FONT, Slam, ease } from "../stickman/fx";
import { Bubble, Stage, WordBlock } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { At, Box } from "../stickman/props";
import { AI_COLOR, Bg, Bug, GROUND, GY, S, YOU_COLOR } from "./shared";

// Time skip. Everything is "clean"... then the ORIGINAL bug strolls back in and stares
// at the camera. STILL THERE. The AI quietly backs out of frame.

export const S04_SFX: SfxCue[] = [
  [0, "page", 0.6],
  [30, "pop", 0.6],
  [70, "boing", 0.5],
  [100, "slam", 0.9],
  [100, "stinger", 0.8],
  [130, "thud", 0.5],
  [165, "ding", 0.6],
];

export const S04Punchline: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const bugX = ease(f, 70, 100, -120, 560, (t) => t);
  const bugWalking = f >= 70 && f < 100;
  const sitY = GY + 40 * S;

  return (
    <Stage
      bg={<Bg />}
      hits={[100]}
      power={24}
      svg={
        <>
          {/* crate YOU sits on while waiting */}
          <At x={250} y={GROUND - 54} s={1.3}>
            <Box />
          </At>
          <Actor
            f={f}
            color={YOU_COLOR}
            scale={S}
            label="YOU"
            base={{ x: 250, y: sitY }}
            keys={[
              { f: 0, p: { ...P.sit, y: sitY, head: 15 } },
              { f: 94, p: {} },
              { f: 100, p: { ...P.shock, y: GY, ll1: -12, ll2: 4, rl1: 12, rl2: -4, lean: -8 } },
              { f: 128, p: { ...P.facepalm } },
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
            base={{ x: 830, y: GY }}
            keys={[
              { f: 0, p: { ...P.cheer } },
              { f: 94, p: {} },
              { f: 100, p: { ...P.shrug } },
              { f: 130, p: { ...P.stand } },
              { f: 190, p: { x: 1350 }, e: (t) => t },
            ]}
            mod={(t, p) => (t > 130 ? addPose(p, walkCycle(t)) : addPose(p, idle(t, 2)))}
          />
          <Bubble x={760} y={690} w={440} h={130} t={ease(f, 30, 40) * (f < 95 ? 1 : 0)} tailX={800} tailY={800}>
            <text y={18} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={54} fill={COL.ink}>
              All clean now!
            </text>
          </Bubble>
          <Bug f={f} x={bugX} s={1.6} walking={bugWalking} dir={1} look={f >= 100 ? 1 : 0} />
          {f >= 70 && <WordBlock x={bugX + 40} y={GROUND - 190} text="THE ORIGINAL BUG" size={30} bg={COL.yellow} r={-3} />}
        </>
      }
      html={
        <>
          <Caption f={f} at={0} out={62} x={540} y={320} size={46} bg={COL.ink}>
            2 hours later...
          </Caption>
          <Slam f={f} at={100} x={540} y={430} size={150} color={COL.red} rotate={-3} stroke={`10px ${COL.ink}`}>
            STILL THERE.
          </Slam>
          <Slam f={f} at={130} x={540} y={580} size={72} font={FONT.title} weight={800} spacing={4}>
            every. single. time.
          </Slam>
          <Caption f={f} at={165} x={540} y={1440} size={42} bg={COL.orange}>
            Follow for more dev pain
          </Caption>
        </>
      }
    />
  );
};
