# Intégrations serveur (phase ultérieure)

Chaque client d'API externe vivra ici, avec `import "server-only"` en première ligne :
la compilation échoue si un de ces fichiers est importé dans un composant client.

Règles :
- Les clés sont lues via `env.ts` (variables sans préfixe `NEXT_PUBLIC_`).
- Le navigateur n'appelle que nos routes `app/api/*` ou des actions serveur,
  qui valident les entrées (Zod), limitent le débit et renvoient des erreurs neutres.
- Les jetons OAuth (TikTok, YouTube) seront chiffrés avant stockage en base.
- Tout texte produit par une IA est enregistré avec `origine: "brouillon-ia"`.
