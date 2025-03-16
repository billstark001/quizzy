import { Patch } from "../utils/patch";
import { Bookmark, BookmarkBase, BookmarkType } from "./bookmark";
import { Question } from "./question";
import { CompleteQuizPaperDraft, QuizPaper } from "./quiz-paper";
import { QuizRecord, QuizRecordEvent, QuizRecordOperation, QuizRecordTactics } from "./quiz-record";
import { QuizResult } from "./quiz-result";
import { Stat, StatBase } from "./stats";
import { Tag, TagBase } from "./tag";
import { ID, SearchResult, VersionConflictRecord } from "./technical";

export type StartQuizOptions = {
  currentTime?: number;
};

export type UpdateQuizOptions = {

};


export type TICIndex = 'typeId' | 'itemId' | 'category';

export type QuizzyData = {
  questions: Question[];
  papers: QuizPaper[];
  records: QuizRecord[];
  results: QuizResult[];
  stats: Stat[];
  bookmarks: Bookmark[];
  bookmarkTypes: BookmarkType[];
  tags: Tag[];
  general?: any;
};

export type TagSearchResult = {
  paper: string[];
  paperTags: string[];
  question: string[];
  questionTags: string[];
};
export type TempTagListResult = {
  paperCategories: string[];
  paperTags: string[];
  questionCategories: string[];
  questionTags: string[];
};

export interface QuizzyController {

  // general

  importData(data: QuizzyData): Promise<void>;
  exportData(): Promise<QuizzyData>;

  // bookmark types

  createBookmarkType(t?: Partial<BookmarkType>): Promise<ID>;
  getBookmarkType(id: ID): Promise<BookmarkType | undefined>;
  listBookmarkTypes(): Promise<BookmarkType[]>;
  updateBookmarkType(id: ID, t: Partial<BookmarkType>): Promise<ID>;
  deleteBookmarkType(id: ID): Promise<boolean>;

  // bookmarks

  getBookmark(id: ID): Promise<Bookmark | undefined>;
  updateBookmark(id: ID, bookmark: Patch<Bookmark>): Promise<ID>;
  deleteBookmark(id: ID): Promise<boolean>;

  /**
   * creates or updates a bookmark
   * @param payload 
   * @returns 
   */
  putBookmarkTIC(payload: BookmarkBase): Promise<ID>;
  deleteBookmarkTIC(payload: BookmarkBase): Promise<boolean>;
  getBookmarkTIC(payload: BookmarkBase): Promise<Bookmark | undefined>;

  listBookmarks(itemId: string, isQuestion: boolean): Promise<Bookmark[]>;
  clearAllBookmarks(itemId: string, isQuestion: boolean): Promise<number>;

  // papers & questions

  importQuestions(...questions: Question[]): Promise<ID[]>;
  importQuizPapers(...papers: QuizPaper[]): Promise<ID[]>;
  importCompleteQuizPapers(...papers: CompleteQuizPaperDraft[]): Promise<ID[]>;

  getQuizPaper(id: ID): Promise<QuizPaper | undefined>;
  getQuizPaperNames(...ids: ID[]): Promise<(string | undefined)[]>;
  getQuestion(id: ID): Promise<Question | undefined>;
  getQuestions(ids: ID[]): Promise<(Question | undefined)[]>;

  listQuizPapers(): Promise<QuizPaper[]>;
  listQuestions(): Promise<Question[]>;

  updateQuestion(id: ID, patch: Patch<Question>): Promise<ID>;
  updateQuizPaper(id: ID, paper: Patch<QuizPaper>): Promise<ID>;
  deleteQuestion(id: ID): Promise<boolean>;
  deleteQuizPaper(id: ID): Promise<boolean>;

  findQuestion(query: string, count?: number, page?: number): Promise<SearchResult<Question>>;
  findQuizPaper(query: string, count?: number, page?: number): Promise<SearchResult<QuizPaper>>;
  findQuestionByTags(query: string, count?: number, page?: number): Promise<SearchResult<Question>>;
  findQuizPaperByTags(query: string, count?: number, page?: number): Promise<SearchResult<QuizPaper>>;
  listQuestionByBookmark(id: ID): Promise<Question[]>;
  listQuizPaperByBookmark(id: ID): Promise<QuizPaper[]>;

  // tags

  getTag(payload: string | Partial<TagBase>): Promise<Tag>;
  listTags(): Promise<Tag[]>;
  updateTag(id: ID, tag: Patch<Tag>): Promise<ID>;
  deleteTag(id: ID): Promise<boolean>;
  mergeTags(ids: ID[]): Promise<ID | undefined>;
  splitToNewTag(src: ID, alternatives: string[]): Promise<ID | undefined>

  
  generateTagHint(query: string, count?: number, page?: number): Promise<TagSearchResult>;
  listTagsInPapersAndQuestions(): Promise<TempTagListResult>;

  // records

  importQuizRecords(...records: QuizRecord[]): Promise<ID[]>;
  getQuizRecord(id: ID): Promise<QuizRecord | undefined>;

  listQuizRecords(quizPaperId?: ID): Promise<QuizRecord[]>;

  startQuiz(tactics: Readonly<QuizRecordTactics>, options?: Readonly<StartQuizOptions>): Promise<QuizRecord>;
  updateQuiz(
    operation: Readonly<QuizRecordOperation>,
    options?: Readonly<UpdateQuizOptions>,
  ): Promise<[QuizRecord, QuizRecordEvent | undefined]>;
  deleteQuizRecord(id: ID): Promise<boolean>;

  // results

  importQuizResults(...results: QuizResult[]): Promise<ID[]>;
  getQuizResult(id: ID): Promise<QuizResult | undefined>;
  listQuizResults(quizPaperId?: ID): Promise<QuizResult[]>;
  deleteQuizResult(id: ID): Promise<boolean>;

  // stats

  generateStats(...resultIds: ID[]): Promise<Stat | StatBase | undefined>;
  listStats(): Promise<Stat[]>;
  getStat(id: ID): Promise<Stat | undefined>;
  deleteStat(id: ID): Promise<boolean>;

  // version control
  
  listVersionConflictRecords(storeId: string, itemId?: string): Promise<VersionConflictRecord[]>;
  resolveVersionConflictRecord(id: ID, apply: boolean): Promise<void>;
};

// import { reflect, ReflectedClass } from 'typescript-rtti';
// export const controllerTypeInfo = reflect<QuizzyController>()
//   .as('interface')
//   .reflectedInterface as Readonly<ReflectedClass<QuizzyController>>;



