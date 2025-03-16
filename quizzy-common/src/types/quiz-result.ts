import { Answers, AnswersEvaluation } from "./answer";
import { StatBase } from "./stats";
import { DatabaseIndexed, ID } from "./technical";

export type AnswerStatus = 'correct' | 'wrong' | 'no-answer';

export type QuizResultRecordRow = {
  id: ID;
  name: string;
  status: AnswerStatus;
  answer: string;
  correct: string;
  score: number;
  totalScore: number;
} & DatabaseIndexed;



export type QuizResult = DatabaseIndexed & {
  paperId?: string;
  paperName: string;
  startTime: number;
  timeUsed: number;

  answers: Record<ID, Answers>;
  correct: Record<ID, AnswersEvaluation>;

  // name, score, weight
  records: QuizResultRecordRow[];
  score: number;
  totalScore: number;
  percentage: number;

  stat?: StatBase;
};
