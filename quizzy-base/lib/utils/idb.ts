import { IDBPDatabase } from "idb";


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
