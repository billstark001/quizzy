
export type ID = string;
export type MarkdownString = string;

export type DatabaseIndexed = {
  id: ID;
  deleted?: boolean;
  lastUpdate?: number;
};

export type KeywordIndexed = {
  keywords?: string[];
  keywordsUpdatedTime?: number;
};