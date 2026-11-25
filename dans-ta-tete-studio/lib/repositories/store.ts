"use client";

import type { DataStore } from "./types";
import { IndexedDbStore } from "./indexeddb";

let store: DataStore | null = null;

/** Point d'accès unique au stockage. En phase 2, on choisira ici l'implémentation Supabase. */
export function getStore(): DataStore {
  store ??= new IndexedDbStore();
  return store;
}
