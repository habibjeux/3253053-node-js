# Soren et la tour des reflets — épisode 1 (vidéo verticale 9:16)

Animation 3D blocky (Three.js), 1080×1920, 30 i/s. Dans cette ville, on marche la tête baissée : après minuit,
lever les yeux suffit pour que ton reflet se désynchronise… et les reflets montent la nuit vers la tour de verre.

- **Accroche (0–2,6 s)** : « NE LÈVE JAMAIS LA TÊTE APRÈS MINUIT. » — un homme lève la tête, la vitrine
  craque, son reflet, lui, garde les yeux baissés et sourit.
- **La ville** : plongée sur la tour de verre, Soren livre ses colis tête baissée, les habitants aussi ;
  à 00:01 le veilleur lève la tête → son reflet se désynchronise.
- **Le miroir** : Maya regarde trop longtemps, son reflet se fige puis s'éloigne dans le couloir du miroir,
  le miroir se fend ; le boulanger n'a plus de reflet.
- **Minuit** : les reflets glissent le long des façades, grimpent sur la tour et font tourner les engrenages ;
  Soren grimpe jusqu'au sommet.
- **La tour** : écrans des habitants (MAYA : ISOLÉE… et en rouge SOREN : REFLET DE REMPLACEMENT), photo,
  porte verrouillée, le Gardien et son levier, la salle tremble : suspendue dans le vide, entourée de
  dizaines de doubles de Soren.

Habillage TikTok : sous-titres karaoké centrés dans la zone sûre (au-dessus du tiers bas, loin des icônes
de droite), accroche dans les 2 premières secondes. Minutage provisoire (86 s) dans `src/timeline.js`,
à recaler sur la voix-off.

```bash
npm install
node render.mjs --preview 2,30,80 --scale 0.5
node render.mjs --workers 3
```
