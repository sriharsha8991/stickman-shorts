import type { RealSpec } from "../shared/realcheck";
// R32 · Does MSG give you headaches? Real Check #32, Arm B (no Spark). Plan v5.1 (7 lines), bridge TTS row.
// Facts: facts.md (US FDA "Questions and Answers on Monosodium glutamate (MSG)"; Geha et al. 2000, J Nutr 130(4S):1058S;
// Obayashi & Nagamura 2016, J Headache Pain 17:54; read 18 Nov 2026). Education, not medical advice.
// Photos live in Drive: Photo library / "R32 · Does MSG give you headaches? — photos" (doc 1YAO67JTGkXXEPFSw3_o8jtOXDC6Gifst0qVMKhPHjTM);
// pull them with tools/drive_photos.py (PIPELINE_V5.md §3). Licences + sources: photos.json.
export const SPEC: RealSpec = {
  id: "R32",
  slug: "r32-msg-headache",
  n: 32,
  bg: "#b5179e",
  accent: "#caffbf",
  overlay: "MSG = HEADACHE?",
  spark: false,
  photos: [
    { file: "msg.jpg", credit: "Ragesoss, CC BY-SA 3.0 (Wikimedia Commons)", focus: [0.47, 0.55], zoom: [1.0, 1.08] },
    { file: "rice.jpg", credit: "fakelvis, CC BY-SA 2.0 (Flickr)", focus: [0.45, 0.55], zoom: [1.0, 1.06] },
    { file: "tomatoes.jpg", credit: "thomasbrightbill, CC BY 2.0 (Flickr)", focus: [0.4, 0.5], zoom: [1.0, 1.06] },
    { file: "cheese.jpg", credit: "Amin, CC BY-SA 4.0 (Wikimedia Commons)", focus: [0.68, 0.55], zoom: [1.0, 1.06] },
    { file: "msg.jpg", credit: "Ragesoss, CC BY-SA 3.0 (Wikimedia Commons)", focus: [0.45, 0.5], zoom: [1.12, 1.2] },
    { file: "noodles.jpg", credit: "-JvL-, CC BY 2.0 (Flickr)", focus: [0.5, 0.5], zoom: [1.0, 1.06] },
  ],
  beats: [
    { show: { photo: 0 }, mood: "curious", gesture: "thinkChin" }, // Skipping MSG? Before you do, does it cause headaches?
    { show: { photo: 1 }, tag: "BLIND TESTS", mood: "neutral", gesture: "pointSide" }, // Blind tests with meals found no extra headaches.
    { show: { card: "130 PEOPLE", sub: "WHO BLAMED MSG · REACTIONS DID NOT REPEAT" }, mood: "shock", gesture: "present" }, // Retests did not repeat the few reactions.
    { show: { split: [{ label: "TOMATOES", photo: 2 }, { label: "CHEESE", photo: 3 }] }, tag: "GLUTAMATE", mood: "shock", gesture: "recoil" }, // Tomatoes and cheese have it too.
    { show: { photo: 4 }, mood: "smug", gesture: "handsHips" }, // MSG gives you headaches? Myth!
    { show: { card: "3 g+ WITH NO FOOD", sub: "A SERVING HAS UNDER 0.5 g · FDA" }, mood: "neutral", gesture: "pointDown" }, // Only big doses with no food bothered a few people.
    { show: { photo: 0 }, mood: "wink", gesture: "doublePoint" }, // Have you ever blamed MSG for a headache?
  ],
  verdict: "MYTH",
  verdictAt: [4, 4],
  hi: ["headaches?", "Blind", "Retests", "Tomatoes", "Myth!", "big", "blamed"],
};
