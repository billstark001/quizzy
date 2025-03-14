import { DatabaseIndexed, ID, SearchIndexed, MarkdownString } from "./technical";
import { Question, QuestionWithOptionalId } from "./question";

type QuizPaperBase = {
  name: string; // display
  img?: string;
  desc?: MarkdownString;
  tags?: string[]; // knowledge points covered in this question
  categories?: string[]; // category of this question in the syllabus
  weights?: Record<ID, number>;
  duration?: number; // in milliseconds
};

export type QuizPaper = QuizPaperBase & {
  questions: ID[];
} & DatabaseIndexed & SearchIndexed;

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
  questions: QuestionWithOptionalId[];
};

export const defaultQuizPaper = (p?: Partial<QuizPaper>): QuizPaper => (
  { id: '', name: '', questions: [], ...p }
);