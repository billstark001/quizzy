import { RandomState } from "#/utils/random-seq";
import { Answers } from "./answer";
import { Question } from "./question";
import { DatabaseIndexed, ID } from "./technical";

export type QuizRecordTactics = {
  type: 'paper';
  paperId: ID;
} | {
  type: 'random-paper';
  papers: Readonly<Record<ID, number>>; // random weight maps
} | {
  type: 'random-category';
  categories: Readonly<Record<string, number>>;
} | {
  type: 'random-tag';
  tags: Readonly<Record<string, number>>;
};

export type QuizRecordInitiation = ({
  paperId: ID;
  randomState?: undefined,
} | {
  paperId?: undefined,
  randomState: RandomState;
}) & {
  nameOverride?: string;
  questionOrder: ID[];
};


export type QuizRecord = & DatabaseIndexed & QuizRecordInitiation & {
  startTime: number;
  timeUsed: number;
  answers: Record<ID, Answers>;
  lastQuestion?: number;
  paused: boolean;
  lastEnter?: number;
  updateTime: number; // the time that timeUsed last updated
};

export type QuizRecordOperation = { currentTime: number } & ({
  type: 'pause' | 'hard-pause' | 'resume' | 'back' | 'forward' | 'submit';
  id: ID;
} | {
  type: 'answer';
  id: ID;
  questionId: ID;
  answers: Answers;
  withForward?: boolean;
});

export type QuizRecordEvent = ({
  type: 'goto',
  id: ID,
  questionIndex: number,
  questionId: ID,
  question?: Question,
} | {
  type: 'submit',
  resultId: ID,
  id: ID,
} | {
  type: 'exhausted',
  id: ID,
  isForward?: boolean,
});


