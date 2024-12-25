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

  const filtered: Record<string, number> = {};
  for (const value of str) {
    segmentSearchWords(value.toLowerCase()).forEach(
      x => filtered[x] = (filtered[x] || 0) + 1
    );
  }

  const filteredArray = Object.keys(filtered);
  filteredArray.sort();
  return [filteredArray, filtered] as
    [typeof filteredArray, typeof filtered];
};