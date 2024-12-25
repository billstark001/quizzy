import { DatabaseUpdateDefinition, openDatabase } from "../utils/idb";
import { IDBPDatabase } from "idb";



export type EditRecord<T = any> = {
  id: string;
  type: string;
  localId: string;
  lastModify: number;
  content: T;
};

const STORE_KEY_CACHE = 'cache';

export const DB_KEY = 'Quizzy Edit Cache';
export const VERSION = 1;

export const updaters: Record<number, DatabaseUpdateDefinition> = {
  [0]: (db) => {
    const cacheStore = db.createObjectStore(STORE_KEY_CACHE, { keyPath: 'id', });
    cacheStore.createIndex('type', 'type');
    cacheStore.createIndex('localId', 'localId');
    cacheStore.createIndex('lastModify', 'lastModify');
  }
} as const;

const createId = (type: string, localId: string) => `${type}+${localId}`;


export class QuizzyEditCache {

  private readonly db: IDBPDatabase;
  protected constructor(db: IDBPDatabase) {
    this.db = db;
  }
  static async connect() {
    const db = await openDatabase(DB_KEY, VERSION, updaters);
    return new QuizzyEditCache(db);
  }

  async loadRecord<T = any>(type: string, localId: string): Promise<T | undefined>;
  async loadRecord<T = any>(type: string, localId: string, def: T): Promise<T>;
  async loadRecord<T = any>(type: string, localId: string, def?: T) {
    const id = createId(type, localId);
    const ret = await this.db.get(STORE_KEY_CACHE, id) as EditRecord<T> | undefined;
    return ret?.content ?? def;
  }

  async dumpRecord<T = any>(
    type: string, value: T, localId?: string
  ): Promise<void> {
    localId = localId || (value as any)?.id;
    if (!localId) {
      throw new Error('Empty ID');
    }
    const id = createId(type, localId);
    await this.db.put(STORE_KEY_CACHE, {
      id, type, localId,
      lastModify: Date.now(),
      content: value,
    } as EditRecord<T>);
  }

  async clearRecord(
    type: string, localId?: string
  ): Promise<number> {
    const tx = this.db.transaction(STORE_KEY_CACHE, 'readwrite');
    let ret = 0;
    if (localId !== undefined) {
      const id = createId(type, localId);
      const obj = !!tx.store.get(id);
      if (obj) {
        tx.store.delete(id);
        ret = 1;
      }
    } else {
      // delete all records of the type
      const ids = await tx.store.index('type').getAllKeys();
      await Promise.all(ids.map(id => tx.store.delete(id)));
      ret = ids.length;
    }
    await tx.done;
    return ret;
  }

  async listRecords<T = any>(type: string) {
    return await this.db.getAllFromIndex(STORE_KEY_CACHE, 'type', type) as T[];
  }
}
