import { 
  CompleteQuizPaper, CompleteQuizPaperDraft, 
  Question, CompleteQuestion, CompleteQuestionDraft 
} from "../types"
import { ID } from "../types/technical";
import { uuidV4B64WithRetry } from "../utils/string";
import { normalizeQuestion } from "./question-id";

export const toCompleted = async (
  p: CompleteQuizPaperDraft,
  hasId?: (id: ID) => boolean | Promise<boolean>,
): Promise<CompleteQuizPaper> => {
  // deep copy
  const paper: CompleteQuizPaperDraft = JSON.parse(JSON.stringify(p));

  // ensure paper ID if needed
  if (!paper.id) {
    paper.id = await uuidV4B64WithRetry(
      async (id) => await hasId?.(id) ?? false,
      12
    );
  } else if (await hasId?.(paper.id!)) {
    throw new Error('Quiz Paper ID Conflict');
  }

  // Ensure questions have IDs for the complete format
  const questionIds = new Set<ID>();
  for (const q of paper.questions) {
    if (!q.id) {
      q.id = await uuidV4B64WithRetry(
        async (id) => !questionIds.has(id),
        16
      );
    }
    if (questionIds.has(q.id!)) {
      throw new Error('Question ID Conflict');
    }
    questionIds.add(q.id!);
  }

  return paper as CompleteQuizPaper;
};

// Convert CompleteQuestion (no foreign keys) to Question (with tag IDs)
export const completeQuestionToQuestion = (
  cq: CompleteQuestion,
  tagIds: ID[],
  categoryIds: ID[]
): Question => {
  const question: Question = {
    id: cq.id,
    name: cq.name,
    tagIds,
    categoryIds,
    title: cq.title,
    content: cq.content,
    solution: cq.solution,
    type: cq.type,
  } as Question;

  // Add type-specific fields
  if (cq.type === 'choice') {
    (question as any).multiple = cq.multiple;
    (question as any).options = cq.options;
  } else if (cq.type === 'blank') {
    (question as any).blanks = cq.blanks;
  } else if (cq.type === 'text') {
    (question as any).answer = cq.answer;
  }

  normalizeQuestion(question);
  return question;
};

// Convert Question to CompleteQuestion (extract tag names from tag entities)
export const questionToCompleteQuestion = async (
  q: Question,
  getTagName: (id: ID) => Promise<string | undefined>
): Promise<CompleteQuestion> => {
  const tags = await Promise.all((q.tagIds ?? []).map(getTagName));
  const categories = await Promise.all((q.categoryIds ?? []).map(getTagName));

  const base: any = {
    id: q.id,
    name: q.name,
    tags: tags.filter(Boolean) as string[],
    categories: categories.filter(Boolean) as string[],
    title: q.title,
    content: q.content,
    solution: q.solution,
    type: q.type,
  };

  // Add type-specific fields
  if (q.type === 'choice') {
    base.multiple = (q as any).multiple;
    base.options = (q as any).options;
  } else if (q.type === 'blank') {
    base.blanks = (q as any).blanks;
  } else if (q.type === 'text') {
    base.answer = (q as any).answer;
  }

  return base as CompleteQuestion;
};