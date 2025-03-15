import { DBSchema, IDBPDatabase, IDBPTransaction, IndexNames, openDB, StoreNames } from "idb";


export type Nullable<T> = T | null | undefined;

export type DatabaseUpdateDefinition<T = unknown> = (db: IDBPDatabase<T>, tx: IDBPTransaction<T, ArrayLike<StoreNames<T>>, "versionchange">) => void;

export const openDatabase = async <T = unknown>(
  key: string, 
  version: number, 
  updaters: Readonly<Record<number, DatabaseUpdateDefinition<T>>>
) => {
  const db = await openDB<T>(key, version, {
    upgrade(db, oldVersion, newVersion, transaction) {
      if (newVersion == null || newVersion < oldVersion) {
        return; // either delete or errored
      }
      for (let i = oldVersion; i < newVersion; ++i) {
        updaters[i]?.(db, transaction);
      }
    },
  });
  return db;
};

export const getAllMultiEntryValues = async <
  T extends DBSchema | unknown = unknown,
>(
  db: IDBPDatabase<T>,
  storeName: StoreNames<T>,
  indexName: IndexNames<T, StoreNames<T>>,
): Promise<string[]> => {
  const uniqueValues = new Set<string>();
  const tx = db.transaction(storeName);

  let cursor = await tx
    .store
    .index(indexName)
    .openKeyCursor();

  while (cursor) {
    uniqueValues.add(cursor.key as string);
    cursor = await cursor.continue();
  }

  await tx.done;

  return Array.from(uniqueValues);
};

export const searchByTag = async (
  db: IDBPDatabase, store: string,
  tag: string, index = 'tags'
) => {
  const tx = db.transaction(store, 'readonly');
  const txIndex = tx.store.index(index);
  return txIndex.getAll(tag);
};

interface BackupData {
  [storeName: string]: any[];
}


export const backupDatabase = async (
  db: IDBPDatabase,
  storeNames: string[]
): Promise<BackupData> => {

  const backup: BackupData = {};
  await Promise.all(storeNames.map(async (storeName) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    backup[storeName] = await store.getAll();
  }));
  return backup;
};


export const restoreDatabase = async (
  db: IDBPDatabase,
  backupData: BackupData,
  clear = true,
): Promise<void> => {

  for (const [storeName, data] of Object.entries(backupData)) {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    if (clear) {
      await store.clear();
    }
    for (const item of data) {
      await store.add(item);
    }
    await tx.done;
  }
};
