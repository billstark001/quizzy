import { ID, IncompleteQuizPaper, QuizPaper } from "#/types"
import { uuidV4B64 } from "#/utils";

export const toCompleted = async (
  p: IncompleteQuizPaper, 
  hasID?: (id: ID) => boolean | Promise<boolean>
): Promise<QuizPaper> => {
  // deep copy
  const paper = JSON.parse(JSON.stringify(p));

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
    } while (questionIds.has(q.id));
  }

  return paper as QuizPaper;
};