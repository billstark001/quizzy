import { uuidV4B64WithRetrySync } from "../utils";
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
  const _f = (id: string) => ids.has(id);
  for (const item of o) {
    if (!item.id) {
      item.id = uuidV4B64WithRetrySync(_f, 6);
    }
  }
  return changed;
};

export const normalizeOptionOrBlankArray = <
  T extends Partial<DatabaseIndexed>
>(o: T[]) => {
  const ret: T[] = [];
  const ids = new Set<ID>();
  const _f = (id: string) => ids.has(id);
  for (const item of o) {
    let optionToCommit: T;
    if (!item.id) {
      optionToCommit = { ...item };
      optionToCommit.id = uuidV4B64WithRetrySync(_f, 6);
    } else {
      optionToCommit = item;
    }
    ids.add(optionToCommit.id!);
    ret.push(optionToCommit);
  }
  return ret;
};

export const normalizeQuestion = (q: Question) => {

  let changed = false;

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