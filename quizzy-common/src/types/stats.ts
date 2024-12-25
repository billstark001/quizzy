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

export const toPercentage = (x?: StatUnit, use100 = false): StatUnit => {
  const { correct, wrong, noAnswer } = x! ?? {};
  const all = (correct + wrong + noAnswer) || 1;
  const scale = use100 ? 100 : 1;
  return {
    correct: (correct || 0) * scale / all,
    wrong: (wrong || 0) * scale / all,
    noAnswer: (noAnswer || 0) * scale / all,
  };
};

export const stringifyUnit = (x?: StatUnit, percentage?: boolean) => {
  const { correct, wrong, noAnswer } = x! ?? {};
  const all = (correct + wrong + noAnswer) || 1;
  return percentage
    ? `${Number((correct || 0 / all) * 100).toFixed(2)}%`
    : `${correct || 0} / ${all}`;
}

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
  time: number;
};
