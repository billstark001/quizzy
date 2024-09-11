import { CompleteQuizPaperDraft, EndQuizOptions, ID, Question, QuizPaper, QuizRecord, QuizzyController, StartQuizOptions, Stat, UpdateQuizOptions } from "#/types";
import { IDBPDatabase, openDB } from "idb";
import { separatePaperAndQuestions, toCompleted } from "./paper-id";
import { uuidV4B64 } from "#/utils";
import { QuizResult } from "#/types/quiz-result";
import { createResultAndStatPatches } from "./result";


const DB_KEY = 'Quizzy';
const VERSION = 2;

const STORE_KEY_PAPERS = 'papers';
const STORE_KEY_RECORDS = 'records';
const STORE_KEY_QUESTIONS = 'questions';
const STORE_KEY_RESULTS = 'results';
const STORE_KEY_STATS = 'stats';

// TODO implement optimistic lock
export type VersionRecord = {
  _version: number;
};

type DBUpdater = (db: IDBPDatabase) => void;
const updaters: Record<number, DBUpdater> = {
  [0]: (db) => {
    const _id: IDBObjectStoreParameters = { keyPath: 'id', };
    const paperStore = db.createObjectStore(STORE_KEY_PAPERS, _id);
    const recordStore = db.createObjectStore(STORE_KEY_RECORDS, _id);
    const questionStore = db.createObjectStore(STORE_KEY_QUESTIONS, _id);
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
    const resultStore = db.createObjectStore(STORE_KEY_RESULTS, _id);
    const statStore = db.createObjectStore(STORE_KEY_STATS, _id);
    for (const key of ['paperId', 'startTime',]) {
      resultStore.createIndex(key, key);
    }
    statStore.createIndex('tag', 'tag', { unique: true });
    statStore.createIndex('alternatives', 'alternatives', { multiEntry: true });
    statStore.createIndex('percentage', 'percentage');
  }
};

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
    return this._import(STORE_KEY_QUESTIONS, questions);
  }

  async importQuizPapers(...papers: QuizPaper[]): Promise<ID[]> {
    return this._import(STORE_KEY_PAPERS, papers);
  }


  async importCompleteQuizPapers(...papers: CompleteQuizPaperDraft[]): Promise<string[]> {
    const purePapers: QuizPaper[] = [];
    for (const _paper of papers) {
      const paper = await toCompleted(_paper, (id) => this.db.get(STORE_KEY_PAPERS, id).then(x => x != null));
      const [purePaper, questions] = separatePaperAndQuestions(paper);
      purePapers.push(purePaper);
      await this.importQuestions(...questions);
    }
    return await this.importQuizPapers(...purePapers);
  }

  async getQuizPaperNames(...ids: ID[]): Promise<(string | undefined)[]> {
    const ret: (string | undefined)[] = [];
    for (const id of ids) {
      ret.push((await this.db.get(STORE_KEY_PAPERS, id))?.name);
    }
    return ret;
  }

  getQuizPaper(id: ID): Promise<QuizPaper | undefined> {
    return this.db.get(STORE_KEY_PAPERS, id);
  }

  async getQuestions(ids: ID[]): Promise<(Question | undefined)[]> {
    const ret: (Question | undefined)[] = [];
    for (const id of ids) {
      ret.push(await this.db.get(STORE_KEY_QUESTIONS, id));
    }
    return ret;
  }

  listQuizPaperIds(): Promise<ID[]> {
    return this.db.getAllKeys(STORE_KEY_PAPERS) as Promise<ID[]>;
  }

  listQuestionsIds(): Promise<ID[]> {
    return this.db.getAllKeys(STORE_KEY_QUESTIONS) as Promise<ID[]>;
  }

  async importQuizRecords(...records: QuizRecord[]): Promise<ID[]> {
    return this._import(STORE_KEY_RECORDS, records);
  }

  getQuizRecord(id: ID): Promise<QuizRecord | undefined> {
    return this.db.get(STORE_KEY_RECORDS, id);
  }

  listQuizRecords(quizPaperID?: ID): Promise<QuizRecord[]> {
    if (!quizPaperID) {
      return this.db.getAll(STORE_KEY_RECORDS);
    }
    return this.db.getAllFromIndex(STORE_KEY_RECORDS, 'paperID', quizPaperID);
  }

  listQuizRecordIds(quizPaperID?: ID): Promise<ID[]> {
    if (!quizPaperID) {
      return this.db.getAllKeys(STORE_KEY_RECORDS) as Promise<ID[]>;
    }
    return this.db.getAllKeysFromIndex(STORE_KEY_RECORDS, 'paperID', quizPaperID) as Promise<ID[]>;
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
    const tx = this.db.transaction(STORE_KEY_RECORDS, 'readwrite');
    do {
      record.id = uuidV4B64();
    } while (!!await tx.store.get(record.id));
    await tx.store.add(record);
    await tx.done;

    return record;
  }

  async updateQuiz(id: ID, record: Partial<QuizRecord>, options?: UpdateQuizOptions | undefined): Promise<QuizRecord> {
    const tx = this.db.transaction(STORE_KEY_RECORDS, 'readwrite');
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


  async endQuiz(id: ID, _options?: EndQuizOptions): Promise<ID | undefined> {
    
    // read necessary data
    const r = await this.getQuizRecord(id);
    if (!r) {
      return;
    }
    const p = await this.getQuizPaper(r.paperId);
    if (!p) {
      return;
    }
    const q: Record<ID, Question> = Object.fromEntries(
      (await this.getQuestions(p.questions)).filter(q => !!q)
        .map(q => [q.id, q]),
    );
    // create result and patches
    const [result, patches] = createResultAndStatPatches(r, p, q);
    

    // create write transactions
    const tx = this.db.transaction([
      STORE_KEY_RESULTS, STORE_KEY_STATS, STORE_KEY_RECORDS,
    ], 'readwrite');

    // put the result into the store
    const _sr = tx.objectStore(STORE_KEY_RESULTS);
    while (!!await _sr.get(result.id)) {
      result.id = uuidV4B64();
    }
    _sr.add(result);

    // delete original record
    // await tx.objectStore(STORE_KEY_RECORDS).delete(id);

    // patch stats
    const _ss = tx.objectStore(STORE_KEY_STATS);
    for (const { tag, questionId, correct } of patches) {
      // get or create the corresponding stat object
      const stat: Stat = await _ss.index('tag').get(tag) 
        ?? await _ss.index('alternatives').get(tag) ?? {
          id: '', tag, alternatives: [], correct: {}, total: {}, percentage: 0,
        } as Stat;
      // generate and assign ID if inexistent
      while (!stat.id || !!await _ss.get(stat.id)) {
        stat.id = uuidV4B64();
      }
      // apply patch
      stat.total[questionId] = (stat.total[questionId] || 0) + 1;
      stat.correct[questionId] = (stat.correct[questionId] || 0) + Number(correct ?? 0);
      const correctCount = Object.values(stat.correct).reduce((acc, val) => acc + val, 0);
      const totalCount = Object.values(stat.total).reduce((acc, val) => acc + val, 0);
      stat.percentage = correctCount / totalCount;
      // write back to store
      await _ss.put(stat);
    }

    await tx.done;
    return result.id;
  }

  deleteQuizRecord(id: ID): Promise<void> {
    return this.db.delete(STORE_KEY_RECORDS, id);
  }

  deleteQuizResult(id: ID): Promise<void> {
    // TODO revert stats
    return this.db.delete(STORE_KEY_RESULTS, id);
  }

  importQuizResults(...results: QuizResult[]): Promise<ID[]> {
    return this._import(STORE_KEY_RESULTS, results);
  }

  getQuizResult(id: ID): Promise<QuizResult | undefined> {
    return this.db.get(STORE_KEY_RESULTS, id);
  }

  listQuizResultIds(quizPaperID?: ID): Promise<ID[]> {
    if (!quizPaperID) {
      return this.db.getAllKeys(STORE_KEY_RESULTS) as Promise<ID[]>;
    }
    return this.db.getAllKeysFromIndex(STORE_KEY_RESULTS, 'paperID', quizPaperID) as Promise<ID[]>;
  }

  listQuizResults(quizPaperID?: ID): Promise<QuizResult[]> {
    if (!quizPaperID) {
      return this.db.getAll(STORE_KEY_RESULTS);
    }
    return this.db.getAllFromIndex(STORE_KEY_RESULTS, 'paperID', quizPaperID);
  }


}