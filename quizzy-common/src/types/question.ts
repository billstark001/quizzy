import { objectHash } from "@/utils";
import { DatabaseIndexed, ID, SearchIndexed, MarkdownString, VersionIndexed } from "./technical";


export type ChoiceQuestionOption = {
  id?: ID;
  shouldChoose?: boolean;
  content: MarkdownString;
};

export type BlankQuestionBlank = {
  id?: ID;
  key: string;
  answer?: string;
  answerIsRegExp?: boolean;
  answerFlag?: string;
};

export type QuestionType = 'choice' | 'blank' | 'text';


type _BaseQuestion = {
  name?: string; // serial
  
  tags?: string[]; // knowledge points covered in this question (deprecated, use tagIds)
  categories?: string[]; // category of this question in the syllabus (deprecated, use categoryIds)
  tagIds?: ID[]; // IDs of tags (new tag system)
  categoryIds?: ID[]; // IDs of categories (new tag system)
  
  title?: MarkdownString;
  content: MarkdownString;
  solution?: MarkdownString;
  type: QuestionType;
};

export type BaseQuestion = _BaseQuestion & DatabaseIndexed & SearchIndexed & VersionIndexed;

type _ChoiceQuestion = {
  type: 'choice';
  multiple?: boolean; // undefined means determined by question
  options: ChoiceQuestionOption[];
};

type _BlankQuestion = {
  type: 'blank';
  blanks: BlankQuestionBlank[];
};

export const BLANK_PREFIX = '@blank:';
export const blankPattern = /\[\[@blank:\s*([^\]]+)\]\]/g;

type _TextQuestion = {
  type: 'text';
  answer?: MarkdownString;
};

type _Question = _ChoiceQuestion | _BlankQuestion | _TextQuestion;

export type BlankQuestion = BaseQuestion & _BlankQuestion;
export type ChoiceQuestion = BaseQuestion & _ChoiceQuestion;
export type TextQuestion = BaseQuestion & _TextQuestion;

export type Question = BaseQuestion & _Question;
export type QuestionWithOptionalId = _BaseQuestion & _Question & { id?: ID } & SearchIndexed;


export const defaultQuestion = (p?: Partial<Question>): Question => ({ 
  id: '', 
  currentVersion: p ? ('0000-' + objectHash(p)) : 'default',
  type: 'choice', 
  content: '', 
  options: [], 
  ...p,
} as Question);