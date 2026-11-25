"use client";

import { ModulePreview } from "@/components/module-preview";
import { Badge } from "@/components/ui";

export default function VoixPage() {
  return (
    <ModulePreview
      title="Voix IA"
      subtitle="Préparer le texte (pauses, emphases) avant la génération de la voix."
      collection="voices"
      etape={3}
      empty="Aucune préparation de voix."
      render={(v) => ({
        titre: v.voix || "Voix à choisir",
        detail: v.texteBalise,
        meta: (
          <>
            <Badge tone={v.statut === "prête" ? "ok" : "neutral"}>{v.statut}</Badge>
            <Badge>vitesse ×{v.vitesse}</Badge>
            <Badge tone="violet">ton {v.ton}</Badge>
          </>
        ),
      })}
    />
  );
}
