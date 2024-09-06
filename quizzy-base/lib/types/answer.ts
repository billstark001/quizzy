import { ID, MarkdownString, QuestionType } from "./question";

export type BaseAnswers = {
  type: QuestionType;
};

export type ChoiceAnswers = BaseAnswers & {
  type: 'choice';
  answer: Record<ID, boolean>;
};

export type BlankAnswers = BaseAnswers & {
  type: 'blank';
  answer: Record<ID, string>;
};

export type TextAnswers = BaseAnswers & {
  type: 'text';
  answer: MarkdownString;
};

export type Answers = ChoiceAnswers | BlankAnswers | TextAnswers;