# 3:17 — Owen (vidéo verticale 9:16, horreur)

Micro-histoire d'horreur en avatars blocky (Three.js), 1080×1920, 30 i/s. 3 h 17 : sous la couverture,
le téléphone s'allume. Owen écrit « Tu dors ? »… alors qu'Owen dort juste à côté.

- **3:17** — réveil rouge, lit, SMS « Tu dors ? », localisation « Owen - Maison · Maintenant », fenêtre
  sous la pluie, « Ne te retourne pas. », photo prise de dehors, « Il est à ma place. »
- **3:18** — Owen immobile dans le lit, gros plan sur les mains jointes : la bague argentée.
- **3:19** — « Ne le laisse pas te toucher. », silhouette à capuche sous la pluie, main baguée plaquée
  contre la vitre, la main d'Owen glisse sous la couverture… Une seule bague : lequel est le vrai Owen ?

Même moteur que `video-nathan/` et `video-leo/`. Le minutage (messages, horloge, éclairs, sous-titres)
est dans `src/timeline.js` et sera recalé sur la voix-off.

```bash
npm install
node render.mjs --preview 5,30 --scale 0.5
node render.mjs --workers 3
```
