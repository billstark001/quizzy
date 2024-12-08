import { francAll } from 'franc';
import TinySegmenter from 'tiny-segmenter';
import { default as init, cut_for_search } from 'jieba-wasm/web';
import { isStopword } from './stopwords';
import TrieSearch from 'trie-search';

await init();

const jpSegmenter = new TinySegmenter();

const periodPattern = /^[\p{P}\p{S}\n\r\t\s]+$/u;

const enPattern = /([0-9]+|[a-zA-Z]+(?:'(?:s|t|d|re|ll|ve|mon|m))?|[\p{P}\p{S}\[\]{}]|\s+|\S{1,4})/gu;
const enTokenize = (text: string) => {
  enPattern.lastIndex = 0;
  const tokens = text.match(enPattern)
    ?.filter(token => !token.match(/^\s+$/)) ?? [];
  return tokens;
};


const zhSet = new Set(['zho', 'cmn', 'yue']);
const jpSet = new Set(['jpn']);
const enSet = new Set(['eng', 'deu', 'nld', 'fra', 'ita']);

export const segmentSearchWords = (words: string): string[] => {

  // determine language

  const langRes = francAll(words, { minLength: 3 });
  langRes.sort((a, b) => b[1] - a[1]);
  let lang = 'und';
  for (const [curLang] of langRes) {
    let cont = false;
    if (zhSet.has(curLang)) {
      lang = 'zho';
    } else if (jpSet.has(curLang)) {
      lang = 'jpn';
    } else if (enSet.has(curLang)) {
      lang = 'eng';
    } else {
      cont = true;
    }
    if (!cont) {
      break;
    }
  }

  let ret: string[] = [];

  if (lang === 'zho') {
    ret = cut_for_search(words, true);
  } else if (lang === 'jpn') {
    ret = jpSegmenter.segment(words);
  } else {
    ret = enTokenize(words);
  }

  ret = ret.filter(word => word && !periodPattern.test(word) && !isStopword(word));
  ret.sort();

  return ret;
};

type _K = { key: string };

export const buildTrieTree = (keywords: string[]) => {
  const tree = new TrieSearch<_K>('key');
  tree.addAll(keywords.map(key => ({ key })));
  const root = tree.root;
  return { tree, root, size: (tree as any).size as number };
};

export const loadTrieTree = (root: any, size: number) => {
  const tree = new TrieSearch<_K>('key');
  tree.root = root;
  (tree as any).size = size;
  tree.clearCache();
  const searchFunc = (word: string) => {
    const ret = tree.search(word).map(({ key }) => key);
    return ret;
  }
  return { tree, searchFunc };
};