import { ID } from "./question";


export type Stat = {
  id: ID;
  tag: string;
  alternatives: string[];
  correct: Record<ID, number>;
  total: Record<ID, number>;
  percentage: number;
};