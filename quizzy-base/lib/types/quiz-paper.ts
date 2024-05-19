
import { WithOptional } from "#/utils";
import { ID, MarkdownString, Question } from "./question";

export type QuizPaper = {
  id: ID;
  title: MarkdownString;
  questions: Question[];
  duration?: number; // in milliseconds
};

export type IncompleteQuizPaper = WithOptional<
  Omit<QuizPaper, 'questions'>,
  'id'
> & {
  questions: WithOptional<Question, 'id'>[];
};
