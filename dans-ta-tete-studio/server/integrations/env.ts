import "server-only";
import { z } from "zod";

/**
 * Lecture centralisée des secrets côté serveur.
 * Toutes les clés sont optionnelles en phase 1 : une intégration non configurée est simplement « non connectée ».
 */
const EnvSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  ELEVENLABS_API_KEY: z.string().min(1).optional(),
  TIKTOK_CLIENT_KEY: z.string().min(1).optional(),
  TIKTOK_CLIENT_SECRET: z.string().min(1).optional(),
  YOUTUBE_CLIENT_ID: z.string().min(1).optional(),
  YOUTUBE_CLIENT_SECRET: z.string().min(1).optional(),
});

const env = EnvSchema.parse(Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== "")));

export type IntegrationStatus = { id: string; nom: string; usage: string; configuree: boolean };

/** Renvoie seulement des booléens : jamais la valeur d'une clé. */
export function integrationStatus(): IntegrationStatus[] {
  return [
    { id: "anthropic", nom: "API de Claude", usage: "Brouillons de scripts (à vérifier)", configuree: !!env.ANTHROPIC_API_KEY },
    { id: "elevenlabs", nom: "ElevenLabs", usage: "Génération des voix IA", configuree: !!env.ELEVENLABS_API_KEY },
    { id: "tiktok", nom: "TikTok", usage: "Statistiques officielles", configuree: !!(env.TIKTOK_CLIENT_KEY && env.TIKTOK_CLIENT_SECRET) },
    { id: "youtube", nom: "YouTube", usage: "Statistiques officielles", configuree: !!(env.YOUTUBE_CLIENT_ID && env.YOUTUBE_CLIENT_SECRET) },
  ];
}
