import { uuidV4B64 } from "../utils";
import { BlankQuestionBlank, ChoiceQuestionOption, Question, QuestionType } from "../types";
import { ID } from "../types/technical";

export const getOptionOrBlankId = (
  o: ChoiceQuestionOption | BlankQuestionBlank, i: number, q: Question
): ID => o.id ?? `${q.id}-${i}`;


const validTypes: QuestionType[] = ['choice', 'blank', 'text'];

export const normalizeQuestion = (q: Question, qid=false) => {

  if (qid) {
    q.id = q.id || uuidV4B64(12);
  }

  const ids = new Set<ID>();

  if (!validTypes.includes(q.type)) {
    q.type = 'choice';
  }
  
  // the IDs should be ensured non-conflict locally
  if (q.type === 'choice') {
    q.options = q.options ?? [];
    for (const option of q.options) {
      let retry = 100;
      while (retry > 0 && (!option.id || ids.has(option.id))) {
        option.id = uuidV4B64(6);
        --retry;
      }
      ids.add(option.id!);
    }
  } else if (q.type === 'blank') {
    q.blanks = q.blanks ?? [];
    for (const blank of q.blanks) {
      let retry = 100;
      while (retry > 0 && (!blank.id || ids.has(blank.id))) {
        blank.id = uuidV4B64(6);
        --retry;
      }
      ids.add(blank.id!);
      if (!blank.key) {
        blank.key = 'blank_' + blank.id?.substring(0, 4);
      }
    }
  } else if (q.type === 'text') {
    q.answer = q.answer ?? '';
  }

}