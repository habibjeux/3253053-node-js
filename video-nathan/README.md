# Patatra — épisode 1 (vidéo verticale 9:16)

Animation 3D « blocky » (Three.js) de 1 min 28 au format TikTok / Shorts / Reels (1080×1920, 30 i/s),
d'après le storyboard : la vallée enneigée où chaque pas coûte 10 €, Nathan « Patatra », Zoé, et Gaspard
qui verglace la rue la nuit depuis sa cabine noire.

## Contenu

| Fichier | Rôle |
|---|---|
| `src/timeline.js` | Découpage de la voix-off (sous-titres) et des événements image/son, partagé par le rendu et l'audio |
| `src/lib.js` | Briques : cubes, textures canvas, visages expressifs, personnages articulés (marche, chute, assis…) |
| `src/world.js` | Décors : vallée, montagnes, maisons, école, boulangerie, téléphérique, cabines, salle des écrans |
| `src/main.js` | Les 20 plans (caméra, éclairage jour / nuit / intérieur), popups « -10 € », onomatopées, sous-titres |
| `render.mjs` | Rendu image par image dans Chromium headless → ffmpeg (H.264) |
| `audio.mjs` | Musique et bruitages synthétisés (ding, boum, clac, pschhh, ka-ching…) + `voix_off.srt` |

## Plans

1. **Introduction (0–20 s)** — plongée sur le village et le téléphérique, « -10 € » à chaque pas, échasses,
   glisse sur câble, cabine verte des riches, Nathan qui tombe trois fois, « PATATRA ! » devant l'école.
2. **Le piège de la glace (20–40 s)** — cabine jaune « G », panneau « 50 € LE TRAJET », chutes du facteur,
   de la boulangère et de Zoé, Zoé en pleurs près de sa tirelire cochon (-400 €), rue verglacée sans neige.
3. **L'enquête de nuit (40–52 s)** — « MARDI — 23:59 », la cabine noire arrose la rue qui gèle, Nathan
   s'accroche sous la cabine.
4. **Révélation et piège (52–88 s)** — écrans de classement (LÉON 29, ZOÉ 40, FACTEUR 112 ; en rouge :
   NATHAN : 3 000 CHUTES — MEILLEUR CLIENT), pluie de pièces et compteur jusqu'à 1 000 000 €, photo,
   grille violette qui se ferme, Gaspard et son monocle, la salle qui bouge… c'était une cabine. « À SUIVRE… »

## Rendu

```bash
npm install
node render.mjs --preview 5,30,60     # quelques images de contrôle dans out/preview
node render.mjs --workers 3           # vidéo muette → out/video_sans_son.mp4
node audio.mjs                        # out/bande_son.wav + out/voix_off.srt
ffmpeg -i out/video_sans_son.mp4 -i out/bande_son.wav -c:v copy -c:a aac -b:a 192k -shortest out/patatra_9x16.mp4
```

Nécessite Node 18+, ffmpeg et Playwright (Chromium). Le rendu est déterministe : chaque image est
calculée à partir de son seul temps `t`, on peut donc rendre n'importe quel intervalle (`--from`, `--to`).

## Voix-off

La vidéo contient les sous-titres incrustés, la musique et les bruitages, mais **pas de voix** (aucun
moteur de synthèse vocale disponible dans l'environnement de rendu). `out/voix_off.srt` donne le minutage
de chaque réplique pour l'enregistrer ; il suffit ensuite de la mixer :

```bash
ffmpeg -i out/patatra_9x16.mp4 -i voix.wav -filter_complex "[1:a]volume=1.0[v];[0:a]volume=0.45[m];[m][v]amix=inputs=2:duration=first[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k out/patatra_9x16_voix.mp4
```
