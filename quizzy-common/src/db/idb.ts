import { 
  CompleteQuizPaperDraft, Question, QuizPaper, 
  QuizRecord, QuizRecordEvent, QuizRecordInitiation, 
  QuizRecordOperation, QuizRecordTactics, 
  QuizzyController, QuizzyData, StartQuizOptions, 
  Stat, StatBase, TagListResult, TagSearchResult, 
  UpdateQuizOptions 
} from "../types";
import { IDBPDatabase } from "idb";
import { separatePaperAndQuestions, toCompleted } from "./paper-id";
import { uuidV4B64 } from "../utils/string";
import { QuizResult } from "../types/quiz-result";
import { createQuizResult } from "./quiz-result";
import { ID, sanitizeIndices, SearchResult } from "../types/technical";
import { Patch } from "../utils/patch";
import { 
  DatabaseUpdateDefinition, 
  getAllMultiEntryValues, 
  openDatabase 
} from "../utils/idb";
import { startQuiz, updateQuiz } from "./quiz";
import { initWeightedState } from "../utils/random-seq";
import { createStatFromQuizResults } from "./stats";
import { normalizeQuestion } from "./question-id";
import IDBCore, { Bm25Cache, BuildBm25CacheOptions, trieSearchByQuery } from "./idb-core";


export const DB_KEY = 'Quizzy';
export const VERSION = 1;

const STORE_KEY_PAPERS = 'papers';
const STORE_KEY_RECORDS = 'records';
const STORE_KEY_QUESTIONS = 'questions';
const STORE_KEY_RESULTS = 'results';
const STORE_KEY_STATS = 'stats';

const STORE_KEY_GENERAL = 'general';


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

export class IDBController extends IDBCore implements QuizzyController {

  private constructor(db: IDBPDatabase) {
    super(db, STORE_KEY_GENERAL);
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

  async importQuestions(...questions: Question[]): Promise<ID[]> {
    questions.forEach(q => normalizeQuestion(q));
    return this._import(STORE_KEY_QUESTIONS, questions);
  }

  async importQuizPapers(...papers: QuizPaper[]): Promise<ID[]> {
    return this._import(STORE_KEY_PAPERS, papers);
  }


  async findQuestion(query: string, count?: number, page?: number): Promise<SearchResult<Question>> {
    await this.refreshSearchIndices();
    const queryKeywords = await this._getKeywords(query, STORE_KEY_QUESTIONS);
    return this._search(STORE_KEY_QUESTIONS, query, queryKeywords, false, count, page);
  }
  async findQuizPaper(query: string, count?: number, page?: number): Promise<SearchResult<QuizPaper>> {
    await this.refreshSearchIndices();
    const queryKeywords = await this._getKeywords(query, STORE_KEY_PAPERS);
    return this._search(STORE_KEY_PAPERS, query, queryKeywords, false, count, page);
  }
  async findQuestionByTags(query: string, count?: number, page?: number): Promise<SearchResult<Question>> {
    await this.refreshSearchIndices();
    const queryKeywords = query.split(' ').filter(x => !!x);
    queryKeywords[0] !== query && queryKeywords.splice(0, 0, query);
    return this._search(STORE_KEY_QUESTIONS, query, queryKeywords, true, count, page);
  }
  async findQuizPaperByTags(query: string, count?: number, page?: number): Promise<SearchResult<QuizPaper>> {
    await this.refreshSearchIndices();
    const queryKeywords = query.split(' ').filter(x => !!x);
    queryKeywords[0] !== query && queryKeywords.splice(0, 0, query);
    return this._search(STORE_KEY_PAPERS, query, queryKeywords, true, count, page);
  }

  async findTags(query: string, _?: number, __?: number): Promise<TagSearchResult> {
    const cachePapers = await this._loadBm25Cache(STORE_KEY_PAPERS);
    const cacheQuestions = await this._loadBm25Cache(STORE_KEY_QUESTIONS);
    return {
      paper: trieSearchByQuery(query, cachePapers, false),
      paperTags: trieSearchByQuery(query, cachePapers, true),
      question: trieSearchByQuery(query, cacheQuestions, false),
      questionTags: trieSearchByQuery(query, cacheQuestions, true),
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

  // TODO manual replacement if conflict detected
  async importCompleteQuizPapers(...papers: CompleteQuizPaperDraft[]): Promise<string[]> {
    const purePapers: QuizPaper[] = [];
    const hasPaperId = (id: ID) => this.db.get(STORE_KEY_PAPERS, id).then(x => x != null && !x.deleted);
    const hasQuestionId = (id: ID) => this.db.get(STORE_KEY_PAPERS, id).then(x => x != null && !x.deleted);
    for (const _paper of papers) {
      const paper = await toCompleted(_paper, hasPaperId, hasQuestionId);
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
    const tx = this.db.transaction(STORE_KEY_QUESTIONS, 'readonly');
    for (const id of ids) {
      const _ret = await tx.store.get(id);
      _ret && sanitizeIndices(_ret, true);
      ret.push(_ret);
    }
    await tx.done;
    return ret;
  }

  async listQuizPapers(): Promise<QuizPaper[]> {
    const ret: QuizPaper[] = await this.db.getAll(STORE_KEY_PAPERS);
    return ret.filter(x => x && !x.deleted);
  }

  async listQuestions(): Promise<Question[]> {
    const ret: Question[] = await this.db.getAll(STORE_KEY_QUESTIONS);
    return ret.filter(x => x && !x.deleted);
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

  async refreshSearchIndices(
    forceReindexing = false, 
    forceReindexingForPreparation = false,
    ignoreDeleted = true
  ) {
    const options: BuildBm25CacheOptions<QuizPaper> = {
      forceReindexing, ignoreDeleted, excludedKeys: ['id', 'questions', 'keywords'],
    }
    return await this._prepareForSearch(
      [STORE_KEY_QUESTIONS, STORE_KEY_PAPERS],
      options,
      forceReindexingForPreparation,
    );
  }

  async deleteUnlinked(logical = true) {
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
      this._delete(STORE_KEY_QUESTIONS, id, logical, tx);
    }
    await tx.done;
    return count;
  }

  async deleteLogicallyDeleted() {
    let count = 0;
    const stores: readonly string[] = [STORE_KEY_PAPERS, STORE_KEY_QUESTIONS, STORE_KEY_RECORDS, STORE_KEY_RESULTS, STORE_KEY_STATS];
    const tx = this.db.transaction(stores, 'readwrite');
    const promises: Promise<void>[] = [];
    for (const storeId of stores) {
      const store = tx.objectStore(storeId);
      const ids: ID[] = await store.index('deleted').getAllKeys() as ID[];
      count += ids.length;
      ids.forEach(id => promises.push(store.delete(id)));
    }
    await Promise.all(promises);
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

  async listQuizRecords(quizPaperId?: ID): Promise<QuizRecord[]> {
    let ret: QuizRecord[];
    if (!quizPaperId) {
      ret = await this.db.getAll(STORE_KEY_RECORDS);
    } else {
      ret = await this.db.getAllFromIndex(STORE_KEY_RECORDS, 'paperId', quizPaperId);
    }
    return ret.filter(x => x && !x.deleted);
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
  ): Promise<[QuizRecord, QuizRecordEvent | undefined]> {
    const { id } = operation;
    const tx = this.db.transaction(STORE_KEY_RECORDS, 'readwrite');
    const oldRecord = await tx.store.get(id) as QuizRecord | undefined;
    if (!oldRecord) {
      if (operation.type === 'hard-pause') {
        return [{
          id,
          startTime: -1,
          timeUsed: -1,
          answers: {},
          lastQuestion: -1,
          paused: false,
          updateTime: -1,
          paperId: '',
          questionOrder: [],
        }, undefined];
      }
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
    return [newRecord, event];
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
    await this._delete(STORE_KEY_RECORDS, id, true, tx);

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

  async listQuizResults(quizPaperId?: ID): Promise<QuizResult[]> {
    let ret: QuizResult[];
    if (!quizPaperId) {
      ret = await this.db.getAll(STORE_KEY_RESULTS);
    } else {
      ret = await this.db.getAllFromIndex(STORE_KEY_RESULTS, 'paperId', quizPaperId);
    }
    return ret.filter(x => x && !x.deleted);
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
      // concurrency problem is not a concern
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
    const ret = await this.db.getAll(STORE_KEY_STATS);
    return ret.filter(x => x && !x.deleted);
  }

  async getStat(id: ID): Promise<Stat | undefined> {
    return await this.db.get(STORE_KEY_STATS, id);
  }

  async deleteStat(id: ID): Promise<boolean> {
    return await this._delete(STORE_KEY_STATS, id, true);
  }
}