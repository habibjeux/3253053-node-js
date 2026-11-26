# Le cadavre sauteur chinois — vidéo animée

Court-métrage vertical (9:16, 1080×1920, 30 i/s, ~2 min 04 s) racontant la légende du *jiangshi*,
entièrement généré par code : dessins 2D vectoriels, animation, voix off française, musique,
bruitages et sous-titres synchronisés.

Résultat : `le-cadavre-sauteur-chinois.mp4`

## Fonctionnement

| Fichier | Rôle |
|---|---|
| `script.json` | Texte exact de la narration (11 scènes) + mots surlignés en jaune |
| `voice_import.py` | Voix off enregistrée (ElevenLabs, `assets/voice/`) : découpe sur les pauses, alignement phrase par phrase, minutage |
| `tts.py` | Alternative : synthèse vocale Piper (`fr-gilles-low`) |
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
./build.sh assets/voice/voix-off-elevenlabs.mp3   # voix off enregistrée
# ou : ./build.sh /chemin/vers/voix-piper          # voix de synthèse
```

Si une phrase est mal découpée, ajouter dans `script.json` → `voiceCuts` le temps (en secondes
dans l'enregistrement) d'une pause où une coupure doit obligatoirement tomber.

Police des sous-titres : Anton (SIL Open Font License, voir `assets/fonts/OFL-Anton.txt`).
