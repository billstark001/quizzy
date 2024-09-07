import { QuizResult } from "./quiz-result";

export type QuizRecord = QuizResult & {
  paused: boolean;
  updateTime: number;
};
