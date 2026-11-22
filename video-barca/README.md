# Analyse : le but de Fermín (Barça – Villarreal) — montage vertical 9:16

Montage 1080×1920, 30 i/s, 63 s, à partir de trois extraits du match (`in/a.mov`, `in/b.mov`, `in/c.mp4`,
non versionnés) et d'une voix-off ElevenLabs (`in2/voix.mp3`, 62 s, posée à +0,2 s). Durée : 64 s.

- Recadrages verticaux / 4:3 avec fond flouté, ralentis, arrêts sur image annotés (Raphinha et ses deux
  options, la passe en glissant, Yamal face au défenseur qui recule, ses deux solutions, l'appel de Fermín,
  la passe chirurgicale, le petit filet), « BUUUUT ! », sous-titres mot à mot calés sur la voix.
- Habillage v2 : projecteurs au sol sur les joueurs avec étiquettes TV, passes tracées avec ballon en mouvement,
  courses en pointillés animés, zones hachurées, sous-titres Montserrat avec le mot prononcé dans un encadré.
- Le découpage et les annotations sont dans `src/edit.js`, les répliques dans `src/timeline.js`.

Deux configurations de montage (`src/cfg_v2.js`, `src/cfg_v3.js`, choisies avec `--cfg`) :
- **v2** : images de match propres recadrées, annotations complètes.
- **v3** : tes 4 clips verticaux (`in2/v1..v4.mov`, déjà calés sur la voix : v1 à 15,75 s, v2 à 26,45 s,
  v3 à 39,63 s, v4 à 52,44 s, retrouvés par corrélation audio) gardés avec leurs cadrages et leurs annotations,
  précédés d'une ouverture (replay du but, mi-temps, arrêt sur image Raphinha), avec étiquettes, bandeaux,
  « BUUUUT ! » et sous-titres karaoké par-dessus.

```bash
for c in a b c; do mkdir -p frames/$c; ffmpeg -i in/$c.* -vsync 0 -q:v 3 frames/$c/%05d.jpg; done
node render.mjs --preview 10,40 --scale 0.5   # images de contrôle
node render.mjs --workers 3 --cfg v2          # → out/video_sans_son.mp4
./mix.sh                                      # voix + ambiance stade → out/barca_9x16.mp4
for i in 1 2 3 4; do mkdir -p frames/v$i; ffmpeg -i in2/v$i.mov -vf fps=30 -q:v 3 frames/v$i/%05d.jpg; done
node render.mjs --workers 3 --cfg v3 --out video_v3_sans_son.mp4
./mix.sh out/video_v3_sans_son.mp4 out/barca_9x16_tes_clips.mp4
```
