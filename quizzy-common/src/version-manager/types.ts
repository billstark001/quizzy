/**
 * Version Management Module - Types
 * This module is completely independent from IDB and provides versioning capabilities.
 */

export type ID = string;

export const MAX_HISTORY_VERSION = 64;
export const reservedVersionWords = [
  'default', 'initial'
] as const;

export type ReservedVersionWords = (typeof reservedVersionWords)[number];

/**
 * Interface for objects that support versioning
 */
export type VersionIndexed = {
  id?: ID;
  lastUpdate?: number;
  currentVersion?: string;
  // first -> last: older -> younger
  // does not include the current one
  historyVersions?: string[]; 
  lastVersionUpdate?: number;
};

/**
 * Record of version conflicts during import/merge operations
 */
export type VersionConflictRecord<T = any> = {
  id: string;
  storeId: string;
  itemId: string;
  importTime: number;
  localVersion: string;
  remoteVersion: string;
  preserved: 'local' | 'remote';
  patch: T; // Patch data
};

/**
 * Status of import operation
 */
export type ImportStatus = "same" | "remote" | "local" | "conflict-local" | 'conflict-remote';

/**
 * Clear version indices from an object
 */
export const clearVersionIndices = <T extends VersionIndexed>(
  object: T,
  inPlace: boolean = false,
): T => {
  const ret: any = inPlace ? object : { ...object };
  delete ret.currentVersion;
  delete ret.historyVersions;
  delete ret.lastVersionUpdate;
  return ret;
};
