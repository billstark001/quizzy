import { IDBPDatabase, IDBPTransaction } from "idb";
import {
  DatabaseIndexed, ID,
  sanitizeIndices, SearchIndexed, SearchResult,
  VersionConflictRecord,
  VersionIndexed
} from "../types/technical";
import { applyPatch, getPatch, Patch } from "../utils/patch";
import { generateKeywords, SearchKeywordCache } from "../search/keywords";
import QuickLRU from "quick-lru";
import { Bm25GlobalCache, buildBm25Cache, BuildBm25CacheOptions, buildBm25QueryScore, BuildBm25QueryScoreParameters, defaultBm25GlobalCache } from "@/search/bm25";
import { extractFields, Nullable, uuidV4B64, uuidV4B64WithRetry } from "@/utils";
import { buildTrieTreeIterative, expandQuery, LoadedTrieTree, loadTrieTree } from "@/search/trie";
import { checkImport, evolveVersionBeforeSync, ImportStatus } from "@/version";


type _TX = IDBPTransaction<unknown, ArrayLike<string>, 'readwrite'>;

export type LogicalDeleteStrategy = 'new' | 'override' | 'error';


export type ImportResult = {
  newlyImported: ID[];
  conflict: VersionConflictRecord[];
};

export type BuildBm25CacheDbOptions = {
  forceReindexing?: boolean;
  /**
   * true -> logically deleted records will not be handled
   */
  ignoreDeleted?: boolean;
  cacheKey?: string;
};

export type PrepareForSearchOptions = {
  fieldsByStore: { [storeId: string]: readonly string[] };
  forceReindexingForPreparation?: boolean;
} & BuildBm25CacheDbOptions;

type DefaultDatabaseType = {
  [key: string]: {
    key: string;
    value: any;
    indexes: Record<string, any>;
  }
};

export type ImportOptions<T> = {
  now?: number;
  isStoreVersionIndexed?: boolean;
  hashFields?: readonly (keyof T)[];
};

export type EvolveOptions<T> = {
  hashFields?: readonly (keyof T)[];
};

export class IDBCore {

  protected readonly db: IDBPDatabase;
  private readonly queryCache: QuickLRU<string, any>;
  private readonly hotCache: QuickLRU<string, any>;
  private readonly cacheStoreKey: string;
  private readonly versionStoreKey: string;
  private readyForSearch: boolean;

  constructor(
    db: IDBPDatabase,
    cacheStoreKey: string,
    versionStoreKey: string,
    queryCacheSize = 128,
    hotCacheSize = 64,
  ) {
    this.db = db;
    this.cacheStoreKey = cacheStoreKey;
    this.versionStoreKey = versionStoreKey;
    this.queryCache = new QuickLRU({
      maxSize: Math.max(queryCacheSize, 4),
    });
    this.hotCache = new QuickLRU({
      maxSize: Math.max(hotCacheSize, 4),
    });
    this.readyForSearch = false;
  }

  // #region version control

  async createVersionConflictRecord(vrc: VersionConflictRecord) {
    vrc.id = await uuidV4B64WithRetry(
      (id) => this.db.get(this.versionStoreKey, id).then(x => !!x),
      12
    );
    return await this.db.add(this.versionStoreKey, vrc) as ID;
  }

  async getVersionConflictRecord(id: ID) {
    return await this.db.get(this.versionStoreKey, id) as VersionConflictRecord;
  }

  async listVersionConflictRecords(storeId: string, itemId?: string) {
    if (itemId) {
      return await this.db.getAllFromIndex(
        this.versionStoreKey, 'SI', [storeId, itemId],
      ) as VersionConflictRecord[];
    }
    return await this.db.getAllFromIndex(
      this.versionStoreKey, 'storeId', storeId
    ) as VersionConflictRecord[];
  }

  async resolveVersionConflictRecord(id: ID, apply: boolean) {
    const vrc = await this.db.get(this.versionStoreKey, id) as VersionConflictRecord;
    if (!vrc) {
      return;
    }
    const tx = this.db.transaction([this.versionStoreKey, vrc.storeId], 'readwrite');
    if (apply) {
      // apply patch to original record
      const origItem = await tx.objectStore(vrc.storeId).get(vrc.itemId);
      const newItem = origItem
        ? applyPatch(origItem, vrc.patch)
        : vrc.patch;
      await tx.objectStore(vrc.storeId).put(newItem);
    }
    // delete record
    await tx.objectStore(this.versionStoreKey).delete(id);
    await tx.done;
  }

  // #endregion

  // #region data sync

  protected async _evolve<T extends DatabaseIndexed & VersionIndexed>(
    storeId: string,
    options?: EvolveOptions<T>,
  ) {
    const {
      hashFields,
    } = options ?? {};
    const tx = this.db.transaction(storeId, 'readwrite');

    const updated: ID[] = [];

    let cursor = await tx.store.openCursor();
    while (cursor != null) {
      const object = cursor.value as T;
      const newObject = evolveVersionBeforeSync(
        object,
        hashFields,
      );
      if (newObject != null) {
        // version evolution required
        const id = await cursor.update(newObject);
        updated.push(id as ID);
      }
      cursor = await cursor.continue();
    }

    await tx.done;

    return updated;
  }

  protected async _import<T extends DatabaseIndexed>(
    storeId: string,
    items: T[],
    options?: ImportOptions<T>,
  ) {

    const {
      now = Date.now(),
      isStoreVersionIndexed = false,
      hashFields,
    } = options ?? {};
    const tx = this.db.transaction(storeId, 'readwrite');

    const res: ImportResult = {
      newlyImported: [],
      conflict: [],
    };
    // logic of single import
    const _i = async (remote: T) => {
      const local = await tx.store.get(remote.id);
      if (local) {
        if (local.deleted) {
          await tx.store.put(remote);
          res.newlyImported.push(remote.id);
          return;
        }
        // apply strategy
        const importStatus: ImportStatus = isStoreVersionIndexed
          ? checkImport(local, remote)
          : 'conflict-remote';
        if (importStatus === 'same' || importStatus === 'local') {
          // do nothing
          return;
        } else if (importStatus === 'remote') {
          // remote override
          await tx.store.put(remote);
          return;
        }
        // default to true
        const preserveLocal = importStatus !== 'conflict-remote';

        // create patch
        const _local = hashFields
          ? extractFields(local, hashFields)
          : local;
        const _remote = hashFields
          ? extractFields(remote, hashFields)
          : remote;
        const patch = preserveLocal
          ? getPatch(_local, _remote)
          : getPatch(_remote, _local);

        if (!preserveLocal) {
          await tx.store.put(remote);
        }
        const record = {
          id: '',
          storeId,
          itemId: local.id,
          importTime: now,
          localVersion: (local as VersionIndexed).currentVersion ?? 'initial',
          remoteVersion: (remote as VersionIndexed).currentVersion ?? 'initial',
          preserved: preserveLocal ? 'local' : 'remote',
          patch,
        } satisfies VersionConflictRecord;
        res.conflict.push(record);
        return;
      }
      // new record
      await tx.store.add(remote);
      res.newlyImported.push(remote.id);
    };

    // execute import on all objects
    const promises: Promise<any>[] = [];
    for (const q of items) {
      promises.push(_i(q));
    }
    await Promise.all(promises);

    await tx.done;
    return res;
  }

  protected async _export<T extends DatabaseIndexed>(
    store: string,
  ): Promise<T[]> {
    const tx = this.db.transaction(store, 'readonly');
    const ret: T[] = await tx.store.getAll() as T[];
    await tx.done;
    return ret;
  }

  // #endregion

  // #region CRUD

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
    this._invalidateCacheByItem(id);
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
   * will not (explicitly) create transaction, 
   * ignore all deleted elements
   * @param storeId 
   * @param index 
   * @param id 
   * @returns 
   */
  protected async _list<T extends DatabaseIndexed>(storeId: string, index?: string, id?: string) {
    let ret: T[];
    if (index) {
      ret = await this.db.getAllFromIndex(storeId, index, id || undefined);
    } else {
      ret = await this.db.getAll(storeId);
    }
    return ret.filter(x => x && !x.deleted);
  }

  /**
   * will create transaction, sequential
   */
  protected async _update<T extends DatabaseIndexed & SearchIndexed>(
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
      modified.searchCacheInvalidated = true;
    }
    await store.put(modified);

    if (!hasTx) {
      await tx.done;
    }

    // invalidate cache
    this._invalidateCacheByItem(id);

    return id;
  }

  // #endregion

  // #region cache

  protected async _invalidateCacheByItem(...id: ID[]) {
    this.queryCache.clear();
    this.hotCache.clear();
    this.readyForSearch = false;
  }

  protected async _dumpCache<T>(type: string, key: string, value: T) {
    const cacheKey = `${type}::${key}`;
    const result = await this.db.put(this.cacheStoreKey, {
      id: cacheKey, type, key, value
    });
    this.hotCache.delete(cacheKey);
    return result;
  }

  protected async _loadCache<T, R = T>(
    type: string, key: string,
    forceDirect = false,
    transform?: (raw: T) => R,
  ): Promise<R | undefined> {
    const cacheKey = `${type}::${key}`;
    if (!forceDirect && this.hotCache.has(cacheKey)) {
      return this.hotCache.get(cacheKey)!;
    }
    const obj = await this.db.get(this.cacheStoreKey, cacheKey);
    const cacheRaw = obj?.value as T;

    if (cacheRaw) {
      const cache = transform
        ? transform(cacheRaw)
        : cacheRaw;
      this.hotCache.set(cacheKey, cache);
      return cache as any;
    }

    return;
  }

  protected async _invalidateCache(
    type: string, key?: string,
  ) {
    // invalidate hot cache
    for (const k of this.hotCache.keys()) {
      if (k.startsWith(type + '::')) {
        this.hotCache.delete(k);
      }
    }
    // invalidate persistent cache
    if (key == null) {

      const keys = await this.db.getAllKeysFromIndex(
        this.cacheStoreKey,
        'type', type,
      );
      await Promise.all(keys.map(x => this.db.delete(this.cacheStoreKey, x)));
    } else {
      const cacheKey = `${type}::${key}`;
      await this.db.delete(this.cacheStoreKey, cacheKey);
    }
  }

  // #endregion

  // #region search

  protected async _prepareForSearch(
    options: PrepareForSearchOptions,
  ) {
    const {
      fieldsByStore,
      forceReindexingForPreparation = false,
      ...rest
    } = options;
    if (this.readyForSearch && !forceReindexingForPreparation) {
      return 0;
    }
    // this includes an invalidate operation
    // document
    let count = 0;
    for (const [storeId, fields] of Object.entries(fieldsByStore)) {
      count += (await this._buildBm25Cache(storeId, fields, rest))
        .length;
    }
    this.readyForSearch = true;
    return count;
  }


  protected async _getKeywords(query: string, __: string) {
    if (!query) {
      return [];
    }
    const orig = generateKeywords(query);
    return orig;
  }

  protected async _buildBm25Cache<T extends DatabaseIndexed & SearchIndexed>(
    storeId: string,
    includedKeys: readonly string[],
    options?: BuildBm25CacheDbOptions,
  ): Promise<ID[]> {
    const {
      forceReindexing = false,
      ignoreDeleted = true,
      cacheKey = 'bm25',
    } = options ?? {};

    const tx = this.db.transaction(storeId, 'readwrite');
    const updated: ID[] = [];

    let cursor = await tx.store.openCursor();

    const buildOptions: BuildBm25CacheOptions<T> = {
      nextObject() {
        const value = cursor?.value as T;
        if (!value || (ignoreDeleted && value.deleted)) {
          return;
        }
        if (forceReindexing || !value.searchCache || value.searchCacheInvalidated) {
          return [value, undefined];
        }
        return [value, value.searchCache];
      },
      async onProcessed(cache) {
        if (cache) {
          const value = cursor!.value as T;
          delete value.searchCacheInvalidated;
          value.searchCacheLastUpdated = Date.now();
          value.searchCache = cache;
          updated.push(value.id);
          await cursor!.update(value);
        }
        cursor = await cursor!.continue();
      },
      fields: includedKeys,
    };

    const bm25Body = await buildBm25Cache(buildOptions);

    await tx.done;

    // write back to database
    await this._invalidateCacheByItem();
    await this._dumpCache(cacheKey, storeId, bm25Body);

    return updated;
  }

  protected async _buildQueryScore<T extends DatabaseIndexed & SearchIndexed>(
    queryCacheKey: string,
    storeId: string, query: string[],
    params?: Partial<BuildBm25QueryScoreParameters>,
  ) {
    // load the current cache
    const bm25Cache = await this._loadCache<Bm25GlobalCache>(
      'bm25',
      storeId
    ) ?? defaultBm25GlobalCache();

    // refresh scores

    const tx = this.db.transaction(storeId, 'readonly');

    let cursor = await tx.store.openCursor();
    const nextObject = async () => {
      const value = cursor?.value as T;
      const cache = value?.searchCache;
      cursor = await cursor?.continue() ?? null;
      if (cache) {
        return [value.id, cache] as [string, SearchKeywordCache];
      }
    };

    // calculate the scores
    const scoresSorted = await buildBm25QueryScore({
      bm25Cache,
      query,
      nextObject,
      ...params,
    });

    this.queryCache.set(queryCacheKey, scoresSorted);
    return scoresSorted;
  }

  protected async _search<T extends DatabaseIndexed & SearchIndexed>(
    store: string, query: string, keywords: string[],
    count?: number, page?: number,
    params?: Partial<BuildBm25QueryScoreParameters>,
  ): Promise<SearchResult<T>> {

    const queryCacheKey = JSON.stringify(['search', store, keywords, params]);
    const scores = this.queryCache.has(queryCacheKey)
      ? (this.queryCache.get(queryCacheKey) as [string, number][])
      : await this._buildQueryScore(queryCacheKey, store, keywords, params);

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

  // #endregion

  // #region tag search

  protected async _buildTrieCache<T extends DatabaseIndexed>(
    cacheKey: string,
    storeIds: string[],
    getWords: (x: T) => Nullable<string | string[]>,
    force = false,
  ) {

    if (!force) {
      // do not build again if the current exists
      const current = await this._loadTrieCache(cacheKey);
      if (current) {
        return;
      }
    }

    const tx = this.db.transaction(storeIds);

    let currentStore = 1;
    let cursor = storeIds[0]
      ? await tx.objectStore(storeIds[0]).openCursor()
      : null;

    const nextFunc: Parameters<typeof buildTrieTreeIterative>[0] = async () => {
      if (!cursor) {
        const storeId = storeIds[currentStore];
        if (storeId) {
          cursor = await tx.objectStore(storeId).openCursor();
          currentStore++;
          return '';
        }
        return;
      }
      // the reason to return an empty string is 
      // to inform the builder that the cursor is not exhausted yet
      if (!cursor.value) {
        cursor = await cursor.continue();
        return '';
      }
      const result = getWords(cursor.value);
      cursor = await cursor.continue();
      return result || '';
    }

    const trie = await buildTrieTreeIterative(nextFunc);
    await tx.done;
    await this._dumpCache('trie', cacheKey, trie);
    return;
  }

  protected async _loadTrieCache(
    cacheKey: string,
    forceDirect = false,
  ) {
    const trie = await this._loadCache(
      'trie',
      cacheKey,
      forceDirect,
      loadTrieTree,
    );

    return trie;
  }

  protected async _buildTagSearchScore<T extends DatabaseIndexed & {
    tags?: string[], categories?: string[],
    tagIds?: string[], categoryIds?: string[],
  }>(
    storeId: string,
    trieRaw: LoadedTrieTree,
    query: string[],
    useCategory: boolean | null = null,
  ) {

    const queryCacheKey = JSON.stringify(['tag-search', storeId, query, useCategory]);

    const initialQuery = new Set(query);
    const expandedQuery = expandQuery(trieRaw!, query);

    // results
    const searchScore: Record<string, [number, T]> = {};
    const objectArrays: T[][] = [];

    for (const tagCandidate of expandedQuery) {
      // gather objects by string-based tags (for backward compatibility)
      objectArrays.push(await this.db.getAllFromIndex(
        storeId,
        useCategory ? 'categories' : 'tags',
        tagCandidate
      ))
      if (useCategory == null) {
        // both tags and categories are applicable
        objectArrays.push(await this.db.getAllFromIndex(
          storeId,
          'categories',
          tagCandidate
        ));
      }
      
      // Also gather objects by ID-based tags
      objectArrays.push(await this.db.getAllFromIndex(
        storeId,
        useCategory ? 'categoryIds' : 'tagIds',
        tagCandidate
      ))
      if (useCategory == null) {
        // both tagIds and categoryIds are applicable
        objectArrays.push(await this.db.getAllFromIndex(
          storeId,
          'categoryIds',
          tagCandidate
        ));
      }
    }
    // calculate object search scores
    for (const _arr of objectArrays) {
      for (const obj of _arr) {
        if (searchScore[obj.id]) {
          // already calculated
          continue;
        }
        let score = 0;
        // Score string-based categories
        for (const c of obj.categories ?? []) {
          if (initialQuery.has(c)) {
            score += 6;
          } else if (expandedQuery.has(c)) {
            score += 4;
          }
        }
        // Score string-based tags
        for (const t of obj.tags ?? []) {
          if (initialQuery.has(t)) {
            score += 3;
          } else if (expandedQuery.has(t)) {
            score += 1;
          }
        }
        // Score ID-based categoryIds
        for (const cid of obj.categoryIds ?? []) {
          if (initialQuery.has(cid)) {
            score += 6;
          } else if (expandedQuery.has(cid)) {
            score += 4;
          }
        }
        // Score ID-based tagIds
        for (const tid of obj.tagIds ?? []) {
          if (initialQuery.has(tid)) {
            score += 3;
          } else if (expandedQuery.has(tid)) {
            score += 1;
          }
        }
        searchScore[obj.id] = [score, obj];
      }
    }

    const results = Object.values(searchScore);
    results.sort((a, b) => b[0] - a[0]); // descend

    const ret = {
      results,
      keywords: [...expandedQuery],
    };

    this.queryCache.set(queryCacheKey, ret);

    return ret;
  }

  protected async _searchByTag<T extends DatabaseIndexed & {
    tags?: string[], categories?: string[],
    tagIds?: string[], categoryIds?: string[],
  }>(
    storeId: string,
    trieRaw: LoadedTrieTree,
    query: string,
    useCategory: boolean | null = null,
    count?: number,
    page?: number,
  ): Promise<SearchResult<T>> {
    const queryArray = query.split(' ').filter(x => !!x);
    queryArray[0] !== query && queryArray.splice(0, 0, query);

    const queryCacheKey = JSON.stringify(['tag-search', storeId, queryArray, useCategory]);
    const { results: scores, keywords } = this.queryCache.has(queryCacheKey)
      ? (this.queryCache.get(queryCacheKey) as Awaited<ReturnType<typeof this._buildTagSearchScore<T>>>)
      : await this._buildTagSearchScore<T>(storeId, trieRaw, queryArray, useCategory);

    count = Math.max(count ?? 1, 1);
    page = Math.max(page ?? 0, 0); // 0-based

    const elementToJump = count * page;
    const pageCount = Math.ceil(scores.length / page);

    const returnObjects = scores.slice(elementToJump, elementToJump + count);
    return {
      query,
      result: returnObjects.map(x => x[1]),
      keywords: [...keywords],
      totalPages: pageCount,
    }
  }

  // #endregion
}

export default IDBCore;