import { ID, MarkdownString, QuestionType } from "./question";

export type BaseAnswer = {
  id: ID;
  type: QuestionType;
};

export type ChoiceAnswer = BaseAnswer & {
  type: 'choice';
  answer: Record<ID, boolean>;
};

export type BlankAnswer = BaseAnswer & {
  type: 'blank';
  answer: Record<ID, string>;
};

export type TextAnswer = BaseAnswer & {
  type: 'text';
  answer: MarkdownString;
};

export type Answer = ChoiceAnswer | BlankAnswer | TextAnswer;