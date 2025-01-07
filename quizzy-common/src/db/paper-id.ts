import { CompleteQuizPaper, CompleteQuizPaperDraft, Question, QuizPaper } from "../types"
import { ID } from "../types/technical";
import { uuidV4B64WithRetry } from "../utils/string";
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
    paper.id = await uuidV4B64WithRetry(
      async (id) => await hasId?.(id) ?? false,
      12
    );
  } else if (await hasId?.(paper.id!)) {
    throw new Error('Quiz Paper ID Conflict');
  }
  // sanitize paper
  paper.tags = paper.tags ?? [];
  paper.categories = paper.categories ?? [];

  // ensure question IDs
  const questionIds = new Set<ID>();
  const _f = async (id: string) => 
    questionIds.has(id) || (await hasQuestionId?.(id) ?? false);
  for (const q of paper.questions) {
    // ensure ID exists
    if (!q.id) {
      // create a new one for it
      q.id = await uuidV4B64WithRetry(_f, 16);
    }
    // still conflict: throw error
    if (questionIds.has(q.id!)) {
      throw new Error('Question ID Conflict');
    }
    questionIds.add(q.id!);
    // normalize
    normalizeQuestion(q as Question);
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