#!/usr/bin/env bash
# Full pipeline: narration -> cues -> soundtrack -> frames -> final MP4.
# Usage: ./build.sh <piper_voices_dir>        (synthetic Piper voice)
#        ./build.sh <voice_over.mp3|wav>       (recorded voice-over, e.g. ElevenLabs)
set -euo pipefail
cd "$(dirname "$0")"
SRC="${1:-assets/voice/voix-off-elevenlabs.mp3}"
mkdir -p build
if [ -f "$SRC" ]; then python3 voice_import.py "$SRC"; else python3 tts.py "$SRC"; fi
node events.js
python3 audio.py
JOBS=${JOBS:-4}
pids=()
for ((k = 0; k < JOBS; k++)); do node render.js seg "$k" "$JOBS" > "build/log_$k.txt" 2>&1 & pids+=($!); done
for p in "${pids[@]}"; do wait "$p"; done
: > build/segs.txt
for ((k = 0; k < JOBS; k++)); do echo "file 'seg_$k.mp4'" >> build/segs.txt; done
ffmpeg -y -loglevel error -f concat -safe 0 -i build/segs.txt -i build/mix.wav \
  -map 0:v -map 1:a -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart \
  le-cadavre-sauteur-chinois.mp4
echo "-> le-cadavre-sauteur-chinois.mp4"
