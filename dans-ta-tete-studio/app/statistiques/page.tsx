import type { Metadata } from "next";
import { Plug } from "lucide-react";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { integrationStatus } from "@/server/integrations/env";

export const metadata: Metadata = { title: "Statistiques" };
export const dynamic = "force-dynamic";

export default function StatistiquesPage() {
  const plateformes = integrationStatus().filter((i) => i.id === "tiktok" || i.id === "youtube");
  return (
    <>
      <PageHeader title="Statistiques" subtitle="TikTok et YouTube." />
      <div className="grid gap-3 sm:grid-cols-2">
        {plateformes.map((p) => (
          <Card key={p.id} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-surface-2">
                <Plug className="size-5 text-violet-soft" aria-hidden />
              </span>
              <span>
                <span className="block font-medium">{p.nom}</span>
                <span className="block text-xs text-muted">{p.usage}</span>
              </span>
            </span>
            <Badge tone={p.configuree ? "ok" : "neutral"}>{p.configuree ? "Clés configurées" : "Non connecté"}</Badge>
          </Card>
        ))}
      </div>
      <div className="mt-6">
        <EmptyState title="Aucune statistique pour le moment">
          Aucun chiffre n&apos;est inventé : cette page affichera uniquement des données saisies à la main (marquées « manuel », étape 4)
          ou récupérées via les API officielles (marquées « API », phase ultérieure).
        </EmptyState>
      </div>
    </>
  );
}
