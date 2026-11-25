import { z } from "zod";
import { COLLECTIONS, SCHEMAS, type CollectionName } from "@/lib/domain/schemas";
import type { Backup } from "./types";

/** Valide une sauvegarde importée : chaque entité est revalidée par son schéma. */
export function parseBackup(raw: unknown): Backup {
  const head = z
    .object({ app: z.literal("dans-ta-tete-studio"), schemaVersion: z.literal(1), exportedAt: z.string(), data: z.record(z.string(), z.array(z.unknown())) })
    .parse(raw);
  const data = {} as Backup["data"];
  for (const c of COLLECTIONS) {
    const items = head.data[c] ?? [];
    (data as Record<CollectionName, unknown[]>)[c] = items.map((it) => SCHEMAS[c].parse(it));
  }
  return { app: head.app, schemaVersion: 1, exportedAt: head.exportedAt, data };
}
