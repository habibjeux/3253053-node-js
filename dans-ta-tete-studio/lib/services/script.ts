import type { Script } from "@/lib/domain/schemas";

export const SCRIPT_PARTS = [
  { key: "accroche", label: "Accroche" },
  { key: "introduction", label: "Introduction" },
  { key: "developpement", label: "Développement" },
  { key: "conclusion", label: "Conclusion" },
  { key: "questionPublic", label: "Question au public" },
  { key: "indicationsVisuelles", label: "Indications visuelles" },
  { key: "sourceIds", label: "Sources" },
] as const;

const filled = (v: string | string[]) => (Array.isArray(v) ? v.some((s) => s.trim()) : v.trim().length > 0);

/** Parties manquantes : un script n'est « complet » que si les 7 parties sont remplies. */
export function missingParts(s: Script) {
  return SCRIPT_PARTS.filter((p) => !filled(s[p.key])).map((p) => p.label);
}

/** Texte lu par la voix (sans indications visuelles ni sources). */
export function spokenText(s: Script) {
  return [s.accroche, s.introduction, ...s.developpement, s.conclusion, s.questionPublic].filter(Boolean).join(" ");
}

/** Durée estimée en secondes, sur la base d'environ 150 mots par minute. */
export function estimateDurationSec(s: Script, wpm = 150) {
  const words = spokenText(s).split(/\s+/).filter(Boolean).length;
  return Math.round((words / wpm) * 60);
}
