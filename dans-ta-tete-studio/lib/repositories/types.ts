import type { CollectionName, EntityOf } from "@/lib/domain/schemas";

/** Données saisies par l'utilisateur (sans les champs gérés par le dépôt). */
export type NewEntity<C extends CollectionName> = Omit<EntityOf<C>, "id" | "createdAt" | "updatedAt" | "isDemo"> & {
  isDemo?: boolean;
};

/**
 * Contrat unique d'accès aux données.
 * Phase 1 : implémentation IndexedDB (navigateur). Phase 2 : implémentation Supabase.
 * Les modules ne dépendent que de cette interface.
 */
export interface Repository<C extends CollectionName> {
  list(): Promise<EntityOf<C>[]>;
  get(id: string): Promise<EntityOf<C> | undefined>;
  create(data: NewEntity<C>): Promise<EntityOf<C>>;
  update(id: string, patch: Partial<NewEntity<C>>): Promise<EntityOf<C>>;
  remove(id: string): Promise<void>;
}

export interface DataStore {
  repo<C extends CollectionName>(name: C): Repository<C>;
  /** Exporte toutes les collections (sauvegarde JSON). */
  exportAll(): Promise<Backup>;
  /** Remplace toutes les données par une sauvegarde validée. */
  importAll(backup: Backup): Promise<void>;
  /** Supprime uniquement les données de démonstration. */
  clearDemo(): Promise<number>;
  /** Insère les données de démonstration si la base est vide. Renvoie true si elles ont été ajoutées. */
  seedDemoIfEmpty(): Promise<boolean>;
}

export type Backup = {
  app: "dans-ta-tete-studio";
  schemaVersion: 1;
  exportedAt: string;
  data: { [C in CollectionName]: EntityOf<C>[] };
};
