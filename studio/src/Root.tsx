import "./index.css";
import React from "react";
import { Composition } from "remotion";
import { Video as AiOneBug, DURATION as AiOneBug_DURATION } from "./ai-one-bug/Video";
import { Video as ScrollTrap, DURATION as ScrollTrap_DURATION } from "./scroll-trap/Video";
import { Video as StreakHostage, DURATION as StreakHostage_DURATION } from "./streak-hostage/Video";
import { Video as V000MeetSpark, DURATION as V000MeetSpark_DURATION } from "./v000-meet-spark/Video";
import { BrandingStills } from "./branding/Branding";
import { Video as V001AiOneBug, DURATION as V001AiOneBug_DURATION } from "./v001-ai-one-bug/Video";
import { Video as V002ScrollTrap, DURATION as V002ScrollTrap_DURATION } from "./v002-scroll-trap/Video";
import { Video as V004UpiPain, DURATION as V004UpiPain_DURATION } from "./v004-upi-pain/Video";
import { Video as V005DemoDay, DURATION as V005DemoDay_DURATION } from "./v005-demo-day/Video";
import { Video as V006FirstBug, DURATION as V006FirstBug_DURATION } from "./v006-first-bug/Video";
import { Video as V007Autoplay, DURATION as V007Autoplay_DURATION } from "./v007-autoplay/Video";
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
        defaultProps={{ music: 0.32, sfx: 0.7, voice: "voice.wav", captions: false }}
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
      <Composition
        id="V002ScrollTrap"
        component={V002ScrollTrap}
        durationInFrames={V002ScrollTrap_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.32, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="V004UpiPain"
        component={V004UpiPain}
        durationInFrames={V004UpiPain_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.32, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="V005DemoDay"
        component={V005DemoDay}
        durationInFrames={V005DemoDay_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.32, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="V006FirstBug"
        component={V006FirstBug}
        durationInFrames={V006FirstBug_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.32, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="V007Autoplay"
        component={V007Autoplay}
        durationInFrames={V007Autoplay_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.32, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      {/* stickman-video:compositions */}
    </>
  );
};
