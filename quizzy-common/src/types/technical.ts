import { type SearchKeywordCache } from "@/search/keywords";
import { Patch } from "@/utils";
import { clearVersionIndices } from "@/version-manager";

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

// version indexed - re-exported from version-manager module
export { 
  MAX_HISTORY_VERSION,
  reservedVersionWords,
  type ReservedVersionWords,
  type VersionIndexed,
  clearVersionIndices,
} from "@/version-manager";

// VersionConflictRecord with Patch type for database usage
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