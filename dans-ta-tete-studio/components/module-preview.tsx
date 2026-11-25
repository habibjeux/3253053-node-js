"use client";

import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import type { CollectionName, EntityOf } from "@/lib/domain/schemas";
import { useCollection } from "@/components/data-provider";
import { Card, DemoBadge, EmptyState, PageHeader } from "@/components/ui";

/**
 * Écran provisoire d'un module (étape 1) : affiche les données sauvegardées en lecture seule
 * et annonce l'étape où l'édition complète arrivera.
 */
export function ModulePreview<C extends CollectionName>({
  title,
  subtitle,
  collection,
  etape,
  empty,
  render,
}: {
  title: string;
  subtitle: string;
  collection: C;
  etape: number;
  empty: string;
  render: (item: EntityOf<C>) => { titre: string; meta?: ReactNode; detail?: string };
}) {
  const items = useCollection(collection);
  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />
      <div className="mb-5 flex items-center gap-2 rounded-xl border border-violet/30 bg-violet/10 px-3 py-2 text-xs text-violet-soft">
        <Sparkles className="size-3.5 shrink-0" aria-hidden />
        Lecture seule pour l&apos;instant : la création et l&apos;édition arrivent à l&apos;étape {etape}.
      </div>
      {items === null ? (
        <div className="grid gap-3" aria-busy="true">
          {[0, 1].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-card bg-surface" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState title={empty} />
      ) : (
        <ul className="grid gap-3">
          {items.map((it) => {
            const r = render(it);
            return (
              <li key={it.id}>
                <Card>
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium">{r.titre}</p>
                    <DemoBadge show={it.isDemo} />
                  </div>
                  {r.detail && <p className="mt-1 line-clamp-2 text-sm text-muted">{r.detail}</p>}
                  {r.meta && <div className="mt-3 flex flex-wrap gap-1.5">{r.meta}</div>}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
