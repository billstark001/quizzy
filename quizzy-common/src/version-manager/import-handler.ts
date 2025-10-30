/**
 * Version Management Module - Import Conflict Handler
 * This module provides conflict resolution logic for import operations.
 */

import { ImportStatus, VersionIndexed } from './types';
import { checkImport } from './version-core';

/**
 * Result of import decision making
 */
export type ImportDecision = {
  /**
   * Action to take for this import
   * - 'skip': Do nothing, keep local version
   * - 'replace': Replace local with remote version
   * - 'conflict': There's a conflict that needs to be recorded
   */
  action: 'skip' | 'replace' | 'conflict';
  
  /**
   * If there's a conflict, which version to preserve
   */
  preserveLocal?: boolean;
  
  /**
   * Import status that led to this decision
   */
  status: ImportStatus;
};

/**
 * Options for import decision
 */
export type ImportDecisionOptions = {
  /**
   * Whether this store uses version indexing
   */
  isStoreVersionIndexed?: boolean;
  
  /**
   * Whether local record is logically deleted
   */
  isLocalDeleted?: boolean;
};

/**
 * Decide what to do when importing a remote object
 * This is the core conflict resolution logic independent of any database implementation
 * 
 * @param local - Local version of the object (undefined if doesn't exist)
 * @param remote - Remote version to import
 * @param options - Import decision options
 * @returns Import decision
 */
export const decideImportAction = <T extends VersionIndexed>(
  local: T | undefined,
  remote: T,
  options?: ImportDecisionOptions,
): ImportDecision => {
  const {
    isStoreVersionIndexed = false,
    isLocalDeleted = false,
  } = options ?? {};

  // If no local record exists, always import as new
  if (!local) {
    return {
      action: 'replace',
      status: 'remote',
    };
  }

  // If local is logically deleted, replace it with remote
  if (isLocalDeleted) {
    return {
      action: 'replace',
      status: 'remote',
    };
  }

  // Check version-based conflict resolution
  const importStatus: ImportStatus = isStoreVersionIndexed
    ? checkImport(local, remote)
    : 'conflict-remote';

  // Handle different import statuses
  switch (importStatus) {
    case 'same':
    case 'local':
      // Local is same or newer, skip import
      return {
        action: 'skip',
        status: importStatus,
      };
      
    case 'remote':
      // Remote is newer, replace local
      return {
        action: 'replace',
        status: importStatus,
      };
      
    case 'conflict-local':
      // Conflict, preserve local
      return {
        action: 'conflict',
        preserveLocal: true,
        status: importStatus,
      };
      
    case 'conflict-remote':
      // Conflict, preserve remote
      return {
        action: 'conflict',
        preserveLocal: false,
        status: importStatus,
      };
      
    default:
      // Should never reach here, but default to conflict-remote
      return {
        action: 'conflict',
        preserveLocal: false,
        status: 'conflict-remote',
      };
  }
};

/**
 * Create a conflict record descriptor (without database-specific details)
 * This provides the data needed to record a conflict independently of database implementation
 */
export type ConflictRecordDescriptor<T = any> = {
  itemId: string;
  localVersion: string;
  remoteVersion: string;
  preserved: 'local' | 'remote';
  localData: T;
  remoteData: T;
};

/**
 * Create a conflict record descriptor from local and remote objects
 * 
 * @param local - Local version
 * @param remote - Remote version  
 * @param preserveLocal - Whether to preserve local version
 * @returns Conflict record descriptor
 */
export const createConflictDescriptor = <T extends VersionIndexed>(
  local: T,
  remote: T,
  preserveLocal: boolean,
): ConflictRecordDescriptor<T> => {
  return {
    itemId: local.id || remote.id || '',
    localVersion: local.currentVersion ?? 'initial',
    remoteVersion: remote.currentVersion ?? 'initial',
    preserved: preserveLocal ? 'local' : 'remote',
    localData: local,
    remoteData: remote,
  };
};
