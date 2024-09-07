import { CompleteQuizPaperDraft, EndQuizOptions, ID, Question, QuizPaper, QuizRecord, QuizzyController, StartQuizOptions, UpdateQuizOptions } from "#/types";
import { IDBPDatabase, openDB } from "idb";
import { separatePaperAndQuestions, toCompleted } from "./paper-id";
import { uuidV4B64 } from "#/utils";
import { QuizResult } from "#/types/quiz-result";


const DB_KEY = 'Quizzy';
const VERSION = 1;
// const HISTORY_VERSIONS = Object.freeze([
// ]);

const STORE_KEY_PAPER = 'papers';
const STORE_KEY_RECORD = 'records';
const STORE_KEY_QUESTION = 'questions';
const STORE_KEY_RESULT = 'results';


type DBUpdater = (db: IDBPDatabase) => void;
const updaters: Record<number, DBUpdater> = {
  [0]: (db) => {
    const _id: IDBObjectStoreParameters = { keyPath: 'id', };
    const paperStore = db.createObjectStore(STORE_KEY_PAPER, _id);
    const recordStore = db.createObjectStore(STORE_KEY_RECORD, _id);
    const questionStore = db.createObjectStore(STORE_KEY_QUESTION, _id);
    for (const store of [paperStore, questionStore]) {
      store.createIndex('name', 'name');
      store.createIndex('tags', 'tags', { multiEntry: true });
    }
    for (const key of ['paperId', 'paused', 'startTime', 'updateTime']) {
      recordStore.createIndex(key, key);
    }
  },
  [1]: (db) => {
    const _id: IDBObjectStoreParameters = { keyPath: 'id', };
    const resultStore = db.createObjectStore(STORE_KEY_RESULT, _id);
    for (const key of ['paperId', 'startTime',]) {
      resultStore.createIndex(key, key);
    }
  }
}

export class IDBController implements QuizzyController {

  private readonly db: IDBPDatabase;
  private constructor(db: IDBPDatabase) {
    this.db = db;
  }

  static async connect() {
    const db = await openDB(DB_KEY, VERSION, {
      upgrade(db, oldVersion, newVersion) {
        if (newVersion == null || newVersion < oldVersion) {
          return; // either delete or errored
        }
        for (let i = oldVersion; i < newVersion; ++i) {
          updaters[i]?.(db);
        }
      },
    });
    return new IDBController(db);
  }

  private async _import<T extends { id: ID }>(store: string, items: T[]): Promise<ID[]> {
    const tx = this.db.transaction(store, 'readwrite');
    const ids: ID[] = [];
    const promises: Promise<any>[] = [];
    for (const q of items) {
      promises.push(tx.store.add(q));
      ids.push(q.id);
    }
    await Promise.all(promises);
    await tx.done;
    return ids;
  }

  async importQuestions(...questions: Question[]): Promise<ID[]> {
    return this._import(STORE_KEY_QUESTION, questions);
  }

  async importQuizPapers(...papers: QuizPaper[]): Promise<ID[]> {
    return this._import(STORE_KEY_PAPER, papers);
  }


  async importCompleteQuizPapers(...papers: CompleteQuizPaperDraft[]): Promise<string[]> {
    const purePapers: QuizPaper[] = [];
    for (const _paper of papers) {
      const paper = await toCompleted(_paper, (id) => this.db.get(STORE_KEY_PAPER, id).then(x => x != null));
      const [purePaper, questions] = separatePaperAndQuestions(paper);
      purePapers.push(purePaper);
      await this.importQuestions(...questions);
    }
    return await this.importQuizPapers(...purePapers);
  }

  async getQuizPaperNames(...ids: ID[]): Promise<(string | undefined)[]> {
    const ret: (string | undefined)[] = [];
    for (const id of ids) {
      ret.push((await this.db.get(STORE_KEY_PAPER, id))?.name);
    }
    return ret;
  }

  getQuizPaper(id: ID): Promise<QuizPaper | undefined> {
    return this.db.get(STORE_KEY_PAPER, id);
  }

  async getQuestions(ids: ID[]): Promise<(Question | undefined)[]> {
    const ret: (Question | undefined)[] = [];
    for (const id of ids) {
      ret.push(await this.db.get(STORE_KEY_QUESTION, id));
    }
    return ret;
  }

  listQuizPaperIds(): Promise<ID[]> {
    return this.db.getAllKeys(STORE_KEY_PAPER) as Promise<ID[]>;
  }

  listQuestionsIds(): Promise<ID[]> {
    return this.db.getAllKeys(STORE_KEY_QUESTION) as Promise<ID[]>;
  }

  async importQuizRecords(...records: QuizRecord[]): Promise<ID[]> {
    return this._import(STORE_KEY_RECORD, records);
  }

  getQuizRecord(id: ID): Promise<QuizRecord | undefined> {
    return this.db.get(STORE_KEY_RECORD, id);
  }

  listQuizRecords(quizPaperID?: ID): Promise<QuizRecord[]> {
    if (!quizPaperID) {
      return this.db.getAll(STORE_KEY_RECORD);
    }
    return this.db.getAllFromIndex(STORE_KEY_RECORD, 'paperID', quizPaperID);
  }

  listQuizRecordIds(quizPaperID?: ID): Promise<ID[]> {
    if (!quizPaperID) {
      return this.db.getAllKeys(STORE_KEY_RECORD) as Promise<ID[]>;
    }
    return this.db.getAllKeysFromIndex(STORE_KEY_RECORD, 'paperID', quizPaperID) as Promise<ID[]>;
  }

  async startQuiz(id: ID, options?: StartQuizOptions | undefined): Promise<QuizRecord> {
    const t = options?.timestamp ?? Date.now();
    const record: QuizRecord = {
      id: '',
      paperId: id,
      paused: false,
      startTime: t,
      updateTime: t,
      timeUsed: 0,
      answers: {},
      ...(options?.record ?? {}),
    };
    const tx = this.db.transaction(STORE_KEY_RECORD, 'readwrite');
    do {
      record.id = uuidV4B64();
    } while (!!await tx.store.get(record.id));
    await tx.store.add(record);
    await tx.done;

    return record;
  }

  async updateQuiz(id: ID, record: Partial<QuizRecord>, options?: UpdateQuizOptions | undefined): Promise<QuizRecord> {
    const tx = this.db.transaction(STORE_KEY_RECORD, 'readwrite');
    const oldRecord = await tx.store.get(id) as QuizRecord | undefined;
    if (!oldRecord) {
      throw new Error('Invalid record ID');
    }
    const t = options?.timestamp ?? Date.now();
    const newRecord = {
      ...oldRecord,
      ...record,
      answers: {
        ...oldRecord.answers,
        ...record.answers,
      },
      id: oldRecord.id,
      updateTime: t,
    };
    if (!options?.ignoreTimeUsed) {
      newRecord.timeUsed = oldRecord.timeUsed + (t - oldRecord.updateTime);
    }
    await tx.store.put(newRecord);
    await tx.done;
    return newRecord;
  }


  endQuiz(id: ID, options?: EndQuizOptions): Promise<ID | undefined> {
    throw new Error("Method not implemented.");
  }
  importQuizResults(...results: QuizResult[]): Promise<ID[]> {
    throw new Error("Method not implemented.");
  }
  getQuizResult(id: ID): Promise<QuizResult | undefined> {
    throw new Error("Method not implemented.");
  }
  listQuizResultIds(quizPaperID?: ID): Promise<ID[]> {
    throw new Error("Method not implemented.");
  }


}