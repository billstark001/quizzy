
export type ID = string;
export type MarkdownString = string;

export type DatabaseIndexed = {
  id: ID;
  deleted?: boolean;
  lastUpdate?: number;
};

export type KeywordIndexed = {
  keywords?: string[];
  keywordsFrequency?: Record<string, number>;
  tags?: string[];
  tagsFrequency?: Record<string, number>;
  keywordsUpdatedTime?: number;
};

export type SearchResult<T> = {
  result: T[];
  totalPages: number;
};


export const sanitizeIndices = <T extends DatabaseIndexed & KeywordIndexed>(
  object: T,
  inPlace: boolean = false,
  retainTags: boolean = true,
) => {
  const ret = inPlace ? object : { ...object };
  delete ret.deleted;
  delete ret.lastUpdate;
  delete ret.keywords;
  delete ret.keywordsFrequency;
  delete ret.tagsFrequency;
  delete ret.keywordsUpdatedTime;
  if (!retainTags) {
    delete ret.tags;
  }
  return ret;
}