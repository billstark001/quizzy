import { objectHash } from "@/utils";
import { DatabaseIndexed, ID, VersionIndexed } from "./technical";

export type BookmarkType = {
  dispCssColor?: string;
  dispCssColorDark?: string;
  name: string;
  names: Record<string, string | undefined>;
  desc: string;
  descs: Record<string, string | undefined>; // TODO do we need this?
} & DatabaseIndexed & VersionIndexed;

export const defaultBookmarkType = (t?: Partial<BookmarkType>): BookmarkType => ({
  id: '',
  currentVersion: t ? ('0000-' + objectHash(t)) : 'default',
  name: '',
  names: {},
  desc: '',
  descs: {},
  ...t,
});

export type BookmarkCategory = 'paper' | 'question';

export const BookmarkReservedWords = Object.freeze([
  'default', 'reported'
] as const);

export const BOOKMARK_DEFAULT_CSS_COLOR = 'gray.solid';

export const BookmarkReservedColors = Object.freeze({
  'default': 'gray.solid',
  'reported': 'orange.solid',
} satisfies Record<BookmarkReservedWord, string>);

export type BookmarkReservedWord = (typeof BookmarkReservedWords)[
  number
] & string;

export type BookmarkBase = {
  typeId: ID; // empty -> default type
  itemId: ID;
  category: BookmarkCategory;
  note?: string;
};

export type Bookmark = BookmarkBase & DatabaseIndexed & VersionIndexed & {
  createTime: number;
};

export const defaultBookmark = (b?: Partial<Bookmark>): Bookmark => ({
  id: '',
  currentVersion: b ? ('0000-' + objectHash(b)) : 'default',
  typeId: '',
  itemId: '',
  category: 'question',
  createTime: -1,
  ...b,
});