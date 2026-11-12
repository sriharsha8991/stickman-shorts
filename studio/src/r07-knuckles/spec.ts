import type { RealSpec } from "../shared/realcheck";
// R07 · Does cracking your knuckles cause arthritis? Real Check #7, Arm B (no Spark). Plan v5.1, OWNER VOICE.
// Prepared 2026-11-12 ahead of the recording: voice.ts / timeline come from tools/owner_voice.py once R07 is in
// Drive › Stickman Shorts › Voice. Then add Video.tsx (copy r06) and register in Root.tsx.
// Facts: facts.md (deWeber 2011 JABFM; Unger 1998 + Ig Nobel 2009; Kawchuk 2015 PLOS ONE).
// Photos live in Drive: Photo library / "R07 · Knuckle cracking — photos" (doc 1LXlyXc0TlXB5tWiGkqWpViaSpc1SnEUm1RkpU8ppS_s).
export const SPEC: RealSpec = {
  id: "R07",
  slug: "r07-knuckles",
  n: 7,
  bg: "#1d5c3a",
  accent: "#ffa6c9",
  overlay: "CRACK = ARTHRITIS?",
  spark: false,
  photos: [
    // crop to the hands: the chin at the top of the frame stays out (focus low, zoom >= 1.15)
    { file: "crack.jpg", credit: "orijinal, CC BY 2.0 (Flickr)", focus: [0.62, 0.72], zoom: [1.18, 1.26] },
    { file: "xray.jpg", credit: "OpenStax College, CC BY 3.0 (Wikimedia Commons)", focus: [0.56, 0.5], zoom: [1.05, 1.15] },
    { file: "oldhands.jpg", credit: "CS Sharada Prasad, CC BY 2.0 (Flickr)", focus: [0.62, 0.45], zoom: [1.0, 1.08] },
    { file: "twohands.jpg", credit: "Lee J Haywood, CC BY-SA 2.0 (Flickr)", focus: [0.5, 0.5], zoom: [1.0, 1.1] },
  ],
  beats: [
    { show: { photo: 0 }, mood: "curious", gesture: "thinkChin" }, // Does cracking your knuckles give you arthritis?
    { show: { photo: 1 }, tag: "215 ADULTS", mood: "neutral", gesture: "pointSide" }, // Doctors X-rayed the hands of 215 older adults.
    { show: { split: [{ label: "CRACKERS", text: "18%" }, { label: "NON-CRACKERS", text: "22%" }] }, mood: "shock", gesture: "present" }, // Crackers and non-crackers had arthritis at about the same rate.
    { show: { photo: 2 }, tag: "60 YEARS", mood: "curious", gesture: "pointSide" }, // One doctor cracked only one hand for sixty years.
    { show: { photo: 3 }, mood: "smug", gesture: "handsHips" }, // Neither hand got arthritis. So far, it is a myth!
    { show: { card: "POP", sub: "A GAS BUBBLE FORMING IN THE JOINT" }, mood: "happy", gesture: "pointDown" }, // The pop is just a gas bubble forming in the joint.
    { show: { photo: 0 }, mood: "wink", gesture: "doublePoint" }, // Do you crack your knuckles too?
  ],
  verdict: "MYTH",
  verdictAt: [4, 8],
  hi: ["arthritis?", "215", "same", "sixty", "myth!", "bubble", "too?"],
};
