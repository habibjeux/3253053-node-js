import type { Metadata } from "next";
import { Badge, Card, PageHeader } from "@/components/ui";
import { integrationStatus } from "@/server/integrations/env";
import { BackupPanel } from "./backup-panel";

export const metadata: Metadata = { title: "Paramètres" };
export const dynamic = "force-dynamic";

export default function ParametresPage() {
  // Calculé côté serveur : seuls des booléens « configurée / non » arrivent au navigateur, jamais une clé.
  const integrations = integrationStatus();
  return (
    <>
      <PageHeader title="Paramètres" subtitle="Sauvegarde des projets et intégrations." />

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted">Sauvegarde</h2>
        <BackupPanel />
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted">Intégrations</h2>
        <Card className="divide-y divide-line p-0">
          {integrations.map((i) => (
            <div key={i.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <span>
                <span className="block text-sm font-medium">{i.nom}</span>
                <span className="block text-xs text-muted">{i.usage}</span>
              </span>
              <Badge tone={i.configuree ? "ok" : "neutral"}>{i.configuree ? "Configurée" : "Non connectée"}</Badge>
            </div>
          ))}
        </Card>
        <p className="mt-2 text-xs text-muted">Les clés se configurent côté serveur (variables d&apos;environnement). Elles ne sont jamais envoyées au navigateur.</p>
      </section>
    </>
  );
}
