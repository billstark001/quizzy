import { Patch } from "#/utils/patch";
import { Question } from "./question";
import { CompleteQuizPaperDraft, QuizPaper } from "./quiz-paper";
import { QuizRecord } from "./quiz-record";
import { QuizResult } from "./quiz-result";
import { Stat } from "./stats";
import { ID, SearchResult } from "./technical";

export type StartQuizOptions = {
  timestamp?: number;
  record?: QuizRecord;
};

export type UpdateQuizOptions = {
  timestamp?: number;
  ignoreTimeUsed?: boolean;
}

export type EndQuizOptions = {
  timestamp?: number;
}

export type QuizzyData = {
  questions: Question[];
  papers: QuizPaper[];
  records: QuizRecord[];
  results: QuizResult[];
  stats: Stat[];
  general?: any;
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

  // records

  importQuizRecords(...records: QuizRecord[]): Promise<ID[]>;
  getQuizRecord(id: ID): Promise<QuizRecord | undefined>;

  listQuizRecords(quizPaperID?: ID): Promise<QuizRecord[]>;
  listQuizRecordIds(quizPaperID?: ID): Promise<ID[]>;

  startQuiz(id: ID, options?: StartQuizOptions): Promise<QuizRecord>;
  updateQuiz(
    id: ID,
    record: Partial<QuizRecord>,
    options?: UpdateQuizOptions,
  ): Promise<QuizRecord>;
  deleteQuizRecord(id: ID): Promise<boolean>;
  endQuiz(id: ID, options?: EndQuizOptions): Promise<ID | undefined>;

  // results

  importQuizResults(...results: QuizResult[]): Promise<ID[]>;
  getQuizResult(id: ID): Promise<QuizResult | undefined>;
  listQuizResultIds(quizPaperID?: ID): Promise<ID[]>;
  listQuizResults(quizPaperID?: ID): Promise<QuizResult[]>;
  deleteQuizResult(id: ID): Promise<boolean>;


};