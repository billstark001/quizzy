export type ID = string;
export type MarkdownString = string;


export type ChoiceQuestionOption = {
  id?: ID;
  shouldChoose?: boolean;
  content: MarkdownString;
};

export type BlankQuestionBlank = {
  id?: ID;
  key: string;
  answer?: string;
};

export type QuestionType = 'choice' | 'blank' | 'text';


type _BaseQuestion = {
  name?: string;
  tags?: string[];
  title?: MarkdownString;
  content: MarkdownString;
  solution?: MarkdownString;
  type: QuestionType;
};

export type BaseQuestion = _BaseQuestion & {
  id: ID;
};

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

type _TextQuestion = {
  type: 'text';
  answer?: MarkdownString;
};

type _Question = _ChoiceQuestion | _BlankQuestion | _TextQuestion;

export type BlankQuestion = BaseQuestion & _BlankQuestion;
export type ChoiceQuestion = BaseQuestion & _ChoiceQuestion;
export type TextQuestion = BaseQuestion & _TextQuestion;

export type Question = BaseQuestion & _Question;
export type QuestionWithOptionalID = _BaseQuestion & _Question & { id?: ID };
