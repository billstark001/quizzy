import { Answers, ID, Question, QuizPaper, QuizRecord, QuizResult, StatPatch } from "#/types";
import { uuidV4B64 } from "#/utils";
import { getOptionOrBlankId } from "./question-id";


const DEFAULT_SCORE = 1;


export const createResultAndStatPatches = (
  record: QuizRecord,
  paper: QuizPaper,
  questions: Record<ID, Question>,
  resultID?: ID,
) => {

  // answers
  const correctAnswers: Record<string, Answers> = {};

  // scores
  let score = 0;
  let total = 0;
  const weights = { ...paper.weights };
  const scores: Record<ID, number> = {};

  // stat patch
  const patches: StatPatch[] = [];

  // iterate through all questions
  // handle answer and score variables
  for (const qid of paper.questions) {
    const question = questions[qid];
    if (!question) {
      continue;
    }

    let isCorrect = false;

    if (question.type === 'choice') {
      const a: Answers = {
        type: question.type,
        answer: Object.fromEntries(question.options.map((o, i) => [
          getOptionOrBlankId(o, i, question),
          o.shouldChoose
        ] as [ID, boolean])),
      };
      correctAnswers[qid] = a;

      const a2 = record.answers[qid];
      isCorrect = a2 && a2.type === 'choice'
        && Object.keys(a.answer).filter(
          (k) => !!a.answer[k] !== !!a2.answer[k]
        ).length === 0;

    } else if (question.type === 'blank') {
      const a: Answers = {
        type: 'blank',
        answer: Object.fromEntries(question.blanks.map((b, i) => [
          getOptionOrBlankId(b, i, question),
          b.answer ?? ''
        ] as [ID, string])),
      }
      correctAnswers[qid] = a;

      // TODO better evaluators
      const a2 = record.answers[qid];
      isCorrect = a2 && a2.type === 'blank'
        && Object.keys(a.answer).filter(
          (k) => (a.answer[k] ?? '') !== (a2.answer[k] ?? '')
        ).length === 0;
    } else { // type is text
      const a: Answers = {
        type: 'text',
        answer: question.answer ?? '',
      };
      correctAnswers[qid] = a;
      isCorrect = !!question.answer 
        && question.answer === record.answers[qid].answer;
    }

    // calculate scores
    weights[qid] = weights[qid] || DEFAULT_SCORE;
    scores[qid] = isCorrect ? weights[qid] : 0;
    score += scores[qid];
    total += weights[qid];

    // create patch
    for (const tag in question.tags ?? []) {
      patches.push({
        tag, questionId: question.id, correct: isCorrect,
      });
    }
  }

  const result: QuizResult = {
    id: resultID ?? uuidV4B64(),

    paperId: paper.id,
    paperName: paper.name,

    startTime: record.startTime,
    timeUsed: record.timeUsed,

    answers: { ...record.answers },
    correct: correctAnswers,

    scores,
    weights,
    score,
    total,
  };

  return [result, patches] as [QuizResult, StatPatch[]];
}