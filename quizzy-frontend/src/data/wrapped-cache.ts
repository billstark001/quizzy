import { openDatabase } from "@quizzy/common/utils";
import { IDBPDatabase } from "idb";
import { withHandler } from "@/components/handler";

import { DB_KEY, VERSION, updaters, QuizzyEditCache } from "@quizzy/common/db/edit-cache";

export class WrappedQuizzyEditCache extends QuizzyEditCache {

  private readonly boundLoadRecord: <T = any>(type: string, localId: string, def?: T) => Promise<T | undefined>;
  private readonly boundDumpRecord: <T = any>(type: string, value: T, localId?: string) => Promise<void>;
  private readonly boundClearRecord: (type: string, localId?: string) => Promise<number>;
  private readonly boundListRecords: <T = any>(type: string) => Promise<T[]>;

  protected constructor(db: IDBPDatabase) {
    super(db);
    this.boundLoadRecord = withHandler(super.loadRecord.bind(this), { async: true, cache: false, notifySuccess: undefined });
    this.boundDumpRecord = withHandler(super.dumpRecord.bind(this), { async: true, cache: false });
    this.boundClearRecord = withHandler(super.clearRecord.bind(this), { async: true, cache: false });
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

  override async dumpRecord<T = any>(type: string, value: T, localId?: string): Promise<void> {
    return await this.boundDumpRecord(type, value, localId);
  }

  override async clearRecord(type: string, localId?: string): Promise<number> {
    return await this.boundClearRecord(type, localId);
  }

  override async listRecords<T = any>(type: string): Promise<T[]> {
    return await this.boundListRecords(type);
  }
}