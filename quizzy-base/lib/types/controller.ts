import { ID } from "./question";
import { QuizPaper } from "./quiz-paper";
import { QuizRecord } from "./quiz-record";

export type StartQuizOptions = {
  timestamp?: number;
  record?: QuizRecord;
};

export type UpdateQuizOptions = {
  timestamp?: number;
}

export interface QuizzyController {

  importQuizPapers(...papers: QuizPaper[]): Promise<ID[]>;
  getQuizPaper(id: ID): Promise<QuizPaper | undefined>;

  listQuizPapers(): Promise<QuizPaper[]>;
  listQuizPaperIds(): Promise<ID[]>;

  importQuizRecords(...records: QuizRecord[]): Promise<ID[]>;
  getQuizRecord(id: ID): Promise<QuizRecord | undefined>;

  listQuizRecords(): Promise<QuizRecord[]>;
  listQuizRecordIds(): Promise<ID[]>;

  startQuiz(id: ID, options?: StartQuizOptions): Promise<ID>;
  updateQuiz(
    id: ID,
    record: Partial<QuizRecord>,
    options?: UpdateQuizOptions,
  ): Promise<QuizRecord>;
  
}