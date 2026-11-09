#!/usr/bin/env python3
"""Find and download a REAL, freely licensed photo for a Real Check Short (Plan v5, PIPELINE_V5.md §3).

Sources (licence read from the source's own metadata, never guessed):
  commons   Wikimedia Commons  (public domain, CC0, CC BY, CC BY-SA only)
  nasa      NASA Image and Video Library (NASA media is generally public domain; check the description for
            third-party credits and never use NASA logos as endorsement)
  openverse Openverse (aggregator; same licence filter as commons)
Never: Google Images, news photos, stock sites without an API licence, photos of identifiable real people as the
subject, logos or brands. The run must LOOK at every downloaded photo (Read tool) before using it.

  python3 tools/fetch_photo.py --slug r01-great-wall --query "Great Wall Mutianyu" --source commons --list
  python3 tools/fetch_photo.py --slug r01-great-wall --query "Great Wall Mutianyu" --source commons --pick 2 --name wall

--pick downloads a candidate to studio/public/<slug>/photos/<name>.jpg (max 1600 px wide) so you can LOOK at it, and records
title, author, licence, source page, direct image URL and credit in studio/src/<slug>/photos.json.
This tool only FINDS photos. The chosen ones are stored in the Drive Photo library and the render uses the copies pulled
back from Drive with tools/drive_photos.py (PIPELINE_V5.md §3).
"""
import argparse
import html
import json
import re
import sys
import urllib.parse
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
UA = "StickmanShortsBot/1.0 (https://github.com/sriharsha8991/stickman-shorts; educational Shorts, licence-checked photos) python-urllib"
OK_LICENCES = re.compile(r"^(public domain|pd|cc0|cc[ -]?by(?:[ -]?sa)?(?:[ -]?\d\.\d)?)", re.I)


def get(url, binary=False):
    import time
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    last = None
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=40) as r:
                data = r.read()
            return data if binary else json.loads(data)
        except urllib.error.HTTPError as e:
            last = e
            if e.code in (429, 503):  # rate limited: wait and retry
                time.sleep(4 * (attempt + 1))
                continue
            break
        except Exception as e:  # noqa: BLE001
            last = e
            break
    host = urllib.parse.urlparse(url).netloc
    sys.exit(f"BLOCKED or failed: {host} ({last}). Allow this domain in claude.ai Settings > Capabilities, or use the Drive photo library.")


def strip(s):
    return html.unescape(re.sub(r"<[^>]+>", "", s or "")).strip()


def commons(q, n):
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(
        {"action": "query", "generator": "search", "gsrsearch": f"{q} filetype:bitmap", "gsrnamespace": 6, "gsrlimit": n,
         "prop": "imageinfo", "iiprop": "url|extmetadata|size", "iiurlwidth": 1600, "format": "json"})
    out = []
    for p in (get(url).get("query", {}).get("pages", {}) or {}).values():
        ii = p["imageinfo"][0]
        m = ii.get("extmetadata", {})
        lic = strip(m.get("LicenseShortName", {}).get("value"))
        out.append({"title": p["title"], "author": strip(m.get("Artist", {}).get("value")) or "unknown", "licence": lic,
                    "page": ii.get("descriptionurl"), "url": ii.get("thumburl") or ii.get("url"), "w": ii.get("width"), "h": ii.get("height"),
                    "source": "Wikimedia Commons"})
    return out


def nasa(q, n):
    d = get("https://images-api.nasa.gov/search?" + urllib.parse.urlencode({"q": q, "media_type": "image"}))
    out = []
    for it in d.get("collection", {}).get("items", [])[:n]:
        meta = it["data"][0]
        nid = meta["nasa_id"]
        out.append({"title": meta.get("title"), "author": meta.get("photographer") or meta.get("center") or "NASA", "licence": "Public domain (NASA)",
                    "page": f"https://images.nasa.gov/details/{nid}", "url": f"https://images-assets.nasa.gov/image/{nid}/{nid}~medium.jpg",
                    "source": "NASA", "note": (meta.get("description") or "")[:200]})
    return out


def openverse(q, n):
    d = get("https://api.openverse.org/v1/images/?" + urllib.parse.urlencode({"q": q, "page_size": n, "license": "by,by-sa,cc0,pdm"}))
    return [{"title": r.get("title"), "author": r.get("creator") or "unknown", "licence": ("Public domain" if r.get('license') in ('pdm',) else "CC0" if r.get('license') == 'cc0' else f"CC {r.get('license','').upper()} {r.get('license_version') or ''}".strip()),
             "page": r.get("foreign_landing_url"), "url": r.get("url"), "source": f"Openverse / {r.get('provider')}"} for r in d.get("results", [])]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--slug", required=True)
    ap.add_argument("--query", required=True)
    ap.add_argument("--source", choices=["commons", "nasa", "openverse"], default="commons")
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--pick", type=int)
    ap.add_argument("--name")
    ap.add_argument("-n", type=int, default=8)
    a = ap.parse_args()
    found = {"commons": commons, "nasa": nasa, "openverse": openverse}[a.source](a.query, a.n)
    found = [f for f in found if f["source"] == "NASA" or OK_LICENCES.match(f["licence"] or "")]
    if a.list or a.pick is None:
        for i, f in enumerate(found):
            print(f"[{i}] {f['title']} | {f['licence']} | {f['author'][:50]} | {f['page']}")
        return
    f = found[a.pick]
    name = a.name or re.sub(r"[^a-z0-9]+", "-", f["title"].lower())[:30]
    out_dir = ROOT / "studio" / "public" / a.slug / "photos"
    out_dir.mkdir(parents=True, exist_ok=True)
    raw = get(f["url"], binary=True)
    tmp = out_dir / f"{name}.download"
    tmp.write_bytes(raw)
    try:
        from PIL import Image
        im = Image.open(tmp).convert("RGB")
        if im.width > 1600:
            im = im.resize((1600, round(im.height * 1600 / im.width)))
        im.save(out_dir / f"{name}.jpg", quality=88)
        tmp.unlink()
    except Exception:  # noqa: BLE001
        tmp.rename(out_dir / f"{name}.jpg")
    credit = f"{f['author']} / {f['licence']} / {f['source']}"
    log = ROOT / "studio" / "src" / a.slug / "photos.json"
    data = json.loads(log.read_text()) if log.exists() else []
    data = [d for d in data if d.get("file") != f"{name}.jpg"] + [{**f, "file": f"{name}.jpg", "credit": credit, "query": a.query}]
    log.parent.mkdir(parents=True, exist_ok=True)
    log.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    print(f"saved photos/{name}.jpg · credit: {credit}\nNow LOOK at it (Read tool) before using it.")


if __name__ == "__main__":
    main()
