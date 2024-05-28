import { fromByteArray } from "base64-js";
import * as uuid from 'uuid';

export type WithOptional<T extends object, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export const uuidV4B64 = () => {
  const uuid1 = uuid.v4();
  const bytes = new Uint8Array(uuid1.match(/[\da-f]{2}/gi)!.map(h => parseInt(h, 16)));
  return fromByteArray(bytes);
}