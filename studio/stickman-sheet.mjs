// Contact sheet: renders a few frames of a composition (one bundle) and tiles them into one PNG,
// so you can check layout, overlaps and poses without rendering the whole video.
//
// usage (from the project root):
//   node stickman-sheet.mjs <CompositionId> <out.png> <frames...>
// frames: single numbers (120) or ranges with a step (300-600:60)
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const [id, out, ...spec] = process.argv.slice(2);
if (!id || !out || spec.length === 0) {
  console.error("usage: node stickman-sheet.mjs <CompositionId> <out.png> <frame|a-b:step> ...");
  process.exit(1);
}
const frames = spec.flatMap((s) => {
  const m = s.match(/^(\d+)-(\d+)(?::(\d+))?$/);
  if (!m) return [Number(s)];
  const [a, b, st] = [Number(m[1]), Number(m[2]), Number(m[3] ?? 30)];
  const r = [];
  for (let f = a; f <= b; f += st) r.push(f);
  return r;
});

// reuse the project's Tailwind override if it has one, otherwise bundle as-is
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const deps = { ...pkg.dependencies, ...pkg.devDependencies };
let webpackOverride = (c) => c;
for (const name of ["@remotion/tailwind-v4", "@remotion/tailwind"]) {
  if (deps[name]) {
    const mod = await import(name);
    webpackOverride = mod.enableTailwind;
    break;
  }
}

// Optional local Chromium (set REMOTION_BROWSER, e.g. in cloud workspaces without remotion.media access)
const browserOpts = process.env.REMOTION_BROWSER
  ? { browserExecutable: process.env.REMOTION_BROWSER, chromeMode: "chrome-for-testing" }
  : {};
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), webpackOverride });
const composition = await selectComposition({ serveUrl, id, ...browserOpts });
const dir = path.resolve(path.dirname(out), "_frames");
fs.mkdirSync(dir, { recursive: true });
const files = [];
for (const fr of frames) {
  if (fr >= composition.durationInFrames) continue;
  const o = path.join(dir, `f${String(fr).padStart(5, "0")}.png`);
  await renderStill({ composition, serveUrl, output: o, frame: fr, scale: 0.5, ...browserOpts });
  files.push(o);
}

try {
  execFileSync(
    "python",
    [
      "-c",
      `
import sys
from PIL import Image, ImageDraw
out, fs = sys.argv[1], sys.argv[2:]
ims = [Image.open(x).convert('RGB') for x in fs]
w, h = ims[0].size
cols = 2
W = Image.new('RGB', (w * cols, h * ((len(ims) + cols - 1) // cols)), 'white')
for k, im in enumerate(ims):
    x, y = (k % cols) * w, (k // cols) * h
    W.paste(im, (x, y))
    ImageDraw.Draw(W).text((x + 8, y + 8), 'frame ' + fs[k].split('f')[-1].split('.')[0].lstrip('0'), fill='red')
W.save(out)
`,
      out,
      ...files,
    ],
    { stdio: "inherit" },
  );
  console.log("contact sheet:", out);
} catch {
  console.log("Pillow not available (pip install pillow); single frames are in", dir);
}
