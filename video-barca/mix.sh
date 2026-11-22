#!/usr/bin/env bash
# Mixe la vidéo montée, la voix-off (+0,2 s) et l'ambiance stade tirée des clips (atténuée sous la voix, explosion au but).
set -e
cd "$(dirname "$0")"
ffmpeg -y -loglevel error -i out/video_sans_son.mp4 -i in/voix.mp3 -i in/a.mov -i in/c.mp4 -i in/b.mov -filter_complex "
[2:a][3:a]concat=n=2:v=0:a=1,aloop=loop=2:size=2e9,atrim=0:54.25,volume=0.22,afade=t=out:st=53.5:d=0.75[bed];
[4:a]atrim=start=2.0,asetpts=PTS-STARTPTS,adelay=54250|54250,volume=0.75,afade=t=out:st=61.5:d=1.4[roar];
[bed][roar]amix=inputs=2:normalize=0:duration=longest[amb];
[1:a]adelay=200|200,highpass=f=70,asplit=2[v][sc];
[amb][sc]sidechaincompress=threshold=0.03:ratio=5:attack=20:release=350[duck];
[duck][v]amix=inputs=2:normalize=0:duration=longest,atrim=0:63,loudnorm=I=-14:TP=-1.5[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -movflags +faststart -shortest out/barca_9x16.mp4
echo out/barca_9x16.mp4
