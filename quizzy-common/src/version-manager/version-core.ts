/**
 * Version Management Module - Core Logic
 * This module is completely independent from IDB and provides version evolution and conflict detection.
 */

import { MAX_HISTORY_VERSION, VersionIndexed, ImportStatus } from './types';
import { objectHash, padHexString } from './utils';

/**
 * Get the day number since epoch (1970-01-01)
 */
const getDaySinceEpoch = (timestamp: number) => {
  return (timestamp / 86400000) | 0;
};

/**
 * Evolve the version of an object before sync operation
 * Returns undefined if no evolution is needed, or the evolved object
 * 
 * @param obj - The object to evolve
 * @param fields - Optional fields to use for hash calculation
 * @returns The evolved object or undefined if no evolution needed
 */
export const evolveVersionBeforeSync = <T extends VersionIndexed>(
  obj: T,
  fields?: readonly string[] | readonly (keyof T)[],
): T | undefined => {
  const {
    id = '',
    lastUpdate = 0,
    lastVersionUpdate = 0,
    currentVersion = 'initial',
    historyVersions = [],
    ...content
  } = obj;
  
  if (currentVersion !== 'initial' && lastUpdate <= lastVersionUpdate) {
    // no need to evolve version
    return undefined;
  }

  // new version format: [day:4]-[hash:12]
  const dayNumber = getDaySinceEpoch(lastUpdate);
  const dayString = padHexString(dayNumber.toString(16), 4, false);
  
  const newVersion = dayString + '-' + objectHash(content as T, fields);

  const newLastVersionUpdate = lastUpdate;
  const newHistoryVersions = [...historyVersions];
  if (currentVersion !== 'initial') {
    // initial's are not guaranteed to be consistent
    // but default's are
    newHistoryVersions.push(currentVersion);
  }
  if (newHistoryVersions.length > MAX_HISTORY_VERSION) {
    // pop too old versions
    newHistoryVersions.splice(0, newHistoryVersions.length - MAX_HISTORY_VERSION);
  }

  // return the evolved one
  return {
    id,
    lastUpdate,
    lastVersionUpdate: newLastVersionUpdate,
    currentVersion: newVersion,
    historyVersions: newHistoryVersions,
    ...content,
  } as T;
};

/**
 * Check the import status when comparing local and remote versions
 * 
 * @param local - Local version of the object
 * @param remote - Remote version of the object
 * @returns Import status indicating which version should be used
 */
export const checkImport = <T extends VersionIndexed>(
  local: T,
  remote: T,
): ImportStatus => {
  const {
    lastUpdate: lLu = 0,
    currentVersion: lCv = 'initial',
    historyVersions: lHv = [],
  } = local;

  const {
    lastUpdate: rLu = 0,
    currentVersion: rCv = 'initial',
    historyVersions: rHv = [],
  } = remote;

  if (lCv === rCv) {
    if (lCv === 'initial') {
      return lLu >= rLu ? 'conflict-local' : 'conflict-remote';
    }
    // no need to merge since they are the same record
    return 'same';
  }

  if (rHv.indexOf(lCv) !== -1 || lCv === 'default') {
    // remote is newer
    return 'remote';
  }

  if (lHv.indexOf(rCv) !== -1 || rCv === 'default') {
    // local is newer
    return 'local';
  }

  // the version is conflict
  return lLu >= rLu ? 'conflict-local' : 'conflict-remote';
};
