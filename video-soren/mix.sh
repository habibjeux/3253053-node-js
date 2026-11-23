#!/usr/bin/env bash
# Mixe la vidéo muette, l'ambiance et la voix-off (posée à +0,3 s, ambiance atténuée sous la voix).
set -e
cd "$(dirname "$0")"
VOIX="${1:-out/voix/voix.mp3}"
ffmpeg -y -loglevel error -i out/video_sans_son.mp4 -i out/bande_son.wav -i "$VOIX" -filter_complex \
  "[2:a]adelay=300|300,highpass=f=70,asplit=2[v][sc];[1:a][sc]sidechaincompress=threshold=0.03:ratio=4:attack=20:release=400[m];[m][v]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -movflags +faststart out/soren_9x16.mp4
echo out/soren_9x16.mp4
