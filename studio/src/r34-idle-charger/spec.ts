import type { RealSpec } from "../shared/realcheck";
// R34 · Empty charger? Before you unplug it, is it costing you? Real Check #34, Arm B (no Spark). Plan v5.1 (7 lines), bridge TTS row.
// Facts: facts.md (Commission Regulation (EU) 2019/1782 Annex II 1(a): no-load ≤ 0.10 W for AC-DC chargers ≤ 49 W from 1 Apr 2020;
// US DOE external power supply standard (10 CFR 430.32(w)): ≤ 0.100 W no-load; Regulation (EC) 278/2009: 0.50 W then 0.3 W; read 18 Nov 2026).
// Photos live in Drive: Photo library / "R34 · Empty charger in the socket — photos" (doc 1MyNsdynw6-QDd61W4Sbk49Mc898dmq29QORTSvBtNF0);
// pull them with tools/drive_photos.py (PIPELINE_V5.md §3). Licences + sources: photos.json.
export const SPEC: RealSpec = {
  id: "R34",
  slug: "r34-idle-charger",
  n: 34,
  bg: "#264653",
  accent: "#e9c46a",
  overlay: "EMPTY CHARGER = BILL?",
  spark: false,
  photos: [
    { file: "socket.jpg", credit: "Markus Spiske, CC0 (StockSnap)", focus: [0.66, 0.5], zoom: [1.0, 1.08] },
    { file: "charger.jpg", credit: "the-unwinder, CC BY-SA 2.0 (Flickr)", focus: [0.4, 0.5], zoom: [1.0, 1.06] },
    { file: "bulb.jpg", credit: "kalleboo, CC BY 2.0 (Flickr)", focus: [0.5, 0.45], zoom: [1.0, 1.06] },
    { file: "socket.jpg", credit: "Markus Spiske, CC0 (StockSnap)", focus: [0.66, 0.55], zoom: [1.15, 1.22] },
  ],
  beats: [
    { show: { photo: 0 }, mood: "curious", gesture: "thinkChin" }, // Empty charger? Before you unplug it, is it costing you?
    { show: { photo: 1 }, tag: "0.1 W MAX", mood: "neutral", gesture: "pointSide" }, // Rules cap idle chargers at a tenth of a watt.
    { show: { card: "UNDER 1 UNIT", sub: "0.1 W ALL YEAR = 0.88 kWh · 1 UNIT = 1 kWh" }, mood: "shock", gesture: "present" }, // That is under one unit a year.
    { show: { photo: 2 }, tag: "9 W · 4 DAYS", mood: "shock", gesture: "recoil" }, // An LED bulb uses that in four days.
    { show: { photo: 3 }, mood: "smug", gesture: "handsHips" }, // Is it costing you? Myth!
    { show: { card: "OLDER CHARGERS", sub: "EU LIMIT WAS 0.5 W IN 2010 · NONE BEFORE" }, mood: "neutral", gesture: "pointDown" }, // Older chargers draw more; unplug warm ones.
    { show: { photo: 0 }, mood: "wink", gesture: "doublePoint" }, // What do you unplug every night?
  ],
  verdict: "MYTH",
  verdictAt: [4, 4],
  hi: ["charger?", "tenth", "unit", "LED", "Myth!", "Older", "unplug"],
};
