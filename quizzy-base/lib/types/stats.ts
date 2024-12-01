import { DatabaseIndexed, ID } from "./technical";



export type Stat = {
  tag: string;
  alternatives: string[];
  correct: Record<ID, number>;
  total: Record<ID, number>;
  percentage: number;
} & DatabaseIndexed;

export type StatPatch = {
  tag: string;
  questionId: ID;
  correct: boolean;
};