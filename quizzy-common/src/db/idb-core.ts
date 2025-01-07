import { IDBPDatabase, IDBPTransaction } from "idb";
import {
  DatabaseIndexed, ID, KeywordIndexed,
  sanitizeIndices, SearchResult
} from "../types/technical";
import { applyPatch, Patch } from "../utils/patch";
import { generateKeywords } from "./keywords";
import QuickLRU from "quick-lru";
import { buildTrieTree, loadTrieTree } from "./search";


export type Bm25Cache = {
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

export const defaultBm25Cache = (): Bm25Cache => ({
  idf: {},
  idfTag: {},
  averageDocLength: 0,
  averageDocLengthTag: 0,
  trie: {},
  trieTags: {},
  trieSize: 0,
  trieSizeTags: 0,
  wordAppeared: {},
  tagAppeared: {},
  totalDocs: 0
})

export const trieSearchByQuery = (
  query: string, cache?: Bm25Cache, isTag?: boolean
) =>
  cache?.[isTag ? 'trieTags' : 'trie']
    ? loadTrieTree(
      cache?.[isTag ? 'trieTags' : 'trie'],
      cache?.[isTag ? 'trieSizeTags' : 'trieSize'])
      .searchFunc(query)
    : [];

type _TX = IDBPTransaction<unknown, ArrayLike<string>, 'readwrite'>;

export type LogicalDeleteStrategy = 'new' | 'override' | 'error';

export type BuildBm25CacheOptions<T> = {
  forceReindexing?: boolean,
  /**
   * true -> logically deleted records will not be handled
   */
  ignoreDeleted?: boolean,
  excludedKeys?: readonly (keyof T)[],
}

export class IDBCore {

  protected readonly db: IDBPDatabase;
  private readonly queryCache: QuickLRU<string, [string, number][]>;
  private readonly bm25Cache: QuickLRU<string, Bm25Cache>;
  private readonly cacheStoreKey: string;
  private readyForSearch: boolean;

  constructor(
    db: IDBPDatabase,
    cacheStoreKey: string,
    queryCacheSize = 128,
    bm25CacheSize = 16,
  ) {
    this.db = db;
    this.cacheStoreKey = cacheStoreKey;
    this.queryCache = new QuickLRU({
      maxSize: Math.max(queryCacheSize, 4),
    });
    this.bm25Cache = new QuickLRU({
      maxSize: Math.max(bm25CacheSize, 4),
    });
    this.readyForSearch = false;
  }

  // data import & export

  protected async _import<T extends DatabaseIndexed>(store: string, items: T[]): Promise<ID[]> {
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

  protected async _export<T extends DatabaseIndexed>(
    store: string,
  ): Promise<T[]> {
    const tx = this.db.transaction(store, 'readonly');
    const ret: T[] = await tx.store.getAll() as T[];
    await tx.done;
    return ret;
  }

  // record operations

  /**
   * will create transaction, sequential
   * 
   * if an element is logically deleted, 
   * it can still be fetched through explicit getting operation,
   * but cannot through listing operation.
   */
  protected async _delete<T extends DatabaseIndexed>(
    storeId: string, id: ID, logical = true,
    tx?: _TX,
  ): Promise<boolean> {
    const hasTx = !!tx;
    tx = tx || this.db.transaction(storeId, 'readwrite') as unknown as _TX;
    const store = tx.objectStore(storeId);
    const original = await store.get(id) as T;
    if (!original || (original.deleted && logical)) {
      // inexistent record
      if (!hasTx) {
        await tx.done;
      }
      return false;
    }
    if (logical) {
      // set deleted flag
      original.deleted = true;
      original.lastUpdate = Date.now();
      await store.put(original);
    } else {
      // remove the record
      await store.delete(id);
    }
    if (!hasTx) {
      await tx.done;
    }
    // invalidate cache
    this._invalidateCache(id);
    return true;
  }

  protected async _get<T extends DatabaseIndexed>(
      storeId: string, id: string, tx?: _TX, 
      returnEvenLogicallyDeleted = true
  ) {
    if (!id) {
      return undefined;
    }
    const ret = await (tx
      ? tx.objectStore(storeId).get(id)
      : this.db.get(storeId, id)) as (T | undefined);
    if (ret?.deleted) {
      return returnEvenLogicallyDeleted ? ret : undefined;
    }
    return ret;
  }

  /**
   * will not create transaction, ignore all deleted elements
   */
  protected async _list<T extends DatabaseIndexed>(storeId: string, index?: string, id?: string) {
    let ret: T[];
    if (index && id) {
      ret = await this.db.getAllFromIndex(storeId, index, id);
    } else {
      ret = await this.db.getAll(storeId, index);
    }
    return ret.filter(x => x && !x.deleted);
  }

  /**
   * will create transaction, sequential
   */
  protected async _update<T extends DatabaseIndexed & KeywordIndexed>(
    storeId: string, id: ID, patch: Patch<T>,
    invalidateKeywordsCache = false,
    logicalDeleteStrategy: LogicalDeleteStrategy = 'new',
    tx?: _TX,
  ): Promise<ID> {
    const hasTx = !!tx;
    tx = tx || this.db.transaction(storeId, 'readwrite') as unknown as _TX;
    const store = tx.objectStore(storeId);

    // get original record
    const original = await store.get(id) as T;
    if (!original || (logicalDeleteStrategy === 'new' && original.deleted)) { // doesn't exist, create
      patch.id = id;
      patch.lastUpdate = Date.now();
      await store.add(patch);
      if (!hasTx) {
        await tx.done;
      }
      return id;
    }
    if (original.deleted && logicalDeleteStrategy === 'error') {
      if (!hasTx) {
        await tx.done;
      }
      throw new Error('ID conflict with a logically deleted record');
    }

    // else, logicalDeleteStrategy is 'override' and/or original exist 
    // apply patch
    const modified = applyPatch(original, patch);
    delete modified.deleted;
    modified.id = id;
    modified.lastUpdate = Date.now();
    // invalidate cache if necessary
    if (invalidateKeywordsCache) {
      modified.keywordsCacheInvalidated = true;
    }
    await store.put(modified);

    if (!hasTx) {
      await tx.done;
    }

    // invalidate cache
    this._invalidateCache(id);

    return id;
  }


  // search related

  protected async _invalidateCache(...id: ID[]) {
    this.queryCache.clear();
    this.bm25Cache.clear();
    this.readyForSearch = false;
  }

  protected async _prepareForSearch<
    T extends DatabaseIndexed & KeywordIndexed = DatabaseIndexed & KeywordIndexed
  >(
    storeIds: string[], 
    options?: BuildBm25CacheOptions<T>,
    forceReindexingForPreparation = false,
  ) {
    if (this.readyForSearch && !forceReindexingForPreparation) {
      return 0;
    }
    // this includes an invalidate operation
    let count = 0;
    for (const storeId of storeIds) {
      count += (await this._buildBm25Cache(storeId, options)).length;
    }
    this.readyForSearch = true;
    return count;
  }

  protected async _loadCache<T>(key: string): Promise<T | undefined> {
    const obj = await this.db.get(this.cacheStoreKey, key);
    return obj?.value as T;
  }

  protected async _dumpCache<T>(key: string, value: T) {
    return await this.db.put(this.cacheStoreKey, { id: key, value });
  }

  protected async _loadBm25Cache(storeId: string): Promise<Bm25Cache> {
    const bm25CacheKey = 'bm25_' + storeId;
    if (this.bm25Cache.has(bm25CacheKey)) {
      return this.bm25Cache.get(bm25CacheKey)!;
    }
    const cache = await this._loadCache<Bm25Cache>(bm25CacheKey);

    if (cache) {
      this.bm25Cache.set(bm25CacheKey, cache);
      return cache;
    }

    return defaultBm25Cache();
  }


  protected async _getKeywords(query: string, __: string) {
    if (!query) {
      return [];
    }
    const [orig, _] = generateKeywords(query);
    return orig;
  }

  protected async _buildQueryScore<T extends DatabaseIndexed & KeywordIndexed>(
    cacheKey: string,
    storeId: string, query: string[], useTag: boolean,
    k1 = 1.5, b = 0.75, threshold = 1e-10,
  ) {
    // load the current cache
    const {
      idf, idfTag,
      averageDocLength, averageDocLengthTag,
      trie, trieSize, trieTags, trieSizeTags
    } = await this._loadBm25Cache(storeId);

    const trieTree = loadTrieTree(!useTag ? trie : trieTags, !useTag ? trieSize : trieSizeTags);

    // refresh scores

    const tx = this.db.transaction(storeId, 'readonly');
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
    // calculate & accumulate the scores
    while (cursor != null) {
      const doc = cursor.value as T;
      const cacheList = useTag ? [...doc.tags ?? [], ...doc.categories ?? []] : doc.keywords;
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

    // sort scores
    const scoresSorted = Object.entries(scores);
    scoresSorted.sort((a, b) => b[1] - a[1]); // descending

    this.queryCache.set(cacheKey, scoresSorted);
    return scoresSorted;
  }

  protected async _search<T extends DatabaseIndexed & KeywordIndexed>(
    store: string, query: string, keywords: string[], useTag: boolean,
    count?: number, page?: number,
    k1 = 1.5, b = 0.75, threshold = 1e-10,
  ): Promise<SearchResult<T>> {

    const queryCacheKey = JSON.stringify([store, keywords, useTag, k1, b, threshold]);
    const scores = this.queryCache.has(queryCacheKey)
      ? this.queryCache.get(queryCacheKey)
      : await this._buildQueryScore(queryCacheKey, store, keywords, useTag, k1, b, threshold);

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

  protected async _buildBm25Cache<T extends DatabaseIndexed & KeywordIndexed>(
    storeId: string,
    options?: BuildBm25CacheOptions<T>,
  ): Promise<ID[]> {
    const {
      forceReindexing = false,
      ignoreDeleted = true,
      excludedKeys = [],
    } = options ?? {};

    const tx = this.db.transaction(storeId, 'readwrite');
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
      if (object.deleted && ignoreDeleted) {
        continue;
      }
      // check if re-indexing is needed
      const needsReindexing =
        forceReindexing
        || object.keywordsCacheInvalidated
        || object.keywords == null
        || object.keywordsUpdatedTime == null
        || (object.lastUpdate != null && object.keywordsUpdatedTime < object.lastUpdate)
        || object.keywordsFrequency == null
        || object.tagsFrequency == null;

      if (needsReindexing) {
        // update it in-place
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

        delete object.keywordsCacheInvalidated;

        // commit the updated record to database
        await cursor.update(object);
        updated.push(object.id);
      }

      // accumulate records' frequency data
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

    // create IDF scores
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

    // write back to database
    const bm25CacheId = 'bm25_' + storeId;
    await this._invalidateCache();
    await this._dumpCache(bm25CacheId, bm25Body);

    return updated;
  }
}

export default IDBCore;