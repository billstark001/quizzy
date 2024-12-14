import { DatabaseIndexed, ID, KeywordIndexed, MarkdownString } from "./technical";
import { Question, QuestionWithOptionalID } from "./question";

type QuizPaperBase = {
  name: string; // display
  img?: string;
  desc?: MarkdownString;
  tags?: string[];
  categories?: string[];
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

export type CompleteQuizPaper = QuizPaperBase & {
  id: ID;
  questions: Question[];
}

export type CompleteQuizPaperDraft = QuizPaperBase & {
  id?: ID;
  questions: QuestionWithOptionalID[];
};

export const defaultQuizPaper = (p?: Partial<QuizPaper>): QuizPaper => (
  { id: '', name: '', questions: [], ...p }
);