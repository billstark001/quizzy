import { ID } from "./question";
import { IncompleteQuizPaper, QuizPaper } from "./quiz-paper";
import { QuizRecord } from "./quiz-record";

export type StartQuizOptions = {
  timestamp?: number;
  record?: QuizRecord;
};

export type UpdateQuizOptions = {
  timestamp?: number;
  ignoreTimeUsed?: boolean;
}

export interface QuizzyController {

  importQuizPapers(...papers: IncompleteQuizPaper[]): Promise<ID[]>;
  getQuizPaper(id: ID): Promise<QuizPaper | undefined>;

  listQuizPapers(): Promise<QuizPaper[]>;
  listQuizPaperIds(): Promise<ID[]>;

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

}