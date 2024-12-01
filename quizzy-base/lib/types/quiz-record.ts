import { Answers } from "./answer";
import { DatabaseIndexed, ID } from "./technical";

export type QuizRecordBase = {
  paperId: ID;
  startTime: number;
  timeUsed: number;
  answers: Record<ID, Answers>;
} & DatabaseIndexed;

export type QuizRecord = QuizRecordBase & {
  paused: boolean;
  lastQuestion?: number;
  updateTime: number;
};
