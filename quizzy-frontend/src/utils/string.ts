export function splitWithValues(str: string, regex: RegExp) {
  if (!regex.global) {
    regex = new RegExp(regex.source, regex.flags + 'g');
  }
  regex.lastIndex = 0;

  const results: string[] = [];
  const matches: RegExpExecArray[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(str)) !== null) {

    if (match.index > lastIndex) {
      results.push(str.slice(lastIndex, match.index));
    }
    
    matches.push(match);
    
    lastIndex = regex.lastIndex;
  }

  // 添加最后一个文本片段
  if (lastIndex < str.length) {
    results.push(str.slice(lastIndex));
  }

  return [results, matches] as [string[], RegExpExecArray[]];
}
