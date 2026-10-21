import "./index.css";
import React from "react";
import { Composition } from "remotion";
import { Video as AiOneBug, DURATION as AiOneBug_DURATION } from "./ai-one-bug/Video";
import { Video as ScrollTrap, DURATION as ScrollTrap_DURATION } from "./scroll-trap/Video";
import { Video as StreakHostage, DURATION as StreakHostage_DURATION } from "./streak-hostage/Video";
import { Video as V000MeetSpark, DURATION as V000MeetSpark_DURATION } from "./v000-meet-spark/Video";
import { BrandingStills } from "./branding/Branding";
import { Video as V001AiOneBug, DURATION as V001AiOneBug_DURATION } from "./v001-ai-one-bug/Video";
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
      <Composition
        id="StreakHostage"
        component={StreakHostage}
        durationInFrames={StreakHostage_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.55, sfx: 0.8, voice: "", captions: false }}
      />
      <Composition
        id="V000MeetSpark"
        component={V000MeetSpark}
        durationInFrames={V000MeetSpark_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.32, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      <BrandingStills />
      <Composition
        id="V001AiOneBug"
        component={V001AiOneBug}
        durationInFrames={V001AiOneBug_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.32, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      {/* stickman-video:compositions */}
    </>
  );
};
