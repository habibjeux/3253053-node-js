# DANS TA TÊTE STUDIO

> Comprendre ce qui se passe en nous.

Application de production de contenu faceless (voix IA) pour TikTok et YouTube, public 18–24 ans, France.

## Démarrer

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # tests (Vitest)
npm run typecheck && npm run lint && npm run build
```

## Architecture

| Dossier | Rôle |
|---|---|
| `app/` | Pages (App Router) : Accueil, Idées, Recherche, Scripts, Storyboard, Voix IA, Productions, Statistiques, Paramètres |
| `components/ui/` | Composants d'interface (Card, Button, Badge, PageHeader, EmptyState) |
| `components/layout/` | Barre latérale (ordinateur), barre d'onglets + panneau « Plus » (iPhone) |
| `lib/domain/` | Schémas Zod et types de toutes les entités |
| `lib/repositories/` | Interface `DataStore` / `Repository` + implémentation IndexedDB (phase 1) |
| `lib/demo/` | Données de démonstration (toutes `isDemo: true`, aucune statistique inventée) |
| `lib/services/` | Logique métier (contrôle des 7 parties d'un script, durée estimée) |
| `server/integrations/` | Futurs clients d'API, `server-only` ; lecture des secrets côté serveur |

## Sauvegarde

Phase 1 : IndexedDB dans le navigateur + export / import JSON (Paramètres).
Phase 2 : implémentation Supabase de la même interface `DataStore` (`lib/repositories/store.ts`).

## Règles

- Données de démo signalées par un badge « Démo », effaçables en un clic.
- Aucune statistique fictive : seulement des chiffres saisis (« manuel ») ou issus d'API officielles (« API »).
- Les scripts ne citent que des sources enregistrées dans le module Recherche.
- Secrets uniquement côté serveur (`.env.local`, jamais `NEXT_PUBLIC_`), voir `.env.example`.
- En-têtes de sécurité (CSP, X-Frame-Options…) dans `next.config.ts`.

## Feuille de route

1. ✅ Base, thème, navigation, stockage, données de démo
2. Idées, Recherche, Générateur de scripts (édition complète)
3. Storyboard, Voix IA, Productions (Kanban)
4. Statistiques (saisie manuelle + graphiques), Dashboard enrichi
5. Supabase (auth + base), puis intégrations API
