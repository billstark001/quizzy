import { DatabaseUpdateDefinition, openDatabase } from "#/utils/idb";
import { IDBPDatabase } from "idb";
import { DatabaseIndexed } from "../types/technical";
import { withHandler } from "#/utils";



export type EditRecord<T = any> = {
  id: string;
  type: string;
  localId: string;
  lastModify: number;
  content: T;
};

const STORE_KEY_CACHE = 'cache';
const DB_KEY = 'Quizzy Edit Cache';
const VERSION = 1;

const updaters: Record<number, DatabaseUpdateDefinition> = {
  [0]: (db) => {
    const cacheStore = db.createObjectStore(STORE_KEY_CACHE, { keyPath: 'id', });
    cacheStore.createIndex('type', 'type');
    cacheStore.createIndex('localId', 'localId', { unique: true });
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

  async dumpRecord<T extends DatabaseIndexed = any>(
    type: string, value: T, localId?: string
  ): Promise<void> {
    localId = localId || value?.id;
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

  async listRecords<T = any>(type: string) {
    return await this.db.getAllFromIndex(STORE_KEY_CACHE, 'type', type) as T[];
  }
}

export class WrappedQuizzyEditCache extends QuizzyEditCache {

  private readonly boundLoadRecord: <T = any>(type: string, localId: string, def?: T) => Promise<T | undefined>;
  private readonly boundDumpRecord: <T extends DatabaseIndexed = any>(type: string, value: T, localId?: string) => Promise<void>;
  private readonly boundListRecords: <T = any>(type: string) => Promise<T[]>;

  protected constructor(db: IDBPDatabase) {
    super(db);
    this.boundLoadRecord = withHandler(super.loadRecord.bind(this), { async: true, cache: false, notifySuccess: undefined });
    this.boundDumpRecord = withHandler(super.dumpRecord.bind(this), { async: true, cache: false });
    this.boundListRecords = withHandler(super.listRecords.bind(this), { async: true, cache: false, notifySuccess: undefined });
  }
  static async connect() {
    const db = await openDatabase(DB_KEY, VERSION, updaters);
    return new WrappedQuizzyEditCache(db);
  }

  override async loadRecord<T = any>(type: string, localId: string): Promise<T | undefined>;
  override async loadRecord<T = any>(type: string, localId: string, def: T): Promise<T>;
  override async loadRecord<T = any>(type: string, localId: string, def?: T): Promise<T | undefined> {
    return await this.boundLoadRecord(type, localId, def);
  }

  override async dumpRecord<T extends DatabaseIndexed = any>(type: string, value: T, localId?: string): Promise<void> {
    return await this.boundDumpRecord(type, value, localId);
  }

  override async listRecords<T = any>(type: string): Promise<T[]> {
    return await this.boundListRecords(type);
  }
}