"use client";

import { ModulePreview } from "@/components/module-preview";
import { Badge } from "@/components/ui";

export default function RecherchePage() {
  return (
    <ModulePreview
      title="Recherche"
      subtitle="Sources, citations et notes documentaires."
      collection="sources"
      etape={2}
      empty="Aucune source enregistrée."
      render={(s) => ({
        titre: s.titre,
        detail: s.notes,
        meta: (
          <>
            <Badge tone={s.fiabilite === "élevée" ? "ok" : s.fiabilite === "à vérifier" ? "warn" : "neutral"}>fiabilité : {s.fiabilite}</Badge>
            {!s.url && <Badge tone="warn">sans URL</Badge>}
          </>
        ),
      })}
    />
  );
}
