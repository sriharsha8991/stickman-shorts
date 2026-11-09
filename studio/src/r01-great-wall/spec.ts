import type { RealSpec } from "../shared/realcheck";
// R01 · Can you see the Great Wall of China from space? Real Check #1, Arm A (Spark as reactor).
// Facts: facts.md (NASA 2005 "China's Wall Less Great in View from Space"; Scientific American). Photos: photos.json.
// The four photo files are PLACEHOLDERS until tools/fetch_photo.py (or the Drive photo inbox) supplies the real ones.
export const SPEC: RealSpec = {
  id: "R01",
  slug: "r01-great-wall",
  n: 1,
  bg: "#ffd23f",
  accent: "#e0352b",
  overlay: "SEEN FROM SPACE?",
  spark: true,
  photos: [
    { file: "wall.jpg", credit: "PLACEHOLDER (Wikimedia Commons)", focus: [0.5, 0.45] },
    { file: "orbit.jpg", credit: "PLACEHOLDER (NASA, public domain)" },
    { file: "blend.jpg", credit: "PLACEHOLDER (Wikimedia Commons)" },
    { file: "chiao.jpg", credit: "PLACEHOLDER (NASA, public domain)", zoom: [1.0, 1.15] },
  ],
  beats: [
    { show: { photo: 0 }, mood: "smug", gesture: "pointUp" }, // Can you see the Great Wall of China from space?
    { show: { card: "“The only thing you can see from space!”", sub: "quiz books and classrooms" }, mood: "happy", gesture: "doublePoint" },
    { show: { photo: 0 }, tag: "ENORMOUS", mood: "excited", gesture: "shrugBig" },
    { show: { photo: 1 }, tag: "LOOKING…", mood: "curious", gesture: "thinkChin" },
    { show: { card: "COULD NOT FIND IT", sub: "China's first astronaut, 2003" }, mood: "worried", gesture: "recoil" },
    { show: { split: [{ label: "YOU PICTURE", text: "A BRIGHT LINE" }, { label: "REAL", photo: 2 }] }, mood: "thinking", gesture: "thinkChin" },
    { show: { photo: 1 }, mood: "mindblown", gesture: "mindBlown" }, // So with your eyes alone, it is a myth!
    { show: { photo: 3 }, tag: "LONG LENS", mood: "curious", gesture: "pointSide" },
    { mood: "wink", gesture: "doublePoint" }, // Which fact did you believe for years?
  ],
  verdict: "MYTH",
  verdictAt: [6, 8],
  hi: ["Great", "Wall", "space?", "astronauts", "colour", "myth!", "camera,", "years?"],
};
