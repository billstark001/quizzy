
import { WithOptional } from "#/utils";
import { ID, MarkdownString, Question } from "./question";

type QuizPaperBase = {
  id: ID;
  title: MarkdownString;
  weights?: Record<ID, number>;
  duration?: number; // in milliseconds
};

export type QuizPaper = QuizPaperBase & {
  questions: ID[];
};

export type QuizPaperDraft = WithOptional<QuizPaper, 'id'>;

export type GenerativeQuizPaper = Omit<QuizPaper, 'questions'> & {
  questions: (currentList: ID[]) => ID | ID[] | [ID, number][];
}

export type CompleteQuizPaper = QuizPaperBase & {
  questions: Question[];
}

export type CompleteQuizPaperDraft = WithOptional<
  Omit<QuizPaper, 'questions'>,
  'id'
> & {
  questions: WithOptional<Question, 'id'>[];
};
