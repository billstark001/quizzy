import { francAll } from 'franc';
import TinySegmenter from 'tiny-segmenter';
import { cut_for_search } from 'jieba-wasm';
import { isStopword } from './stopwords';


const jpSegmenter = new TinySegmenter();

const periodPattern = /^[\p{P}\p{S}\n\r\t\s]+$/u;

const enPattern = /([0-9]+|[a-zA-Z]+(?:'(?:s|t|d|re|ll|ve|mon|m))?|[.,!?;:'"()\[\]{}]|\s+)/g;
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

  const langRes = francAll(words);
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
    ret = cut_for_search(words);
  } else if (lang === 'jpn') {
    ret = jpSegmenter.segment(words);
  } else {
    ret = enTokenize(words);
  }

  ret = ret.filter(word => !periodPattern.test(word) && !isStopword(word));
  ret.sort();

  return ret;
};
