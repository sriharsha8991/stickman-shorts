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
import { Video as V101BatBall, DURATION as V101BatBall_DURATION } from "./v101-bat-ball/Video";
import { Video as V025PaidToStay, DURATION as V025PaidToStay_DURATION } from "./v025-paid-to-stay/Video";
import { Video as V102BlameTheDoor, DURATION as V102BlameTheDoor_DURATION } from "./v102-blame-the-door/Video";
import { Video as V026OnlyTwoLeft, DURATION as V026OnlyTwoLeft_DURATION } from "./v026-only-two-left/Video";
import { Video as V103PhantomBuzz, DURATION as V103PhantomBuzz_DURATION } from "./v103-phantom-buzz/Video";
import { Video as V021LossTwice, DURATION as V021LossTwice_DURATION } from "./v021-loss-twice/Video";
import { Launch15, LAUNCH15_FRAMES } from "./launch-15/Launch15";
import { LaunchKeynote, KEYNOTE_FRAMES } from "./launch-15/LaunchKeynote";
import { Video as V104WobblyShelf, DURATION as V104WobblyShelf_DURATION } from "./v104-wobbly-shelf/Video";
import { Video as V018TypingDots, DURATION as V018TypingDots_DURATION } from "./v018-typing-dots/Video";
import { Video as V105TickleYourself, DURATION as V105TickleYourself_DURATION } from "./v105-tickle-yourself/Video";
import { Video as H20PhoneBrainDrain, DURATION as H20PhoneBrainDrain_DURATION } from "./h20-phone-brain-drain/Video";
import { Video as V028LowBatteryFare, DURATION as V028LowBatteryFare_DURATION } from "./v028-low-battery-fare/Video";
import { Video as V024PauseNoticed, DURATION as V024PauseNoticed_DURATION } from "./v024-pause-noticed/Video";
import { Video as V020ShameButton, DURATION as V020ShameButton_DURATION } from "./v020-shame-button/Video";
import { Video as V106YourName, DURATION as V106YourName_DURATION } from "./v106-your-name/Video";
import { Video as H29MorningLight, DURATION as H29MorningLight_DURATION } from "./h29-morning-light/Video";
import { Video as V019SureButWrong, DURATION as V019SureButWrong_DURATION } from "./v019-sure-but-wrong/Video";
import { Video as H05StandingStill, DURATION as H05StandingStill_DURATION } from "./h05-standing-still/Video";
import { Video as V023FailedGlue, DURATION as V023FailedGlue_DURATION } from "./v023-failed-glue/Video";
import { Video as H16PingCost, DURATION as H16PingCost_DURATION } from "./h16-ping-cost/Video";
import { Video as V029PickedForYou, DURATION as V029PickedForYou_DURATION } from "./v029-picked-for-you/Video";
import { Video as H30EightGlasses, DURATION as H30EightGlasses_DURATION } from "./h30-eight-glasses/Video";
import { Video as V030MeltedBar, DURATION as V030MeltedBar_DURATION } from "./v030-melted-bar/Video";
import { Video as H06FiftySteps, DURATION as H06FiftySteps_DURATION } from "./h06-fifty-steps/Video";
import { DoodleDemo } from "./doodle-demo/DoodleDemo";
import { Video as V032FirstNumber, DURATION as V032FirstNumber_DURATION } from "./v032-first-number/Video";
import { Video as H17StillTied, DURATION as H17StillTied_DURATION } from "./h17-still-tied/Video";
import { Video as T31VoiceNote, DURATION as T31VoiceNote_DURATION } from "./t31-voice-note/Video";
import { Video as T37YawnTest, DURATION as T37YawnTest_DURATION } from "./t37-yawn-test/Video";
import { Video as T36ForgotName, DURATION as T36ForgotName_DURATION } from "./t36-forgot-name/Video";
import { Video as T17FrozenClock, DURATION as T17FrozenClock_DURATION } from "./t17-frozen-clock/Video";
import { Video as T26NobodyLooked, DURATION as T26NobodyLooked_DURATION } from "./t26-nobody-looked/Video";
import { Video as T11CrossedFingers, DURATION as T11CrossedFingers_DURATION } from "./t11-crossed-fingers/Video";
import { Video as T32OtherLane, DURATION as T32OtherLane_DURATION } from "./t32-other-lane/Video";
import { Video as T01NeverSaw, DURATION as T01NeverSaw_DURATION } from "./t01-never-saw/Video";
import { Video as T35TipOfTongue, DURATION as T35TipOfTongue_DURATION } from "./t35-tip-of-tongue/Video";
import { Video as T38FallingJerk, DURATION as T38FallingJerk_DURATION } from "./t38-falling-jerk/Video";
import { Video as T34StuckSong, DURATION as T34StuckSong_DURATION } from "./t34-stuck-song/Video";
import { Video as T08CountF, DURATION as T08CountF_DURATION } from "./t08-count-f/Video";
import { Video as T02EyeHole, DURATION as T02EyeHole_DURATION } from "./t02-eye-hole/Video";
import { Video as T33WayHome, DURATION as T33WayHome_DURATION } from "./t33-way-home/Video";
import { Video as T15Birthday, DURATION as T15Birthday_DURATION } from "./t15-birthday/Video";
import { Video as R01GreatWall, DURATION as R01GreatWall_DURATION } from "./r01-great-wall/Video";
import { Video as R02Goldfish, DURATION as R02Goldfish_DURATION } from "./r02-goldfish/Video";
import { Video as R03Shaving, DURATION as R03Shaving_DURATION } from "./r03-shaving/Video";
import { Video as R04Lightning, DURATION as R04Lightning_DURATION } from "./r04-lightning/Video";
import { Video as R05SugarHyper, DURATION as R05SugarHyper_DURATION } from "./r05-sugar-hyper/Video";
import { Video as R06HeadHeat, DURATION as R06HeadHeat_DURATION } from "./r06-head-heat/Video";
import { Video as R18RicePhone, DURATION as R18RicePhone_DURATION } from "./r18-rice-phone/Video";
import { Video as R19FiveSecond, DURATION as R19FiveSecond_DURATION } from "./r19-five-second/Video";
import { Video as R20WashChicken, DURATION as R20WashChicken_DURATION } from "./r20-wash-chicken/Video";
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
      <Composition
        id="V101BatBall"
        component={V101BatBall}
        durationInFrames={V101BatBall_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.32, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="V025PaidToStay"
        component={V025PaidToStay}
        durationInFrames={V025PaidToStay_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.32, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="V102BlameTheDoor"
        component={V102BlameTheDoor}
        durationInFrames={V102BlameTheDoor_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.32, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="V026OnlyTwoLeft"
        component={V026OnlyTwoLeft}
        durationInFrames={V026OnlyTwoLeft_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.32, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="V103PhantomBuzz"
        component={V103PhantomBuzz}
        durationInFrames={V103PhantomBuzz_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.32, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="V021LossTwice"
        component={V021LossTwice}
        durationInFrames={V021LossTwice_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.24, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="V104WobblyShelf"
        component={V104WobblyShelf}
        durationInFrames={V104WobblyShelf_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.24, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="V018TypingDots"
        component={V018TypingDots}
        durationInFrames={V018TypingDots_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.24, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      <Composition id="Launch15" component={Launch15} durationInFrames={LAUNCH15_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ music: 0.9, sfx: 0.7 }} />
      <Composition id="LaunchKeynote" component={LaunchKeynote} durationInFrames={KEYNOTE_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ music: 0.95 }} />
      <Composition
        id="V105TickleYourself"
        component={V105TickleYourself}
        durationInFrames={V105TickleYourself_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.2, sfx: 0.6, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="V028LowBatteryFare"
        component={V028LowBatteryFare}
        durationInFrames={V028LowBatteryFare_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.2, sfx: 0.6, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="H20PhoneBrainDrain"
        component={H20PhoneBrainDrain}
        durationInFrames={H20PhoneBrainDrain_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.2, sfx: 0.6, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="V024PauseNoticed"
        component={V024PauseNoticed}
        durationInFrames={V024PauseNoticed_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.2, sfx: 0.6, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="V020ShameButton"
        component={V020ShameButton}
        durationInFrames={V020ShameButton_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.2, sfx: 0.6, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="V106YourName"
        component={V106YourName}
        durationInFrames={V106YourName_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.2, sfx: 0.6, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="H29MorningLight"
        component={H29MorningLight}
        durationInFrames={H29MorningLight_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.2, sfx: 0.6, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="V019SureButWrong"
        component={V019SureButWrong}
        durationInFrames={V019SureButWrong_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.2, sfx: 0.6, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="H05StandingStill"
        component={H05StandingStill}
        durationInFrames={H05StandingStill_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.2, sfx: 0.6, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="V023FailedGlue"
        component={V023FailedGlue}
        durationInFrames={V023FailedGlue_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.2, sfx: 0.6, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="H16PingCost"
        component={H16PingCost}
        durationInFrames={H16PingCost_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.2, sfx: 0.6, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="V029PickedForYou"
        component={V029PickedForYou}
        durationInFrames={V029PickedForYou_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.2, sfx: 0.6, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="H30EightGlasses"
        component={H30EightGlasses}
        durationInFrames={H30EightGlasses_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.2, sfx: 0.6, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="V030MeltedBar"
        component={V030MeltedBar}
        durationInFrames={V030MeltedBar_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.2, sfx: 0.6, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="H06FiftySteps"
        component={H06FiftySteps}
        durationInFrames={H06FiftySteps_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.2, sfx: 0.6, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="V032FirstNumber"
        component={V032FirstNumber}
        durationInFrames={V032FirstNumber_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.24, sfx: 0.65, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="H17StillTied"
        component={H17StillTied}
        durationInFrames={H17StillTied_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.22, sfx: 0.65, voice: "voice.wav", captions: false }}
      />
      <Composition id="DoodleDemo" component={DoodleDemo} durationInFrames={60} fps={30} width={1080} height={1920} />
      <Composition
        id="T31VoiceNote"
        component={T31VoiceNote}
        durationInFrames={T31VoiceNote_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.32, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="T37YawnTest"
        component={T37YawnTest}
        durationInFrames={T37YawnTest_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.3, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="T36ForgotName"
        component={T36ForgotName}
        durationInFrames={T36ForgotName_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.3, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="T17FrozenClock"
        component={T17FrozenClock}
        durationInFrames={T17FrozenClock_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.3, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="T26NobodyLooked"
        component={T26NobodyLooked}
        durationInFrames={T26NobodyLooked_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.3, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="T11CrossedFingers"
        component={T11CrossedFingers}
        durationInFrames={T11CrossedFingers_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.3, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="T32OtherLane"
        component={T32OtherLane}
        durationInFrames={T32OtherLane_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.3, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="T01NeverSaw"
        component={T01NeverSaw}
        durationInFrames={T01NeverSaw_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.3, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="T35TipOfTongue"
        component={T35TipOfTongue}
        durationInFrames={T35TipOfTongue_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.3, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="T38FallingJerk"
        component={T38FallingJerk}
        durationInFrames={T38FallingJerk_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.3, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="T34StuckSong"
        component={T34StuckSong}
        durationInFrames={T34StuckSong_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.3, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="T08CountF"
        component={T08CountF}
        durationInFrames={T08CountF_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.3, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="T02EyeHole"
        component={T02EyeHole}
        durationInFrames={T02EyeHole_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.3, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="T33WayHome"
        component={T33WayHome}
        durationInFrames={T33WayHome_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.32, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      <Composition
        id="T15Birthday"
        component={T15Birthday}
        durationInFrames={T15Birthday_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ music: 0.32, sfx: 0.7, voice: "voice.wav", captions: false }}
      />
      <Composition id="R01GreatWall" component={R01GreatWall} durationInFrames={R01GreatWall_DURATION} fps={30} width={1080} height={1920} />
      <Composition id="R02Goldfish" component={R02Goldfish} durationInFrames={R02Goldfish_DURATION} fps={30} width={1080} height={1920} />
      <Composition id="R03Shaving" component={R03Shaving} durationInFrames={R03Shaving_DURATION} fps={30} width={1080} height={1920} />
      <Composition id="R04Lightning" component={R04Lightning} durationInFrames={R04Lightning_DURATION} fps={30} width={1080} height={1920} />
      <Composition id="R05SugarHyper" component={R05SugarHyper} durationInFrames={R05SugarHyper_DURATION} fps={30} width={1080} height={1920} />
      <Composition id="R06HeadHeat" component={R06HeadHeat} durationInFrames={R06HeadHeat_DURATION} fps={30} width={1080} height={1920} />
      <Composition id="R18RicePhone" component={R18RicePhone} durationInFrames={R18RicePhone_DURATION} fps={30} width={1080} height={1920} />
      <Composition id="R19FiveSecond" component={R19FiveSecond} durationInFrames={R19FiveSecond_DURATION} fps={30} width={1080} height={1920} />
      <Composition id="R20WashChicken" component={R20WashChicken} durationInFrames={R20WashChicken_DURATION} fps={30} width={1080} height={1920} />
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
