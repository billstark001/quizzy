
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