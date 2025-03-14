import { binarySearchLowerBound, binarySearchUpperBound } from "@/utils/array";

export function calculatePositionalScore(
  query: readonly string[],
  positionIndex: Record<string, number[]>,
  maxDistance: number = 8,
  distanceWeight: number = 0.1,
): number {

  if (query.length <= 1) {
    return 0;
  }

  let totalScore = 0;
  let validPairs = 0;

  // calculate all positional scores
  // of adjacent word pairs

  for (let i = 0; i < query.length - 1; i++) {
    const term1 = query[i];
    const term2 = query[i + 1];
    
    // if the word is not in, continue
    if (!positionIndex[term1] || !positionIndex[term2] || 
        positionIndex[term1].length === 0 || positionIndex[term2].length === 0) {
      continue;
    }
    validPairs++; 
    
    const positions1 = positionIndex[term1];
    const positions2 = positionIndex[term2];
    
    const { minDistance, matchCount } = findMinDistanceAndCount(
      positions1,
      positions2,
      maxDistance
    );
    
    // distance is too long, continue
    if (minDistance > maxDistance) {
      continue;
    }
    
    const distanceScore = 1 - (distanceWeight * (minDistance - 1));
    const matchScore = Math.log1p(matchCount);
    
    totalScore += distanceScore * matchScore;
  }

  // normalize by valid pairs
  const totalPossiblePairs = query.length - 1;
  if (validPairs === 0) {
    return 0;
  }
  const ret = totalScore * (validPairs / totalPossiblePairs);
  return ret;
}


function findMinDistanceAndCount(
  sortedPos1: number[],
  sortedPos2: number[],
  maxDistance: number,
) {

  // assume arrays are sorted

  let minDistance = Infinity;
  let matchCount = 0;
  
  
  const [shortPositions, longPositions] = 
    sortedPos1.length <= sortedPos2.length 
      ? [sortedPos1, sortedPos2] 
      : [sortedPos2, sortedPos1];
  
  // the expect order that pos1 < pos2
  const expectOrder = sortedPos1.length <= sortedPos2.length;
  
  for (const pos of shortPositions) {
    // first position >= pos - maxDistance
    let lowerIndex = binarySearchLowerBound(
      longPositions, 
      expectOrder ? pos + 1 : pos - maxDistance
    );
    
    // last position <= pos + maxDistance
    let upperIndex = binarySearchUpperBound(
      longPositions, 
      expectOrder ? pos + maxDistance : pos - 1
    );
    
    // condition met
    if (lowerIndex <= upperIndex) {
      matchCount += (upperIndex - lowerIndex + 1);
      
      // calc distance
      for (let i = lowerIndex; i <= upperIndex; i++) {
        const distance = expectOrder 
          ? longPositions[i] - pos 
          : pos - longPositions[i];
        
        minDistance = Math.min(minDistance, distance);
      }
    }
  }
  
  return { 
    minDistance: minDistance === Infinity 
    ? maxDistance + 1 
    : minDistance, 
    matchCount 
  };
}