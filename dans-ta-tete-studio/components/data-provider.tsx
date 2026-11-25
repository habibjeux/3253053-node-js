"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { CollectionName, EntityOf } from "@/lib/domain/schemas";
import { getStore } from "@/lib/repositories/store";

type Ctx = { ready: boolean; version: number; refresh: () => void; error: string | null };
const DataCtx = createContext<Ctx>({ ready: false, version: 0, refresh: () => {}, error: null });

/** Ouvre le stockage local, insère la démo au premier lancement, et notifie les écrans après chaque modification. */
export function DataProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [version, setVersion] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    getStore()
      .seedDemoIfEmpty()
      .then(() => setReady(true))
      .catch(() => setError("Le stockage local n'est pas disponible (navigation privée ?). Les données ne pourront pas être sauvegardées."));
  }, []);

  return <DataCtx.Provider value={{ ready, version, refresh, error }}>{children}</DataCtx.Provider>;
}

export function useData() {
  return useContext(DataCtx);
}

/** Liste réactive d'une collection. */
export function useCollection<C extends CollectionName>(name: C) {
  const { ready, version } = useData();
  const [items, setItems] = useState<EntityOf<C>[] | null>(null);
  useEffect(() => {
    if (!ready) return;
    let alive = true;
    getStore()
      .repo(name)
      .list()
      .then((rows) => alive && setItems(rows));
    return () => {
      alive = false;
    };
  }, [name, ready, version]);
  return items;
}
