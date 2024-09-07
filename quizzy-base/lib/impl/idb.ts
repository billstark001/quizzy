import { CompleteQuizPaperDraft, ID, Question, QuizPaper, QuizRecord, QuizzyController, StartQuizOptions, UpdateQuizOptions } from "#/types";
import { IDBPDatabase, openDB } from "idb";
import { separatePaperAndQuestions, toCompleted } from "./paper-id";
import { uuidV4B64 } from "#/utils";


const DB_KEY = 'Quizzy';
const VERSION = 1;
// const HISTORY_VERSIONS = Object.freeze([
// ]);

const STORE_KEY_PAPER = 'papers';
const STORE_KEY_RECORD = 'records';
const STORE_KEY_QUESTION = 'questions';

const RECORD_INDEX_KEYS = Object.freeze<(keyof QuizRecord)[]>([
  'paperId', 'paused', 'startTime', 'updateTime',
])

export class IDBController implements QuizzyController {

  private readonly db: IDBPDatabase;
  private constructor(db: IDBPDatabase) {
    this.db = db;
  }

  static async connect() {
    const db = await openDB(DB_KEY, VERSION, {
      upgrade(db) {
        const _id: IDBObjectStoreParameters = { keyPath: 'id', };
        const paperStore = db.createObjectStore(STORE_KEY_PAPER, _id);
        const recordStore = db.createObjectStore(STORE_KEY_RECORD, _id);
        const questionStore = db.createObjectStore(STORE_KEY_QUESTION, _id);
        for (const store of [paperStore, questionStore]) {
          store.createIndex('name', 'name');
          store.createIndex('tags', 'tags', { multiEntry: true });
        }
        for (const key of RECORD_INDEX_KEYS) {
          recordStore.createIndex(key, key);
        }
      },
    });
    return new IDBController(db);
  }

  async importQuestions(...questions: Question[]): Promise<ID[]> {
    const tx = this.db.transaction(STORE_KEY_QUESTION, 'readwrite');
    const ids: ID[] = [];
    const promises: Promise<any>[] = [];
    for (const q of questions) {
      promises.push(tx.store.add(q));
      ids.push(q.id);
    }
    await Promise.all(promises);
    await tx.done;
    return ids;
  }

  async importQuizPapers(...papers: QuizPaper[]): Promise<ID[]> {
    const tx = this.db.transaction(STORE_KEY_PAPER, 'readwrite');
    const ids: ID[] = [];
    const promises: Promise<any>[] = [];
    for (const p of papers) {
      promises.push(tx.store.add(p));
      ids.push(p.id);
    }
    await Promise.all(promises);
    await tx.done;
    return ids;
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
    const tx = this.db.transaction(STORE_KEY_RECORD, 'readwrite');
    const ids: ID[] = [];
    const promises: Promise<any>[] = [];
    for (const r of records) {
      promises.push(tx.store.add(r));
      ids.push(r.id);
    }
    await Promise.all(promises);
    await tx.done;
    return ids;
  }

  getQuizRecord(id: ID): Promise<QuizRecord | undefined> {
    return this.db.get(STORE_KEY_RECORD, id);
  }

  listQuizRecords(quizPaperID?: ID): Promise<QuizRecord[]> {
    return this.db.getAllFromIndex(STORE_KEY_RECORD, 'paperID', quizPaperID);
  }

  listQuizRecordIds(quizPaperID?: ID): Promise<ID[]> {
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

}