#!/usr/bin/env bash
# Mixe la vidéo muette, la bande son et la voix-off (musique atténuée sous la voix).
set -e
cd "$(dirname "$0")"
VOIX="${1:-out/voix/voix_maxime.mp3}"
ffmpeg -y -loglevel error -i out/video_sans_son.mp4 -i out/bande_son.wav -i "$VOIX" -filter_complex \
  "[2:a]adelay=400|400,highpass=f=70,asplit=2[v][sc];[1:a][sc]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=300[m];[m][v]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -movflags +faststart out/leo_9x16.mp4
echo out/leo_9x16.mp4
