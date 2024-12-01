import { Answers } from "./answer";
import { QuizRecordBase } from "./quiz-record";
import { DatabaseIndexed, ID } from "./technical";

export type QuizResultRecordRow = {
  name: string;
  answer: string;
  correct: string;
  score: number;
  weight: number;
} & DatabaseIndexed;

export type QuizResult = QuizRecordBase & {
  // TODO

  paperName: string;

  correct: Record<ID, Answers>;

  // name, score, weight
  records: QuizResultRecordRow[];
  score: number;
  total: number;
};