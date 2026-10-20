import "./index.css";
import React from "react";
import { Composition } from "remotion";
import { Video as AiOneBug, DURATION as AiOneBug_DURATION } from "./ai-one-bug/Video";
import { Video as ScrollTrap, DURATION as ScrollTrap_DURATION } from "./scroll-trap/Video";
// stickman-video:imports

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="AiOneBug"
        component={AiOneBug}
        durationInFrames={AiOneBug_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.35, sfx: 0.8, voice: "", captions: false }}
      />
      <Composition
        id="ScrollTrap"
        component={ScrollTrap}
        durationInFrames={ScrollTrap_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.55, sfx: 0.8, voice: "", captions: false }}
      />
      {/* stickman-video:compositions */}
    </>
  );
};
