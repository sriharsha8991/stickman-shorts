import { LONG_THUMBS, LongThumb } from "./thumbs/LongThumbs";
import { SparkSheet } from "./shared/SparkSheet";
import { CameraDemo } from "./shared/CameraDemo";
import { PowerUpDemo, POWERUP_DEMO_FRAMES } from "./shared/PowerUpDemo";
import { ShotsDemo, SHOTS_DEMO_FRAMES } from "./shared/ShotsDemo";
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
import { Video as V008FreeDelivery, DURATION as V008FreeDelivery_DURATION } from "./v008-free-delivery/Video";
import { Video as H0110kSteps, DURATION as H0110kSteps_DURATION } from "./h01-10k-steps/Video";
import { Video as V009Strawberry, DURATION as V009Strawberry_DURATION } from "./v009-strawberry/Video";
import { Video as H12IfThen, DURATION as H12IfThen_DURATION } from "./h12-if-then/Video";
import { Video as V010RedDot, DURATION as V010RedDot_DURATION } from "./v010-red-dot/Video";
import { Video as H26CoffeeCutoff, DURATION as H26CoffeeCutoff_DURATION } from "./h26-coffee-cutoff/Video";
import { Video as V011FridayFix, DURATION as V011FridayFix_DURATION } from "./v011-friday-fix/Video";
import { Video as H02StepSweetSpot, DURATION as H02StepSweetSpot_DURATION } from "./h02-step-sweet-spot/Video";
import { Video as L001FeedDecides, DURATION as L001FeedDecides_DURATION } from "./l001-feed-decides/Video";
import { Video as L002NextGuess, DURATION as L002NextGuess_DURATION } from "./l002-next-guess/Video";
import { Video as V012DecoyPopcorn, DURATION as V012DecoyPopcorn_DURATION } from "./v012-decoy-popcorn/Video";
import { Video as H13Habit21Days, DURATION as H13Habit21Days_DURATION } from "./h13-habit-21-days/Video";
import { Video as V013AiWontTakeJob, DURATION as V013AiWontTakeJob_DURATION } from "./v013-ai-wont-take-job/Video";
import { Video as H27WeekendSleepDebt, DURATION as H27WeekendSleepDebt_DURATION } from "./h27-weekend-sleep-debt/Video";
import { Video as V013AiWontTakeJobV2, DURATION as V013AiWontTakeJobV2_DURATION } from "./v013-ai-wont-take-job-v2/Video";
import { Video as H03HuffBursts, DURATION as H03HuffBursts_DURATION } from "./h03-huff-bursts/Video";
import { Video as V014ScratchCard, DURATION as V014ScratchCard_DURATION } from "./v014-scratch-card/Video";
import { Video as H14WillpowerBattery, DURATION as H14WillpowerBattery_DURATION } from "./h14-willpower-battery/Video";
import { Video as V015LikeRegret, DURATION as V015LikeRegret_DURATION } from "./v015-like-regret/Video";
import { Video as V016TwoWeeks, DURATION as V016TwoWeeks_DURATION } from "./v016-two-weeks/Video";
import { Video as H04WalkVsStand, DURATION as H04WalkVsStand_DURATION } from "./h04-walk-vs-stand/Video";
import { Video as H28CyclicSigh, DURATION as H28CyclicSigh_DURATION } from "./h28-cyclic-sigh/Video";
import { Video as L003PayInFour, DURATION as L003PayInFour_DURATION } from "./l003-pay-in-four/Video";
import { Video as V017CrossedPrice, DURATION as V017CrossedPrice_DURATION } from "./v017-crossed-price/Video";
import { Video as H15FreshStart, DURATION as H15FreshStart_DURATION } from "./h15-fresh-start/Video";
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
      <Composition
        id="V008FreeDelivery"
        component={V008FreeDelivery}
        durationInFrames={V008FreeDelivery_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.32, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="H0110kSteps"
        component={H0110kSteps}
        durationInFrames={H0110kSteps_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.32, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="V009Strawberry"
        component={V009Strawberry}
        durationInFrames={V009Strawberry_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.2, sfx: 0.5, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="H12IfThen"
        component={H12IfThen}
        durationInFrames={H12IfThen_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.32, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="V010RedDot"
        component={V010RedDot}
        durationInFrames={V010RedDot_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.32, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="H26CoffeeCutoff"
        component={H26CoffeeCutoff}
        durationInFrames={H26CoffeeCutoff_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.32, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="V011FridayFix"
        component={V011FridayFix}
        durationInFrames={V011FridayFix_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.32, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="H02StepSweetSpot"
        component={H02StepSweetSpot}
        durationInFrames={H02StepSweetSpot_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.32, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="L002NextGuess"
        component={L002NextGuess}
        durationInFrames={L002NextGuess_DURATION}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ music: 0.19, sfx: 0.6, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="L001FeedDecides"
        component={L001FeedDecides}
        durationInFrames={L001FeedDecides_DURATION}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ music: 0.28, sfx: 0.6, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="V012DecoyPopcorn"
        component={V012DecoyPopcorn}
        durationInFrames={V012DecoyPopcorn_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.32, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="H13Habit21Days"
        component={H13Habit21Days}
        durationInFrames={H13Habit21Days_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.32, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="V013AiWontTakeJob"
        component={V013AiWontTakeJob}
        durationInFrames={V013AiWontTakeJob_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.32, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="H27WeekendSleepDebt"
        component={H27WeekendSleepDebt}
        durationInFrames={H27WeekendSleepDebt_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.32, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="V013AiWontTakeJobV2"
        component={V013AiWontTakeJobV2}
        durationInFrames={V013AiWontTakeJobV2_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.32, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="H03HuffBursts"
        component={H03HuffBursts}
        durationInFrames={H03HuffBursts_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.32, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="V014ScratchCard"
        component={V014ScratchCard}
        durationInFrames={V014ScratchCard_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.32, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="H14WillpowerBattery"
        component={H14WillpowerBattery}
        durationInFrames={H14WillpowerBattery_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.32, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="V015LikeRegret"
        component={V015LikeRegret}
        durationInFrames={V015LikeRegret_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.32, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="H28CyclicSigh"
        component={H28CyclicSigh}
        durationInFrames={H28CyclicSigh_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.32, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="V016TwoWeeks"
        component={V016TwoWeeks}
        durationInFrames={V016TwoWeeks_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.32, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="H04WalkVsStand"
        component={H04WalkVsStand}
        durationInFrames={H04WalkVsStand_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.32, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="L003PayInFour"
        component={L003PayInFour}
        durationInFrames={L003PayInFour_DURATION}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ music: 0.24, sfx: 0.6, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="V017CrossedPrice"
        component={V017CrossedPrice}
        durationInFrames={V017CrossedPrice_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.35, sfx: 0.8, voice: "", captions: false }}
      />
      <Composition
        id="H15FreshStart"
        component={H15FreshStart}
        durationInFrames={H15FreshStart_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.35, sfx: 0.8, voice: "", captions: false }}
      />
      {/* stickman-video:compositions */}
          <Composition id="SparkSheet" component={SparkSheet} durationInFrames={60} fps={30} width={1920} height={1080} />
          <Composition id="CameraDemo" component={CameraDemo} durationInFrames={200} fps={30} width={1920} height={1080} />
          <Composition id="PowerUpDemo" component={PowerUpDemo} durationInFrames={POWERUP_DEMO_FRAMES} fps={30} width={1080} height={1920} />
          <Composition id="ShotsDemo" component={ShotsDemo} durationInFrames={SHOTS_DEMO_FRAMES} fps={30} width={1080} height={1920} />
          {LONG_THUMBS.map((c) => (
        <Composition key={c.id} id={`Thumb${c.id}`} component={() => <LongThumb cfg={c} />} durationInFrames={1} fps={30} width={1280} height={720} />
      ))}
    </>
  );
};
