/**
 * Version Management Module - Utility Functions
 * This module is completely independent from IDB and provides hashing utilities.
 */

import hash from 'hash-it';

// 64 digits padding string
const PAD_STR = '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Pad a hex string to a specific length
 */
export const padHexString = (str: string, l: number, preserveFromLeft = false): string => {
  while (str.length < l) {
    str = PAD_STR.substring(0, l - str.length) + str;
  }
  if (str.length > l) {
    str = preserveFromLeft
      ? str.substring(0, l) // [left][discard]
      : str.substring(str.length - l); // [discard][right]
  }
  return str;
};

/**
 * Extract specific fields from an object
 */
export const extractFields = <T = any>(obj: T, fields: readonly string[] | readonly (keyof T)[]) => {
  const ret: Partial<T> = {};
  for (const field of fields) {
    (ret as any)[field] = (obj as any)[field];
  }
  return ret;
};

/**
 * Generate a hash for an object, optionally using only specific fields
 */
export const objectHash = <T = any>(obj: T, fields?: readonly string[] | readonly (keyof T)[]) => {
  const resObj = fields
    ? extractFields(obj, fields)
    : obj;
  const hashNumber = hash(resObj);
  const hashString = padHexString(
    hashNumber.toString(16),
    12,
    true
  );
  return hashString;
};
