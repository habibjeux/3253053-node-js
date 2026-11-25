import { describe, expect, it } from "vitest";
import { ScriptSchema } from "@/lib/domain/schemas";
import { estimateDurationSec, missingParts } from "./script";
import { buildDemoData } from "@/lib/demo/data";
import { parseBackup } from "@/lib/repositories/backup";

const t = new Date().toISOString();
const base = { id: "x", createdAt: t, updatedAt: t, titre: "Test" };

describe("script", () => {
  it("liste les 7 parties manquantes d'un script vide", () => {
    expect(missingParts(ScriptSchema.parse(base))).toHaveLength(7);
  });
  it("le script de démo est complet", () => {
    const s = buildDemoData(t).scripts[0]!;
    expect(missingParts(s)).toEqual([]);
    expect(estimateDurationSec(s)).toBeGreaterThan(10);
  });
  it("estime ~60 s pour 150 mots", () => {
    const s = ScriptSchema.parse({ ...base, accroche: Array(150).fill("mot").join(" ") });
    expect(estimateDurationSec(s)).toBe(60);
  });
});

describe("démo et sauvegarde", () => {
  it("toutes les données de démo sont marquées et aucune statistique n'est inventée", () => {
    const d = buildDemoData(t);
    expect(d.stats).toEqual([]);
    for (const items of Object.values(d)) for (const it of items) expect(it.isDemo).toBe(true);
  });
  it("une sauvegarde valide est relue, une invalide est refusée", () => {
    const backup = { app: "dans-ta-tete-studio", schemaVersion: 1, exportedAt: t, data: buildDemoData(t) };
    expect(parseBackup(JSON.parse(JSON.stringify(backup))).data.ideas).toHaveLength(4);
    expect(() => parseBackup({ app: "autre" })).toThrow();
  });
});
