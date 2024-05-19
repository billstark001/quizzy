
import { ID, MarkdownString, Question } from "./question";

export type QuizPaper = {
  id: ID;
  title: MarkdownString;
  questions: Question[];
  duration?: number; // in milliseconds
};
