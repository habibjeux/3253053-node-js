# Analyse : le but de Fermín (Barça – Villarreal) — montage vertical 9:16

Montage 1080×1920, 30 i/s, 63 s, à partir de trois extraits du match (`in/a.mov`, `in/b.mov`, `in/c.mp4`,
non versionnés) et d'une voix-off ElevenLabs (`in/voix.mp3`, posée à +0,2 s).

- Recadrages verticaux / 4:3 avec fond flouté, ralentis, arrêts sur image annotés (Raphinha et ses deux
  options, la passe en glissant, Yamal face au défenseur qui recule, ses deux solutions, l'appel de Fermín,
  la passe chirurgicale, le petit filet), « BUUUUT ! », sous-titres mot à mot calés sur la voix.
- Le découpage et les annotations sont dans `src/edit.js`, les répliques dans `src/timeline.js`.

```bash
for c in a b c; do mkdir -p frames/$c; ffmpeg -i in/$c.* -vsync 0 -q:v 3 frames/$c/%05d.jpg; done
node render.mjs --preview 10,40 --scale 0.5   # images de contrôle
node render.mjs --workers 3                   # → out/video_sans_son.mp4
./mix.sh                                      # voix + ambiance stade → out/barca_9x16.mp4
```
