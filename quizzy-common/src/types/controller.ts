import { Patch } from "../utils/patch";
import { Question } from "./question";
import { CompleteQuizPaperDraft, QuizPaper } from "./quiz-paper";
import { QuizRecord, QuizRecordEvent, QuizRecordOperation, QuizRecordTactics } from "./quiz-record";
import { QuizResult } from "./quiz-result";
import { Stat, StatBase } from "./stats";
import { ID, SearchResult } from "./technical";

export type StartQuizOptions = {
  currentTime?: number;
};

export type UpdateQuizOptions = {
}

export type QuizzyData = {
  questions: Question[];
  papers: QuizPaper[];
  records: QuizRecord[];
  results: QuizResult[];
  stats: Stat[];
  general?: any;
};

export type TagSearchResult = {
  paper: string[];
  paperTags: string[];
  question: string[];
  questionTags: string[];
};
export type TagListResult = {
  paperCategories: string[];
  paperTags: string[];
  questionCategories: string[];
  questionTags: string[];
};

export interface QuizzyController {

  // general

  importData(data: QuizzyData): Promise<void>;
  exportData(): Promise<QuizzyData>;

  // papers & questions

  importQuestions(...questions: Question[]): Promise<ID[]>;
  importQuizPapers(...papers: QuizPaper[]): Promise<ID[]>;
  importCompleteQuizPapers(...papers: CompleteQuizPaperDraft[]): Promise<ID[]>;

  getQuizPaper(id: ID): Promise<QuizPaper | undefined>;
  getQuizPaperNames(...ids: ID[]): Promise<(string | undefined)[]>;
  getQuestions(ids: ID[]): Promise<(Question | undefined)[]>;

  listQuizPaperIds(): Promise<ID[]>;
  listQuestionsIds(): Promise<ID[]>;

  updateQuestion(id: ID, patch: Patch<Question>): Promise<ID>;
  updateQuizPaper(id: ID, paper: Patch<QuizPaper>): Promise<ID>;
  deleteQuestion(id: ID): Promise<boolean>;
  deleteQuizPaper(id: ID): Promise<boolean>;

  findQuestion(query: string, count?: number, page?: number): Promise<SearchResult<Question>>;
  findQuizPaper(query: string, count?: number, page?: number): Promise<SearchResult<QuizPaper>>;
  findQuestionByTags(query: string, count?: number, page?: number): Promise<SearchResult<Question>>;
  findQuizPaperByTags(query: string, count?: number, page?: number): Promise<SearchResult<QuizPaper>>;

  // tags
  
  findTags(query: string, count?: number, page?: number): Promise<TagSearchResult>;
  listTags(): Promise<TagListResult>;

  // records

  importQuizRecords(...records: QuizRecord[]): Promise<ID[]>;
  getQuizRecord(id: ID): Promise<QuizRecord | undefined>;

  listQuizRecords(quizPaperId?: ID): Promise<QuizRecord[]>;
  listQuizRecordIds(quizPaperId?: ID): Promise<ID[]>;

  startQuiz(tactics: Readonly<QuizRecordTactics>, options?: Readonly<StartQuizOptions>): Promise<QuizRecord>;
  updateQuiz(
    operation: Readonly<QuizRecordOperation>,
    options?: Readonly<UpdateQuizOptions>,
  ): Promise<[QuizRecord, QuizRecordEvent | undefined]>;
  deleteQuizRecord(id: ID): Promise<boolean>;

  // results

  importQuizResults(...results: QuizResult[]): Promise<ID[]>;
  getQuizResult(id: ID): Promise<QuizResult | undefined>;
  listQuizResultIds(quizPaperId?: ID): Promise<ID[]>;
  listQuizResults(quizPaperId?: ID): Promise<QuizResult[]>;
  deleteQuizResult(id: ID): Promise<boolean>;

  // stats

  generateStats(...resultIds: ID[]): Promise<Stat | StatBase | undefined>;
  listStats(): Promise<Stat[]>;
  getStat(id: ID): Promise<Stat | undefined>;
  deleteStat(id: ID): Promise<boolean>;
};