import type { RealSpec } from "../shared/realcheck";
// R01 · Can you see the Great Wall of China from space? Real Check #1, Arm A (Spark as reactor).
// Facts: facts.md (NASA 2005 "China's Wall Less Great in View from Space"; Scientific American). Photos: photos.json.
// Photos live in Drive: Photo library / "R01 · Great Wall — photos" (doc 1W6JIjBucvmPg3Bh6iBPl0ECnOHRyL4YzTi9OtEK1jcw);
// pull them with tools/drive_photos.py (PIPELINE_V5.md §3). Licences + sources: photos.json.
export const SPEC: RealSpec = {
  id: "R01",
  slug: "r01-great-wall",
  n: 1,
  bg: "#ffd23f",
  accent: "#e0352b",
  overlay: "SEEN FROM SPACE?",
  spark: true,
  photos: [
    { file: "wall.jpg", credit: "Keith Roper, CC BY 2.0 (Flickr)", focus: [0.5, 0.5] },
    { file: "dusk.jpg", credit: "matt512, CC BY 2.0 (Flickr)", focus: [0.5, 0.55] },
    { file: "limb.jpg", credit: "NASA, public domain", focus: [0.5, 0.5] },
    { file: "chiao.jpg", credit: "NASA (ISS010-E-08497), public domain" },
    { file: "chiao.jpg", credit: "NASA (ISS010-E-08497), public domain", focus: [0.5, 0.56], zoom: [1.25, 2.1] },
  ],
  beats: [
    { show: { photo: 0 }, mood: "smug", gesture: "pointUp" }, // Can you see the Great Wall of China from space?
    { show: { card: "“The only thing you can see from space!”", sub: "quiz books and classrooms" }, mood: "happy", gesture: "doublePoint" },
    { show: { photo: 1 }, tag: "ENORMOUS", mood: "excited", gesture: "shrugBig" },
    { show: { photo: 2 }, tag: "LOOKING…", mood: "curious", gesture: "thinkChin" },
    { show: { card: "COULD NOT FIND IT", sub: "China's first astronaut, 2003" }, mood: "worried", gesture: "recoil" },
    { show: { split: [{ label: "YOU PICTURE", text: "A BRIGHT LINE" }, { label: "FROM ORBIT", photo: 3 }] }, mood: "thinking", gesture: "thinkChin" },
    { show: { photo: 3 }, mood: "mindblown", gesture: "mindBlown" }, // So with your eyes alone, it is a myth!
    { show: { photo: 4 }, tag: "LONG LENS", mood: "curious", gesture: "pointSide" },
    { mood: "wink", gesture: "doublePoint" }, // Which fact did you believe for years?
  ],
  verdict: "MYTH",
  verdictAt: [6, 8],
  hi: ["Great", "Wall", "space?", "astronauts", "colour", "myth!", "camera,", "years?"],
};
