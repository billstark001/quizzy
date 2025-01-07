import { DatabaseIndexed } from "./technical";

export type TagBase = {
  mainName: string;
  mainNames: Record<string, string | undefined>;
  alternatives: string[];
};

export type Tag = TagBase & DatabaseIndexed;

export const defaultTag = (t?: Partial<Tag>): Tag => ({
  id: '',
  mainName: '',
  mainNames: {},
  alternatives: [],
  ...t,
});