import { objectHash } from "@/utils";
import { DatabaseIndexed, VersionIndexed } from "./technical";

export type TagBase = {
  mainName: string;
  mainNames: Record<string, string | undefined>;
  alternatives: string[];
};

export type Tag = TagBase & DatabaseIndexed & VersionIndexed;

export const defaultTag = (t?: Partial<Tag>): Tag => ({
  id: '',
  currentVersion: t ? ('0000-' + objectHash(t)) : 'default',
  mainName: '',
  mainNames: {},
  alternatives: [],
  ...t,
});