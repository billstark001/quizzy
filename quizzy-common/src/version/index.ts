import { DatabaseIndexed, MAX_HISTORY_VERSION, VersionIndexed } from "@/types";
import { objectHash, padHexString } from "@/utils";


const getDaySinceEpoch = (timestamp: number) => {
  return (timestamp / 86400000) | 0;
}

export const evolveVersionBeforeSync = <T extends DatabaseIndexed & VersionIndexed>(
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

export type ImportStatus = "same" | "remote" | "local" | "conflict-local" | 'conflict-remote';

export const checkImport = <T extends DatabaseIndexed & VersionIndexed>(
  local: T,
  remote: T,
  // fields?: string[],
): ImportStatus => {
  const {
    // id: lId = '',
    lastUpdate: lLu = 0,
    // lastVersionUpdate: lLvu = 0,
    currentVersion: lCv = 'initial',
    historyVersions: lHv = [],
    // ...lContent
  } = local;

  const {
    // id: rId = '',
    lastUpdate: rLu = 0,
    // lastVersionUpdate: rLvu = 0,
    currentVersion: rCv = 'initial',
    historyVersions: rHv = [],
    // ...rContent
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
}