# Le cadavre sauteur chinois — vidéo animée

Court-métrage vertical (9:16, 1080×1920, 30 i/s, ~2 min 17 s) racontant la légende du *jiangshi*,
entièrement généré par code : dessins 2D vectoriels, animation, voix off française, musique,
bruitages et sous-titres synchronisés.

Résultat : `le-cadavre-sauteur-chinois.mp4`

## Fonctionnement

| Fichier | Rôle |
|---|---|
| `script.json` | Texte exact de la narration (11 scènes) + mots surlignés en jaune |
| `tts.py` | Synthèse vocale française (Piper, voix `fr-gilles-low`), calcule le minutage de chaque phrase |
| `events.js` | Déduit du minutage les repères son/image (sauts, clochettes, porte, rafale…) |
| `lib.js` | Palette, personnage Jiangshi (vue de face / de profil / silhouette), prêtre, villageois, maisons, lune, brume |
| `scenes.js` | Les 11 scènes animées (caméra, parallaxe, transitions internes) |
| `render.js` | Composition image par image, fondus enchaînés, tremblements de caméra, grain, sous-titres |
| `audio.py` | Traitement de la voix + musique synthétisée (bourdon, cithare pentatonique, taiko), vent, clochettes, impacts |
| `build.sh` | Chaîne complète → MP4 |

## Reconstruire

```bash
npm install
pip install piper-tts numpy scipy
# voix : https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-fr-gilles-low.tar.gz
./build.sh /chemin/vers/voix
```

Police des sous-titres : Anton (SIL Open Font License, voir `assets/fonts/OFL-Anton.txt`).
