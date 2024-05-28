import { ID, IncompleteQuizPaper, QuizPaper, QuizRecord, QuizzyController, StartQuizOptions, UpdateQuizOptions } from "#/types";
import { uuidV4B64 } from "#/utils";
import { toCompleted } from "./paper-id";

const _c = <T>(x: T) => x === undefined ? undefined : JSON.parse(JSON.stringify(x));

export class MemoryController implements QuizzyController {

  private readonly papers: Map<ID, QuizPaper>;
  private readonly records: Map<ID, QuizRecord>;

  constructor() {
    this.papers = new Map();
    this.records = new Map();
  }

  async importQuizPapers(...papers: IncompleteQuizPaper[]): Promise<string[]> {
    const ids: string[] = [];
    for (const _paper of papers) {
      const paper = await toCompleted(_paper, (id) => this.papers.has(id));
      this.papers.set(paper.id!, paper as QuizPaper);
      ids.push(paper.id!);
    }
    return ids;
  }

  async getQuizPaper(id: ID): Promise<QuizPaper | undefined> {
    return _c(this.papers.get(id));
  }

  async listQuizPapers(): Promise<QuizPaper[]> {
    return [...this.papers.entries()].map(([, x]) => _c(x));
  }

  async listQuizPaperIds(): Promise<string[]> {
    return [...this.papers.entries()].map(([x]) => x);
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
      if (quizRecord.quizPaperId === quizPaperID) {
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
      quizPaperId: id,
      status: 'ongoing',
      startTime: t,
      updateTime: t,
      timeUsed: 0,
      answers: [],
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