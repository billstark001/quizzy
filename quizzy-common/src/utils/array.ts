
export const parseCommaSeparatedArray = (
  input: string, 
  separators = ',;、；，',
  spaces = ' 　'
): string[] => {
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
};

export const removeDuplicates = <T>(sortedArray: T[]) => {
  if (sortedArray.length <= 1) return sortedArray;
  
  let j = 0;
  for (let i = 1; i < sortedArray.length; i++) {
    if (sortedArray[i] !== sortedArray[j]) {
      j++;
      sortedArray[j] = sortedArray[i];
    }
  }

  sortedArray.splice(j + 1, sortedArray.length - j - 1);
  return sortedArray;
};

// first pos >= target
export function binarySearchLowerBound(arr: number[], target: number): number {
  let left = 0;
  let right = arr.length - 1;
  let result = arr.length;
  
  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    
    if (arr[mid] >= target) {
      result = mid;
      right = mid - 1;
    } else {
      left = mid + 1;
    }
  }
  
  return result;
}

// last pos <= target
export function binarySearchUpperBound(arr: number[], target: number): number {
  let left = 0;
  let right = arr.length - 1;
  let result = -1;
  
  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    
    if (arr[mid] <= target) {
      result = mid;
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  
  return result;
}