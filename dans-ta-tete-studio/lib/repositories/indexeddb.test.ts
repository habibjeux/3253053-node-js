import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { IndexedDbStore } from "./indexeddb";

describe("IndexedDbStore", () => {
  it("insère la démo, crée, modifie, exporte et efface la démo", async () => {
    const store = new IndexedDbStore("test-" + Math.random());
    expect(await store.seedDemoIfEmpty()).toBe(true);
    expect(await store.seedDemoIfEmpty()).toBe(false);

    const ideas = store.repo("ideas");
    const mine = await ideas.create({ titre: "Mon idée", angle: "", theme: "cerveau", statut: "brouillon", priorite: "haute", tags: [] });
    expect(mine.isDemo).toBe(false);
    const upd = await ideas.update(mine.id, { statut: "validée" });
    expect(upd.statut).toBe("validée");
    expect(upd.createdAt).toBe(mine.createdAt);

    const backup = await store.exportAll();
    expect(backup.data.ideas).toHaveLength(5);

    await store.clearDemo();
    const left = await ideas.list();
    expect(left.map((i) => i.titre)).toEqual(["Mon idée"]);

    await store.importAll(backup);
    expect(await ideas.list()).toHaveLength(5);
  });

  it("refuse une entité invalide", async () => {
    const store = new IndexedDbStore("test-" + Math.random());
    // @ts-expect-error thème inconnu
    await expect(store.repo("ideas").create({ titre: "", theme: "inconnu" })).rejects.toThrow();
  });
});
