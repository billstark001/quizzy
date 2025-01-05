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
  const ids = new Set<ID>();
  for (const item of o) {
    let retry = 100;
    while (retry > 0 && (!item.id || ids.has(item.id))) {
      item.id = uuidV4B64(6);
      --retry;
    }
    ids.add(item.id!);
  }
  return o;
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

  if (qid) {
    q.id = q.id || uuidV4B64(16);
  }

  const ids = new Set<ID>();

  if (!validTypes.includes(q.type)) {
    q.type = 'choice';
  }

  // the IDs should be ensured non-conflict locally
  if (q.type === 'choice') {
    q.options = q.options ?? [];
    normalizeOptionOrBlankArrayInPlace(q.options);
  } else if (q.type === 'blank') {
    q.blanks = q.blanks ?? [];
    normalizeOptionOrBlankArrayInPlace(q.blanks);
  } else if (q.type === 'text') {
    q.answer = q.answer ?? '';
  }

}