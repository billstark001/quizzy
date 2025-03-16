import { type SearchKeywordCache } from "@/search/keywords";
import { Patch } from "@/utils";

export type ID = string;
export type MarkdownString = string;

export type DatabaseIndexed = {
  id: ID;
  deleted?: boolean;
  lastUpdate?: number;
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

// version indexed

export const MAX_HISTORY_VERSION = 64;
export const reservedVersionWords = [
  'default', 'initial'
] as const;

export type ReservedVersionWords = (typeof reservedVersionWords)[number];

export type VersionIndexed = {
  currentVersion?: string;
  // first -> last: older -> younger
  // does not include the current one
  historyVersions?: string[]; 
  lastVersionUpdate?: number;
};

export type VersionConflictRecord = {
  id: string;
  storeId: string;
  itemId: string;
  importTime: number;
  localVersion: string;
  remoteVersion: string;
  preserved: 'local' | 'remote';
  patch: Patch<any>;
};

export const clearVersionIndices = <T extends VersionIndexed>(
  object: T,
  inPlace: boolean = false,
) => {
  const ret: any = inPlace ? object : { ...object };
  delete ret.currentVersion;
  delete ret.historyVersions;
  delete ret.lastVersionUpdate;
  return ret;
}

// tool functions

export const sanitizeIndices = <T extends DatabaseIndexed & SearchIndexed>(
  object: T,
  inPlace: boolean = false,
) => {
  const ret = inPlace ? object : { ...object };
  if (!ret.deleted) {
    delete ret.deleted;
  }
  // delete ret.lastUpdate;
  clearSearchIndices(ret as any, true);
  clearVersionIndices(ret as any, true);
  return ret;
};

// search results

export type SearchResult<T> = {
  query: string;
  keywords: readonly string[];
  result: readonly T[];
  totalPages: number;
};