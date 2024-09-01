import { CompleteQuizPaper, ID, CompleteQuizPaperDraft, Question, QuizPaper } from "#/types"
import { uuidV4B64 } from "#/utils";

export const toCompleted = async (
  p: CompleteQuizPaperDraft,
  hasID?: (id: ID) => boolean | Promise<boolean>
): Promise<CompleteQuizPaper> => {
  // deep copy
  const paper: CompleteQuizPaperDraft = JSON.parse(JSON.stringify(p));

  // ensure paper ID
  if (!paper.id) {
    do {
      paper.id = uuidV4B64();
    } while (await hasID?.(paper.id!));
  } else if (await hasID?.(paper.id!)) {
    throw new Error('ID Conflict');
  }

  // ensure question IDs
  const questionIds = new Set<ID>();
  for (const q of paper.questions) {
    if (q.id) {
      questionIds.add(q.id!);
    }
  }
  for (const q of paper.questions) {
    if (q.id) {
      continue;
    }
    do {
      q.id = uuidV4B64();
    } while (q.id == null || questionIds.has(q.id));
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