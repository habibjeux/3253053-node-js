"use client";

import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { useCollection } from "@/components/data-provider";
import { Badge, Card, DemoBadge, PageHeader } from "@/components/ui";
import { ETAPES } from "@/lib/domain/schemas";
import { missingParts } from "@/lib/services/script";

export default function Dashboard() {
  const ideas = useCollection("ideas");
  const scripts = useCollection("scripts");
  const productions = useCollection("productions");
  const sources = useCollection("sources");
  const loading = !ideas || !scripts || !productions || !sources;

  const enCours = productions?.filter((p) => p.etape !== "publiée") ?? [];
  const aTrier = ideas?.filter((i) => i.statut === "brouillon") ?? [];
  const incomplets = scripts?.filter((s) => missingParts(s).length > 0) ?? [];
  const aVerifier = sources?.filter((s) => s.fiabilite === "à vérifier") ?? [];
  const hasDemo = [ideas, scripts, productions, sources].some((c) => c?.some((x) => x.isDemo));

  const kpis = [
    { label: "Productions en cours", value: enCours.length, href: "/productions" },
    { label: "Idées à trier", value: aTrier.length, href: "/idees" },
    { label: "Scripts incomplets", value: incomplets.length, href: "/scripts" },
    { label: "Sources à vérifier", value: aVerifier.length, href: "/recherche" },
  ];

  return (
    <>
      <PageHeader
        title="Bonjour 👋"
        subtitle="Comprendre ce qui se passe en nous."
        action={
          <Link href="/idees" className="hidden min-h-11 items-center gap-2 rounded-xl bg-violet px-4 text-sm font-medium sm:inline-flex">
            <Plus className="size-4" aria-hidden /> Nouvelle idée
          </Link>
        }
      />

      {hasDemo && (
        <p className="mb-5 text-xs text-muted">
          <Badge tone="demo">Démo</Badge> Des données de démonstration sont affichées. Tu peux les effacer dans{" "}
          <Link href="/parametres" className="text-violet-soft underline underline-offset-2">
            Paramètres
          </Link>
          .
        </p>
      )}

      <section aria-label="Indicateurs" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <Link key={k.label} href={k.href}>
            <Card className="transition hover:border-violet/50">
              <p className="font-display text-3xl font-semibold">{loading ? "–" : k.value}</p>
              <p className="mt-1 text-xs text-muted">{k.label}</p>
            </Card>
          </Link>
        ))}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted">Pipeline</h2>
        <Card className="overflow-x-auto">
          <ol className="flex min-w-max gap-2">
            {ETAPES.map((e) => {
              const n = productions?.filter((p) => p.etape === e).length ?? 0;
              return (
                <li key={e} className={`flex min-w-24 flex-col items-center rounded-xl px-3 py-3 ${n ? "bg-violet/15" : "bg-surface-2"}`}>
                  <span className="font-display text-xl font-semibold">{n}</span>
                  <span className="text-[11px] capitalize text-muted">{e}</span>
                </li>
              );
            })}
          </ol>
        </Card>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted">En cours</h2>
        {enCours.length === 0 && !loading ? (
          <p className="text-sm text-muted">Aucune production en cours.</p>
        ) : (
          <ul className="grid gap-2">
            {enCours.map((p) => (
              <li key={p.id}>
                <Link href="/productions">
                  <Card className="flex items-center justify-between gap-3 py-3 transition hover:border-violet/50">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{p.titre}</span>
                      <span className="mt-1 flex gap-1.5">
                        <Badge tone="violet">{p.etape}</Badge>
                        <DemoBadge show={p.isDemo} />
                      </span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted">Statistiques</h2>
        <Card>
          <p className="text-sm text-muted">
            Aucune statistique affichée ici tant qu&apos;aucun chiffre n&apos;a été saisi ou récupéré via une intégration officielle.{" "}
            <Link href="/statistiques" className="text-violet-soft underline underline-offset-2">
              Voir le module
            </Link>
          </p>
        </Card>
      </section>
    </>
  );
}
