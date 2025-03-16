import { padHexString } from "./string";

import hash from 'hash-it';

export const extractFields = <T = any>(obj: T, fields: readonly string[] | readonly (keyof T)[]) => {
  const ret: Partial<T> = {};
  for (const field of fields) {
    (ret as any)[field] = (obj as any)[field];
  }
  return ret;
};

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