"use client";

import { ModulePreview } from "@/components/module-preview";
import { Badge } from "@/components/ui";

export default function IdeesPage() {
  return (
    <ModulePreview
      title="Idées"
      subtitle="Capturer, trier et valider les sujets."
      collection="ideas"
      etape={2}
      empty="Aucune idée pour le moment."
      render={(i) => ({
        titre: i.titre,
        detail: i.angle,
        meta: (
          <>
            <Badge tone="violet">{i.theme}</Badge>
            <Badge tone={i.statut === "validée" ? "ok" : "neutral"}>{i.statut}</Badge>
            <Badge>priorité {i.priorite}</Badge>
          </>
        ),
      })}
    />
  );
}
