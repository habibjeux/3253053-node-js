# 3:17 — Owen (vidéo verticale 9:16, horreur)

Micro-histoire d'horreur en avatars blocky (Three.js), 1080×1920, 30 i/s, 54,5 s. 3 h 17 : sous la couverture,
le téléphone s'allume. Owen écrit « Tu dors ? »… alors qu'Owen dort juste à côté.

- **3:17** — réveil rouge, lit, SMS « Tu dors ? », localisation « Owen - Maison · Maintenant », fenêtre
  sous la pluie, « Ne te retourne pas. », photo prise de dehors, « Il est à ma place. »
- **3:18** — Owen immobile dans le lit, gros plan sur les mains jointes : la bague argentée.
- **3:19** — « Ne le laisse pas te toucher. », silhouette à capuche sous la pluie, main baguée plaquée
  contre la vitre, la main d'Owen glisse sous la couverture… Une seule bague : lequel est le vrai Owen ?

Même moteur que `video-nathan/` et `video-leo/`. Le minutage (23 répliques de la voix-off ElevenLabs posée
à +0,5 s, messages, horloge 3:17 → 3:18 → 3:19, éclairs, coups à la vitre, dilemme) est dans `src/timeline.js`.

```bash
npm install
node render.mjs --preview 5,30 --scale 0.5
node render.mjs --workers 3
node audio.mjs                 # pluie, drone, vibrations, tonnerre, coups → out/bande_son.wav
./mix.sh out/voix/voix.mp3     # → out/owen_9x16.mp4
```
