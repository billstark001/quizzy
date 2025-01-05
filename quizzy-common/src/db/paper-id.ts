import { CompleteQuizPaper, CompleteQuizPaperDraft, Question, QuizPaper } from "../types"
import { ID } from "../types/technical";
import { uuidV4B64 } from "../utils/string";
import { normalizeQuestion } from "./question-id";

export const toCompleted = async (
  p: CompleteQuizPaperDraft,
  hasId?: (id: ID) => boolean | Promise<boolean>,
  hasQuestionId?: (id: ID) => boolean | Promise<boolean>,
): Promise<CompleteQuizPaper> => {
  // deep copy
  const paper: CompleteQuizPaperDraft = JSON.parse(JSON.stringify(p));

  // ensure paper ID
  if (!paper.id) {
    let retry = 100;
    do {
      paper.id = uuidV4B64(12);
      retry--;
    } while (retry > 0 && (await hasId?.(paper.id!)));
  } else if (await hasId?.(paper.id!)) {
    throw new Error('Quiz Paper ID Conflict');
  }
  // sanitize paper
  paper.tags = paper.tags ?? [];
  paper.categories = paper.categories ?? [];

  // ensure question IDs
  const questionIds = new Set<ID>();
  for (const q of paper.questions) {
    // ensure ID exists
    if (!q.id) {
      // create a new one for it
      let retry = 100;
      do {
        q.id = uuidV4B64(16);
        retry--;
      } while (retry > 0 && (questionIds.has(q.id!) || hasQuestionId?.(q.id!)));
    }
    // still conflict: throw error
    if (questionIds.has(q.id!)) {
      throw new Error('Question ID Conflict');
    }
    questionIds.add(q.id!);
    // normalize
    normalizeQuestion(q as Question, false);
  }

  return paper as CompleteQuizPaper;
};

export const separatePaperAndQuestions = (
  p: CompleteQuizPaper,
) => {
  const q: QuizPaper = {
    ...p,
    questions: p.questions.map(x => x.id),
  };
  const questions = [...p.questions];
  return [q, questions] as [QuizPaper, Question[]];
}