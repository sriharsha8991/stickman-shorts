#!/usr/bin/env bash
# Loudness-master a rendered short for social platforms (-14 LUFS, -1.5 dBTP); video stream is copied.
# Usage: bash tools/master_audio.sh in.mp4 out.mp4
set -euo pipefail
ffmpeg -v error -y -i "$1" -c:v copy -af "loudnorm=I=-14:TP=-1.5:LRA=9" -ar 48000 -c:a aac -b:a 192k "$2"
ffmpeg -hide_banner -i "$2" -af ebur128 -f null - 2>&1 | grep -E "^\s+I:|Peak:" | tail -2
