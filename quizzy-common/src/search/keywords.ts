import { segmentSearchWords } from "./tokenize";
import { removeDuplicates } from "@/utils/array";

const extractStrings = (object: any) => {
  const str: string[] = [];

  let stack: any[] = [object];
  while (stack.length > 0) {
    const cur = stack.pop();
    if (!cur || typeof cur === 'function') {
      continue;
    } else if (Array.isArray(cur)) {
      stack.push(...cur);
    } else if (typeof cur === 'string') {
      str.push(cur);
    } else if (typeof cur === 'object') {
      Object.entries(cur).forEach(([, v]) => stack.push(v));
    } else {
      continue;
    }
  }

  return str;
}

const generate2GramArray = (arr: string[]) => {
  const ret: string[] = [];
  for (let i = 0; i < arr.length - 1; ++i) {
    const currentWord = arr[i] + ' ' + arr[i + 1];
    ret.push(currentWord);
  }
  return ret;
};

export const generateKeywords = (object: any) => {
  const str = extractStrings(object);
  const words: string[] = [];
  for (const value of str) {
    const segmented = segmentSearchWords(value.toLowerCase());
    for (let i = 0; i < segmented.length; ++i) {
      const x = segmented[i];
      words.push(x);
    }
  }
  words.sort();
  removeDuplicates(words);
  return words;
};

export type SearchKeywordCache = {
  words: string[];
  frequency: Record<string, number>;
  position: Record<string, number[]>;

  words2: string[];
  frequency2: Record<string, number>;

  filteredWords: string[];
}

export const generateSearchKeywordCache = (object: any) => {
  const str = extractStrings(object);

  const words: string[] = [];
  const frequency: Record<string, number> = {};
  const position: Record<string, number[]> = {};

  let totalLength = 0;
  const arrayBreakpoints: number[] = [];

  for (const value of str) {
    const segmented = segmentSearchWords(value.toLowerCase());
    totalLength += segmented.length;

    for (let i = 0; i < segmented.length; ++i) {
      const x = segmented[i];
      words.push(x);
      frequency[x] = (frequency[x] || 0) + 1;
      position[x] = position[x] || [];
      position[x].push(totalLength + i);
    }

    arrayBreakpoints.push(totalLength);
  }

  // pop the last one since it is the end of the document
  arrayBreakpoints.pop();

  // 2-gram
  const words2 = generate2GramArray(words);
  const frequency2: Record<string, number> = {};
  for (let i = arrayBreakpoints.length - 1; i >= 0; --i) {
    words2.splice(i, 1);
  }
  for (const w2 of words2) {
    frequency2[w2] = (frequency2[w2] || 0) + 1;
  }

  const filteredWords = [...words];
  filteredWords.sort();
  removeDuplicates(filteredWords);

  const ret: SearchKeywordCache = {
    words, 
    frequency,
    position,

    words2,
    frequency2,

    filteredWords,
  };

  return ret;
};
