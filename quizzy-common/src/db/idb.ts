import { 
  CompleteQuizPaperDraft, Question, QuizPaper, 
  QuizRecord, QuizRecordEvent, QuizRecordInitiation, 
  QuizRecordOperation, QuizRecordTactics, 
  QuizzyController, QuizzyData, StartQuizOptions, 
  Stat, StatBase, TempTagListResult, TagSearchResult, 
  TICIndex, Tag, TagBase,
  UpdateQuizOptions, 
  defaultTag,
  BaseQuestion,
  ExportOptions, PaperExportResult, QuestionExportResult,
  CompleteQuizPaper, CompleteQuestion, CompleteQuestionDraft
} from "../types";
import { IDBPDatabase, IDBPTransaction } from "idb";
import { separatePaperAndQuestions, toCompleted, completeQuestionToQuestion, questionToCompleteQuestion } from "./paper-id";
import { uuidV4B64WithRetry } from "../utils/string";
import { QuizResult } from "../types/quiz-result";
import { createQuizResult } from "./quiz-result";
import { DatabaseIndexed, ID, sanitizeIndices, SearchResult, VersionConflictRecord, VersionIndexed } from "../types/technical";
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


export const DB_VERSION = 6;

const STORE_KEY_PAPERS = 'papers';
const STORE_KEY_RECORDS = 'records';
const STORE_KEY_QUESTIONS = 'questions';
const STORE_KEY_RESULTS = 'results';
const STORE_KEY_STATS = 'stats';
const STORE_KEY_TAGS = 'tags';
const STORE_KEY_BOOKMARK_TYPES = 'bookmark_types';
const STORE_KEY_BOOKMARKS = 'bookmarks';

const STORE_KEY_GENERAL = 'general';
const STORE_KEY_VERSION = 'version';


const ticIndices: readonly ((keyof BookmarkBase) & TICIndex)[] = ['typeId', 'itemId', 'category'];
const icIndices: readonly ((keyof BookmarkBase) & TICIndex)[] = ['itemId', 'category'];
const tcIndices: readonly ((keyof BookmarkBase) & TICIndex)[] = ['typeId', 'category'];

const fieldsByStore = Object.freeze({
  [STORE_KEY_PAPERS]: [
    'name', 'desc', 'tags', 'categories', 'tagIds', 'categoryIds'
  ] as any, // 'tags' and 'categories' kept for migration, not in type
  [STORE_KEY_QUESTIONS]: [
    'name', 'tags', 'categories', 'tagIds', 'categoryIds',
    'title', 'content', 'solution', 
    'options', 'blanks', 'answer'
  ] as any, // 'tags' and 'categories' kept for migration, not in type
});

const fieldsByStore2 = Object.freeze({
  [STORE_KEY_PAPERS]: [
    'deleted',
    ...fieldsByStore[STORE_KEY_PAPERS] as any[],
    'img', 'weights', 'duration', 'questions',
  ] as any, // Contains legacy fields for migration
  [STORE_KEY_QUESTIONS]: [
    'deleted',
    ...fieldsByStore[STORE_KEY_QUESTIONS],
    'type', 'multiple',
  ] as any, // Contains legacy fields for migration
  [STORE_KEY_RECORDS]: [
    'deleted',
    'startTime', 'timeUsed', 'answers', 'lastQuestion',
    'paused', 'lastEnter', 'updateTime',
    'paperId', 'randomState', 'nameOverride', 'questionOrder',
  ] satisfies readonly (keyof QuizRecord)[],
  [STORE_KEY_TAGS]: [
    'deleted',
    'mainName', 'mainNames', 'alternatives',
  ] satisfies readonly (keyof Tag)[],
  [STORE_KEY_BOOKMARKS]: [
    'deleted',
    'typeId', 'itemId', 'category', 'note',
  ] satisfies readonly (keyof Bookmark)[],
  [STORE_KEY_BOOKMARK_TYPES]: [
    'deleted',
    'dispCssColor', 'dispCssColorDark',
    'name', 'names', 'desc', 'descs',
  ] satisfies readonly (keyof BookmarkType)[],
});

const dataByStore = Object.freeze({    
  [STORE_KEY_PAPERS]: 'papers',
  [STORE_KEY_QUESTIONS]: 'questions',
  [STORE_KEY_RECORDS]: 'records',
  [STORE_KEY_BOOKMARKS]: 'bookmarks',
  [STORE_KEY_BOOKMARK_TYPES]: 'bookmarkTypes',
  [STORE_KEY_TAGS]: 'tags',
});

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
        currentVersion: 'default',
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
  },
  [4]: (db) => {
    const versionStore = db.createObjectStore(STORE_KEY_VERSION, {
      keyPath: 'id',
    });
    for (const key of ['storeId', 'itemId', 'importTime'] as (keyof VersionConflictRecord)[]) {
      versionStore.createIndex(key, key);
    };
    versionStore.createIndex('SI', ['storeId', 'itemId']);
  },
  [5]: (_, tx) => {
    // Add tagIds and categoryIds indexes for new ID-based tag system
    const paperStore = tx.objectStore(STORE_KEY_PAPERS);
    const questionStore = tx.objectStore(STORE_KEY_QUESTIONS);
    
    paperStore.createIndex('tagIds', 'tagIds', { multiEntry: true });
    paperStore.createIndex('categoryIds', 'categoryIds', { multiEntry: true });
    questionStore.createIndex('tagIds', 'tagIds', { multiEntry: true });
    questionStore.createIndex('categoryIds', 'categoryIds', { multiEntry: true });
  }
} as const;

export class IDBController extends IDBCore implements QuizzyController {

  private constructor(db: IDBPDatabase) {
    super(db, STORE_KEY_GENERAL, STORE_KEY_VERSION);
  }

  static async connect(key: string) {
    const db = await openDatabase(key, DB_VERSION, updaters);
    const controller = new IDBController(db);
    
    // Check and perform automatic migration if needed
    await controller.checkAndPerformAutoMigration();
    
    return controller;
  }

  /**
   * Check if automatic tag migration is needed and perform it
   */
  private async checkAndPerformAutoMigration(): Promise<void> {
    const migrationKey = 'tag-migration-to-ids-completed';
    
    try {
      const migrationStatus = await this.db.get(STORE_KEY_GENERAL, migrationKey);
      
      if (!migrationStatus?.value) {
        // Migration not done yet, perform it
        console.log('Performing automatic tag migration to ID-based system...');
        const result = await this.migrateTagsToIds();
        console.log('Tag migration completed:', result);
        
        // Mark migration as completed
        await this.db.put(STORE_KEY_GENERAL, {
          id: migrationKey,
          value: true,
          timestamp: Date.now(),
          result,
        });
      }
    } catch (error) {
      console.error('Error during automatic tag migration:', error);
      // Don't throw - allow the app to continue even if migration fails
    }
  }

  // #region version control

  async evolveVersion(): Promise<void> {
    for (const storeId of Object.keys(dataByStore)) {
      const hashFields: (keyof DatabaseIndexed & VersionIndexed)[] 
      = (fieldsByStore2 as any)[storeId];
      await this._evolve(storeId, { hashFields });
    }
  }

  async importData(data: QuizzyData): Promise<void> {
    // import version-indexed
    for (const [storeId, dataKey] of Object.entries(dataByStore)) {
      const obj = data[dataKey];
      if (!obj?.length) {
        continue;
      }
      const hashFields: (keyof DatabaseIndexed & VersionIndexed)[] 
      = (fieldsByStore2 as any)[storeId];
      await this._evolve(storeId, { hashFields });
      const { conflict } = await this._import<DatabaseIndexed & VersionIndexed>(storeId, obj, { 
        now: Date.now(),
        isStoreVersionIndexed: true,
        hashFields,
      });
      for (const c of conflict) {
        await this.createVersionConflictRecord(c);
      }
    }

    // import non-version-indexed
    await this._import(STORE_KEY_RESULTS, data.results ?? []);
    await this._import(STORE_KEY_STATS, data.stats ?? []);
  }

  async exportData(): Promise<QuizzyData> {
    const result: QuizzyData = {
      questions: [],
      papers: [],
      records: [],
      bookmarks: [],
      bookmarkTypes: [],
      tags: [],

      results: await this._export(STORE_KEY_RESULTS),
      stats: await this._export(STORE_KEY_STATS),
    };

    for (const [storeId, dataKey] of Object.entries(dataByStore)) {
      const hashFields: (keyof DatabaseIndexed & VersionIndexed)[] 
      = (fieldsByStore2 as any)[storeId];
      await this._evolve(storeId, { hashFields });
      result[dataKey] = (await this._export(storeId)) as any;
    }

    return result;
  }

  // #endregion
  
  // #region indexing

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

  /**
   * Reset database - delete all data and edit history
   * WARNING: This is a destructive operation that cannot be undone!
   * @returns The number of records deleted
   */
  async resetDatabase(): Promise<number> {
    let count = 0;
    const stores: readonly string[] = [
      STORE_KEY_PAPERS, STORE_KEY_QUESTIONS, STORE_KEY_RECORDS,
      STORE_KEY_RESULTS, STORE_KEY_STATS, STORE_KEY_TAGS,
      STORE_KEY_BOOKMARKS, STORE_KEY_BOOKMARK_TYPES,
      STORE_KEY_GENERAL, STORE_KEY_VERSION,
    ];
    
    // Clear all object stores
    const tx = this.db.transaction(stores, 'readwrite');
    for (const storeId of stores) {
      const store = tx.objectStore(storeId);
      const allKeys = await store.getAllKeys();
      count += allKeys.length;
      await store.clear();
    }
    await tx.done;
    
    // Clear all caches
    await this._invalidateCache('bm25');
    await this._invalidateCache('trie');
    
    // Re-initialize reserved bookmark types
    const bookmarkTypeTx = this.db.transaction(STORE_KEY_BOOKMARK_TYPES, 'readwrite');
    for (const w of BookmarkReservedWords) {
      await bookmarkTypeTx.store.put(defaultBookmarkType({
        currentVersion: 'default',
        dispCssColor: BookmarkReservedColors[w],
        name: w,
        id: w,
      }));
    }
    await bookmarkTypeTx.done;
    
    return count;
  }

  // #endregion
  
  // #region bookmark types
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

  // #endregion
  
  // #region bookmarks

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

  // #endregion
  
  // #region tags

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
    // Filter out soft-deleted tags to avoid uniqueness constraint conflicts
    if (ret && ret.deleted) {
      return undefined;
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

  async getTagById(id: ID): Promise<Tag | undefined> {
    return await this._get<Tag>(STORE_KEY_TAGS, id);
  }

  async getTagsByIds(ids: ID[]): Promise<(Tag | undefined)[]> {
    return await Promise.all(ids.map(id => this.getTagById(id)));
  }

  async updateTag(id: ID, tag: Patch<Tag>) {
    await this._invalidateCache('trie');
    return await this._update(STORE_KEY_TAGS, id, tag);
  }

  async deleteTag(id: ID) {
    // Soft delete the tag
    await this._delete(STORE_KEY_TAGS, id, true);
    
    // Remove the tag ID from all questions
    const txQuestions = this.db.transaction(STORE_KEY_QUESTIONS, 'readwrite');
    const questions = await txQuestions.store.getAll();
    let questionsUpdated = 0;
    
    for (const q of questions) {
      let updated = false;
      
      // Remove from tagIds
      if (q.tagIds && q.tagIds.includes(id)) {
        q.tagIds = q.tagIds.filter((tagId: ID) => tagId !== id);
        updated = true;
      }
      
      // Remove from categoryIds
      if (q.categoryIds && q.categoryIds.includes(id)) {
        q.categoryIds = q.categoryIds.filter((catId: ID) => catId !== id);
        updated = true;
      }
      
      if (updated) {
        q.lastUpdate = Date.now();
        await txQuestions.store.put(q);
        questionsUpdated++;
      }
    }
    await txQuestions.done;
    
    // Remove the tag ID from all papers
    const txPapers = this.db.transaction(STORE_KEY_PAPERS, 'readwrite');
    const papers = await txPapers.store.getAll();
    let papersUpdated = 0;
    
    for (const p of papers) {
      let updated = false;
      
      // Remove from tagIds
      if (p.tagIds && p.tagIds.includes(id)) {
        p.tagIds = p.tagIds.filter((tagId: ID) => tagId !== id);
        updated = true;
      }
      
      // Remove from categoryIds
      if (p.categoryIds && p.categoryIds.includes(id)) {
        p.categoryIds = p.categoryIds.filter((catId: ID) => catId !== id);
        updated = true;
      }
      
      if (updated) {
        p.lastUpdate = Date.now();
        await txPapers.store.put(p);
        papersUpdated++;
      }
    }
    await txPapers.done;
    
    // Invalidate search caches to rebuild without deleted tag
    await this._invalidateCache('trie');
    await this._invalidateCacheByItem();
    
    return true;
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
    
    // Get IDs of tags being merged (excluding the main tag)
    const mergedTagIds = otherTags.map(t => t.id);
    const mainTagId = mainTag.id;
    
    // Update all questions that reference the merged tags
    const txQuestions = this.db.transaction(STORE_KEY_QUESTIONS, 'readwrite');
    const questions = await txQuestions.store.getAll();
    let questionsUpdated = 0;
    
    for (const q of questions) {
      let updated = false;
      
      // Update tagIds
      if (q.tagIds && q.tagIds.some((id: ID) => mergedTagIds.includes(id))) {
        const newTagIds = new Set(q.tagIds.map((id: ID) =>
          mergedTagIds.includes(id) ? mainTagId : id
        ));
        q.tagIds = Array.from(newTagIds);
        updated = true;
      }
      
      // Update categoryIds
      if (q.categoryIds && q.categoryIds.some((id: ID) => mergedTagIds.includes(id))) {
        const newCategoryIds = new Set(q.categoryIds.map((id: ID) =>
          mergedTagIds.includes(id) ? mainTagId : id
        ));
        q.categoryIds = Array.from(newCategoryIds);
        updated = true;
      }
      
      if (updated) {
        q.lastUpdate = Date.now();
        await txQuestions.store.put(q);
        questionsUpdated++;
      }
    }
    await txQuestions.done;
    
    // Update all papers that reference the merged tags
    const txPapers = this.db.transaction(STORE_KEY_PAPERS, 'readwrite');
    const papers = await txPapers.store.getAll();
    let papersUpdated = 0;
    
    for (const p of papers) {
      let updated = false;
      
      // Update tagIds
      if (p.tagIds && p.tagIds.some((id: ID) => mergedTagIds.includes(id))) {
        const newTagIds = new Set(p.tagIds.map((id: ID) =>
          mergedTagIds.includes(id) ? mainTagId : id
        ));
        p.tagIds = Array.from(newTagIds);
        updated = true;
      }
      
      // Update categoryIds
      if (p.categoryIds && p.categoryIds.some((id: ID) => mergedTagIds.includes(id))) {
        const newCategoryIds = new Set(p.categoryIds.map((id: ID) =>
          mergedTagIds.includes(id) ? mainTagId : id
        ));
        p.categoryIds = Array.from(newCategoryIds);
        updated = true;
      }
      
      if (updated) {
        p.lastUpdate = Date.now();
        await txPapers.store.put(p);
        papersUpdated++;
      }
    }
    await txPapers.done;
    
    // Invalidate search caches to rebuild with merged tags
    await this._invalidateCache('trie');
    await this._invalidateCacheByItem();
    
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

  /**
   * Check if tag migration has been completed
   */
  async isTagMigrationCompleted(): Promise<boolean> {
    const migrationKey = 'tag-migration-to-ids-completed';
    try {
      const migrationStatus = await this.db.get(STORE_KEY_GENERAL, migrationKey);
      return !!migrationStatus?.value;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get migration status information
   */
  async getMigrationStatus(): Promise<{
    completed: boolean;
    timestamp?: number;
    result?: any;
  }> {
    const migrationKey = 'tag-migration-to-ids-completed';
    try {
      const migrationStatus = await this.db.get(STORE_KEY_GENERAL, migrationKey);
      if (migrationStatus?.value) {
        return {
          completed: true,
          timestamp: migrationStatus.timestamp,
          result: migrationStatus.result,
        };
      }
    } catch (error) {
      // ignore
    }
    return { completed: false };
  }

  /**
   * Migrate all tags from string-based to ID-based system
   * @returns object with counts of migrated items
   */
  async migrateTagsToIds(): Promise<{
    questionsUpdated: number;
    papersUpdated: number;
    tagsCreated: number;
  }> {
    // Step 1: Collect all unique tag strings from questions and papers
    const allTagStrings = new Set<string>();
    
    const questions = await this._list<Question>(STORE_KEY_QUESTIONS);
    const papers = await this._list<QuizPaper>(STORE_KEY_PAPERS);
    
    for (const q of questions) {
      (q as any).tags?.forEach((t: string) => allTagStrings.add(t));
      (q as any).categories?.forEach((c: string) => allTagStrings.add(c));
    }
    
    for (const p of papers) {
      (p as any).tags?.forEach((t: string) => allTagStrings.add(t));
      (p as any).categories?.forEach((c: string) => allTagStrings.add(c));
    }
    
    // Step 2: Create or get tag entities for each unique string
    const tagMap = new Map<string, ID>();
    let tagsCreated = 0;
    
    for (const tagStr of allTagStrings) {
      if (!tagStr || !tagStr.trim()) {
        continue;
      }
      try {
        const tag = await this.getTag(tagStr);
        tagMap.set(tagStr, tag.id);
        // Check if this is a newly created tag (no lastUpdate means new)
        if (!tag.lastUpdate) {
          tagsCreated++;
        }
      } catch (e) {
        console.error(`Failed to create tag for "${tagStr}":`, e);
      }
    }
    
    // Step 3: Update all questions
    let questionsUpdated = 0;
    const txQuestions = this.db.transaction(STORE_KEY_QUESTIONS, 'readwrite');
    for (const q of questions) {
      // Skip if already migrated (has tagIds)
      if (q.tagIds && q.tagIds.length > 0) {
        continue;
      }
      
      const tagIds = ((q as any).tags ?? [])
        .map((t: string) => tagMap.get(t))
        .filter((id: any): id is ID => !!id);
      const categoryIds = ((q as any).categories ?? [])
        .map((c: string) => tagMap.get(c))
        .filter((id: any): id is ID => !!id);
      
      if (tagIds.length > 0 || categoryIds.length > 0) {
        q.tagIds = tagIds;
        q.categoryIds = categoryIds;
        q.lastUpdate = Date.now();
        await txQuestions.store.put(q);
        questionsUpdated++;
      }
    }
    await txQuestions.done;
    
    // Step 4: Update all papers
    let papersUpdated = 0;
    const txPapers = this.db.transaction(STORE_KEY_PAPERS, 'readwrite');
    for (const p of papers) {
      // Skip if already migrated (has tagIds)
      if (p.tagIds && p.tagIds.length > 0) {
        continue;
      }
      
      const tagIds = ((p as any).tags ?? [])
        .map((t: string) => tagMap.get(t))
        .filter((id: any): id is ID => !!id);
      const categoryIds = ((p as any).categories ?? [])
        .map((c: string) => tagMap.get(c))
        .filter((id: any): id is ID => !!id);
      
      if (tagIds.length > 0 || categoryIds.length > 0) {
        p.tagIds = tagIds;
        p.categoryIds = categoryIds;
        p.lastUpdate = Date.now();
        await txPapers.store.put(p);
        papersUpdated++;
      }
    }
    await txPapers.done;
    
    // Step 5: Invalidate caches to rebuild with new IDs
    await this._invalidateCacheByItem();
    
    return {
      questionsUpdated,
      papersUpdated,
      tagsCreated,
    };
  }

  /**
   * Remove legacy tags and categories fields from all questions and papers
   * This should only be called after migration is complete
   * @returns object with counts of items updated
   */
  async removeLegacyTagFields(): Promise<{
    questionsUpdated: number;
    papersUpdated: number;
  }> {
    let questionsUpdated = 0;
    let papersUpdated = 0;
    
    // Update all questions
    const txQuestions = this.db.transaction(STORE_KEY_QUESTIONS, 'readwrite');
    const questions = await txQuestions.store.getAll();
    for (const q of questions) {
      if ((q as any).tags || (q as any).categories) {
        delete (q as any).tags;
        delete (q as any).categories;
        await txQuestions.store.put(q);
        questionsUpdated++;
      }
    }
    await txQuestions.done;
    
    // Update all papers
    const txPapers = this.db.transaction(STORE_KEY_PAPERS, 'readwrite');
    const papers = await txPapers.store.getAll();
    for (const p of papers) {
      if ((p as any).tags || (p as any).categories) {
        delete (p as any).tags;
        delete (p as any).categories;
        await txPapers.store.put(p);
        papersUpdated++;
      }
    }
    await txPapers.done;
    
    // Invalidate caches to rebuild without legacy fields
    await this._invalidateCacheByItem();
    
    return {
      questionsUpdated,
      papersUpdated,
    };
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
    // Get both old string-based tags and new ID-based tags
    const [
      questionCategories,
      questionTags,
      paperCategories,
      paperTags,
      questionCategoryIds,
      questionTagIds,
      paperCategoryIds,
      paperTagIds,
    ] = await Promise.all([
      getAllMultiEntryValues(this.db, STORE_KEY_QUESTIONS, 'categories'),
      getAllMultiEntryValues(this.db, STORE_KEY_QUESTIONS, 'tags'),
      getAllMultiEntryValues(this.db, STORE_KEY_PAPERS, 'categories'),
      getAllMultiEntryValues(this.db, STORE_KEY_PAPERS, 'tags'),
      getAllMultiEntryValues(this.db, STORE_KEY_QUESTIONS, 'categoryIds'),
      getAllMultiEntryValues(this.db, STORE_KEY_QUESTIONS, 'tagIds'),
      getAllMultiEntryValues(this.db, STORE_KEY_PAPERS, 'categoryIds'),
      getAllMultiEntryValues(this.db, STORE_KEY_PAPERS, 'tagIds'),
    ]);

    // Combine string tags and ID tags (convert IDs to strings for backward compatibility)
    return {
      questionCategories: [...new Set([...questionCategories as string[], ...questionCategoryIds as string[]])],
      questionTags: [...new Set([...questionTags as string[], ...questionTagIds as string[]])],
      paperCategories: [...new Set([...paperCategories as string[], ...paperCategoryIds as string[]])],
      paperTags: [...new Set([...paperTags as string[], ...paperTagIds as string[]])],
    };
  }


  // #endregion
  
  // #region questions & papers

  async importQuestions(...questions: Question[]): Promise<ID[]> {
    questions.forEach(q => normalizeQuestion(q));
    await this._evolve(STORE_KEY_QUESTIONS, { 
      hashFields: fieldsByStore2[STORE_KEY_QUESTIONS], 
    });
    const { newlyImported, conflict } = await this._import(STORE_KEY_QUESTIONS, questions, { 
      now: Date.now(),
      isStoreVersionIndexed: true,
      hashFields: fieldsByStore2[STORE_KEY_QUESTIONS],
    });
    for (const c of conflict) {
      await this.createVersionConflictRecord(c);
    }
    return newlyImported;
  }

  async importQuizPapers(...papers: QuizPaper[]): Promise<ID[]> {
    await this._evolve(STORE_KEY_PAPERS, { 
      hashFields: fieldsByStore2[STORE_KEY_PAPERS], 
    });
    const { newlyImported, conflict } = await this._import(STORE_KEY_PAPERS, papers, { 
      now: Date.now(),
      isStoreVersionIndexed: true,
      hashFields: fieldsByStore2[STORE_KEY_PAPERS],
    });
    for (const c of conflict) {
      await this.createVersionConflictRecord(c);
    }
    return newlyImported;
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

  // Legacy function for backward compatibility
  // TODO: Deprecate this in favor of importCompleteQuizPapersNew
  async importCompleteQuizPapers(...papers: CompleteQuizPaperDraft[]): Promise<string[]> {
    const purePapers: QuizPaper[] = [];
    const hasPaperId = (id: ID) => this.db.get(STORE_KEY_PAPERS, id).then(x => x != null && !x.deleted);
    
    for (const _paper of papers) {
      const paper = await toCompleted(_paper, hasPaperId);
      
      // For new format, we need to convert CompleteQuestions to Questions
      // This requires tag reconciliation
      const questions: Question[] = [];
      const paperTagIds: ID[] = [];
      const paperCategoryIds: ID[] = [];
      
      // Process all tags and categories from the paper
      if (paper.tags) {
        for (const tagName of paper.tags) {
          const tag = await this.getTag(tagName);
          paperTagIds.push(tag.id);
        }
      }
      if (paper.categories) {
        for (const catName of paper.categories) {
          const tag = await this.getTag(catName);
          paperCategoryIds.push(tag.id);
        }
      }
      
      // Process each question
      for (const cq of paper.questions) {
        const qTagIds: ID[] = [];
        const qCategoryIds: ID[] = [];
        
        if (cq.tags) {
          for (const tagName of cq.tags) {
            const tag = await this.getTag(tagName);
            qTagIds.push(tag.id);
          }
        }
        if (cq.categories) {
          for (const catName of cq.categories) {
            const tag = await this.getTag(catName);
            qCategoryIds.push(tag.id);
          }
        }
        
        const question = completeQuestionToQuestion(cq, qTagIds, qCategoryIds);
        questions.push(question);
      }
      
      // Create the pure paper with question IDs
      const purePaper: QuizPaper = {
        id: paper.id,
        name: paper.name,
        img: paper.img,
        desc: paper.desc,
        tagIds: paperTagIds,
        categoryIds: paperCategoryIds,
        weights: paper.weights,
        duration: paper.duration,
        questions: questions.map(q => q.id),
      } as QuizPaper;
      
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
    return await this._update(STORE_KEY_QUESTIONS, id, patch, true);
  }
  async updateQuizPaper(id: ID, paper: Patch<QuizPaper>): Promise<ID> {
    await this._invalidateCache('trie');
    return await this._update(STORE_KEY_PAPERS, id, paper, true);
  }

  async deleteQuestion(id: ID): Promise<boolean> {
    await this._invalidateCache('trie');
    return await this._delete(STORE_KEY_QUESTIONS, id, true);
  }
  async deleteQuizPaper(id: ID): Promise<boolean> {
    await this._invalidateCache('trie');
    return await this._delete(STORE_KEY_PAPERS, id, true);
  }

  // Export functions
  async exportQuizPaper(id: ID, options: ExportOptions): Promise<PaperExportResult> {
    const paper = await this.getQuizPaper(id);
    if (!paper) {
      throw new Error(`Quiz paper with ID ${id} not found`);
    }

    if (options.format === 'separate') {
      // Export as separate arrays
      const questions = await this.getQuestions(paper.questions);
      const validQuestions = questions.filter(q => q !== undefined) as Question[];
      
      // Collect all unique tag IDs
      const tagIdSet = new Set<ID>();
      if (paper.tagIds) {
        paper.tagIds.forEach(tid => tagIdSet.add(tid));
      }
      if (paper.categoryIds) {
        paper.categoryIds.forEach(tid => tagIdSet.add(tid));
      }
      validQuestions.forEach(q => {
        q.tagIds?.forEach(tid => tagIdSet.add(tid));
        q.categoryIds?.forEach(tid => tagIdSet.add(tid));
      });
      
      const tags = await this.getTagsByIds(Array.from(tagIdSet));
      const validTags = tags.filter(t => t !== undefined) as Tag[];
      
      // Optionally remove indices
      let resultPaper = paper;
      let resultQuestions = validQuestions;
      let resultTags = validTags;
      
      if (options.removeIndices) {
        resultPaper = sanitizeIndices(JSON.parse(JSON.stringify(paper)), false);
        resultQuestions = validQuestions.map(q => sanitizeIndices(JSON.parse(JSON.stringify(q)), false));
        resultTags = validTags.map(t => sanitizeIndices(JSON.parse(JSON.stringify(t)), false));
      }
      
      if (!options.keepIds) {
        // Note: We keep IDs by default for referential integrity in separate format
        // User can manually remove them if needed
      }
      
      return {
        format: 'separate',
        data: {
          paper: resultPaper,
          questions: resultQuestions,
          tags: resultTags,
        }
      };
    } else if (options.format === 'complete') {
      // Export as CompleteQuizPaper format
      const questions = await this.getQuestions(paper.questions);
      const validQuestions = questions.filter(q => q !== undefined) as Question[];
      
      const completeQuestions: CompleteQuestion[] = [];
      
      for (const q of validQuestions) {
        const cq = await questionToCompleteQuestion(
          q,
          async (tagId) => {
            const tag = await this.getTagById(tagId);
            return tag?.mainName;
          }
        );
        completeQuestions.push(cq);
      }
      
      // Get tag names for paper
      const paperTags: string[] = [];
      const paperCategories: string[] = [];
      
      if (paper.tagIds) {
        for (const tid of paper.tagIds) {
          const tag = await this.getTagById(tid);
          if (tag) {
            paperTags.push(tag.mainName);
          }
        }
      }
      
      if (paper.categoryIds) {
        for (const tid of paper.categoryIds) {
          const tag = await this.getTagById(tid);
          if (tag) {
            paperCategories.push(tag.mainName);
          }
        }
      }
      
      const completePaper: CompleteQuizPaper | CompleteQuizPaperDraft = {
        id: options.keepIdsInComplete ? paper.id : undefined,
        name: paper.name,
        img: paper.img,
        desc: paper.desc,
        tags: paperTags,
        categories: paperCategories,
        weights: paper.weights,
        duration: paper.duration,
        questions: completeQuestions.map(cq => 
          options.keepIdsInComplete ? cq : { ...cq, id: undefined }
        ) as any,
      };
      
      return {
        format: 'complete',
        data: completePaper,
      };
    } else {
      throw new Error(`Export format '${options.format}' not supported in backend. Use frontend for text export.`);
    }
  }

  async exportQuestion(id: ID, options: ExportOptions): Promise<QuestionExportResult> {
    const question = await this.getQuestion(id);
    if (!question) {
      throw new Error(`Question with ID ${id} not found`);
    }

    if (options.format === 'separate') {
      // Export as separate question and tags
      const tagIdSet = new Set<ID>();
      question.tagIds?.forEach(tid => tagIdSet.add(tid));
      question.categoryIds?.forEach(tid => tagIdSet.add(tid));
      
      const tags = await this.getTagsByIds(Array.from(tagIdSet));
      const validTags = tags.filter(t => t !== undefined) as Tag[];
      
      let resultQuestion = question;
      let resultTags = validTags;
      
      if (options.removeIndices) {
        resultQuestion = sanitizeIndices(JSON.parse(JSON.stringify(question)), false);
        resultTags = validTags.map(t => sanitizeIndices(JSON.parse(JSON.stringify(t)), false));
      }
      
      return {
        format: 'separate',
        data: {
          question: resultQuestion,
          tags: resultTags,
        }
      };
    } else if (options.format === 'complete') {
      // Export as CompleteQuestion format
      const cq = await questionToCompleteQuestion(
        question,
        async (tagId) => {
          const tag = await this.getTagById(tagId);
          return tag?.mainName;
        }
      );
      
      const completeQuestion: CompleteQuestion | CompleteQuestionDraft = 
        options.keepIdsInComplete ? cq : { ...cq, id: undefined };
      
      return {
        format: 'complete',
        data: completeQuestion,
      };
    } else {
      throw new Error(`Export format '${options.format}' not supported in backend. Use frontend for text export.`);
    }
  }

  // #endregion
  
  // #region search

  async refreshSearchIndices(
    forceReindexing = false, 
    forceReindexingForPreparation = false,
    ignoreDeleted = true
  ) {
    const ret = await this._prepareForSearch({
      fieldsByStore,
      forceReindexing,
      forceReindexingForPreparation,
      ignoreDeleted,
    });
    // TODO apply forceReindexingForPreparation
    await this._buildTrieCache(
      'tags-categories',
      [STORE_KEY_PAPERS, STORE_KEY_QUESTIONS],
      (x: QuizPaper & BaseQuestion) => {
        // Include both old string-based tags and new ID-based tags
        return [
          ...(x as any).categories ?? [],
          ...(x as any).tags ?? [],
          ...x.categoryIds ?? [],
          ...x.tagIds ?? [],
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

  // #endregion
  
  // #region quiz control

  async importQuizRecords(...records: QuizRecord[]): Promise<ID[]> {
    await this._evolve(STORE_KEY_RECORDS, { 
      hashFields: (fieldsByStore2[STORE_KEY_RECORDS]) as any, 
    });
    const { newlyImported, conflict } = await this._import(STORE_KEY_RECORDS, records, { 
      now: Date.now(),
      isStoreVersionIndexed: true,
      hashFields: fieldsByStore2[STORE_KEY_RECORDS],
    });
    for (const c of conflict) {
      await this.createVersionConflictRecord(c);
    }
    return newlyImported;
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

  async importQuizResults(...results: QuizResult[]): Promise<ID[]> {
    const x = await this._import(STORE_KEY_RESULTS, results);
    return x.newlyImported;
  }

  getQuizResult(id: ID): Promise<QuizResult | undefined> {
    return this.db.get(STORE_KEY_RESULTS, id);
  }

  listQuizResults(quizPaperId?: ID): Promise<QuizResult[]> {
    return this._list(STORE_KEY_RESULTS, quizPaperId ? 'paperId' : undefined, quizPaperId);
  }

  // #endregion

  // #region stats


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

  // #endregion
}