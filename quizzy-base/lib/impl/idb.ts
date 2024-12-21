import { CompleteQuizPaperDraft, Question, QuizPaper, QuizRecord, QuizRecordEvent, QuizRecordInitiation, QuizRecordOperation, QuizRecordTactics, QuizzyController, QuizzyData, StartQuizOptions, Stat, StatBase, TagListResult, TagSearchResult, UpdateQuizOptions } from "#/types";
import { IDBPDatabase } from "idb";
import { separatePaperAndQuestions, toCompleted } from "./paper-id";
import { uuidV4B64 } from "#/utils/string";
import { QuizResult } from "#/types/quiz-result";
import { createQuizResult } from "./quiz-result";
import { DatabaseIndexed, ID, KeywordIndexed, sanitizeIndices, SearchResult } from "#/types/technical";
import { applyPatch, Patch } from "#/utils/patch";
import { generateKeywords } from "./keywords";
import QuickLRU from "quick-lru";
import { DatabaseUpdateDefinition, getAllMultiEntryValues, openDatabase } from "#/utils/idb";
import { buildTrieTree, loadTrieTree } from "./search";
import { startQuiz, updateQuiz } from "./quiz";
import { initWeightedState } from "#/utils/random-seq";
import { createStatFromQuizResults } from "./stats";


const DB_KEY = 'Quizzy';
const VERSION = 1;

const STORE_KEY_PAPERS = 'papers';
const STORE_KEY_RECORDS = 'records';
const STORE_KEY_QUESTIONS = 'questions';
const STORE_KEY_RESULTS = 'results';
const STORE_KEY_STATS = 'stats';

const STORE_KEY_GENERAL = 'general';

type Bm25Cache = {
  wordAppeared: Record<string, number>;
  tagAppeared: Record<string, number>;
  averageDocLength: number;
  averageDocLengthTag: number;
  totalDocs: number;
  idf: Record<string, number>;
  idfTag: Record<string, number>;
  trie: any,
  trieSize: number,
  trieTags: any,
  trieSizeTags: number,
};

const _ts = (query: string, cachePapers?: Bm25Cache, isTag?: boolean) =>
  cachePapers?.[isTag ? 'trieTags' : 'trie']
    ? loadTrieTree(
      cachePapers?.[isTag ? 'trieTags' : 'trie'],
      cachePapers?.[isTag ? 'trieSizeTags' : 'trieSize'])
      .searchFunc(query)
    : [];

const updaters: Record<number, DatabaseUpdateDefinition> = {
  [0]: (db) => {
    const _id: IDBObjectStoreParameters = { keyPath: 'id', };

    const paperStore = db.createObjectStore(STORE_KEY_PAPERS, _id);
    const recordStore = db.createObjectStore(STORE_KEY_RECORDS, _id);
    const questionStore = db.createObjectStore(STORE_KEY_QUESTIONS, _id);
    const resultStore = db.createObjectStore(STORE_KEY_RESULTS, _id);
    const statStore = db.createObjectStore(STORE_KEY_STATS, _id);

    db.createObjectStore(STORE_KEY_GENERAL, { keyPath: 'id', });

    for (const store of [paperStore, recordStore, questionStore, resultStore, statStore]) {
      store.createIndex('deleted', 'deleted');
      store.createIndex('lastUpdate', 'lastUpdate');
    }

    for (const store of [paperStore, questionStore]) {
      store.createIndex('name', 'name');
      store.createIndex('tags', 'tags', { multiEntry: true });
      store.createIndex('categories', 'categories', { multiEntry: true });
      store.createIndex('keywords', 'keywords', { multiEntry: true });
      store.createIndex('keywordsUpdatedTime', 'keywordsUpdatedTime', {});
    }

    for (const key of [
      'paperId', 'paused', 'startTime',
      'updateTime', 'timeUsed', 'lastEnter'
    ] as (keyof QuizRecord)[]) {
      recordStore.createIndex(key, key);
    }

    for (const key of [
      'paperId', 'startTime', 'timeUsed',
      'score', 'totalScore', 'percentage'
    ] as (keyof QuizResult)[]) {
      resultStore.createIndex(key, key);
    }

    statStore.createIndex('allTags', 'allTags', { multiEntry: true });
    statStore.createIndex('allCategories', 'allCategories', { multiEntry: true });
    statStore.createIndex('results', 'results', { multiEntry: true });
  },
} as const;

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
    const db = await openDatabase(DB_KEY, VERSION, updaters);
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

  private async _delete<T extends DatabaseIndexed>(
    store: string, id: ID, hard = false,
  ): Promise<boolean> {
    const original = await this.db.get(store, id) as T;
    if (!original) {
      // inexistent record
      return false;
    }
    if (!hard) {
      original.deleted = true;
      original.lastUpdate = Date.now();
      await this.db.put(store, original);
    } else {
      await this.db.delete(store, id);
    }
    // invalidate cache
    this.cache.clear();
    return true;
  }

  private async _update<T extends DatabaseIndexed & KeywordIndexed>(
    store: string, id: ID, patch: Patch<T>,
    invalidateKeywordsCache = false,
  ): Promise<ID> {
    const original = await this.db.get(store, id) as T;
    if (!original) { // doesn't exist, create
      patch.id = id;
      patch.lastUpdate = Date.now();
      await this._import(store, [patch as T]);
      return id;
    }
    // apply patch
    const modified = applyPatch(original, patch);
    modified.id = id;
    modified.lastUpdate = Date.now();
    // invalidate cache
    if (invalidateKeywordsCache) {
      delete modified.keywords;
      delete modified.keywordsFrequency;
      delete modified.tagsFrequency;
      delete modified.keywordsUpdatedTime;
    }
    // optimistic lock
    const tx = this.db.transaction(store, 'readwrite');
    const another = await tx.store.get(id) as T;
    if (another?.lastUpdate !== original.lastUpdate) {
      throw new Error('Data modified.');
    }
    await tx.store.put(modified);
    await tx.done;

    // invalidate cache
    this.cache.clear();

    return id;
  }

  private async _getKeywords(query: string, __: string) {
    if (!query) {
      return [];
    }
    const [orig, _] = generateKeywords(query);
    return orig;
  }

  private async _buildScore<T extends DatabaseIndexed & KeywordIndexed>(
    key: string,
    store: string, query: string[], useTag: boolean,
    k1 = 1.5, b = 0.75, threshold = 1e-10,
  ) {
    const { idf, idfTag, averageDocLength, averageDocLengthTag, trie, trieSize, trieTags, trieSizeTags } = await this._load<Bm25Cache>('bm25_' + store)
      ?? { idf: {}, idfTag: {}, averageDocLength: 0, averageDocLengthTag: 0, trie: {}, trieTags: {}, trieSize: 0, trieSizeTags: 0 } as Bm25Cache;

    const trieTree = loadTrieTree(!useTag ? trie : trieTags, !useTag ? trieSize : trieSizeTags);
    const tx = this.db.transaction(store, 'readonly');
    const scores: Record<string, number> = {};

    const l = useTag ? averageDocLengthTag : averageDocLength;
    const _idf = useTag ? idfTag : idf;

    let cursor = await tx.store.openCursor();
    let expandedQuery = new Set<string>();
    for (const qi of query) {
      expandedQuery.add(qi);
      for (const qj of trieTree.searchFunc(qi)) {
        expandedQuery.add(qj);
      }
    }
    while (cursor != null) {
      const doc = cursor.value as T;
      const cacheList = useTag ? [...doc.tags ?? [], ...doc.categories ?? []] : doc.keywords;
      // TODO implement caching
      const docLength = cacheList?.length || 1;
      const freq = (useTag ? doc.tagsFrequency : doc.keywordsFrequency) ?? {};
      let score = 0;
      for (const qi of expandedQuery) {
        const f_qi = freq[qi] ?? 0;
        const localTerm = (_idf[qi] ?? 0)
          * (f_qi * (k1 + 1))
          / (f_qi + k1 * (1 - b + b * docLength / l));
        score += localTerm;
      }
      if (score > threshold) {
        scores[doc.id] = score;
      }
      cursor = await cursor.continue();
    }
    await tx.done;

    const scoresSorted = Object.entries(scores);
    scoresSorted.sort((a, b) => b[1] - a[1]); // descending

    this.cache.set(key, scoresSorted);
    return scoresSorted;
  }

  private async _search<T extends DatabaseIndexed & KeywordIndexed>(
    store: string, query: string, keywords: string[], useTag: boolean,
    count?: number, page?: number,
    k1 = 1.5, b = 0.75, threshold = 1e-10,
  ): Promise<SearchResult<T>> {

    const queryCacheKey = JSON.stringify([store, keywords, useTag, k1, b, threshold]);
    const scores = this.cache.has(queryCacheKey)
      ? this.cache.get(queryCacheKey)
      : await this._buildScore(queryCacheKey, store, keywords, useTag, k1, b, threshold);

    count = Math.max(count ?? 1, 1);
    page = Math.max(page ?? 0, 0); // 0-based

    const result: T[] = [];
    for (let i = page * count; i < (page + 1) * count; ++i) {
      const currentResult = await this.db.get(store, scores?.[i]?.[0] ?? '');
      if (currentResult != null) {
        result.push(sanitizeIndices(currentResult, true));
      }
    }

    return {
      query,
      keywords,
      result,
      totalPages: Math.ceil((scores?.length ?? 0) / count)
    };
  }

  private async _buildIndices<T extends DatabaseIndexed & KeywordIndexed>(
    store: string,
    force?: boolean,
    excludedKeys?: (keyof T)[],
  ): Promise<ID[]> {
    const tx = this.db.transaction(store, 'readwrite');
    const updated: ID[] = [];

    // build bm25 cache
    // TODO add incremental building
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
        for (const tag of object.categories ?? []) {
          tagFreq[tag] = 4;
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
      totalLengthTag += (object.tags?.length ?? 0) + (object.categories?.length ?? 0);
      totalDocs += 1;

      cursor = await cursor.continue();
    }
    await tx.done;

    // build trie trees
    const { root: trie, size: trieSize, } = buildTrieTree(Object.keys(wordAppeared));
    const { root: trieTags, size: trieSizeTags, } = buildTrieTree(Object.keys(tagAppeared));

    // write the cache into database
    const idf: Record<string, number> = Object.fromEntries(
      Object.entries(wordAppeared).map(
        ([k, n]) => [k, Math.max(1e-8, Math.log((totalDocs - n + 0.5) / (n + 0.5)))]
      )
    );
    const idfTag: Record<string, number> = Object.fromEntries(
      Object.entries(tagAppeared).map(
        ([k, n]) => [k, Math.max(1e-8, Math.log((totalDocs - n + 0.5) / (n + 0.5)))]
      )
    );
    const averageDocLength = totalLength / (totalDocs || 1);
    const averageDocLengthTag = totalLengthTag / (totalDocs || 1);
    const bm25Body: Bm25Cache = {
      wordAppeared, tagAppeared,
      averageDocLength, averageDocLengthTag,
      totalDocs, idf, idfTag,
      trie, trieSize, trieTags, trieSizeTags,
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


  async findQuestion(query: string, count?: number, page?: number): Promise<SearchResult<Question>> {
    const queryKeywords = await this._getKeywords(query, STORE_KEY_QUESTIONS);
    return this._search(STORE_KEY_QUESTIONS, query, queryKeywords, false, count, page);
  }
  async findQuizPaper(query: string, count?: number, page?: number): Promise<SearchResult<QuizPaper>> {
    const queryKeywords = await this._getKeywords(query, STORE_KEY_PAPERS);
    return this._search(STORE_KEY_PAPERS, query, queryKeywords, false, count, page);
  }
  async findQuestionByTags(query: string, count?: number, page?: number): Promise<SearchResult<Question>> {
    const queryKeywords = query.split(' ').filter(x => !!x);
    queryKeywords[0] !== query && queryKeywords.splice(0, 0, query);
    return this._search(STORE_KEY_QUESTIONS, query, queryKeywords, true, count, page);
  }
  async findQuizPaperByTags(query: string, count?: number, page?: number): Promise<SearchResult<QuizPaper>> {
    const queryKeywords = query.split(' ').filter(x => !!x);
    queryKeywords[0] !== query && queryKeywords.splice(0, 0, query);
    return this._search(STORE_KEY_PAPERS, query, queryKeywords, true, count, page);
  }

  async findTags(query: string, _?: number, __?: number): Promise<TagSearchResult> {
    // TODO cache trie trees
    const cachePapers = await this._load<Bm25Cache>('bm25_' + STORE_KEY_PAPERS);
    const cacheQuestions = await this._load<Bm25Cache>('bm25_' + STORE_KEY_QUESTIONS);
    return {
      paper: _ts(query, cachePapers, false),
      paperTags: _ts(query, cachePapers, true),
      question: _ts(query, cacheQuestions, false),
      questionTags: _ts(query, cacheQuestions, true),
    };
  }

  async listTags(): Promise<TagListResult> {
    return {
      questionCategories: await getAllMultiEntryValues(
        this.db, STORE_KEY_QUESTIONS, 'categories',
      ) as string[],
      questionTags: await getAllMultiEntryValues(
        this.db, STORE_KEY_QUESTIONS, 'tags',
      ) as string[],
      paperCategories: await getAllMultiEntryValues(
        this.db, STORE_KEY_PAPERS, 'categories',
      ) as string[],
      paperTags: await getAllMultiEntryValues(
        this.db, STORE_KEY_PAPERS, 'tags',
      ) as string[],
    };
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

  deleteQuestion(id: ID): Promise<boolean> {
    return this._delete(STORE_KEY_QUESTIONS, id, true);
  }
  deleteQuizPaper(id: ID): Promise<boolean> {
    return this._delete(STORE_KEY_PAPERS, id, true);
  }

  // search

  async refreshSearchIndices(force?: boolean) {
    let count = 0;
    count += (await this._buildIndices<Question>(STORE_KEY_QUESTIONS, force, ['id', 'keywords'])).length;
    count += (await this._buildIndices<QuizPaper>(STORE_KEY_PAPERS, force, ['id', 'questions', 'keywords'])).length;
    await this.cache.clear();
    return count;
  }

  async deleteUnlinked() {
    let count = 0;
    const tx = this.db.transaction([STORE_KEY_PAPERS, STORE_KEY_QUESTIONS, STORE_KEY_RECORDS, STORE_KEY_RESULTS], 'readwrite');
    const allQuestions = await tx.objectStore(STORE_KEY_QUESTIONS).getAll() as Question[];
    // delete all questions
    const linkedQuestions = new Set<ID>();
    for (const { questions } of await tx.objectStore(STORE_KEY_PAPERS).getAll() as QuizPaper[]) {
      questions?.forEach(q => linkedQuestions.add(q));
    }
    for (const result of await tx.objectStore(STORE_KEY_RESULTS).getAll() as QuizResult[]) {
      Object.keys(result.answers ?? []).forEach(q => linkedQuestions.add(q));
    }
    const deleteNeededQuestions = new Set<ID>();
    for (const { id } of allQuestions) {
      if (!linkedQuestions.has(id)) {
        deleteNeededQuestions.add(id);
      }
    }
    for (const id of deleteNeededQuestions) {
      count += 1;
      tx.objectStore(STORE_KEY_QUESTIONS).delete(id);
    }
    await tx.done;
    return count;
  }

  // records

  async importQuizRecords(...records: QuizRecord[]): Promise<ID[]> {
    return await this._import(STORE_KEY_RECORDS, records);
  }

  async getQuizRecord(id: ID): Promise<QuizRecord | undefined> {
    return await this.db.get(STORE_KEY_RECORDS, id);
  }

  listQuizRecords(quizPaperId?: ID): Promise<QuizRecord[]> {
    if (!quizPaperId) {
      return this.db.getAll(STORE_KEY_RECORDS);
    }
    return this.db.getAllFromIndex(STORE_KEY_RECORDS, 'paperId', quizPaperId);
  }

  listQuizRecordIds(quizPaperId?: ID): Promise<ID[]> {
    if (!quizPaperId) {
      return this.db.getAllKeys(STORE_KEY_RECORDS) as Promise<ID[]>;
    }
    return this.db.getAllKeysFromIndex(STORE_KEY_RECORDS, 'paperId', quizPaperId) as Promise<ID[]>;
  }

  async parseTactics(t: Readonly<QuizRecordTactics>): Promise<QuizRecordInitiation | undefined> {
    const { type } = t;
    if (type === 'paper') {
      const paper = await this.getQuizPaper(t.paperId);
      return paper ? {
        paperId: paper.id,
        questionOrder: paper.questions,
      } : undefined;
    } else if (type === 'random-paper') {
      const papers: (QuizPaper | undefined)[] = [];
      for (const pid of Object.keys(t.papers)) {
        papers.push(await this.getQuizPaper(pid));
      }
      const weightList: Record<string, number> = {};
      for (const paper of papers) {
        if (!paper) {
          continue;
        }
        const totalWeight = Math.max(t.papers[paper.id] || 1, 1e-4);
        const individualWeight = totalWeight / paper.questions.length;
        for (const q of paper.questions) {
          weightList[q] = individualWeight;
        }
      }
      if (Object.keys(weightList).length == 0) {
        return undefined;
      }
      return {
        questionOrder: [],
        randomState: initWeightedState(weightList),
      };
    } else if (type === 'random-category' || type === 'random-tag') {
      const isCategory = type === 'random-category';
      const targetIndex = isCategory ? 'categories' : 'tags';
      const weightList: Record<string, number> = {};
      for (const [target, weight] of Object.entries(isCategory ? t.categories : t.tags)) {
        const totalWeight = Math.max(weight || 1, 1e-6);
        const questions: Question[] = (await this.db.getAllFromIndex(STORE_KEY_QUESTIONS, targetIndex, target))
          .filter(x => !!x);
        const individualWeight = totalWeight / (questions.length || 1);
        for (const question of questions) {
          weightList[question.id] = individualWeight;
        }
      }
      if (Object.keys(weightList).length == 0) {
        return undefined;
      }
      return {
        questionOrder: [],
        randomState: initWeightedState(weightList),
      };
    }
  }

  async startQuiz(tactics: QuizRecordTactics, options?: StartQuizOptions | undefined): Promise<QuizRecord> {
    const t = options?.currentTime ?? Date.now();
    const record = await startQuiz(tactics, t, this.parseTactics.bind(this));
    const tx = this.db.transaction(STORE_KEY_RECORDS, 'readwrite');
    do {
      record.id = uuidV4B64();
    } while (!!await tx.store.get(record.id));
    await tx.store.add(record);
    await tx.done;

    return record;
  }

  async updateQuiz(
    operation: Readonly<QuizRecordOperation>,
    _?: Readonly<UpdateQuizOptions>
  ) {
    const { id } = operation;
    const tx = this.db.transaction(STORE_KEY_RECORDS, 'readwrite');
    const oldRecord = await tx.store.get(id) as QuizRecord | undefined;
    if (!oldRecord) {
      throw new Error('Invalid record ID');
    }
    const [newRecord, event] = updateQuiz(oldRecord, operation);
    await tx.store.put(newRecord);
    await tx.done;
    // handle submission
    if (event?.type === 'submit') {
      const resultId = await this.endQuiz(event.id);
      event.resultId = resultId ?? event.resultId;
    } else if (event?.type === 'goto') {
      // get question
      event.question = (await this.getQuestions([event.questionId]))[0];
    }
    return [newRecord, event] as [QuizRecord, QuizRecordEvent | undefined];
  }


  async endQuiz(id: ID): Promise<ID | undefined> {
    // read necessary data
    const r = await this.getQuizRecord(id);
    if (!r) {
      return;
    }
    const quizPaper = r.paperId ? await this.getQuizPaper(r.paperId) : undefined;
    const allQuestions: Record<ID, Question> = Object.fromEntries(
      (await this.getQuestions(r.questionOrder)).filter(q => !!q)
        .map(q => [q.id, q]),
    );
    // create result and patches
    const result = createQuizResult(r, quizPaper, allQuestions);
    result.stat = await createStatFromQuizResults([result], async (id) => allQuestions[id]);

    // create write transactions
    const tx = this.db.transaction([
      STORE_KEY_RESULTS, STORE_KEY_RECORDS,
    ], 'readwrite');

    // put the result into the store
    const _sr = tx.objectStore(STORE_KEY_RESULTS);
    while (!!await _sr.get(result.id)) {
      result.id = uuidV4B64();
    }
    await _sr.add(result);

    // delete original record
    await tx.objectStore(STORE_KEY_RECORDS).delete(id);

    await tx.done;
    return result.id;
  }

  deleteQuizRecord(id: ID): Promise<boolean> {
    return this._delete(STORE_KEY_RECORDS, id, true);
  }

  deleteQuizResult(id: ID): Promise<boolean> {
    return this._delete(STORE_KEY_RESULTS, id, true);
  }

  importQuizResults(...results: QuizResult[]): Promise<ID[]> {
    return this._import(STORE_KEY_RESULTS, results);
  }

  getQuizResult(id: ID): Promise<QuizResult | undefined> {
    return this.db.get(STORE_KEY_RESULTS, id);
  }

  listQuizResultIds(quizPaperId?: ID): Promise<ID[]> {
    if (!quizPaperId) {
      return this.db.getAllKeys(STORE_KEY_RESULTS) as Promise<ID[]>;
    }
    return this.db.getAllKeysFromIndex(STORE_KEY_RESULTS, 'paperId', quizPaperId) as Promise<ID[]>;
  }

  listQuizResults(quizPaperId?: ID): Promise<QuizResult[]> {
    if (!quizPaperId) {
      return this.db.getAll(STORE_KEY_RESULTS);
    }
    return this.db.getAllFromIndex(STORE_KEY_RESULTS, 'paperId', quizPaperId);
  }

  // stats


  async generateStats(...resultIds: ID[]): Promise<Stat | StatBase | undefined> {
    const now = Date.now();
    const results = (await Promise.all(resultIds.map(
      (id) => this.db.get(STORE_KEY_RESULTS, id) as Promise<QuizResult | undefined>,
    ))).filter(x => !!x);
    if (!results.length) {
      return undefined;
    }
    // get questions
    const questionCache: Record<ID, Promise<Question | undefined> | undefined> = {};
    const getQuestion = async (id: ID) => {
      if (questionCache[id]) {
        return questionCache[id];
      }
      const promise = this.getQuestions([id]).then(x => x[0] as Question | undefined);
      questionCache[id] = promise;
      return await promise;
    };
    const stat = await createStatFromQuizResults(results, getQuestion);
    if (results.length === 1) {
      // concurrent problem is not a concern
      // since results are never modified
      const res = results[0];
      res.stat = stat;
      await this.db.put(STORE_KEY_RESULTS, res);
      return stat;
    }
    const statWithId: Stat = {
      ...stat,
      time: now,
      id: uuidV4B64(),
      results: results.map(x => x.id),
    };
    await this.db.put(STORE_KEY_STATS, statWithId);
    return statWithId;
  }

  async listStats(): Promise<Stat[]> {
    return await this.db.getAll(STORE_KEY_STATS);
  }

  async getStat(id: ID): Promise<Stat | undefined> {
    return await this.db.get(STORE_KEY_STATS, id);
  }

  async deleteStat(id: ID): Promise<boolean> {
    return await this._delete(STORE_KEY_STATS, id, true);
  }
}