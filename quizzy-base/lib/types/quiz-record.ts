import { Answer } from "./answer";
import { ID } from "./question";

export type QuizRecordStatus = 'ongoing' | 'paused' | 'finished';

export type QuizRecord = {
  id: ID;
  quizPaperId: ID;
  status: QuizRecordStatus;
  startTime: number;
  timeUsed: number;
  answers: Answer[];
};