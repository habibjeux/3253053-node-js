import type { Backup } from "@/lib/repositories/types";
import type { Idea, Production, Scene, Script, Source, VoicePrep } from "@/lib/domain/schemas";

/**
 * Données de démonstration. Toutes portent isDemo: true (badge « Démo » dans l'interface).
 * Règles :
 *  - aucune statistique n'est inventée (la collection « stats » reste vide) ;
 *  - les sources de démo sont des exemples fictifs, sans URL, marquées « à vérifier ».
 */
export function buildDemoData(t: string): Backup["data"] {
  const b = { createdAt: t, updatedAt: t, isDemo: true } as const;

  const ideas: Idea[] = [
    { ...b, id: "demo-idea-1", titre: "Pourquoi on rumine la nuit", angle: "Ce que fait le cerveau quand on n'arrive pas à « éteindre » ses pensées au coucher.", theme: "sommeil", statut: "validée", priorite: "haute", tags: ["nuit", "pensées"] },
    { ...b, id: "demo-idea-2", titre: "Le besoin de validation sur les réseaux", angle: "Pourquoi un like peut autant compter, et comment reprendre la main.", theme: "estime de soi", statut: "brouillon", priorite: "moyenne", tags: ["réseaux"] },
    { ...b, id: "demo-idea-3", titre: "Attachement anxieux : les signes", angle: "Reconnaître ses réactions en couple sans se coller d'étiquette.", theme: "attachement", statut: "brouillon", priorite: "moyenne", tags: ["couple"] },
    { ...b, id: "demo-idea-4", titre: "Procrastiner n'est pas de la paresse", angle: "La procrastination comme gestion d'une émotion désagréable.", theme: "émotions", statut: "validée", priorite: "haute", tags: ["études", "travail"] },
  ];

  const sources: Source[] = [
    { ...b, id: "demo-src-1", ideaId: "demo-idea-1", titre: "Exemple de source — article de synthèse sur la rumination (démo)", auteur: "", url: "", datePublication: "", dateConsultation: "", fiabilite: "à vérifier", notes: "Source fictive de démonstration : à remplacer par une vraie référence vérifiée." },
    { ...b, id: "demo-src-2", ideaId: "demo-idea-4", titre: "Exemple de source — étude sur la procrastination et les émotions (démo)", auteur: "", url: "", datePublication: "", dateConsultation: "", fiabilite: "à vérifier", notes: "Source fictive de démonstration." },
  ];

  const scripts: Script[] = [
    {
      ...b,
      id: "demo-script-1",
      ideaId: "demo-idea-1",
      titre: "Pourquoi on rumine la nuit",
      version: 1,
      accroche: "Il est 2 h du matin et ton cerveau rejoue encore cette conversation.",
      introduction: "Tu n'es pas seul·e. Le soir, quand tout se calme, l'esprit a enfin de la place pour tout ce qu'on a mis de côté.",
      developpement: [
        "Dans la journée, l'attention est occupée. La nuit, il n'y a plus rien pour la capter.",
        "Ruminer donne l'impression de résoudre un problème, mais on tourne en rond.",
        "Noter ses pensées avant de dormir peut aider à les « poser » ailleurs.",
      ],
      conclusion: "Ruminer, ce n'est pas un défaut : c'est un cerveau qui cherche à te protéger, un peu trop fort.",
      questionPublic: "Et toi, c'est quoi la pensée qui revient le plus souvent la nuit ?",
      indicationsVisuelles: ["Chambre sombre, écran de téléphone allumé", "Pensées sous forme de bulles qui tournent", "Carnet posé sur la table de nuit"],
      sourceIds: ["demo-src-1"],
      origine: "manuel",
    },
  ];

  const scenes: Scene[] = [
    { ...b, id: "demo-scene-1", scriptId: "demo-script-1", ordre: 0, texteVoix: "Il est 2 h du matin et ton cerveau rejoue encore cette conversation.", visuel: "Plafond dans le noir, lueur bleue du téléphone", mouvementCamera: "Zoom lent", texteEcran: "2:00", dureeSec: 4 },
    { ...b, id: "demo-scene-2", scriptId: "demo-script-1", ordre: 1, texteVoix: "Tu n'es pas seul·e.", visuel: "Fenêtres d'immeubles allumées la nuit", mouvementCamera: "Travelling latéral", texteEcran: "", dureeSec: 2 },
  ];

  const voices: VoicePrep[] = [
    { ...b, id: "demo-voice-1", scriptId: "demo-script-1", voix: "Voix féminine douce (à choisir)", vitesse: 0.95, ton: "intime", texteBalise: "Il est 2 h du matin… [pause] et ton cerveau rejoue encore cette conversation.", statut: "à préparer" },
  ];

  const productions: Production[] = [
    { ...b, id: "demo-prod-1", ideaId: "demo-idea-1", titre: "Pourquoi on rumine la nuit", etape: "storyboard", plateformes: ["tiktok", "youtube"], datePrevue: "", checklist: [ { label: "Sources vérifiées", fait: false }, { label: "Script relu", fait: true }, { label: "Voix générée", fait: false } ] },
    { ...b, id: "demo-prod-2", ideaId: "demo-idea-4", titre: "Procrastiner n'est pas de la paresse", etape: "recherche", plateformes: ["tiktok"], datePrevue: "", checklist: [] },
  ];

  return { ideas, sources, scripts, scenes, voices, productions, stats: [] };
}
