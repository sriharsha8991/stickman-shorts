import type { RealSpec } from "../shared/realcheck";
// R02 · Do goldfish really forget in three seconds? Real Check #2, Arm B (no Spark).
// Facts: facts.md (Gee, Stephenson & Wright 1994, J Exp Anal Behav 62:1-13, doi 10.1901/jeab.1994.62-1). Photos: photos.json.
// Photos live in Drive: Photo library / "R02 · Goldfish memory — photos" (doc 1wah5d7gJRqTQ4nAn6Sm1oVOfAVBxbXQiGkBSe8cQKew);
// pull them with tools/drive_photos.py (PIPELINE_V5.md §3). Licences + sources: photos.json.
export const SPEC: RealSpec = {
  id: "R02",
  slug: "r02-goldfish",
  n: 2,
  bg: "#0b8a8f",
  accent: "#ff7a1a",
  overlay: "3-SECOND MEMORY?",
  spark: false,
  photos: [
    { file: "bowl.jpg", credit: "katerha, CC BY 2.0 (Flickr)", focus: [0.4, 0.55] },
    { file: "gravel.jpg", credit: "alicegop, CC BY 2.0 (Flickr)", focus: [0.75, 0.75] },
    { file: "clock.jpg", credit: "alexkerhead, CC BY 2.0 (Flickr)", focus: [0.62, 0.45] },
    { file: "close.jpg", credit: "Melody Ayres-Griffiths, CC BY 2.0 (Flickr)", focus: [0.62, 0.5] },
    { file: "close.jpg", credit: "Melody Ayres-Griffiths, CC BY 2.0 (Flickr)", focus: [0.82, 0.55], zoom: [1.2, 1.6] },
  ],
  beats: [
    { show: { photo: 0 } }, // Does your goldfish forget you, before you even turn around?
    { show: { card: "“Only three seconds of memory!”", sub: "jokes, cartoons and memes" } },
    { show: { photo: 1 }, tag: "TESTED" }, // But in a lab, goldfish learned to press a lever.
    { show: { photo: 2 }, tag: "ONE HOUR" }, // The lever gave food, for one hour, each day.
    { show: { card: "THEY LEARNED THE HOUR", sub: "goldfish lever study, Plymouth, 1994" } },
    { show: { photo: 3 } }, // So the three second memory is a myth!
    { show: { photo: 4 }, tag: "A WHOLE DAY" },
    { show: { photo: 0 } }, // What animal myth did you grow up with?
  ],
  verdict: "MYTH",
  verdictAt: [5, 7],
  hi: ["goldfish", "three", "lever.", "hour,", "myth!", "day.", "grow"],
};
