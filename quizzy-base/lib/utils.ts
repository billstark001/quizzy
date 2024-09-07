import { fromByteArray } from "base64-js";
import * as uuid from 'uuid';

export type WithOptional<T extends object, K extends keyof T> = Omit<T, K> & { [k in K]?: T[k] };

export const uuidV4B64 = (digit = 16) => {
  const uuid1 = uuid.v4();
  const bytes = new Uint8Array(uuid1.match(/[\da-f]{2}/gi)!.map(h => parseInt(h, 16)));
  const ret = fromByteArray(bytes).replace(/\+\/-=/g, '_');
  return ret.substring(0, digit);
}

export const formatMilliseconds = (milliseconds: number) => {

  if (milliseconds < 0) {
    return "Invalid input";
  }

  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const remainingHours = hours % 24;
  const remainingMinutes = minutes % 60;
  const remainingSeconds = seconds % 60;

  const formattedHours = String(remainingHours).padStart(2, '0');
  const formattedMinutes = String(remainingMinutes).padStart(2, '0');
  const formattedSeconds = String(remainingSeconds).padStart(2, '0');

  if (days < 1) {
    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  }

  return `${days}:${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}