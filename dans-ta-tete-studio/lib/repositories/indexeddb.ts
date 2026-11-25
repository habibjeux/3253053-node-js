"use client";

import { openDB, type IDBPDatabase } from "idb";
import { COLLECTIONS, SCHEMAS, type CollectionName, type EntityOf } from "@/lib/domain/schemas";
import { buildDemoData } from "@/lib/demo/data";
import type { Backup, DataStore, NewEntity, Repository } from "./types";

const DB_NAME = "dans-ta-tete-studio";
const DB_VERSION = 1;

function now() {
  return new Date().toISOString();
}
export function newId() {
  return crypto.randomUUID();
}

/** Implémentation phase 1 : tout est stocké dans IndexedDB, sur l'appareil de l'utilisateur. */
export class IndexedDbStore implements DataStore {
  private dbp: Promise<IDBPDatabase>;

  constructor(name = DB_NAME, factory?: IDBFactory) {
    if (factory) (globalThis as { indexedDB?: IDBFactory }).indexedDB ??= factory;
    this.dbp = openDB(name, DB_VERSION, {
      upgrade(db) {
        for (const c of COLLECTIONS) if (!db.objectStoreNames.contains(c)) db.createObjectStore(c, { keyPath: "id" });
      },
    });
  }

  repo<C extends CollectionName>(name: C): Repository<C> {
    const dbp = this.dbp;
    const schema = SCHEMAS[name];
    type E = EntityOf<C>;
    const get = async (id: string) => {
      const raw = await (await dbp).get(name, id);
      return raw === undefined ? undefined : (schema.parse(raw) as E);
    };
    return {
      async list() {
        const rows = await (await dbp).getAll(name);
        return rows
          .map((r) => schema.parse(r) as E)
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      },
      get,
      async create(data: NewEntity<C>) {
        const t = now();
        const entity = schema.parse({ ...data, id: newId(), createdAt: t, updatedAt: t, isDemo: data.isDemo ?? false }) as E;
        await (await dbp).put(name, entity);
        return entity;
      },
      async update(id: string, patch: Partial<NewEntity<C>>) {
        const current = await get(id);
        if (!current) throw new Error("Élément introuvable");
        const entity = schema.parse({ ...current, ...patch, id, createdAt: current.createdAt, updatedAt: now() }) as E;
        await (await dbp).put(name, entity);
        return entity;
      },
      async remove(id: string) {
        await (await dbp).delete(name, id);
      },
    };
  }

  async exportAll(): Promise<Backup> {
    const db = await this.dbp;
    const data = {} as Backup["data"];
    for (const c of COLLECTIONS) (data as Record<string, unknown[]>)[c] = await db.getAll(c);
    return { app: "dans-ta-tete-studio", schemaVersion: 1, exportedAt: now(), data };
  }

  async importAll(backup: Backup) {
    const db = await this.dbp;
    const tx = db.transaction(COLLECTIONS, "readwrite");
    for (const c of COLLECTIONS) {
      const store = tx.objectStore(c);
      await store.clear();
      for (const item of backup.data[c]) await store.put(item);
    }
    await tx.done;
  }

  async clearDemo() {
    const db = await this.dbp;
    const tx = db.transaction(COLLECTIONS, "readwrite");
    let n = 0;
    for (const c of COLLECTIONS) {
      const store = tx.objectStore(c);
      for (const item of (await store.getAll()) as { id: string; isDemo?: boolean }[]) {
        if (item.isDemo) {
          await store.delete(item.id);
          n++;
        }
      }
    }
    await tx.done;
    return n;
  }

  async seedDemoIfEmpty() {
    const db = await this.dbp;
    for (const c of COLLECTIONS) if ((await db.count(c)) > 0) return false;
    // Ne ré-insère pas la démo si l'utilisateur l'a déjà effacée volontairement.
    if (typeof localStorage !== "undefined") {
      try {
        if (localStorage.getItem("dtt:demo-cleared") === "1") return false;
      } catch {
        /* stockage indisponible : on continue */
      }
    }
    const demo = buildDemoData(now());
    const tx = db.transaction(COLLECTIONS, "readwrite");
    for (const c of COLLECTIONS) for (const item of demo[c]) await tx.objectStore(c).put(item);
    await tx.done;
    return true;
  }
}
