#!/usr/bin/env python3
"""Pull a Short's photos out of its Drive photo-library doc (Plan v5: Drive is where the photos live; owner, 2026-11-09).

The library: Drive folder "Stickman Shorts / Photo library" (id 14pOfC1HSmKun60-zaF9ztKsKKnDfJXSe), one Google Doc per
Short, "<ID> · <topic> — photos". Each photo is a `## <file>.jpg — <use>` heading, the image, then a credit line.
Google stores the images inside the doc at full size.

Making a library doc (no image bytes pass through the model): Drive create_file with contentMimeType text/markdown and
parent 14pOfC1HSmKun60-zaF9ztKsKKnDfJXSe, the text holding `## wall.jpg — hook` + `![wall.jpg](<direct image URL>)` +
`<title> · <author> · <licence> · <source page>` per photo (URLs and licences from tools/fetch_photo.py --list).

Using it: Drive download_file_content(fileId=<doc id>, exportMimeType="text/html"). The tool result is saved to a JSON file
when large (the path is printed in the result); pass that path here:

  python3 tools/drive_photos.py --slug r01-great-wall --export <saved-result.json or .html>

Writes studio/public/<slug>/photos/<file>.jpg for every heading and checks that every heading had an image.
"""
import argparse
import base64
import html as htmllib
import io
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def load_html(p: Path) -> str:
    raw = p.read_text(errors="ignore")
    if raw.lstrip().startswith("{"):
        d = json.loads(raw)
        c = d.get("content", "")
        try:
            return base64.b64decode(c).decode("utf8", "ignore")
        except Exception:  # noqa: BLE001
            return c
    return raw


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--slug", required=True)
    ap.add_argument("--export", required=True, help="the saved download_file_content result (JSON) or an .html export")
    a = ap.parse_args()
    html = load_html(Path(a.export))
    out = ROOT / "studio" / "public" / a.slug / "photos"
    out.mkdir(parents=True, exist_ok=True)
    # walk headings and images in document order
    tokens = re.finditer(r"<h[1-3][^>]*>(.*?)</h[1-3]>|<img[^>]*src=\"data:image/(\w+);base64,([^\"]+)\"", html, re.S)
    want, saved, missing = None, [], []
    for m in tokens:
        if m.group(1) is not None:
            text = htmllib.unescape(re.sub(r"<[^>]+>", "", m.group(1)))
            fm = re.search(r"([\w-]+\.(?:jpg|jpeg|png))", text, re.I)
            if want:
                missing.append(want)
            want = fm.group(1) if fm else None
        elif want:
            data = base64.b64decode(m.group(3))
            try:
                from PIL import Image

                im = Image.open(io.BytesIO(data)).convert("RGB")
                im.save(out / Path(want).with_suffix(".jpg").name, quality=90)
                saved.append(f"{want} {im.size[0]}x{im.size[1]}")
            except Exception:  # noqa: BLE001
                (out / want).write_bytes(data)
                saved.append(want)
            want = None
    if want:
        missing.append(want)
    for s in saved:
        print("saved", s)
    if missing:
        sys.exit(f"MISSING in the Drive doc (the image host refused Google, or the link is wrong): {', '.join(missing)}")


if __name__ == "__main__":
    main()
