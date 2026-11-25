"use client";

import { ModulePreview } from "@/components/module-preview";
import { Badge } from "@/components/ui";

export default function ProductionsPage() {
  return (
    <ModulePreview
      title="Productions"
      subtitle="Suivre chaque vidéo de l'idée à la publication."
      collection="productions"
      etape={3}
      empty="Aucune production en cours."
      render={(p) => ({
        titre: p.titre,
        meta: (
          <>
            <Badge tone="violet">{p.etape}</Badge>
            {p.plateformes.map((pl) => (
              <Badge key={pl}>{pl === "tiktok" ? "TikTok" : "YouTube"}</Badge>
            ))}
            {p.checklist.length > 0 && (
              <Badge>
                {p.checklist.filter((c) => c.fait).length}/{p.checklist.length} tâches
              </Badge>
            )}
          </>
        ),
      })}
    />
  );
}
