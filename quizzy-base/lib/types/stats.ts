import { DatabaseIndexed, ID } from "./technical";

export type StatUnit = {
  correct: number;
  wrong: number;
  noAnswer: number;
};

export type StatBase = {
  countByQuestion: Record<ID, StatUnit>;
  countByTag: Record<string, StatUnit>;
  countByCategory: Record<string, StatUnit>;
  scoreByQuestion: Record<ID, StatUnit>;
  scoreByTag: Record<string, StatUnit>;
  scoreByCategory: Record<string, StatUnit>;
  grossCount: StatUnit;
  grossScore: StatUnit;
  grossPercentage: StatUnit;
  countedQuestions: ID[];
  ignoredQuestions: ID[];
  allTags: string[];
  allCategories: string[];
};

export const defaultStatUnit = (): StatUnit => ({
  correct: 0,
  wrong: 0,
  noAnswer: 0,
});

export const toPercentage = ({ correct, wrong, noAnswer }: StatUnit): StatUnit => {
  const all = (correct + wrong + noAnswer) || 1;
  return {
    correct: correct / all,
    wrong: wrong / all,
    noAnswer: noAnswer / all,
  };
};

export const defaultStatBase = (): StatBase => ({
  countByQuestion: {},
  countByTag: {},
  countByCategory: {}, 
  scoreByQuestion: {},
  scoreByTag: {},
  scoreByCategory: {},
  grossCount: defaultStatUnit(),
  grossScore: defaultStatUnit(),
  grossPercentage: defaultStatUnit(),
  countedQuestions: [],
  ignoredQuestions: [],
  allTags: [],
  allCategories: [],
});

export type Stat = StatBase & DatabaseIndexed & {
  results: ID[];
};
