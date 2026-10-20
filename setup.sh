#!/usr/bin/env bash
# Rebuilds the full Stickman Shorts toolchain in a fresh container (~3-5 min).
# Usage (from the repo root):  bash setup.sh   then   source env.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "== Python deps"
PIP="pip install -q"
python3 -m pip --version >/dev/null 2>&1 || { echo "python3 + pip required"; exit 1; }
$PIP --break-system-packages numpy scipy pillow mido 2>/dev/null || $PIP numpy scipy pillow mido
# tinysoundfont's pyaudio extra can't build headless: install without deps (only numpy needed)
$PIP --break-system-packages --no-deps tinysoundfont 2>/dev/null || $PIP --no-deps tinysoundfont

echo "== Skills (pinned commits)"
mkdir -p _vendor
fetch() {  # fetch <owner/repo> <sha> <dir>
  local repo=$1 sha=$2 dir=_vendor/$3
  [ -d "$dir/.git" ] && return 0
  mkdir -p "$dir" && git -C "$dir" init -q && git -C "$dir" remote add origin "https://github.com/$repo"
  if ! git -C "$dir" fetch -q --depth 1 origin "$sha" 2>/dev/null; then
    echo "   pinned $sha unavailable for $repo, using default branch"; git -C "$dir" fetch -q --depth 1 origin HEAD
  fi
  git -C "$dir" checkout -q FETCH_HEAD
}
fetch nispa/stickman-video                c2ede0f707559bf9e3d207c3902d64bf3affe8ae stickman-video
fetch remotion-dev/skills                 039e8a2fc78b67efc228d5645367838b85818a1c remotion-skills
fetch Jakeschincariol/youtube-agent-skill a2feb2104981a375ffd4f87ee04f4f5344ac43c6 youtube-agent-skill
fetch yaxeen/storytelling-skills          24ef3c1e3d7fde66cc5f1c5953cd6c1d7afc0b4f storytelling-skills
fetch iart-ai/tiktok-video-skills         2a775336b5a638cbf8a61dbd785f9a1b649be016 tiktok-video-skills
fetch iart-ai/motion-design-skills        3c129f769d90a1328c209c386492333c9ac62312 motion-design-skills
fetch sirruf/music-gen-skill              a025267abd8b669035695f60ff22b54fc71c1362 music-gen-skill

echo "== SoundFont (GeneralUser GS)"
mkdir -p soundfonts
[ -f soundfonts/gu/GeneralUser-GS.sf2 ] || {
  mkdir -p soundfonts/gu && git -C soundfonts/gu init -q && git -C soundfonts/gu remote add origin https://github.com/mrbumpy409/GeneralUser-GS
  git -C soundfonts/gu fetch -q --depth 1 origin 684543d5e5efaef08d02be50dcda8d552478fa60 || git -C soundfonts/gu fetch -q --depth 1 origin HEAD
  git -C soundfonts/gu checkout -q FETCH_HEAD
}

echo "== Remotion project"
(cd studio && npm ci --no-audit --no-fund --loglevel=error)

echo "== Headless browser"
BROWSER=""
if ! (cd studio && timeout 120 npx remotion browser ensure >/dev/null 2>&1); then
  BROWSER=$(find /opt/pw-browsers ~/.cache/ms-playwright -maxdepth 4 -type f -name chrome 2>/dev/null | head -1 || true)
  [ -z "$BROWSER" ] && BROWSER=$(command -v chromium || command -v chromium-browser || command -v google-chrome || true)
  [ -z "$BROWSER" ] && { echo "No Chromium found and Remotion's download failed."; exit 1; }
  echo "   using local Chromium: $BROWSER"
fi
cat > env.sh <<EOF
export STICKMAN_ROOT="$ROOT"
export SKILLS="$ROOT/_vendor"
export ENGINE="$ROOT/_vendor/stickman-video"
${BROWSER:+export REMOTION_BROWSER="$BROWSER"}
EOF

echo "== Type-check"
(cd studio && npx tsc --noEmit)
echo "OK. Now: source env.sh"
