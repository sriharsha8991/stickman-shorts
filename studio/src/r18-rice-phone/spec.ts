import type { RealSpec } from "../shared/realcheck";
// R18 · Does a bag of rice really dry a wet phone? Real Check #18, Arm B (no Spark). Plan v5.1 (7 lines), bridge TTS row.
// Facts: facts.md (Gazelle 2014 drying test; Apple Support liquid-detection guidance, Feb 2024; iFixit).
// Photos live in Drive: Photo library / "R18 · Rice and a wet phone — photos" (doc 1SQAybZhsjw3Z217xq-SWCV2qBGYHTLbBv4EpByPYK2s);
// pull them with tools/drive_photos.py (PIPELINE_V5.md §3). Licences + sources: photos.json.
// phone.jpg has a carrier SIM card with a logo at the far right: focus left + zoom keeps it out of frame.
export const SPEC: RealSpec = {
  id: "R18",
  slug: "r18-rice-phone",
  n: 18,
  bg: "#8a5a00",
  accent: "#9be7ff",
  overlay: "RICE SAVES PHONES?",
  spark: false,
  photos: [
    { file: "phone.jpg", credit: "Mark Ou, CC BY-SA 2.0 (Wikimedia Commons)", focus: [0, 0.3], zoom: [1.2, 1.28] },
    { file: "sponges.jpg", credit: "Horia Varlan, CC BY 2.0 (Flickr)", focus: [0.45, 0.5], zoom: [1.0, 1.1] },
    { file: "rice.jpg", credit: "jlastras, CC BY 2.0 (Flickr)", focus: [0.5, 0.55], zoom: [1.0, 1.1] },
    { file: "phone.jpg", credit: "Mark Ou, CC BY-SA 2.0 (Wikimedia Commons)", focus: [0, 0.45], zoom: [1.45, 1.6] },
  ],
  beats: [
    { show: { photo: 0 } }, // Wet phone? Before you grab the rice, does it work?
    { show: { photo: 1 }, tag: "7 MATERIALS" }, // A test dried wet sponges in seven materials.
    { show: { photo: 2 }, tag: "LAST PLACE" }, // Raw rice soaked up the least water.
    { show: { card: "“Don't put your iPhone in a bag of rice.”", sub: "APPLE SUPPORT, 2024" } }, // Apple says rice bits can harm your phone.
    { show: { photo: 3 } }, // Rice drying your phone? A myth!
    { show: { split: [{ label: "RICE", photo: 2 }, { label: "OPEN AIR", text: "BETTER" }] } }, // Open air did better, so tap out water and wait.
    { show: { photo: 0 } }, // What did your phone fall into?
  ],
  verdict: "MYTH",
  verdictAt: [4, 5],
  hi: ["rice,", "seven", "least", "harm", "myth!", "better,", "into?"],
};
