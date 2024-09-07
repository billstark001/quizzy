
export function numberToLetters(num: number) {
  if (num < 1) return '';
  let result = '';
  while (num > 0) {
    num--;
    result = String.fromCharCode(65 + (num % 26)) + result;
    num = Math.floor(num / 26);
  }
  return result;
}

export function lettersToNumber(str: string) {
  str = str.toUpperCase();
  let result = 0;
  for (let i = 0; i < str.length; i++) {
    result *= 26;
    result += str.charCodeAt(i) - 64;
  }
  return result;
}

export function parseCommaSeparatedArray(
  input: string, 
  separators = ',;、；，',
  spaces = ' 　'
): string[] {
  const result: string[] = [];
  let current: string = '';
  let escaped: boolean = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (escaped) {
      if (char === '\\') {
        current += '\\';
      } else if (separators.includes(char) || spaces.includes(char)) {
        current += char;
      } else {
        current += '\\' + char;
      }
      escaped = false;
    } else if (char === '\\') {
      escaped = true;
    } else if (separators.includes(char)) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  if (current.length > 0 || input.endsWith(separators[separators.length - 1])) {
    result.push(current.trim());
  }

  return result;
}