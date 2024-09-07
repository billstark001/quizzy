import { Answers } from "./answer";
import { ID } from "./question";

export type QuizRecordBase = {
  id: ID;
  paperId: ID;
  startTime: number;
  timeUsed: number;
  answers: Record<ID, Answers>;
};

export type QuizRecord = QuizRecordBase & {
  paused: boolean;
  lastQuestion?: number;
  updateTime: number;
};
