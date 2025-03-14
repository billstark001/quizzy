import { type SearchKeywordCache } from "@/search/keywords";

export type ID = string;
export type MarkdownString = string;

export type DatabaseIndexed = {
  id: ID;
  deleted?: boolean;
  lastUpdate?: number;
};

// keyword indexed

/**
 * @deprecated use `SearchIndexed`.
 */
export type KeywordIndexed = {
  tags?: string[];
  categories?: string[];
  
  keywords?: string[];
  keywordsFrequency?: Record<string, number>;
  tagsFrequency?: Record<string, number>;
  keywordsUpdatedTime?: number;
  keywordsCacheInvalidated?: boolean;
};

/**
 * @deprecated use `SearchIndexed`.
 */
export const needsReindexing = (currentObject: KeywordIndexed & { lastUpdate?: number }) => {
  return currentObject.keywordsCacheInvalidated
  || currentObject.keywords == null
  || currentObject.keywordsUpdatedTime == null
  || (currentObject.lastUpdate != null && currentObject.keywordsUpdatedTime < currentObject.lastUpdate)
  || currentObject.keywordsFrequency == null
  || currentObject.tagsFrequency == null;
};

/**
 * @deprecated use `SearchIndexed`.
 */
export const clearKeywordIndices = <T extends KeywordIndexed>(
  object: T,
  inPlace: boolean = false,
) => {
  const ret = inPlace ? object : { ...object };
  delete ret.keywords;
  delete ret.keywordsFrequency;
  delete ret.tagsFrequency;
  delete ret.keywordsUpdatedTime;
  delete ret.keywordsCacheInvalidated;
  return ret;
};

// search indexed

export type SearchIndexed = {
  searchCache?: SearchKeywordCache;
  searchCacheLastUpdated?: number;
  searchCacheInvalidated?: boolean;
};

export const clearSearchIndices = <T extends SearchIndexed>(
  object: T,
  inPlace: boolean = false,
) => {
  const ret: any = inPlace ? object : { ...object };
  delete ret.searchCache;
  delete ret.searchCacheLastUpdated;
  delete ret.searchCacheInvalidated;
  return ret;
};

// tool functions

export const sanitizeIndices = <T extends DatabaseIndexed & KeywordIndexed>(
  object: T,
  inPlace: boolean = false,
  retainTags: boolean = true,
) => {
  const ret = inPlace ? object : { ...object };
  if (!ret.deleted) {
    delete ret.deleted;
  }
  // delete ret.lastUpdate;
  clearKeywordIndices(ret, true);
  clearSearchIndices(ret as any, true);
  if (!retainTags) {
    delete ret.tags;
  }
  return ret;
};

// search results

export type SearchResult<T> = {
  query: string;
  keywords: readonly string[];
  result: readonly T[];
  totalPages: number;
};