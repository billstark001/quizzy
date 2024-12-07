import { DatabaseIndexed, ID, KeywordIndexed, MarkdownString } from "./technical";
import { Question, QuestionWithOptionalID } from "./question";

type QuizPaperBase = {
  name: string; // display
  img?: string;
  desc?: MarkdownString;
  tags?: string[];
  weights?: Record<ID, number>;
  duration?: number; // in milliseconds
};

export type QuizPaper = QuizPaperBase & {
  questions: ID[];
} & DatabaseIndexed & KeywordIndexed;

export type QuizPaperDraft = QuizPaperBase & {
  questions: ID[];
  id?: ID;
};

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
