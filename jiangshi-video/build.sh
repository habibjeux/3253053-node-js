#!/usr/bin/env bash
# Full pipeline: narration -> cues -> soundtrack -> frames -> final MP4.
# Usage: ./build.sh <piper_voices_dir>
set -euo pipefail
cd "$(dirname "$0")"
VOICES="${1:?path to the folder containing fr-gilles-low.onnx}"
mkdir -p build
python3 tts.py "$VOICES"
node events.js
python3 audio.py
JOBS=${JOBS:-4}
pids=()
for ((k = 0; k < JOBS; k++)); do node render.js seg "$k" "$JOBS" > "build/log_$k.txt" 2>&1 & pids+=($!); done
for p in "${pids[@]}"; do wait "$p"; done
: > build/segs.txt
for ((k = 0; k < JOBS; k++)); do echo "file 'seg_$k.mp4'" >> build/segs.txt; done
ffmpeg -y -loglevel error -f concat -safe 0 -i build/segs.txt -i build/mix.wav \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart \
  le-cadavre-sauteur-chinois.mp4
echo "-> le-cadavre-sauteur-chinois.mp4"
