export type ID = string;
export type MarkdownString = string;


export type ChoiceQuestionOption = {
  id: ID;
  seq?: number;
  shouldChoose?: boolean;
  content: MarkdownString;
};

export type BlankQuestionBlank = {
  id: ID;
  key: string;
  answer?: string;
};

export type QuestionType = 'choice' | 'blank' | 'text';

export type BaseQuestion = {
  id: ID;
  seq?: number;
  name?: string;
  tag?: string[];
  title?: MarkdownString;
  content: MarkdownString;
  solution?: MarkdownString;
  type: QuestionType;
};

export type ChoiceQuestion = BaseQuestion & {
  type: 'choice';
  options: ChoiceQuestionOption[];
};

export type BlankQuestion = BaseQuestion & {
  type: 'blank';
  blanks: BlankQuestionBlank[];
};

export const BLANK_PREFIX = '@blank:';

export type TextQuestion = BaseQuestion & {
  type: 'text';
  answer?: MarkdownString;
};

export type Question = ChoiceQuestion | BlankQuestion | TextQuestion;
