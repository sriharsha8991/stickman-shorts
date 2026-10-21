import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile } from "remotion";
import { COL } from "../stickman/fx";
import { Captions, ChapterCard } from "../stickman/common";
import { CARD, SfxCue } from "./sfx";
import { TIMELINE } from "./timeline";
import { S01Tower, S01_SFX } from "./S01Tower";
import { VOICE_FRAMES } from "./voice";

// Folder in public/ with music.mp3, sfx/*.wav and (optionally) the voiceover.
const ASSETS = "v001-ai-one-bug";

export type SceneProps = { from: number; dur: number };
type Scene = { c: React.FC<SceneProps>; from: number; sfx?: SfxCue[] };

const chapter = (n: string, title: string, sub: string, from: number): Scene => ({
  c: ({ dur }) => <ChapterCard n={n} title={title} sub={sub} dur={dur} />,
  from,
  sfx: CARD,
});

// Each scene lasts until the next one starts.
// WITH a voiceover: start scenes on timeline frames (a cue's startFrame) so the picture
// stays in sync with the voice. WITHOUT a voiceover: pick the starts freely (pacing is
// set by the animation and the on-screen text) and set DURATION below.
export const SCENES: Scene[] = [
  { c: S01Tower, from: 0, sfx: S01_SFX },
  // chapter("CHAPTER 1", "Title", "subtitle", TIMELINE.chapters[0].startFrame),
];

// With a voiceover this must stay = the narration length. Without one, use the end of the last scene.
export const DURATION = VOICE_FRAMES; // narration length (tools/voiceover.py)

export type VideoProps = {
  music: number; // music volume (0-1)
  sfx: number; // sound-effects volume (0-1)
  voice: string; // voiceover file name inside public/<ASSETS>/ ("" = none)
  captions: boolean; // burn the narration in as subtitles
};

// music ducking: lower the music while the narrator speaks
const duck = (f: number) => {
  let g = 1;
  for (const c of TIMELINE.cues) {
    if (f < c.startFrame - 10) break;
    g = Math.min(
      g,
      interpolate(f, [c.startFrame - 8, c.startFrame, c.endFrame, c.endFrame + 10], [1, 0.4, 0.4, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    );
  }
  return g;
};

export const Video: React.FC<VideoProps> = ({ music, sfx, voice, captions }) => {
  return (
    <AbsoluteFill style={{ background: COL.paper }}>
      <Audio
        src={staticFile(`${ASSETS}/music.mp3`)}
        volume={(f) =>
          music *
          (voice ? duck(f) : 1) *
          interpolate(f, [0, 10, DURATION - 45, DURATION], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
        }
      />
      {voice && <Audio src={staticFile(`${ASSETS}/${voice}`)} />}
      {SCENES.map(({ c: C, from, sfx: cues }, i) => {
        const dur = (SCENES[i + 1]?.from ?? DURATION) - from;
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            <C from={from} dur={dur} />
            {cues?.map(([f, name, v = 1], k) => (
              <Sequence key={k} from={f} layout="none">
                {/* eslint-disable-next-line @remotion/volume-callback -- constant per-effect volume */}
                <Audio src={staticFile(`${ASSETS}/sfx/${name}.wav`)} volume={v * sfx} />
              </Sequence>
            ))}
          </Sequence>
        );
      })}
      {captions && <Captions cues={TIMELINE.cues} />}
    </AbsoluteFill>
  );
};

// keep the helper referenced until the first chapter is added
export const _chapter = chapter;
