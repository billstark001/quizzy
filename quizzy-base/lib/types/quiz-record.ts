import { Answer } from "./answer";
import { ID } from "./question";

export type QuizRecordStatus = 'ongoing' | 'paused' | 'finished';

export type QuizRecord = {
  id: ID;
  paperId: ID;
  status: QuizRecordStatus;
  startTime: number;
  updateTime: number;
  timeUsed: number;
  answers: Record<ID, Answer>;
};
