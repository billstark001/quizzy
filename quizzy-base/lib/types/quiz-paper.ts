
import { WithOptional } from "#/utils";
import { ID, MarkdownString, Question, QuestionWithOptionalID } from "./question";

type QuizPaperBase = {
  name: string;
  img?: string;
  desc?: MarkdownString;
  tags?: string[];
  weights?: Record<ID, number>;
  duration?: number; // in milliseconds
};

export type QuizPaper = QuizPaperBase & {
  id: ID;
  questions: ID[];
};

export type QuizPaperDraft = WithOptional<QuizPaper, 'id'>;

export type GenerativeQuizPaper = Omit<QuizPaper, 'questions'> & {
  questions: (currentList: ID[]) => ID | ID[] | [ID, number][];
}

export type CompleteQuizPaper = QuizPaperBase & {
  id: ID;
  questions: Question[];
}

export type CompleteQuizPaperDraft = QuizPaperBase & {
  id?: ID;
  questions: QuestionWithOptionalID[];
};
