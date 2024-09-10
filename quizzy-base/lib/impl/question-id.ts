import { BlankQuestionBlank, ChoiceQuestionOption, ID, Question } from "#/types";

export const getOptionOrBlankId = (
  o: ChoiceQuestionOption | BlankQuestionBlank, i: number, q: Question
): ID => o.id ?? `${q.id}-${i}`;