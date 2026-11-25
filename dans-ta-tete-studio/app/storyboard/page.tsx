"use client";

import { ModulePreview } from "@/components/module-preview";
import { Badge } from "@/components/ui";

export default function StoryboardPage() {
  return (
    <ModulePreview
      title="Storyboard"
      subtitle="Découper chaque script en scènes verticales 9:16."
      collection="scenes"
      etape={3}
      empty="Aucune scène pour le moment."
      render={(s) => ({
        titre: `Scène ${s.ordre + 1} — ${s.visuel || "visuel à définir"}`,
        detail: s.texteVoix,
        meta: (
          <>
            <Badge>{s.dureeSec} s</Badge>
            {s.mouvementCamera && <Badge tone="violet">{s.mouvementCamera}</Badge>}
          </>
        ),
      })}
    />
  );
}
