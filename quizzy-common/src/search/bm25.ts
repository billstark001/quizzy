import { generateSearchKeywordCache, SearchKeywordCache } from "./keywords";
import { calculatePositionalScore } from "./position";

export type Bm25GlobalCache = {
  wordAppeared: Record<string, number>;
  averageDocLength: number;
  wordAppeared2: Record<string, number>;
  averageDocLength2: number;
  idf: Record<string, number>;
  idf2: Record<string, number>;
  totalDocs: number;
};

export type BuildBm25CacheOptions<T> = {
  nextObject: () => Nullable<[T, Nullable<SearchKeywordCache>]> | Promise<Nullable<[T, Nullable<SearchKeywordCache>]>>,
  onProcessed: (cache: SearchKeywordCache | null) => void | Promise<void>,
  fields: readonly string[],
};

type Nullable<T> = T | null | undefined;

const generate2GramArray = (arr: readonly string[]) => {
  const ret: string[] = [];
  for (let i = 0; i < arr.length - 1; ++i) {
    const currentWord = arr[i] + ' ' + arr[i + 1];
    ret.push(currentWord);
  }
  return ret;
};

export const buildBm25Cache = async <T extends object>(
  options: BuildBm25CacheOptions<T>,
) => {
  const {
    nextObject,
    onProcessed,
    fields = [],
  } = options ?? {};

  // build bm25 cache
  const wordAppeared: Record<string, number> = {};
  const wordAppeared2: Record<string, number> = {};
  let totalLength = 0;
  let totalLength2 = 0;
  let totalDocs = 0;

  // filter all re-indexing required
  let [obj, objCache] = await nextObject() ?? [undefined, undefined];
  while (obj) {

    if (!objCache) {
      // basic list
      objCache = generateSearchKeywordCache(
        fields.map(k => (obj as any)?.[k as any]),
      );
      // commit single updated record
      await onProcessed(objCache);
    } else {
      // mark that there's no need to process again
      await onProcessed(null);
    }

    // accumulate records' frequency data
    // both original and 2-gram
    for (const key of Object.keys(objCache.frequency ?? {})) {
      wordAppeared[key] = (wordAppeared[key] || 0) + 1;
    }
    for (const key of Object.keys(objCache.frequency2 ?? {})) {
      wordAppeared2[key] = (wordAppeared2[key] || 0) + 1;
    }

    totalLength += objCache.words?.length ?? 0;
    totalLength2 += objCache.words2?.length ?? 0;

    totalDocs += 1;

    // move on
    [obj, objCache] = await nextObject() ?? [undefined, undefined];
  }

  // create IDF scores
  const idf: Record<string, number> = Object.fromEntries(
    Object.entries(wordAppeared).map(
      ([k, n]) => [k, Math.max(1e-8, Math.log((totalDocs - n + 0.5) / (n + 0.5)))]
    )
  );
  const idf2: Record<string, number> = Object.fromEntries(
    Object.entries(wordAppeared2).map(
      ([k, n]) => [k, Math.max(1e-8, Math.log((totalDocs - n + 0.5) / (n + 0.5)))]
    )
  );
  const averageDocLength = Math.max(0.1, totalLength / (totalDocs || 1));
  const averageDocLength2 = Math.max(0.1, totalLength2 / (totalDocs || 1));
  const bm25Body: Bm25GlobalCache = {
    wordAppeared,
    averageDocLength,
    wordAppeared2,
    averageDocLength2,
    idf,
    idf2,
    totalDocs,
  };

  return bm25Body;
};

export type BuildBm25QueryScoreOptions<T> = {
  bm25Cache: Readonly<Bm25GlobalCache>,
  query: readonly string[],
  query2?: readonly string[],
  nextObject: () => Nullable<[string, T]> | Promise<Nullable<[string, T]>>,
  k1?: number,
  b?: number,
  discardThreshold?: number,
  unigramRatio?: number,
  // positional
  calcPosScore?: boolean,
  calcPosScoreMinCount?: number,
  calcPosScoreRatio?: number,
  maxDistance?: number,
  distanceWeight?: number,
};


export const buildBm25QueryScore = async <T extends SearchKeywordCache = SearchKeywordCache>(
  options: BuildBm25QueryScoreOptions<T>,
) => {

  const {
    bm25Cache,
    query,
    query2 = generate2GramArray(query),
    nextObject,
    k1 = 1.5,
    b = 0.75,
    discardThreshold: threshold = 1e-10,
    unigramRatio = 0.7,
    calcPosScore = false,
    calcPosScoreMinCount = 16,
    calcPosScoreRatio = 0.3,
    maxDistance = 6,
    distanceWeight = 0.1,
  } = options ?? {};

  const {
    idf,
    averageDocLength: l,
    idf2,
    averageDocLength2: l2,
  } = bm25Cache;

  // 2-gram query

  // refresh scores
  const _score = (
    query: readonly string[],
    freq: Record<string, number>, 
    idf: Record<string, number>, 
    docLength: number,
    avgLength: number,
  ) => {
    let score = 0;
    for (const qi of query) {
      const f_qi = freq[qi] ?? 0;
      const localTerm = (idf[qi] ?? 0)
        * (f_qi * (k1 + 1))
        / (f_qi + k1 * (1 - b + b * docLength / avgLength));
      score += localTerm;
    }
    return score;
  };

  const scores: Record<string, number> = {};
  const positionIndexCache: Record<string, Record<string, number[]>> = {};

  // calculate & accumulate the scores
  let [docId, doc] = await nextObject() ?? ['', undefined];
  while (doc != null) {
    const score = _score(
      query,
      doc.frequency,
      idf,
      doc.words?.length ?? 1,
      l,
    );

    // if less than threshold, do no further calculation
    if (score < threshold) {
      [docId, doc] = await nextObject() ?? ['', undefined];
      continue;
    }

    // if over threshold, calculate 2-gram score
    const score2 = _score(
      query2,
      doc.frequency2,
      idf2,
      doc.words2?.length ?? 1,
      l2,
    );
    scores[docId] = score * unigramRatio + score2 * (1 - unigramRatio);

    if (calcPosScore) {
      positionIndexCache[docId] = doc.position;
    }

    // move on
    [docId, doc] = await nextObject() ?? ['', undefined];
  }

  // sort scores
  const scoresSorted = Object.entries(scores);
  scoresSorted.sort((a, b) => b[1] - a[1]); // descending

  // calculate positional scores if applicable
  if (calcPosScore) {
    const count = Math.max(
      calcPosScoreMinCount, 
      Math.ceil(calcPosScoreRatio * scoresSorted.length)
    );
    for (let i = 0; i < count; ++i) {
      const pos = positionIndexCache[scoresSorted[i][0]];
      const score = calculatePositionalScore(
        query,
        pos,
        maxDistance,
        distanceWeight,
      );
      scoresSorted[i][1] += score;
    }
    // sort again
    scoresSorted.sort((a, b) => b[1] - a[1]);
  }

  return scoresSorted;
}