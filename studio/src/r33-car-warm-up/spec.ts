import type { RealSpec } from "../shared/realcheck";
// R33 · Do you need to warm up your car? Real Check #33, Arm A (Spark reactor). Plan v5.1 (7 lines), bridge TTS row.
// Facts: facts.md (US DOE "Consumer Guide to Reducing Vehicle Idling" DOE/EE-2530, Dec 2021; US DOE AFDC "Idling Personal
// Vehicles"; Natural Resources Canada AutoSmart fact sheet 3; read 18 Nov 2026).
// Photos live in Drive: Photo library / "R33 · Do you need to warm up your car? — photos" (doc 1QBDEJcqScWuhODmuO6k7XNhLDkHUg2YC4AA6TSpelkw);
// pull them with tools/drive_photos.py (PIPELINE_V5.md §3). Licences + sources: photos.json.
export const SPEC: RealSpec = {
  id: "R33",
  slug: "r33-car-warm-up",
  n: 33,
  bg: "#1b4965",
  accent: "#ff9f1c",
  overlay: "WARM UP FIRST?",
  spark: true,
  photos: [
    { file: "jam.jpg", credit: "Slaunger, CC BY-SA 4.0 (Wikimedia Commons)", focus: [0.6, 0.45], zoom: [1.0, 1.08] },
    { file: "snow-traffic.jpg", credit: "pfly, CC BY-SA 2.0 (Flickr)", focus: [0.55, 0.5], zoom: [1.0, 1.06] },
    { file: "scrape.jpg", credit: "freestocks.org, CC0 (Flickr)", focus: [0.55, 0.45], zoom: [1.0, 1.06] },
    { file: "jam.jpg", credit: "Slaunger, CC BY-SA 4.0 (Wikimedia Commons)", focus: [0.75, 0.6], zoom: [1.15, 1.22] },
  ],
  beats: [
    { show: { photo: 0 }, mood: "curious", gesture: "thinkChin" }, // Cold car? Before you drive, must it warm up?
    { show: { card: "30 SECONDS", sub: "THEN DRIVE OFF GENTLY · US DOE" }, mood: "shock", gesture: "present" }, // Most carmakers say thirty seconds, even in winter.
    { show: { photo: 1 }, tag: "WARMS FASTER", mood: "neutral", gesture: "pointSide" }, // Driving warms the engine faster than idling.
    { show: { card: "10 MIN IDLING", sub: "BURNS 0.25–0.5 L OF FUEL · NRCAN" }, mood: "shock", gesture: "recoil" }, // Ten idle minutes can burn half a litre.
    { show: { photo: 3 }, mood: "smug", gesture: "handsHips" }, // A long warm up? Myth!
    { show: { photo: 2 }, tag: "GO GENTLY", mood: "neutral", gesture: "pointDown" }, // Just drive gently for the first few minutes.
    { show: { photo: 0 }, mood: "wink", gesture: "doublePoint" }, // How long does your car idle each morning?
  ],
  verdict: "MYTH",
  verdictAt: [4, 4],
  hi: ["warm", "thirty", "faster", "half", "Myth!", "gently", "idle"],
};
