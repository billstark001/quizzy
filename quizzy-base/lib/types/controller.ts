import { ID, Question } from "./question";
import { CompleteQuizPaperDraft, QuizPaper } from "./quiz-paper";
import { QuizRecord } from "./quiz-record";
import { QuizResult } from "./quiz-result";

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

export interface QuizzyController {

  // papers & questions

  importQuestions(...questions: Question[]): Promise<ID[]>;
  importQuizPapers(...papers: QuizPaper[]): Promise<ID[]>;
  importCompleteQuizPapers(...papers: CompleteQuizPaperDraft[]): Promise<ID[]>;

  getQuizPaper(id: ID): Promise<QuizPaper | undefined>;
  getQuizPaperNames(...ids: ID[]): Promise<(string | undefined)[]>;
  getQuestions(ids: ID[]): Promise<(Question | undefined)[]>;

  listQuizPaperIds(): Promise<ID[]>;
  listQuestionsIds(): Promise<ID[]>;

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
  deleteQuizRecord(id: ID): Promise<void>;
  endQuiz(id: ID, options?: EndQuizOptions): Promise<ID | undefined>;

  // results

  importQuizResults(...results: QuizResult[]): Promise<ID[]>;
  getQuizResult(id: ID): Promise<QuizResult | undefined>;
  listQuizResultIds(quizPaperID?: ID): Promise<ID[]>;
  listQuizResults(quizPaperID?: ID): Promise<QuizResult[]>;
  deleteQuizResult(id: ID): Promise<void>;


};