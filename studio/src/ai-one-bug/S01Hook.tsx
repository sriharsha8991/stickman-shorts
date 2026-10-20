import React from "react";
import { useCurrentFrame } from "remotion";
import { Actor, P, addPose, idle } from "../stickman/stick";
import { COL, Dust, FONT, Slam, ease } from "../stickman/fx";
import { Bubble, Stage } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { Bg, Bug, GROUND, GY, S, YOU_COLOR } from "./shared";

// Hook: POV title slams in line by line, YOU points at one tiny bug.
export const S01_SFX: SfxCue[] = [
  [0, "slam", 0.7],
  [8, "whoosh", 0.5],
  [16, "impact", 1],
  [40, "swish", 0.4],
  [50, "pop", 0.7],
];

export const S01Hook: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const bubbleT = ease(f, 50, 60);
  // the bug scuttles in from the right and stops in the middle
  const bugX = ease(f, 18, 40, 1150, 700);
  const bugWalking = f > 18 && f < 40;

  return (
    <Stage
      bg={<Bg />}
      hits={[16]}
      power={20}
      svg={
        <>
          <Actor
            f={f}
            color={YOU_COLOR}
            scale={S}
            label="YOU"
            base={{ x: 280, y: GY }}
            keys={[
              { f: 0, p: {} },
              { f: 34, p: {} },
              { f: 40, p: { ...P.pointR } },
            ]}
            mod={(t, p) => addPose(p, idle(t, 1))}
          />
          <Bug f={f} x={bugX} s={1.4} walking={bugWalking} dir={-1} look={f > 44 ? 1 : 0} />
          <Dust x={700} y={GROUND} at={40} f={f} spread={90} />
          <Bubble x={430} y={760} w={480} h={130} t={bubbleT} tailX={330} tailY={890}>
            <text y={16} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={52} fill={COL.ink}>
              Just fix this ONE.
            </text>
          </Bubble>
        </>
      }
      html={
        <>
          <Slam f={f} at={0} x={540} y={300} size={110} color={COL.orange}>
            POV:
          </Slam>
          <Slam f={f} at={8} x={540} y={430} size={92} font={FONT.title} weight={900} spacing={2}>
            YOU ASKED AI TO FIX
          </Slam>
          <Slam f={f} at={16} x={540} y={580} size={170} color={COL.red} rotate={-4} stroke={`10px ${COL.ink}`}>
            ONE BUG
          </Slam>
        </>
      }
    />
  );
};
