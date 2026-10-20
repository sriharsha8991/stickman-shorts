import React from "react";
import { random, useCurrentFrame } from "remotion";
import { Actor, P, addPose, idle } from "../stickman/stick";
import { COL, FONT, Slam, countUp, ease } from "../stickman/fx";
import { Bubble, Stage, Stamp } from "../stickman/common";
import type { SceneProps } from "./Video";
import { range, type SfxCue } from "./sfx";
import { AI_COLOR, Bg, Bug, GROUND, GY, S, YOU_COLOR } from "./shared";

// The bug counter spins 1 -> 47 while bugs multiply across the floor.
// YOU facepalms, the AI proudly announces success, BUILD FAILED lands.

const MAX_BUGS = 22;
const BUGS = Array.from({ length: MAX_BUGS }, (_, i) => ({
  x: 110 + random(`bx${i}`) * 860,
  row: i % 3, // 0 = on the ground line, 1-2 = closer to the camera
  phase: random(`bp${i}`) * Math.PI * 2,
  speed: 0.04 + random(`bs${i}`) * 0.05,
  s: 0.8 + random(`bz${i}`) * 0.5,
}));

export const S03_SFX: SfxCue[] = [
  ...range(10, 12, 5, "tick", 0.5),
  [72, "impact", 1],
  [80, "thud", 0.6],
  [90, "ding", 0.7],
  [108, "stamp", 1],
  [110, "buzz", 0.6],
];

export const S03Fallout: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const count = countUp(f, 10, 70, 47, 1);
  const visible = Math.round((count / 47) * MAX_BUGS);

  return (
    <Stage
      bg={<Bg />}
      hits={[72, 108]}
      power={22}
      svg={
        <>
          {BUGS.slice(0, visible).map((b, i) => {
            const wob = Math.sin(f * b.speed * 3 + b.phase);
            const x = b.x + wob * 60;
            const dir = Math.cos(f * b.speed * 3 + b.phase) >= 0 ? 1 : -1;
            return <Bug key={i} f={f + i * 3} x={x} y={GROUND + b.row * 70} s={b.s} walking dir={dir} />;
          })}
          <Actor
            f={f}
            color={YOU_COLOR}
            scale={S}
            label="YOU"
            base={{ x: 270, y: GY }}
            keys={[
              { f: 0, p: { ...P.shock } },
              { f: 74, p: {} },
              { f: 80, p: { ...P.facepalm } },
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
              { f: 0, p: { ...P.shrug } },
              { f: 84, p: {} },
              { f: 90, p: { ...P.cheer } },
            ]}
            mod={(t, p) => addPose(p, idle(t, 2))}
          />
          <Bubble x={800} y={760} w={380} h={130} t={ease(f, 90, 100)} tailX={830} tailY={880}>
            <text y={22} textAnchor="middle" fontFamily={FONT.comic} fontSize={68} fill={COL.green}>
              FIXED IT!
            </text>
          </Bubble>
        </>
      }
      html={
        <>
          <Slam f={f} at={0} x={540} y={300} size={84} font={FONT.title} weight={900} spacing={8}>
            BUGS:
          </Slam>
          {f >= 4 && (
            <div
              style={{
                position: "absolute",
                left: 540,
                top: 500,
                transform: `translate(-50%, -50%) scale(${f >= 72 ? 1 + 0.25 * Math.max(0, 1 - (f - 72) / 8) : 1}) rotate(${f >= 72 ? -5 : 0}deg)`,
                fontFamily: FONT.comic,
                fontSize: 260,
                lineHeight: 1,
                color: COL.red,
                WebkitTextStroke: `12px ${COL.ink}`,
                paintOrder: "stroke fill",
              }}
            >
              {count}
            </div>
          )}
          <Stamp f={f} at={108} x={540} y={1440} text="BUILD FAILED" size={96} />
        </>
      }
    />
  );
};
