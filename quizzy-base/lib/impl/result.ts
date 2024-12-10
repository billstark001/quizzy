import { Answers, Question, QuizPaper, QuizRecord, QuizResultRecordRow, QuizResult, StatPatch } from "#/types";
import { ID } from "#/types/technical";
import { uuidV4B64 } from "#/utils/string";
import { numberToLetters } from "#/utils/string";
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

  const records: QuizResultRecordRow[] = [];

  // stat patch
  const patches: StatPatch[] = [];

  // iterate through all questions
  // handle answer and score variables
  for (let i = 0; i < paper.questions.length; ++i) {
    const qid = paper.questions[i];
    const question = questions[qid];
    if (!question) {
      continue;
    }

    let isCorrect = false;
    const answerRaw: string[] = [];
    const correctRaw: string[] = [];

    if (question.type === 'choice') {
      const a: Answers = {
        type: question.type,
        answer: Object.fromEntries(question.options.map((o, i) => [
          getOptionOrBlankId(o, i, question),
          o.shouldChoose
        ] as [ID, boolean])),
      };
      correctAnswers[qid] = a;
      // create text-form question record
      question.options.forEach(
        (o, i) => o.shouldChoose && correctRaw.push(numberToLetters(i + 1))
      );

      const a2 = record.answers[qid];
      isCorrect = a2?.type === 'choice'
        && Object.keys(a.answer).filter(
          (k) => !!a.answer[k] !== !!a2.answer[k]
        ).length === 0;
      // create text-form answer record
      a2?.type === 'choice' && question.options.forEach(
        (o, i) => a2.answer[getOptionOrBlankId(o, i, question)]
          && answerRaw.push(numberToLetters(i + 1))
      );

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
      isCorrect = a2?.type === 'blank'
        && Object.keys(a.answer).filter(
          (k) => (a.answer[k] ?? '') !== (a2.answer[k] ?? '')
        ).length === 0;

      // create records
      const _b = a2?.type === 'blank';
      question.blanks.forEach((b, i) => {
        const id = getOptionOrBlankId(b, i, question);
        answerRaw.push(_b ? a2.answer[id] : '');
        correctRaw.push(b.answer ?? '');
      });

    } else { // type is text
      const a: Answers = {
        type: 'text',
        answer: question.answer ?? '',
      };
      // TODO better evaluators
      correctAnswers[qid] = a;
      isCorrect = !!question.answer
        && question.answer === record.answers[qid]?.answer;

      answerRaw.push(String(record.answers[qid]?.answer ?? ''));
      correctRaw.push(question.answer ?? '');
    }

    // calculate scores
    const weight = paper.weights?.[qid] || DEFAULT_SCORE;
    const localScore = isCorrect ? weight : 0;
    score += localScore;
    total += weight;

    // record
    records.push({
      id: question.id,
      name: question.name ?? `${i + 1}`,
      answer: answerRaw.join(question.type === 'choice' ? ', ' : '\n'),
      correct: correctRaw.join(question.type === 'choice' ? ', ' : '\n'),
      score: localScore,
      weight,
    })

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

    records,
    score,
    total,
  };

  return [result, patches] as [QuizResult, StatPatch[]];
}