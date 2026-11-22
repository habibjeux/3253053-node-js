# Léo et la ville du silence — épisode 1 (vidéo verticale 9:16)

Animation 3D « blocky » (Three.js), 1080×1920, 30 i/s, 1 min 19,5. Dans cette ville côtière, le moindre bruit
coûte 15 € : un panneau géant affiche « BRUIT AUTORISÉ : 0 dB », des capteurs dans les rues verbalisent
éternuements et bips de vélo… et c'est le phare de M. Vane qui encaisse.

Même moteur que `video-nathan/` (personnages articulés, rendu image par image dans Chromium, sous-titres
TikTok, bruitages synthétisés).

## Plans (calés sur la voix-off)

1. **La ville du silence (0–31,6 s)** — plan large ville / port / phare, livreur qui freine (« bip », -15 €),
   panneau « BRUIT AUTORISÉ : 0 dB — AMENDE : 15 € », pas trop lourd (-15 €), éternuement (-15 €),
   passants sur la pointe des pieds, chuchotements en chaussons épais, Léo enrhumé (« Atchoum » -15 €, -30 €),
   porte-monnaie vide, M. Vane sur la galerie du phare, rue déserte où les compteurs s'affolent,
   la boulangère, le pêcheur et Mila ruinés.
2. **La nuit (31,6–47,1 s)** — ville endormie, « JEUDI SOIR », Léo se faufile, « MINUIT » : faisceau et ondes
   depuis la lanterne qui déclenchent tous les compteurs, faux sons enregistrés (ATCHOUM, BIP, BOUM…),
   Léo escalade la falaise.
3. **Le phare (47,1–71,5 s)** — écrans des amendes (MILA 90 €, PÊCHEUR 240 €… et en rouge LÉO : 420 € —
   RECORD DE LA SEMAINE), générateur de sons, billets aspirés vers le coffre blindé, photo, porte en fer qui
   claque, M. Vane sur l'écran, le sol vibre.
4. **Décollage (71,5–79,5 s)** — le phare se détache de la falaise et s'élève au-dessus de l'océan. « À SUIVRE… »

## Rendu

```bash
npm install
node render.mjs --preview 5,30,60 --scale 0.5   # images de contrôle (out/preview)
node render.mjs --workers 3                     # vidéo muette 1080×1920 → out/video_sans_son.mp4
node audio.mjs                                  # musique + bruitages → out/bande_son.wav (+ voix_off.srt)
./mix.sh out/voix/voix_maxime.mp3               # + voix-off → out/leo_9x16.mp4
```

La voix-off (ElevenLabs, voix « Maxime », 1 min 15) est posée à +0,4 s ; `src/timeline.js` contient le minutage de
chaque réplique (sous-titres mot à mot) et des événements, recalés sur cette voix. La vidéo dure 1 min 19,5.
