import { ID, CompleteQuizPaperDraft, Question, QuizPaper, QuizRecord, QuizzyController, StartQuizOptions, UpdateQuizOptions } from "#/types";
import { uuidV4B64 } from "#/utils";
import { separatePaperAndQuestions, toCompleted } from "./paper-id";

const _c = <T>(x: T) => x === undefined ? undefined : JSON.parse(JSON.stringify(x));

export class MemoryController implements QuizzyController {

  private readonly papers: Map<ID, QuizPaper>;
  private readonly questions: Map<ID, Question>;
  private readonly records: Map<ID, QuizRecord>;

  constructor() {
    this.papers = new Map();
    this.records = new Map();
    this.questions = new Map();
  }

  async importQuestions(...questions: Question[]): Promise<ID[]> {
    const ids: ID[] = [];
    for (const question of questions) {
      this.questions.set(question.id, _c(question));
      ids.push(question.id);
    }
    return ids;
  }

  async importQuizPapers(...papers: QuizPaper[]): Promise<ID[]> {
    const ids: ID[] = [];
    for (const paper of papers) {
      this.papers.set(paper.id, _c(paper));
      ids.push(paper.id);
    }
    return ids;
  }

  async importCompleteQuizPapers(...papers: CompleteQuizPaperDraft[]): Promise<string[]> {
    const purePapers: QuizPaper[] = [];
    for (const _paper of papers) {
      const paper = await toCompleted(_paper, (id) => this.papers.has(id));
      const [purePaper, questions] = separatePaperAndQuestions(paper);
      purePapers.push(purePaper);
      await this.importQuestions(...questions);
    }
    return await this.importQuizPapers(...purePapers);
  }

  async getQuizPaper(id: ID): Promise<QuizPaper | undefined> {
    return _c(this.papers.get(id));
  }

  async getQuestions(ids: ID[]): Promise<(Question | undefined)[]> {
    return ids.map((id) => _c(this.questions.get(id)));
  }

  async listQuizPapers(ids: ID[]): Promise<QuizPaper[]> {
    return ids.map((x) => _c(this.papers.get(x)));
  }

  async listQuizPaperIds(): Promise<ID[]> {
    return [...this.papers.entries()].map(([x]) => x);
  }

  async listQuestionsIds(): Promise<ID[]> {
    return [...this.questions.entries()].map(([x]) => x);
  }

  async importQuizRecords(...records: QuizRecord[]): Promise<ID[]> {
    const ids: ID[] = [];
    for (const _record in records) {
      const record = _c(_record);
      ids.push(record.id!);
      this.records.set(record.id!, record);
    }
    return ids;
  }

  async getQuizRecord(id: ID): Promise<QuizRecord | undefined> {
    return _c(this.records.get(id));
  }

  async listQuizRecords(quizPaperID?: string | undefined): Promise<QuizRecord[]> {
    const records: QuizRecord[] = [];
    for (const [, quizRecord] of this.records.entries()) {
      if (quizRecord.paperId === quizPaperID) {
        records.push(_c(quizRecord));
      }
    }
    return records;
  }

  async listQuizRecordIds(quizPaperID?: string | undefined): Promise<ID[]> {
    const ids: ID[] = [];
    for (const [id,] of this.records.entries()) {
      if (id === quizPaperID) {
        ids.push(id);
      }
    }
    return ids;
  }

  async startQuiz(id: ID, options?: StartQuizOptions | undefined): Promise<QuizRecord> {
    const t = options?.timestamp ?? Date.now();
    const record: QuizRecord = {
      id: '',
      paperId: id,
      status: 'ongoing',
      startTime: t,
      updateTime: t,
      timeUsed: 0,
      answers: {},
      ...(options?.record ?? {}),
    };
    do {
      record.id = uuidV4B64();
    } while (this.records.has(record.id));
    this.records.set(record.id, _c(record));
    return _c(record);
  }

  async updateQuiz(id: ID, record: Partial<QuizRecord>, options?: UpdateQuizOptions | undefined): Promise<QuizRecord> {
    const oldRecord = this.records.get(id);
    if (!oldRecord) {
      throw new Error('Invalid record ID');
    }
    const t = options?.timestamp ?? Date.now();
    const newRecord = {
      ...oldRecord,
      ...record,
      answers: {
        ...oldRecord.answers,
        ...record.answers,
      },
      id: oldRecord.id,
      updateTime: t,
    };
    if (!options?.ignoreTimeUsed) {
      newRecord.timeUsed = oldRecord.timeUsed + (t - oldRecord.updateTime);
    }
    this.records.set(id, _c(newRecord));
    return _c(newRecord);
  }

}