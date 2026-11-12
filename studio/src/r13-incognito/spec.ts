import type { RealSpec } from "../shared/realcheck";
// R13 · Does incognito mode really hide what you browse? Real Check #13, Arm A (Spark reactor). Plan v5.1, OWNER VOICE.
// Prepared 2026-11-12 ahead of the recording: voice.ts / timeline come from tools/owner_voice.py once R13 is in
// Drive › Stickman Shorts › Voice. Then add Video.tsx (copy r06) and register in Root.tsx.
// Facts: facts.md (Google Chrome Help, answers 95464 and 9845881, read 2026-11-12).
// Photos live in Drive: Photo library / "R13 · Incognito mode — photos" (doc 1RSVx0D3V9DfKGZdXAehtrukHHF_Sw9f-r8Mn_dB9nm0).
// No browser logo or real browser screen on screen: the notice is a plain text card.
export const SPEC: RealSpec = {
  id: "R13",
  slug: "r13-incognito",
  n: 13,
  bg: "#1b1f24",
  accent: "#39e88b",
  overlay: "INCOGNITO = HIDDEN?",
  spark: true,
  photos: [
    { file: "keys.jpg", credit: "Remko van Dokkum, CC BY 2.0 (Flickr)", focus: [0.5, 0.5], zoom: [1.05, 1.15] },
    // a person stands at the far left edge, out of focus: keep focus right so he stays out of frame
    { file: "servers.jpg", credit: "bugeaters, CC BY 2.0 (Flickr)", focus: [0.66, 0.4], zoom: [1.1, 1.18] },
    { file: "network.jpg", credit: "andrewfhart, CC BY-SA 2.0 (Flickr)", focus: [0.5, 0.5], zoom: [1.0, 1.1] },
    { file: "keys2.jpg", credit: "Patrick Hoesly, CC BY 2.0 (Flickr)", focus: [0.5, 0.55], zoom: [1.05, 1.12] },
  ],
  beats: [
    { show: { photo: 0 }, mood: "curious", gesture: "thinkChin" }, // Does incognito mode really hide what you browse?
    { show: { card: "HISTORY NOT SAVED", sub: "ON YOUR OWN DEVICE. THAT'S ALL." }, mood: "neutral", gesture: "present" }, // It only stops your own browser from saving history.
    { show: { photo: 1 }, tag: "WEBSITES SEE YOU", mood: "shock", gesture: "pointSide" }, // The websites you visit can still see you.
    { show: { photo: 2 }, tag: "OFFICE + PROVIDER", mood: "curious", gesture: "pointSide" }, // So can your office network and your internet provider.
    { show: { photo: 3 }, tag: "CHROME'S OWN WORDS", mood: "smug", gesture: "handsHips" }, // Chrome itself tells you this. So "hidden" is a myth!
    { show: { card: "IT HIDES IT FROM", sub: "PEOPLE WHO SHARE YOUR DEVICE" }, mood: "happy", gesture: "pointDown" }, // It hides your history from people who share your device.
    { show: { photo: 0 }, mood: "wink", gesture: "doublePoint" }, // Did you think incognito made you invisible?
  ],
  verdict: "MYTH",
  verdictAt: [4, 9],
  hi: ["incognito", "only", "websites", "office", "myth!", "share", "invisible?"],
};
