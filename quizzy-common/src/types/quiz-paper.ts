import { DatabaseIndexed, ID, SearchIndexed, MarkdownString, VersionIndexed } from "./technical";
import { Question, QuestionWithOptionalId, QuestionType, ChoiceQuestionOption, BlankQuestionBlank } from "./question";
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

// Legacy complete types (with foreign keys via IDs)
// Kept for backward compatibility with existing code
export type LegacyCompleteQuizPaper = QuizPaperBase & {
  id: ID;
  questions: Question[];
}

export type LegacyCompleteQuizPaperDraft = QuizPaperBase & {
  id?: ID;
  questions: QuestionWithOptionalId[];
};

// New complete types without any foreign keys
// These are self-contained and suitable for import/export
type CompleteQuizPaperBase = {
  name: string;
  img?: string;
  desc?: MarkdownString;
  tags?: string[];       // Direct tag names, not IDs
  categories?: string[]; // Direct category names, not IDs
  weights?: Record<ID, number>; // Weights still use question IDs as keys
  duration?: number;
};

// Complete question without foreign keys
type CompleteQuestionBase = {
  name?: string;
  tags?: string[];       // Direct tag names, not IDs
  categories?: string[]; // Direct category names, not IDs
  title?: MarkdownString;
  content: MarkdownString;
  solution?: MarkdownString;
  type: QuestionType;
};

type CompleteChoiceQuestion = CompleteQuestionBase & {
  type: 'choice';
  multiple?: boolean;
  options: ChoiceQuestionOption[];
};

type CompleteBlankQuestion = CompleteQuestionBase & {
  type: 'blank';
  blanks: BlankQuestionBlank[];
};

type CompleteTextQuestion = CompleteQuestionBase & {
  type: 'text';
  answer?: MarkdownString;
};

export type CompleteQuestion = (CompleteChoiceQuestion | CompleteBlankQuestion | CompleteTextQuestion) & {
  id: ID;
};

export type CompleteQuestionDraft = (CompleteChoiceQuestion | CompleteBlankQuestion | CompleteTextQuestion) & {
  id?: ID;
};

export type CompleteQuizPaper = CompleteQuizPaperBase & {
  id: ID;
  questions: CompleteQuestion[];
};

export type CompleteQuizPaperDraft = CompleteQuizPaperBase & {
  id?: ID;
  questions: CompleteQuestionDraft[];
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