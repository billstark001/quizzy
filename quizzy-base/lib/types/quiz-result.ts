import { Answers } from "./answer";
import { ID } from "./question";
import { QuizRecordBase } from "./quiz-record";

export type QuizRecordRow = {
  id: ID;
  name: string;
  answer: string;
  correct: string;
  score: number;
  weight: number;
};

export type QuizResult = QuizRecordBase & {
  // TODO

  paperName: string;

  correct: Record<ID, Answers>;

  // name, score, weight
  records: QuizRecordRow[];
  score: number;
  total: number;
};