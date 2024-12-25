import { BlankQuestionBlank, ChoiceQuestionOption, Question } from "../types";
import { ID } from "../types/technical";

export const getOptionOrBlankId = (
  o: ChoiceQuestionOption | BlankQuestionBlank, i: number, q: Question
): ID => o.id ?? `${q.id}-${i}`;