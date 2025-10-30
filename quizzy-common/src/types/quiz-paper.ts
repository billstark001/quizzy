import { DatabaseIndexed, ID, SearchIndexed, MarkdownString, VersionIndexed } from "./technical";
import { Question, QuestionWithOptionalId } from "./question";
import { objectHash } from "@/utils";

type QuizPaperBase = {
  name: string; // display
  img?: string;
  desc?: MarkdownString;
  tagIds?: ID[]; // IDs of tags
  categoryIds?: ID[]; // IDs of categories
  weights?: Record<ID, number>;
  duration?: number; // in milliseconds
};

export type QuizPaper = QuizPaperBase & {
  questions: ID[];
} & DatabaseIndexed & SearchIndexed & VersionIndexed;

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
  { 
    id: '', 
    currentVersion: p ? ('0000-' + objectHash(p)) : 'default',
    name: '', 
    questions: [], 
    ...p,
  }
);