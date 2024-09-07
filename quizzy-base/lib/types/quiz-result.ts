import { Answers } from "./answer";
import { ID } from "./question";

export type QuizResult = {
  id: ID;
  paperId: ID;
  startTime: number;
  timeUsed: number;
  answers: Record<ID, Answers>;
};