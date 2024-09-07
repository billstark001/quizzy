import { Answers } from "./answer";
import { ID } from "./question";
import { QuizRecordBase } from "./quiz-record";

export type QuizResult = QuizRecordBase & {
  // TODO

  paperName: string;
  correct: Record<ID, Answers>;
  score: number;
};