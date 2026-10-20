import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Actor, P, addPose, idle } from "../stickman/stick";
import { COL, Caption, FONT, Slam, countUp, ease } from "../stickman/fx";
import { Bubble, Stage } from "../stickman/common";
import type { SceneProps } from "./Video";
import { range, type SfxCue } from "./sfx";
import { DayBg, GY, Kinetic, S, punch, type Page } from "./kit";

// RECEIPTS. The two inventors as labelled generic figures. Brichter's real quote (The Guardian, 2017),
// then Raskin's own estimate counts up: 200,000 human lifetimes, every day.

const COUNT_A = 80;
const COUNT_B = 128;
const HIT = 134;

const PAGES: Page[] = [
  { at: 4, text: "Both inventors now regret it.", hi: ["regret"] },
  { at: 78, text: "Aza Raskin's own estimate:" },
  { at: HIT, text: "wasted on infinite scroll.", hi: ["wasted"] },
];

export const S04_SFX: SfxCue[] = [
  [0, "page", 0.5],
  [16, "pop", 0.6],
  ...range(COUNT_A, 13, 4, "tick", 0.3),
  [HIT, "slam", 0.9],
  [HIT + 2, "thud", 0.6],
  [HIT + 8, "thud", 0.35],
];

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const commas = (n: number) => n.toLocaleString("en-US");

export const S04Regret: React.FC<SceneProps> = ({ dur }) => {
  const f = useCurrentFrame();
  const bubbleT = ease(f, 16, 26) * (f < 74 ? 1 : interpolate(f, [74, 80], [1, 0], clamp));
  const n = countUp(f, COUNT_A, COUNT_B, 200000, 0);
  const numScale = f >= HIT ? 1 + 0.22 * Math.max(0, 1 - (f - HIT) / 8) : 1;

  return (
    <Stage
      bg={<DayBg tint="#eeecf5" />}
      hits={[HIT]}
      power={20}
      cam={{ z: punch(f, [0, COUNT_A, HIT], 0.06) }}
      svg={
        <>
          <Actor
            f={f}
            color={COL.purple}
            scale={S}
            label="INFINITE SCROLL"
            accessory="glasses"
            face="sad"
            base={{ x: 270, y: GY }}
            keys={[
              { f: 0, p: { ...P.sad } },
              { f: HIT, p: { ...P.sad } },
              { f: HIT + 8, p: { ...P.facepalm } },
            ]}
            mod={(t, p) => addPose(p, idle(t, 5))}
          />
          <Actor
            f={f}
            color={COL.green}
            scale={S}
            label="PULL-TO-REFRESH"
            face="sad"
            facing={-1}
            base={{ x: 810, y: GY }}
            keys={[
              { f: 0, p: { ...P.sad } },
              { f: 14, p: { ...P.shrug } },
              { f: 70, p: { ...P.shrug } },
              { f: 80, p: { ...P.sad } },
            ]}
            mod={(t, p) => addPose(p, idle(t, 6))}
          />
          <Bubble x={540} y={760} w={720} h={140} t={bubbleT} tailX={700} tailY={830}>
            <text y={18} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={56} fill={COL.ink}>
              "Pull-to-refresh is addictive."
            </text>
          </Bubble>
        </>
      }
      html={
        <>
          {f >= 22 && f < 78 && (
            <Caption f={f} at={22} out={72} x={540} y={620} size={32} bg={COL.ink}>
              — Loren Brichter, The Guardian, 2017
            </Caption>
          )}
          {f >= COUNT_A && (
            <>
              <div
                style={{
                  position: "absolute",
                  left: 540,
                  top: 380,
                  transform: `translate(-50%, -50%) scale(${numScale}) rotate(${f >= HIT ? -3 : 0}deg)`,
                  fontFamily: FONT.comic,
                  fontSize: 210,
                  lineHeight: 1,
                  color: COL.red,
                  WebkitTextStroke: `12px ${COL.ink}`,
                  paintOrder: "stroke fill",
                  whiteSpace: "nowrap",
                }}
              >
                {commas(n)}
              </div>
              <Slam f={f} at={COUNT_A + 6} x={540} y={540} size={76} font={FONT.title} weight={900} spacing={6}>
                HUMAN LIFETIMES
              </Slam>
              <Slam f={f} at={HIT} x={540} y={650} size={92} color={COL.red} font={FONT.comic} rotate={-2}>
                EVERY. SINGLE. DAY.
              </Slam>
            </>
          )}
          <Kinetic f={f} pages={PAGES} end={dur} />
        </>
      }
    />
  );
};
