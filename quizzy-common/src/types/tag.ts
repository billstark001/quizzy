import { DatabaseIndexed } from "./technical";

export type Tag = {
  mainName: string;
  mainNames: Record<string, string | undefined>;
  type?: 'tag' | 'category';
  alternatives: string[];
} & DatabaseIndexed;

export const defaultTag = (t?: Partial<Tag>): Tag => ({
  id: '',
  mainName: '',
  mainNames: {},
  alternatives: [],
  ...t,
});