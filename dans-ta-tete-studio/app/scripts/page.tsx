"use client";

import { ModulePreview } from "@/components/module-preview";
import { Badge } from "@/components/ui";
import { estimateDurationSec, missingParts } from "@/lib/services/script";

export default function ScriptsPage() {
  return (
    <ModulePreview
      title="Scripts"
      subtitle="Accroche, introduction, développement, conclusion, question, visuels et sources."
      collection="scripts"
      etape={2}
      empty="Aucun script pour le moment."
      render={(s) => {
        const manque = missingParts(s);
        return {
          titre: s.titre,
          detail: s.accroche,
          meta: (
            <>
              <Badge tone={manque.length ? "warn" : "ok"}>{manque.length ? `incomplet : ${manque.join(", ")}` : "complet"}</Badge>
              <Badge>≈ {estimateDurationSec(s)} s</Badge>
              <Badge>v{s.version}</Badge>
              {s.origine === "brouillon-ia" && <Badge tone="warn">Brouillon IA — à vérifier</Badge>}
            </>
          ),
        };
      }}
    />
  );
}
