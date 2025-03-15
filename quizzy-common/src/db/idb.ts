import { 
  CompleteQuizPaperDraft, Question, QuizPaper, 
  QuizRecord, QuizRecordEvent, QuizRecordInitiation, 
  QuizRecordOperation, QuizRecordTactics, 
  QuizzyController, QuizzyData, StartQuizOptions, 
  Stat, StatBase, TempTagListResult, TagSearchResult, 
  TICIndex, Tag, TagBase,
  UpdateQuizOptions, 
  defaultTag,
  BaseQuestion
} from "../types";
import { IDBPDatabase, IDBPTransaction } from "idb";
import { separatePaperAndQuestions, toCompleted } from "./paper-id";
import { uuidV4B64WithRetry } from "../utils/string";
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
import IDBCore from "./idb-core";
import { Bookmark, BookmarkBase, BookmarkReservedColors, BookmarkReservedWords, BookmarkType, defaultBookmark, defaultBookmarkType } from "../types/bookmark";
import { createMergableTagsFinder, diffTags, mergeTags } from "./tag";


export const DB_KEY = 'Quizzy';
export const VERSION = 4;

const STORE_KEY_PAPERS = 'papers';
const STORE_KEY_RECORDS = 'records';
const STORE_KEY_QUESTIONS = 'questions';
const STORE_KEY_RESULTS = 'results';
const STORE_KEY_STATS = 'stats';
const STORE_KEY_TAGS = 'tags';
const STORE_KEY_BOOKMARK_TYPES = 'bookmark_types';
const STORE_KEY_BOOKMARKS = 'bookmarks';

const STORE_KEY_GENERAL = 'general';


const ticIndices: readonly ((keyof BookmarkBase) & TICIndex)[] = ['typeId', 'itemId', 'category'];
const icIndices: readonly ((keyof BookmarkBase) & TICIndex)[] = ['itemId', 'category'];
const tcIndices: readonly ((keyof BookmarkBase) & TICIndex)[] = ['typeId', 'category'];

// TODO replace with strict typing
type DatabaseType = {
  [STORE_KEY_GENERAL]: {
    key: string;
    value: any;
  },
  [STORE_KEY_QUESTIONS]: {
    key: string;
    value: Question;
  },
};

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
      // store.createIndex('keywords', 'keywords', { multiEntry: true });
      // store.createIndex('keywordsUpdatedTime', 'keywordsUpdatedTime', {});
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
  [1]: (db) => {
    // create new stores
    const _id: IDBObjectStoreParameters = { keyPath: 'id', };
    const tagStore = db.createObjectStore(STORE_KEY_TAGS, _id);
    const bookmarkTypeStore = db.createObjectStore(STORE_KEY_BOOKMARK_TYPES, _id);
    const bookmarkStore = db.createObjectStore(STORE_KEY_BOOKMARKS, _id);
    for (const store of [tagStore, bookmarkTypeStore, bookmarkStore]) {
      store.createIndex('deleted', 'deleted');
      store.createIndex('lastUpdate', 'lastUpdate');
    }

    // tag
    tagStore.createIndex('mainName', 'mainName', { unique: true });
    tagStore.createIndex('alternatives', 'alternatives', { multiEntry: true });

    // bookmark
    // 'typeId' | 'itemId' | 'category';
    for (const i of ticIndices) {
      bookmarkStore.createIndex(i, i);
    }
    bookmarkStore.createIndex('TIC', ticIndices as any, { unique: true });
    bookmarkStore.createIndex('IC', icIndices as any);
    bookmarkStore.createIndex('createTime', 'createTime');

    // bookmark type
    bookmarkTypeStore.createIndex('name', 'name', { unique: true });
    for (const w of BookmarkReservedWords) {
      bookmarkTypeStore.put(defaultBookmarkType({
        dispCssColor: BookmarkReservedColors[w],
        name: w,
        id: w,
      }));
    }
  },
  [2]: (_, tx) => {
    const bookmarkStore = tx.objectStore(STORE_KEY_BOOKMARKS);
    bookmarkStore.createIndex('TC', tcIndices as any);
  },
  [3]: (_, tx) => {
    const generalStore = tx.objectStore(STORE_KEY_GENERAL);
    generalStore.createIndex('type', 'type');
    generalStore.createIndex('key', 'key');
  }
} as const;

export class IDBController extends IDBCore implements QuizzyController {

  private constructor(db: IDBPDatabase) {
    super(db, STORE_KEY_GENERAL);
  }

  static async connect() {
    const db = await openDatabase(DB_KEY, VERSION, updaters);

    // const tx = db.transaction([STORE_KEY_PAPERS, STORE_KEY_QUESTIONS], 'readwrite');
    
    // let cursor = await tx.objectStore(STORE_KEY_PAPERS).openCursor();
    // while (cursor != null) {
    //   const obj = cursor.value;
    //   clearKeywordIndices(obj, true);
    //   cursor.update(obj);
    //   cursor = await cursor.continue();
    // }
    // let cursor2 = await tx.objectStore(STORE_KEY_QUESTIONS).openCursor();
    // while (cursor2 != null) {
    //   const obj = cursor2.value;
    //   clearKeywordIndices(obj, true);
    //   cursor2.update(obj);
    //   cursor2 = await cursor2.continue();
    // }

    // await tx.done;

    return new IDBController(db);
  }

  async importData(data: QuizzyData): Promise<void> {
    await this._import(STORE_KEY_PAPERS, data.papers ?? []);
    await this._import(STORE_KEY_QUESTIONS, data.questions ?? []);
    await this._import(STORE_KEY_RECORDS, data.records ?? []);
    await this._import(STORE_KEY_RESULTS, data.results ?? []);
    await this._import(STORE_KEY_STATS, data.stats ?? []);
    await this._import(STORE_KEY_BOOKMARKS, data.bookmarks ?? []);
    await this._import(STORE_KEY_BOOKMARK_TYPES, data.bookmarkTypes ?? []);
    await this._import(STORE_KEY_TAGS, data.tags ?? []);
    await this._import(STORE_KEY_GENERAL, data.general ?? []);
  }

  async exportData(): Promise<QuizzyData> {
    return {
      papers: await this._export(STORE_KEY_PAPERS),
      questions: await this._export(STORE_KEY_QUESTIONS),
      records: await this._export(STORE_KEY_RECORDS),
      results: await this._export(STORE_KEY_RESULTS),
      stats: await this._export(STORE_KEY_STATS),
      bookmarks: await this._export(STORE_KEY_BOOKMARKS),
      bookmarkTypes: await this._export(STORE_KEY_BOOKMARK_TYPES),
      tags: await this._export(STORE_KEY_TAGS),
      general: await this._export(STORE_KEY_GENERAL),
    };
  }

  // bookmark types
  // just standard CRUD

  async createBookmarkType(t?: Partial<BookmarkType>) {
    const bt = defaultBookmarkType(t);
    bt.id = await uuidV4B64WithRetry(
      (id) => this._get(STORE_KEY_BOOKMARK_TYPES, id, undefined, false).then(x => !!x), 
      12
    );
    return await this.db.add(STORE_KEY_BOOKMARK_TYPES, bt) as ID;
  }

  getBookmarkType(id: ID) {
    return this._get<BookmarkType>(STORE_KEY_BOOKMARK_TYPES, id);
  }

  listBookmarkTypes() {
    return this._list<BookmarkType>(STORE_KEY_BOOKMARK_TYPES);
  }

  updateBookmarkType(id: ID, t: Partial<BookmarkType>) {
    return this._update(STORE_KEY_BOOKMARK_TYPES, id, t);
  }

  deleteBookmarkType(id: ID) {
    return this._delete(STORE_KEY_BOOKMARK_TYPES, id, true);
  }

  // bookmarks

  getBookmark(id: ID) {
    return this._get<Bookmark>(STORE_KEY_BOOKMARKS, id);
  }

  updateBookmark(id: ID, bookmark: Patch<Bookmark>) {
    return this._update<Bookmark>(STORE_KEY_BOOKMARKS, id, bookmark);
  }

  deleteBookmark(id: ID) {
    return this._delete<Bookmark>(STORE_KEY_BOOKMARKS, id);
  }


  protected async _tic(payload: BookmarkBase) {
    const tx = this.db.transaction(STORE_KEY_BOOKMARKS, 'readwrite');
    const index = [payload.typeId, payload.itemId, payload.category];
    const existentBookmark = await tx.store.index('TIC')
      .get(index) as Bookmark | undefined;
    return [tx, existentBookmark] as [typeof tx, typeof existentBookmark];
  }

  async putBookmarkTIC(payload: BookmarkBase): Promise<ID> {
    // first check if exists, and return the existent one
    const [tx, existentBookmark] = await this._tic(payload);

    // exists && needs update
    if (existentBookmark && (
      existentBookmark.note !== payload.note 
      || existentBookmark.deleted
    )) {
      const lastUpdate = Date.now();
      const id = await tx.store.put({ 
        ...existentBookmark, 
        note: payload.note, 
        lastUpdate, 
        deleted: false,
      });
      await tx.done;
      return id as ID;
    } else if (existentBookmark) {
      // exists
      await tx.done;
      return existentBookmark.id;
    }
    // else, create a new one
    const id = await uuidV4B64WithRetry(
      (id) => this._get(STORE_KEY_BOOKMARKS, id, tx as any, false).then(x => !!x), 
      16
    );
    const bookmark = defaultBookmark(payload);
    bookmark.id = id;
    delete bookmark.deleted;
    bookmark.lastUpdate = Date.now();
    const ret = await tx.store.add(bookmark) as ID;
    await tx.done;
    return ret;
  }
  
  async deleteBookmarkTIC(payload: BookmarkBase) {
    const [tx, existentBookmark] = await this._tic(payload);
    if (!existentBookmark) {
      await tx.done;
      return false;
    }
    const ret = await this._delete<Bookmark>(STORE_KEY_BOOKMARKS, existentBookmark.id, true, tx as any);
    await tx.done;
    return ret;
  }
  
  async getBookmarkTIC(payload: BookmarkBase) {
    const [tx, existentBookmark] = await this._tic(payload);
    await tx.done;
    return existentBookmark;
  }

  listBookmarks(itemId: string, isQuestion: boolean) {
    return this._list<Bookmark>(STORE_KEY_BOOKMARKS, 'IC', [
      itemId, 
      isQuestion ? 'question' : 'paper'
    ] as any);
  }

  async clearAllBookmarks(itemId: string, isQuestion: boolean) {
    const tx = this.db.transaction(STORE_KEY_BOOKMARKS, 'readwrite');
    const i = tx.store.index('IC');
    const bookmarks = await i.getAll([
      itemId,
      isQuestion ? 'question' : 'paper'
    ]);
    const now = Date.now();
    const promises: Promise<any>[] = [];
    for (const b of bookmarks) {
      if (b.deleted) {
        continue;
      }
      b.deleted = true;
      b.lastUpdate = now;
      promises.push(tx.store.put(b));
    }
    await Promise.all(promises);
    await tx.done;
    return promises.length;
  }

  // tags

  protected async _matchTag(name: string, tx?: IDBPTransaction<unknown, ["tags"], "readonly">) {
    // 
    const hasTx = !!tx;
    tx = tx ?? this.db.transaction(STORE_KEY_TAGS, 'readonly');
    const store = tx.store;
    let ret = await store.index('mainName').get(name) as Tag | undefined;
    if (!ret) {
      ret = await store.index('alternatives').get(name);
    }
    if (!hasTx) {
      await tx.done;
    }
    return ret;
  }

  async getTag(payload: string | Partial<TagBase>) {
    if (!payload 
      || (typeof payload === 'object' && !payload.mainName?.trim())
      || (typeof payload === 'string' && !payload?.trim())
    ) {
      throw new Error('Empty tag name.');
    }
    if (typeof payload === "string") {
      payload = { mainName: payload };
    }
    const tx = this.db.transaction(STORE_KEY_TAGS, 'readwrite');

    // if exists, return current
    const currentTag = await this._matchTag(payload.mainName!, tx as any);
    if (currentTag) {
      await tx.done;
      return currentTag;
    }

    // return default tag
    const tag = defaultTag({
      ...payload,
      id: await uuidV4B64WithRetry(
        (id) => this._get(STORE_KEY_TAGS, id, tx as any, false).then(x => !!x),
        16
      ),
    });
    delete tag.deleted;
    await tx.store.add(tag);
    await tx.done;
    return tag;
  }

  listTags() {
    return this._list<Tag>(STORE_KEY_TAGS);
  }

  async updateTag(id: ID, tag: Patch<Tag>) {
    await this._invalidateCache('trie');
    return await this._update(STORE_KEY_TAGS, id, tag);
  }

  async deleteTag(id: ID) {
    await this._invalidateCache('trie');
    return await this._delete(STORE_KEY_TAGS, id, true);
  }

  async mergeTags(ids: ID[]) {
    const tx = this.db.transaction(STORE_KEY_TAGS, 'readwrite');
    const tags: Tag[] = (await Promise.all(ids.map(id => tx.store.get(id)))).filter(x => x && !x.deleted);
    if (tags.length === 0) {
      await tx.done;
      return undefined;
    }
    const [mainTag, otherTags] = mergeTags(tags, Date.now());
    await tx.store.put(mainTag);
    await Promise.all(otherTags.map(t => tx.store.put(t)));
    await tx.done;
    return mainTag.id;
  }

  async splitToNewTag(src: ID, alternatives: string[]) {
    if (!alternatives?.length || !src) {
      return undefined;
    }
    const tx = this.db.transaction(STORE_KEY_TAGS, 'readwrite');
    const srcTag: Tag = await tx.store.get(src);
    if (!srcTag) {
      await tx.done;
      return undefined;
    }
    const newTag = defaultTag({ alternatives: [...alternatives] });
    diffTags(srcTag, newTag, Date.now());
    newTag.mainName = newTag.alternatives[0];
    newTag.id = await uuidV4B64WithRetry(
      (id) => this._get(STORE_KEY_TAGS, id, tx as any, false).then(x => !!x),
      16
    );
    const ret = await tx.store.put(newTag) as ID;
    await tx.done;
    return ret;
  }

  async getNormalizedTagList(list: string[]) {
    const tagSet: Set<ID> = new Set();
    const remainTags: Tag[] = [];
    for (const tag of list) {
      const tagObj = await this.getTag(tag);
      if (tagSet.has(tagObj.id)) {
        continue;
      }
      tagSet.add(tagObj.id);
      remainTags.push(tagObj);
    }
    return remainTags;
  }

  async mergeMergableTags() {
    const tx = this.db.transaction(STORE_KEY_TAGS, 'readwrite');
    // find all mergable tags
    let cursor = await tx.store.openCursor();
    const { onNextTag, getResult } = createMergableTagsFinder();
    const tagCache: Record<ID, Tag> = {};
    while (cursor != null) {
      if (cursor.value.deleted) { // ignore deleted tags
        cursor = await cursor.continue();
        continue;
      }
      tagCache[cursor.key as ID] = cursor.value;
      onNextTag(cursor.value);
      cursor = await cursor.continue();
    }
    // change & commit records
    const mergableGroups = getResult();
    const updateTime = Date.now();
    const promisesMain: Promise<IDBValidKey>[] = [];
    const promisesOthers: Promise<IDBValidKey>[] = [];
    for (const group of mergableGroups) {
      const tagGroup = group.map(x => tagCache[x]);
      const [mainTag, otherTags] = mergeTags(tagGroup, updateTime);
      promisesMain.push(tx.store.put(mainTag));
      for (const t of otherTags) {
        promisesOthers.push(tx.store.put(t));
      }
    }
    const allMainIds = await Promise.all(promisesMain);
    const allDeletedIds = await Promise.all(promisesOthers);
    await tx.done;
    return [allMainIds, allDeletedIds] as [ID[], ID[]];
  }

  async generateTagHint(query: string, limit?: number, __?: number): Promise<TagSearchResult> {
    const trieRaw = await this._loadTrieCache('tags-categories');
    const trieObj = await this._loadTrieCache('tag-objects');
    return {
      paper: trieRaw?.searchFunc(query, limit) ?? [],
      paperTags: trieObj?.searchFunc(query, limit) ?? [],
      question: [],
      questionTags: [],
    };
  }

  async listTagsInPapersAndQuestions(): Promise<TempTagListResult> {
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


  // questions & papers

  async importQuestions(...questions: Question[]): Promise<ID[]> {
    questions.forEach(q => normalizeQuestion(q));
    // TODO
    return this._import(STORE_KEY_QUESTIONS, questions).then(x => x.newlyImported);
  }

  async importQuizPapers(...papers: QuizPaper[]): Promise<ID[]> {
    // TODO
    return this._import(STORE_KEY_PAPERS, papers).then(x => x.newlyImported);
  }

  // TODO replace with repetitive tasks

  async findQuestion(query: string, count?: number, page?: number): Promise<SearchResult<Question>> {
    await this.refreshSearchIndices();
    const queryKeywords = await this._getKeywords(query, STORE_KEY_QUESTIONS);
    return this._search(STORE_KEY_QUESTIONS, query, queryKeywords, count, page);
  }

  async findQuizPaper(query: string, count?: number, page?: number): Promise<SearchResult<QuizPaper>> {
    await this.refreshSearchIndices();
    const queryKeywords = await this._getKeywords(query, STORE_KEY_PAPERS);
    return this._search(STORE_KEY_PAPERS, query, queryKeywords, count, page);
  }

  async findQuestionByTags(query: string, count?: number, page?: number): Promise<SearchResult<Question>> {
    await this.refreshSearchIndices();
    const trieRaw = await this._loadTrieCache('tags-categories');
    return this._searchByTag<Question>(
      STORE_KEY_QUESTIONS, trieRaw!, query, null, count, page,
    );
  }

  async findQuizPaperByTags(query: string, count?: number, page?: number): Promise<SearchResult<QuizPaper>> {
    await this.refreshSearchIndices();
    const trieRaw = await this._loadTrieCache('tags-categories');
    return this._searchByTag<QuizPaper>(
      STORE_KEY_PAPERS, trieRaw!, query, null, count, page,
    );
  }

  async listQuestionByBookmark(id: string) {
    const bookmarks: Bookmark[] = (await this.db.getAllFromIndex(
      STORE_KEY_BOOKMARKS, 'TC', [id, 'question']
    )).filter(x => !x.deleted);
    const items: Question[] = (await Promise.all(bookmarks.map(
      x => this.db.get(STORE_KEY_QUESTIONS, x.itemId)
    ))).filter(x => x && !x.deleted);
    items.forEach(x => sanitizeIndices(x, true));
    return items;
  }
  
  async listQuizPaperByBookmark(id: string) {
    const bookmarks: Bookmark[] = (await this.db.getAllFromIndex(
      STORE_KEY_BOOKMARKS, 'TC', [id, 'paper']
    )).filter(x => !x.deleted);
    const items: QuizPaper[] = (await Promise.all(bookmarks.map(
      x => this.db.get(STORE_KEY_PAPERS, x.itemId)
    ))).filter(x => x && !x.deleted);
    items.forEach(x => sanitizeIndices(x, true));
    return items;
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

  async getQuestion(id: ID): Promise<Question | undefined> {
    const ret = await this.db.get(STORE_KEY_QUESTIONS, id);
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
    const ret: QuizPaper[] = await this._list(STORE_KEY_PAPERS);
    ret.forEach(x => sanitizeIndices(x, true));
    return ret;
  }

  async listQuestions(): Promise<Question[]> {
    const ret: Question[] = await this._list(STORE_KEY_QUESTIONS);
    ret.forEach(x => sanitizeIndices(x, true));
    return ret;
  }


  async updateQuestion(id: ID, patch: Patch<Question>): Promise<ID> {
    await this._invalidateCache('trie');
    return await this._update(STORE_KEY_QUESTIONS, id, patch);
  }
  async updateQuizPaper(id: ID, paper: Patch<QuizPaper>): Promise<ID> {
    await this._invalidateCache('trie');
    return await this._update(STORE_KEY_PAPERS, id, paper);
  }

  async deleteQuestion(id: ID): Promise<boolean> {
    await this._invalidateCache('trie');
    return await this._delete(STORE_KEY_QUESTIONS, id, true);
  }
  async deleteQuizPaper(id: ID): Promise<boolean> {
    await this._invalidateCache('trie');
    return await this._delete(STORE_KEY_PAPERS, id, true);
  }

  // search

  async refreshSearchIndices(
    forceReindexing = false, 
    forceReindexingForPreparation = false,
    ignoreDeleted = true
  ) {
    const ret = await this._prepareForSearch({
      fieldsByStore: {
        [STORE_KEY_PAPERS]: [
          'name', 'desc', 'tags', 'categories'
        ], // satisfies (keyof QuizPaper),
        [STORE_KEY_QUESTIONS]: [
          'name', 'tags', 'categories', 
          'title', 'content', 'solution', 
          'options', 'blanks', 'answer'
        ], // satisfies (keyof Question)[],
      },
      forceReindexing,
      forceReindexingForPreparation,
      ignoreDeleted,
    });
    // TODO apply forceReindexingForPreparation
    await this._buildTrieCache(
      'tags-categories',
      [STORE_KEY_PAPERS, STORE_KEY_QUESTIONS],
      (x: QuizPaper & BaseQuestion) => {
        return [
          ...x.categories ?? [],
          ...x.tags ?? [],
        ];
      },
      forceReindexing,
    );
    await this._buildTrieCache(
      'tag-objects',
      [STORE_KEY_TAGS],
      (x: Tag) => [
        x.mainName,
        ...Object.values(x.mainNames ?? {}).filter(x => !!x) as string[],
        ...x.alternatives ?? [],
      ],
      forceReindexing,
    );
    return ret;
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
    const stores: readonly string[] = [
      STORE_KEY_PAPERS, STORE_KEY_QUESTIONS, STORE_KEY_RECORDS,
      STORE_KEY_RESULTS, STORE_KEY_STATS, STORE_KEY_TAGS,
      STORE_KEY_BOOKMARKS, STORE_KEY_BOOKMARK_TYPES,
    ];
    const tx = this.db.transaction(stores, 'readwrite');
    const promises: Promise<void>[] = [];
    for (const storeId of stores) {
      const store = tx.objectStore(storeId);
      let cursor = await store.openCursor();
      while (cursor != null) {
        const { id, deleted } = cursor.value;
        if (deleted) {
          promises.push(store.delete(id));
          ++count;
        }
        cursor = await cursor.continue();
      }
    }
    await Promise.all(promises);
    await tx.done;
    return count;
  }

  async normalizeQuestions() {
    const questions = await this.listQuestions();
    const questionsToCommit: Question[] = [];
    for (const question of questions) {
      const changed = normalizeQuestion(question);
      if (changed) {
        questionsToCommit.push(question);
      }
    }
    const tx = this.db.transaction(STORE_KEY_QUESTIONS, 'readwrite');
    await Promise.all(questionsToCommit.map(x => tx.store.put(x)));
    await tx.done;
    return questionsToCommit.length;
  }

  // records

  importQuizRecords(...records: QuizRecord[]): Promise<ID[]> {
    // TODO
    return this._import(STORE_KEY_RECORDS, records).then(x => x.newlyImported);
  }

  getQuizRecord(id: ID): Promise<QuizRecord | undefined> {
    return this.db.get(STORE_KEY_RECORDS, id);
  }

  listQuizRecords(quizPaperId?: ID): Promise<QuizRecord[]> {
    return this._list(STORE_KEY_RECORDS, quizPaperId ? 'paperId' : undefined, quizPaperId);
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
    record.id = await uuidV4B64WithRetry(
      (id) => this._get(STORE_KEY_RECORDS, id, tx as any, false).then(x => !!x),
      16
    );
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
      event.question = (await this.getQuestion(event.questionId));
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
        .map(q => [q!.id, q as Question]),
    );
    // create result and patches

    // create write transactions
    const tx = this.db.transaction([
      STORE_KEY_RESULTS, STORE_KEY_RECORDS,
    ], 'readwrite');

    // put the result into the store
    const _sr = tx.objectStore(STORE_KEY_RESULTS);
    const resultId = await uuidV4B64WithRetry(
      (id) => this._get(STORE_KEY_RESULTS, id, tx as any, false).then(x => !!x),
      16
    );
    const result = createQuizResult(r, quizPaper, allQuestions, resultId);
    result.stat = await createStatFromQuizResults([result], async (id) => allQuestions[id]);
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
    // TODO
    return this._import(STORE_KEY_RESULTS, results).then(x => x.newlyImported);
  }

  getQuizResult(id: ID): Promise<QuizResult | undefined> {
    return this.db.get(STORE_KEY_RESULTS, id);
  }

  listQuizResults(quizPaperId?: ID): Promise<QuizResult[]> {
    return this._list(STORE_KEY_RESULTS, quizPaperId ? 'paperId' : undefined, quizPaperId);
  }

  // stats


  async generateStats(...resultIds: ID[]): Promise<Stat | StatBase | undefined> {
    const now = Date.now();
    const results = (await Promise.all(resultIds.map(
      (id) => this.db.get(STORE_KEY_RESULTS, id) as Promise<QuizResult | undefined>,
    ))).filter(x => !!x) as QuizResult[];
    if (!results.length) {
      return undefined;
    }
    // get questions
    const questionCache: Record<ID, Promise<Question | undefined> | undefined> = {};
    const getQuestion = async (id: ID) => {
      if (questionCache[id]) {
        return questionCache[id];
      }
      const promise = this.getQuestion(id);
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
      id: await uuidV4B64WithRetry(
        (id) => this._get(STORE_KEY_STATS, id, undefined, false).then(x => !!x), 
        16
      ),
      results: results.map(x => x.id),
    };
    await this.db.put(STORE_KEY_STATS, statWithId);
    return statWithId;
  }

  listStats(): Promise<Stat[]> {
    return this._list(STORE_KEY_STATS);
  }

  getStat(id: ID): Promise<Stat | undefined> {
    return this.db.get(STORE_KEY_STATS, id);
  }

  deleteStat(id: ID): Promise<boolean> {
    return this._delete(STORE_KEY_STATS, id, true);
  }
}