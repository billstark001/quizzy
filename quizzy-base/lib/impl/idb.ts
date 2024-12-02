import { CompleteQuizPaperDraft, EndQuizOptions, Question, QuizPaper, QuizRecord, QuizzyController, QuizzyData, StartQuizOptions, Stat, UpdateQuizOptions } from "#/types";
import { IDBPDatabase, IDBPTransaction, openDB } from "idb";
import { separatePaperAndQuestions, toCompleted } from "./paper-id";
import { uuidV4B64 } from "#/utils";
import { QuizResult } from "#/types/quiz-result";
import { createResultAndStatPatches } from "./result";
import { DatabaseIndexed, ID, KeywordIndexed, sanitizeIndices, SearchResult } from "#/types/technical";
import { applyPatch, Patch } from "#/utils/patch";
import { generateKeywords } from "./keywords";
import QuickLRU from "quick-lru";


const DB_KEY = 'Quizzy';
const VERSION = 2;

const STORE_KEY_PAPERS = 'papers';
const STORE_KEY_RECORDS = 'records';
const STORE_KEY_QUESTIONS = 'questions';
const STORE_KEY_RESULTS = 'results';
const STORE_KEY_STATS = 'stats';

const STORE_KEY_GENERAL = 'general';

// TODO implement optimistic lock
export type VersionRecord = {
  _version: number;
};

type Bm25Cache = {
  wordAppeared: Record<string, number>;
  tagAppeared: Record<string, number>;
  averageDocLength: number;
  averageDocLengthTag: number;
  totalDocs: number;
  idf: Record<string, number>;
  idfTag: Record<string, number>;
};

type DBUpdater = (db: IDBPDatabase, tx: IDBPTransaction<unknown, string[], "versionchange">) => void;
const updaters: Record<number, DBUpdater> = {
  [0]: (db) => {
    const _id: IDBObjectStoreParameters = { keyPath: 'id', };
    const paperStore = db.createObjectStore(STORE_KEY_PAPERS, _id);
    const recordStore = db.createObjectStore(STORE_KEY_RECORDS, _id);
    const questionStore = db.createObjectStore(STORE_KEY_QUESTIONS, _id);
    const resultStore = db.createObjectStore(STORE_KEY_RESULTS, _id);
    const statStore = db.createObjectStore(STORE_KEY_STATS, _id);
    for (const store of [paperStore, recordStore, questionStore, resultStore, statStore]) {
      store.createIndex('deleted', 'deleted');
      store.createIndex('lastUpdate', 'lastUpdate');
    }
    for (const store of [paperStore, questionStore]) {
      store.createIndex('name', 'name');
      store.createIndex('tags', 'tags', { multiEntry: true });
      store.createIndex('keywords', 'keywords', { multiEntry: true });
      store.createIndex('keywordsUpdatedTime', 'keywordsUpdatedTime', {});
    }
    for (const key of ['paperId', 'paused', 'startTime', 'updateTime']) {
      recordStore.createIndex(key, key);
    }
    for (const key of ['paperId', 'startTime',]) {
      resultStore.createIndex(key, key);
    }
    statStore.createIndex('tag', 'tag', { unique: true });
    statStore.createIndex('alternatives', 'alternatives', { multiEntry: true });
    statStore.createIndex('percentage', 'percentage');
  },
  [1]: (db) => {
    db.createObjectStore(STORE_KEY_GENERAL, { keyPath: 'id', });
  }
};

export class IDBController implements QuizzyController {

  private readonly db: IDBPDatabase;
  private readonly cache: QuickLRU<string, [string, number][]>;
  private constructor(db: IDBPDatabase) {
    this.db = db;
    this.cache = new QuickLRU({
      maxSize: 100,
    });
  }

  static async connect() {
    const db = await openDB(DB_KEY, VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        if (newVersion == null || newVersion < oldVersion) {
          return; // either delete or errored
        }
        for (let i = oldVersion; i < newVersion; ++i) {
          updaters[i]?.(db, transaction);
        }
      },
    });
    return new IDBController(db);
  }

  async importData(data: QuizzyData): Promise<void> {
    await this._import(STORE_KEY_PAPERS, data.papers);
    await this._import(STORE_KEY_QUESTIONS, data.questions);
    await this._import(STORE_KEY_RECORDS, data.records);
    await this._import(STORE_KEY_RESULTS, data.results);
    await this._import(STORE_KEY_STATS, data.stats);
    await this._import(STORE_KEY_GENERAL, data.general);
  }

  async exportData(): Promise<QuizzyData> {
    return {
      papers: await this._export(STORE_KEY_PAPERS),
      questions: await this._export(STORE_KEY_QUESTIONS),
      records: await this._export(STORE_KEY_RECORDS),
      results: await this._export(STORE_KEY_RESULTS),
      stats: await this._export(STORE_KEY_STATS),
      general: await this._export(STORE_KEY_GENERAL),
    };
  }

  // utils

  private async _load<T>(key: string): Promise<T | undefined> {
    const obj = await this.db.get(STORE_KEY_GENERAL, key);
    return obj?.value as T;
  }

  private async _dump<T>(key: string, value: T) {
    return await this.db.put(STORE_KEY_GENERAL, { id: key, value });
  }

  private async _import<T extends DatabaseIndexed>(store: string, items: T[]): Promise<ID[]> {
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

  private async _export<T extends DatabaseIndexed>(
    store: string,
  ): Promise<T[]> {
    const tx = this.db.transaction(store, 'readonly');
    const ret: T[] = await tx.store.getAll() as T[];
    await tx.done;
    return ret;
  }

  private async _update<T extends DatabaseIndexed>(store: string, id: ID, patch: Patch<T>): Promise<ID> {
    const original = await this.db.get(store, id) as T;
    if (!original) { // doesn't exist, create
      patch.id = id;
      await this._import(store, [patch as T]);
      return id;
    }
    // apply patch
    const modified = applyPatch(original, patch);
    modified.id = id;
    modified.lastUpdate = Date.now();
    // optimistic lock
    const tx = this.db.transaction(store, 'readwrite');
    const another = await tx.store.get(id) as T;
    if (another?.lastUpdate !== original.lastUpdate) {
      throw new Error('Data modified.');
    }
    await tx.store.put(modified, id);
    await tx.done;

    // invalidate cache
    this.cache.clear();

    return id;
  }

  private async _buildScore<T extends DatabaseIndexed & KeywordIndexed>(
    key: string,
    store: string, query: string[], useTag: boolean,
    k1 = 1.5, b = 0.75,
  ) {
    const { idf, idfTag, averageDocLength, averageDocLengthTag } = await this._load<Bm25Cache>('bm25_' + store)
      ?? { idf: {}, idfTag: {}, averageDocLength: 0, averageDocLengthTag: 0, } as Bm25Cache;

    const tx = this.db.transaction(store, 'readonly');
    const scores: Record<string, number> = {};

    const l = useTag ? averageDocLengthTag : averageDocLength;
    const _idf = useTag ? idfTag : idf;

    let cursor = await tx.store.openCursor();
    while (cursor != null) {
      const doc = cursor.value as T;
      const docLength = (useTag ? doc.tags : doc.keywords)?.length || 1;
      const freq = (useTag ? doc.tagsFrequency : doc.keywordsFrequency) ?? {};
      let score = 0;
      for (const qi of query) {
        const f_qi = freq[qi];
        score += (_idf[qi] ?? 0)
          * (f_qi * (k1 + 1))
          / (f_qi + k1 * (1 - b + b * docLength / l))
      }
      scores[doc.id] = score;
      cursor = await cursor.continue();
    }
    await tx.done;

    const scoresSorted = Object.entries(scores);
    scoresSorted.sort((a, b) => b[1] - a[1]); // descending

    this.cache.set(key, scoresSorted);
    return scoresSorted;
  }

  private async _search<T extends DatabaseIndexed & KeywordIndexed>(
    store: string, query: string[], useTag: boolean,
    count?: number, page?: number,
    k1 = 1.5, b = 0.75,
  ): Promise<SearchResult<T>> {

    const queryCacheKey = JSON.stringify([store, query, useTag, k1, b]);
    const scores = this.cache.has(queryCacheKey) 
      ? this.cache.get(queryCacheKey)
      : await this._buildScore(queryCacheKey, store, query, useTag, k1, b);

    count = Math.min(count ?? 1, 1);
    page = Math.min(page ?? 0, 0); // 0-based

    const result: T[] = [];
    for (let i = page * count; i < (page + 1) * count; ++i) {
      const currentResult = await this.db.get(store, scores?.[i][0] ?? '');
      if (currentResult != null) {
        result.push(sanitizeIndices(currentResult, true));
      }
    }

    return {result, totalPages: Math.ceil((scores?.length ?? 0) / page)};
  }

  private async _index<T extends DatabaseIndexed & KeywordIndexed>(
    store: string,
    force?: boolean,
    excludedKeys?: (keyof T)[],
  ): Promise<ID[]> {
    const tx = this.db.transaction(store, 'readwrite');
    const updated: ID[] = [];

    // build bm25 cache
    const wordAppeared: Record<string, number> = {};
    const tagAppeared: Record<string, number> = {};
    let totalLength = 0;
    let totalLengthTag = 0;
    let totalDocs = 0;

    // filter all re-indexing required
    let cursor = await tx.store.openCursor();
    let excludedKeysSet = new Set(excludedKeys);
    while (cursor) {
      const object = cursor.value as T;
      // check if re-indexing is needed
      if (force || (!object.deleted && (
        object.keywords == null || object.keywordsUpdatedTime == null ||
        (object.lastUpdate != null && object.keywordsUpdatedTime < object.lastUpdate)
      ))) {
        // update it in-place
        // this will not affect the database, for sure
        const [words, freq] = generateKeywords(
          Object.entries(object)
            .filter(([k]) => !excludedKeysSet.has(k as any))
            .map(([, v]) => v)
        );
        object.keywordsUpdatedTime = Date.now();
        object.keywordsFrequency = freq;
        object.keywords = words;

        // tags
        const tagFreq: Record<string, number> = {};
        for (const tag of object.tags ?? []) {
          tagFreq[tag] = 1;
        }
        object.tagsFrequency = tagFreq;

        await cursor.update(object);
        updated.push(object.id);
      }

      for (const key of Object.keys(object.keywordsFrequency ?? {})) {
        wordAppeared[key] = (wordAppeared[key] || 0) + 1;
      }
      for (const key of Object.keys(object.tagsFrequency ?? {})) {
        tagAppeared[key] = (tagAppeared[key] || 0) + 1;
      }
      totalLength += object.keywords?.length ?? 0;
      totalLengthTag += object.tags?.length ?? 0;
      totalDocs += 1;

      cursor = await cursor.continue();
    }
    await tx.done;

    // write the cache into database
    const idf: Record<string, number> = Object.fromEntries(
      Object.entries(wordAppeared).map(
        ([k, n]) => [k, Math.log((totalDocs - n + 0.5) / (n + 0.5))]
      )
    );
    const idfTag: Record<string, number> = Object.fromEntries(
      Object.entries(tagAppeared).map(
        ([k, n]) => [k, Math.log((totalDocs - n + 0.5) / (n + 0.5))]
      )
    );
    const averageDocLength = totalLength / (totalDocs || 1);
    const averageDocLengthTag = totalLengthTag / (totalDocs || 1);
    const bm25Body: Bm25Cache = { 
      wordAppeared, tagAppeared, 
      averageDocLength, averageDocLengthTag, 
      totalDocs, idf, idfTag,
    };
    await this._dump('bm25_' + store, bm25Body);

    return updated;
  }

  async importQuestions(...questions: Question[]): Promise<ID[]> {
    return this._import(STORE_KEY_QUESTIONS, questions);
  }

  async importQuizPapers(...papers: QuizPaper[]): Promise<ID[]> {
    return this._import(STORE_KEY_PAPERS, papers);
  }


  findQuestion(query: string, count?: number, page?: number): Promise<SearchResult<Question>> {
    const queryKeywords = generateKeywords(query)[0];
    return this._search(STORE_KEY_QUESTIONS, queryKeywords, false, count, page);
  }
  async findQuizPaper(query: string, count?: number, page?: number): Promise<SearchResult<QuizPaper>> {
    const queryKeywords = generateKeywords(query)[0];
    return this._search(STORE_KEY_PAPERS, queryKeywords, false, count, page);
  }
  async findQuestionByTags(query: string, count?: number, page?: number): Promise<SearchResult<Question>> {
    const queryKeywords = query.split(' ').filter(x => !!x);
    queryKeywords[0] !== query && queryKeywords.splice(0, 0, query);
    return this._search(STORE_KEY_QUESTIONS, queryKeywords, true, count, page);
  }
  async findQuizPaperByTags(query: string, count?: number, page?: number): Promise<SearchResult<QuizPaper>> {
    const queryKeywords = query.split(' ').filter(x => !!x);
    queryKeywords[0] !== query && queryKeywords.splice(0, 0, query);
    return this._search(STORE_KEY_PAPERS, queryKeywords, true, count, page);
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

  async getQuizPaper(id: ID): Promise<QuizPaper | undefined> {
    const ret = await this.db.get(STORE_KEY_PAPERS, id);
    ret && sanitizeIndices(ret, true);
    return ret;
  }

  async getQuestions(ids: ID[]): Promise<(Question | undefined)[]> {
    const ret: (Question | undefined)[] = [];
    for (const id of ids) {
      const _ret = await this.db.get(STORE_KEY_QUESTIONS, id);
      _ret && sanitizeIndices(_ret, true);
      ret.push(_ret);
    }
    return ret;
  }

  listQuizPaperIds(): Promise<ID[]> {
    return this.db.getAllKeys(STORE_KEY_PAPERS) as Promise<ID[]>;
  }

  listQuestionsIds(): Promise<ID[]> {
    return this.db.getAllKeys(STORE_KEY_QUESTIONS) as Promise<ID[]>;
  }


  updateQuestion(id: ID, patch: Patch<Question>): Promise<ID> {
    return this._update(STORE_KEY_QUESTIONS, id, patch);
  }
  updateQuizPaper(id: ID, paper: Patch<QuizPaper>): Promise<ID> {
    return this._update(STORE_KEY_PAPERS, id, paper);
  }

  // search

  async refreshSearchIndices(force?: boolean) {
    await this._index<Question>(STORE_KEY_QUESTIONS, force, ['id', 'keywords']);
    await this._index<QuizPaper>(STORE_KEY_PAPERS, force, ['id', 'questions', 'keywords']);
  }

  // records

  async importQuizRecords(...records: QuizRecord[]): Promise<ID[]> {
    return await this._import(STORE_KEY_RECORDS, records);
  }

  async getQuizRecord(id: ID): Promise<QuizRecord | undefined> {
    return await this.db.get(STORE_KEY_RECORDS, id);
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
    await tx.objectStore(STORE_KEY_RECORDS).delete(id);

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