import { segmentSearchWords } from "./search";

export const generateKeywords = (object: any) => {
  const str = new Set<string>();

  let stack: any[] = [object];
  while (stack.length > 0) {
    const cur = stack.pop();
    if (!cur || typeof cur === 'function') {
      continue;
    } else if (Array.isArray(cur)) {
      stack.push(...cur);
    } else if (typeof cur === 'string') {
      str.add(cur);
    } else if (typeof cur === 'object') {
      Object.entries(cur).forEach(([, v]) => stack.push(v));
    } else {
      continue;
    }
  }

  const filtered = new Set<string>();
  for (const value of str) {
    segmentSearchWords(value.toLowerCase()).forEach(x => filtered.add(x));
  }

  const filteredArray = [...filtered];
  filteredArray.sort();
  return filteredArray;
};