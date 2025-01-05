import { uuidV4B64 } from "../utils";
import { BlankQuestionBlank, ChoiceQuestionOption, Question, QuestionType } from "../types";
import { DatabaseIndexed, ID } from "../types/technical";

export const getOptionOrBlankId = (
  o: ChoiceQuestionOption | BlankQuestionBlank,
  i: number, q: Question
): ID => o.id ?? `${q.id}-${i}`;


const validTypes: QuestionType[] = ['choice', 'blank', 'text'];

export const normalizeOptionOrBlankArrayInPlace = <
  T extends Partial<DatabaseIndexed>
>(o: T[]) => {
  o = o ?? [];
  let changed = false;
  const ids = new Set<ID>();
  for (const item of o) {
    let retry = 100;
    while (retry > 0 && (!item.id || ids.has(item.id))) {
      item.id = uuidV4B64(6);
      changed = true;
      --retry;
    }
    ids.add(item.id!);
  }
  return changed;
};

export const normalizeOptionOrBlankArray = <
  T extends Partial<DatabaseIndexed>
>(o: T[]) => {
  const ret: T[] = [];
  const ids = new Set<ID>();
  for (const item of o) {
    let retry = 100;
    let optionToCommit: T | undefined = undefined;
    while (retry > 0 && (!item.id || ids.has(item.id))) {
      optionToCommit = optionToCommit ?? { ...item };
      optionToCommit.id = uuidV4B64(6);
      --retry;
    }
    ids.add((optionToCommit ?? item).id!);
    ret.push(optionToCommit ?? item);
  }
  return ret;
};

export const normalizeQuestion = (q: Question, qid = false) => {

  let changed = false;

  if (qid && !q.id) {
    changed = true;
    q.id = uuidV4B64(16);
  }

  if (!validTypes.includes(q.type)) {
    q.type = 'choice';
    changed = true;
  }

  // the IDs should be ensured non-conflict locally
  if (q.type === 'choice') {
    if (!q.options) {
      changed = true;
      q.options = [];
    }
    const c = normalizeOptionOrBlankArrayInPlace(q.options);
    changed = changed || c;
  } else if (q.type === 'blank') {
    if (!q.blanks) {
      changed = true;
      q.blanks = [];
    }
    const c = normalizeOptionOrBlankArrayInPlace(q.blanks);
    changed = changed || c;
  } else if (q.type === 'text') {
    q.answer = q.answer ?? '';
  }

  return changed;
}