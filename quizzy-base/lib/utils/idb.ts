import { IDBPDatabase } from "idb";



export const searchByTag = async (
  db: IDBPDatabase, store: string, 
  tag: string, index = 'tags'
) => {
  const tx = db.transaction(store, 'readonly');
  const txIndex = tx.store.index(index);
  return txIndex.getAll(tag);
};