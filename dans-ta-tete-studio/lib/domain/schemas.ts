import { z } from "zod";

/** Champs communs à toutes les entités sauvegardées. */
const base = {
  id: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  /** true = donnée de démonstration (badge « Démo » affiché, effaçable en un clic). */
  isDemo: z.boolean().default(false),
};

export const THEMES = [
  "anxiété",
  "sommeil",
  "attachement",
  "estime de soi",
  "émotions",
  "habitudes",
  "relations",
  "cerveau",
] as const;

export const IdeaSchema = z.object({
  ...base,
  titre: z.string().min(1, "Le titre est obligatoire").max(160),
  angle: z.string().max(600).default(""),
  theme: z.enum(THEMES),
  statut: z.enum(["brouillon", "validée", "abandonnée"]).default("brouillon"),
  priorite: z.enum(["basse", "moyenne", "haute"]).default("moyenne"),
  tags: z.array(z.string().max(40)).default([]),
});

export const SourceSchema = z.object({
  ...base,
  ideaId: z.string().nullable().default(null),
  titre: z.string().min(1).max(300),
  auteur: z.string().max(200).default(""),
  url: z.string().url().or(z.literal("")).default(""),
  datePublication: z.string().default(""),
  dateConsultation: z.string().default(""),
  fiabilite: z.enum(["à vérifier", "moyenne", "élevée"]).default("à vérifier"),
  notes: z.string().max(4000).default(""),
});

export const ScriptSchema = z.object({
  ...base,
  ideaId: z.string().nullable().default(null),
  titre: z.string().min(1).max(160),
  version: z.number().int().positive().default(1),
  accroche: z.string().default(""),
  introduction: z.string().default(""),
  developpement: z.array(z.string()).default([]),
  conclusion: z.string().default(""),
  questionPublic: z.string().default(""),
  indicationsVisuelles: z.array(z.string()).default([]),
  /** Uniquement des sources enregistrées dans le module Recherche : jamais inventées. */
  sourceIds: z.array(z.string()).default([]),
  /** Origine du texte : rédigé à la main, ou brouillon IA à vérifier (futur). */
  origine: z.enum(["manuel", "brouillon-ia"]).default("manuel"),
});

export const SceneSchema = z.object({
  ...base,
  scriptId: z.string(),
  ordre: z.number().int().nonnegative(),
  texteVoix: z.string().default(""),
  visuel: z.string().default(""),
  mouvementCamera: z.string().default(""),
  texteEcran: z.string().default(""),
  dureeSec: z.number().nonnegative().default(3),
});

export const VoicePrepSchema = z.object({
  ...base,
  scriptId: z.string(),
  voix: z.string().default(""),
  vitesse: z.number().min(0.5).max(2).default(1),
  ton: z.string().default("posé"),
  texteBalise: z.string().default(""),
  statut: z.enum(["à préparer", "prête", "générée"]).default("à préparer"),
});

export const ETAPES = ["idée", "recherche", "script", "storyboard", "voix", "montage", "publiée"] as const;
export const PLATEFORMES = ["tiktok", "youtube"] as const;

export const ProductionSchema = z.object({
  ...base,
  ideaId: z.string().nullable().default(null),
  titre: z.string().min(1).max(160),
  etape: z.enum(ETAPES).default("idée"),
  plateformes: z.array(z.enum(PLATEFORMES)).default([]),
  datePrevue: z.string().default(""),
  checklist: z.array(z.object({ label: z.string(), fait: z.boolean() })).default([]),
});

export const StatSnapshotSchema = z.object({
  ...base,
  productionId: z.string(),
  plateforme: z.enum(PLATEFORMES),
  date: z.string(),
  vues: z.number().int().nonnegative(),
  likes: z.number().int().nonnegative().default(0),
  commentaires: z.number().int().nonnegative().default(0),
  partages: z.number().int().nonnegative().default(0),
  /** Rétention moyenne en % (optionnelle). */
  retention: z.number().min(0).max(100).nullable().default(null),
  /** « manuel » = saisi par l'utilisateur ; « api » = récupéré via une intégration officielle. */
  source: z.enum(["manuel", "api"]),
});

export type Idea = z.infer<typeof IdeaSchema>;
export type Source = z.infer<typeof SourceSchema>;
export type Script = z.infer<typeof ScriptSchema>;
export type Scene = z.infer<typeof SceneSchema>;
export type VoicePrep = z.infer<typeof VoicePrepSchema>;
export type Production = z.infer<typeof ProductionSchema>;
export type StatSnapshot = z.infer<typeof StatSnapshotSchema>;

export const SCHEMAS = {
  ideas: IdeaSchema,
  sources: SourceSchema,
  scripts: ScriptSchema,
  scenes: SceneSchema,
  voices: VoicePrepSchema,
  productions: ProductionSchema,
  stats: StatSnapshotSchema,
} as const;

export type CollectionName = keyof typeof SCHEMAS;
export type EntityOf<C extends CollectionName> = z.infer<(typeof SCHEMAS)[C]>;
export const COLLECTIONS = Object.keys(SCHEMAS) as CollectionName[];
