# Léo et la ville du silence — épisode 1 (vidéo verticale 9:16)

Animation 3D « blocky » (Three.js), 1080×1920, 30 i/s, 1 min 28. Dans cette ville côtière, le moindre bruit
coûte 15 € : un panneau géant affiche « BRUIT AUTORISÉ : 0 dB », des capteurs dans les rues verbalisent
éternuements et bips de vélo… et c'est le phare de M. Vane qui encaisse.

Même moteur que `video-nathan/` (personnages articulés, rendu image par image dans Chromium, sous-titres
TikTok, bruitages synthétisés).

## Plans

1. **Introduction (0–20 s)** — plan large ville / port / phare, panneau « BRUIT AUTORISÉ : 0 dB — AMENDE : 15 € »,
   passants sur la pointe des pieds, livreur à vélo qui freine (« bip », -15 €), foule qui lève les yeux.
2. **Le piège du silence (20–40 s)** — zoom sur le phare (M. Vane sur la galerie), Mila éternue (-15 €),
   porte-monnaie vide, habitants qui chuchotent, pêcheur en ciré jaune et chaussons épais.
3. **L'enquête de nuit (40–52 s)** — « MINUIT », Léo se faufile, faisceau et ondes sonores depuis la lanterne
   qui déclenchent les compteurs, Léo escalade la falaise.
4. **Révélation et piège (52–88 s)** — salle de contrôle (ÉTERNUEMENT : 15 €, PAS LOURD : 15 €… et en rouge
   LÉO : 420 € — RECORD DE LA SEMAINE), générateur de sons, billets aspirés vers un coffre blindé, photo,
   porte blindée qui claque, M. Vane sur l'écran, le phare vrombit, se détache de la falaise et s'élève
   au-dessus de l'océan. « À SUIVRE… »

## Rendu

```bash
npm install
node render.mjs --preview 5,30,60 --scale 0.5   # images de contrôle (out/preview)
node render.mjs --workers 3                     # vidéo muette 1080×1920 → out/video_sans_son.mp4
node audio.mjs                                  # musique + bruitages → out/bande_son.wav (+ voix_off.srt)
```

La voix-off et les sous-titres se règlent dans `src/timeline.js` (`LINES`, une ligne par réplique).
