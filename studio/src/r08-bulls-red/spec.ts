import type { RealSpec } from "../shared/realcheck";
// R08 · Do bulls really hate the colour red? Real Check #8, Arm A (Spark reactor). Plan v5.1, OWNER VOICE.
// Prepared 2026-11-12 ahead of the recording: voice.ts / timeline come from tools/owner_voice.py once R08 is in
// Drive › Stickman Shorts › Voice. Then add Video.tsx (copy r06) and register in Root.tsx.
// Facts: facts.md (Jacobs, Deegan & Neitz 1998 Vis Neurosci 15:581-584; MythBusters "Red Rag to a Bull", 2007).
// Photos live in Drive: Photo library / "R08 · Bulls and red — photos" (doc 1-kOf5GxXgbi4VSdDyOBrrjvSzuQpIKDEHFAFGrcL5sk).
export const SPEC: RealSpec = {
  id: "R08",
  slug: "r08-bulls-red",
  n: 8,
  bg: "#1446a0",
  accent: "#c6f68d",
  overlay: "BULLS HATE RED?",
  spark: true,
  photos: [
    // fence wire crosses the face: keep the head centred, sky above stays behind the overlay
    { file: "bull.jpg", credit: "Just chaos, CC BY 2.0 (Flickr)", focus: [0.64, 0.5], zoom: [1.05, 1.14] },
    { file: "eye.jpg", credit: "BotheredByBees, CC BY 2.0 (Flickr)", focus: [0.47, 0.55], zoom: [1.0, 1.1] },
    // framed on the flag only: the marshal (left) and the cap logo stay out of frame (focus x >= 0.68, zoom >= 1.15)
    { file: "redflag.jpg", credit: "Karting Nord, CC BY-SA 2.0 (Flickr)", focus: [0.7, 0.62], zoom: [1.18, 1.25] },
    { file: "field.jpg", credit: "4nitsirk, CC BY-SA 2.0 (Flickr)", focus: [0.35, 0.45], zoom: [1.0, 1.08] },
  ],
  beats: [
    { show: { photo: 0 }, mood: "curious", gesture: "thinkChin" }, // Do bulls really hate the colour red?
    { show: { split: [{ label: "PEOPLE", text: "3 CELLS" }, { label: "CATTLE", text: "2 CELLS" }] }, mood: "shock", gesture: "present" }, // Cattle have only two kinds of colour cells, not three.
    { show: { photo: 1 }, tag: "RED DOESN'T POP", mood: "curious", gesture: "pointSide" }, // So red does not stand out to a bull.
    { show: { photo: 2 }, tag: "TV TEST: STILL RED", mood: "neutral", gesture: "pointSide" }, // In a TV test, a bull ignored a still red flag.
    { show: { photo: 3 }, tag: "CHASED: MOVING BLUE", mood: "smug", gesture: "handsHips" }, // It chased a moving blue flag instead. So, a myth!
    { show: { card: "MOVEMENT", sub: "NOT COLOUR, STARTS THE CHARGE" }, mood: "happy", gesture: "pointDown" }, // The bull charges at movement, not at colour.
    { show: { photo: 0 }, mood: "wink", gesture: "doublePoint" }, // Which animal fact did you believe as a child?
  ],
  verdict: "MYTH",
  verdictAt: [4, 9],
  hi: ["red?", "two", "stand", "still", "myth!", "movement,", "child?"],
};
