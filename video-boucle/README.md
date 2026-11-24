# La boucle — montagnes russes (vidéo verticale 9:16)

Animation 3D (Three.js), 1080×1920, 30 i/s. Personnages stickman 2.5D (grosse tête blanche ronde à contour
noir épais, petit torse habillé, membres en traits noirs fins — `src/stick.js`) dans un parc d'attractions 3D.

- **L'invention** : le créateur présente sa boucle, portefeuille vide ; le rival copie le plan et construit
  un cercle blanc parfait.
- **La nuit** : bannière « INAUGURATION DEMAIN », guirlandes, pleine lune ; le wagon de test revient avec le
  mannequin écrasé ; coups de maillet (base élargie), puis le rival resserre la boucle : haute et étroite.
- **L'ouverture** : la foule devant le cercle du rival, montée des deux wagons, crête.
- **L'explication** : voiture lente dans un virage serré (OK) / rapide (tonneau), puis schéma des forces :
  cercle ≈ 6,6 G (serré là où ça va vite) contre boucle en goutte ≈ 3,8 G (serrée là où ça ralentit),
  calculé à partir du tracé réel (vitesse √(2g·Δh), courbure, gravité).
- **Le final** : le créateur passe la boucle en goutte, la boucle circulaire du rival explose au loin.

Les boucles sont construites par leur courbure κ(s) (cercle → base élargie → clothoïde), voir `loopPoints`
dans `src/world.js`. Minutage provisoire (63 s) dans `src/timeline.js`, à recaler sur la voix-off.

```bash
npm install
node render.mjs --preview 2,30,55 --scale 0.5
node render.mjs --workers 3
```
