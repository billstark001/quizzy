import { Answers, Question, QuizPaper, QuizRecord, QuizResultRecordRow, QuizResult, AnswerStatus } from "../types";
import { ID } from "../types/technical";
import { uuidV4B64 } from "../utils/string";
import { numberToLetters } from "../utils/string";
import { getOptionOrBlankId } from "./question-id";


const DEFAULT_SCORE = 1;


export const createQuizResult = (
  record: QuizRecord,
  paper: QuizPaper | undefined,
  questions: Record<ID, Question>,
  resultId?: ID,
) => {

  // answers
  const correctAnswers: Record<string, Answers> = {};

  // scores
  let score = 0;
  let totalScore = 0;

  const records: QuizResultRecordRow[] = [];

  // iterate through all questions
  // handle answer and score variables
  for (let i = 0; i < record.questionOrder.length; ++i) {
    const qid = record.questionOrder[i];
    const question = questions[qid];
    if (!question) {
      continue;
    }

    let status: AnswerStatus = 'no-answer';
    const answerRaw: string[] = [];
    const correctRaw: string[] = [];

    if (question.type === 'choice') {
      const options = question.options ?? [];
      const correctAnswer: Answers = {
        type: question.type,
        answer: Object.fromEntries(options.map((o, i) => [
          getOptionOrBlankId(o, i, question),
          o.shouldChoose
        ] as [ID, boolean])),
      };
      correctAnswers[qid] = correctAnswer;
      // create text-form question record
      options.forEach(
        (o, i) => o.shouldChoose && correctRaw.push(numberToLetters(i + 1))
      );

      const userAnswer = record.answers[qid];
      const noAnswer = userAnswer?.type !== 'choice'
        || Object.keys(userAnswer.answer).length === 0;
      const wrongAnswer = !noAnswer && Object.keys(correctAnswer.answer)
        .findIndex(
          (k) => !!correctAnswer.answer[k] !== !!userAnswer.answer[k]
        ) !== -1;
      status = noAnswer ? 'no-answer' : wrongAnswer ? 'wrong' : 'correct';
      // create text-form answer record
      userAnswer?.type === 'choice' && options.forEach(
        (o, i) => userAnswer.answer[getOptionOrBlankId(o, i, question)]
          && answerRaw.push(numberToLetters(i + 1))
      );

    } else if (question.type === 'blank') {
      const blanks = question.blanks ?? [];
      const correctAnswer: Answers = {
        type: 'blank',
        answer: Object.fromEntries(blanks.map((b, i) => [
          getOptionOrBlankId(b, i, question),
          b.answer ?? ''
        ] as [ID, string])),
      }
      correctAnswers[qid] = correctAnswer;

      // TODO better evaluators
      const userAnswer = record.answers[qid];
      const noAnswer = userAnswer?.type !== 'blank'
        || Object.keys(userAnswer.answer).length === 0;
      const wrongAnswer = !noAnswer
        && Object.keys(correctAnswer.answer).findIndex(
          (k) => (correctAnswer.answer[k] ?? '') !== (userAnswer.answer[k] ?? '')
        ) !== -1;
      status = noAnswer ? 'no-answer' : wrongAnswer ? 'wrong' : 'correct';

      // create records
      const _b = userAnswer?.type === 'blank';
      blanks.forEach((b, i) => {
        const id = getOptionOrBlankId(b, i, question);
        answerRaw.push(_b ? userAnswer.answer[id] : '');
        correctRaw.push(b.answer ?? '');
      });

    } else { // type is text
      const correctAnswer: Answers = {
        type: 'text',
        answer: question.answer?.trim() ?? '',
      };
      // TODO better evaluators
      const userAnswer = (typeof record.answers[qid]?.answer === 'string'
        ? record.answers[qid]?.answer
        : String(record.answers[qid]?.answer ?? '')).trim();
      
      correctAnswers[qid] = correctAnswer;
      const noAnswer = !question.answer?.replace(/\s\n\r/g, '');
      const isCorrect = noAnswer
        ? !correctAnswer.answer
        : correctAnswer.answer === userAnswer;
      status = isCorrect ? 'correct' : noAnswer ? 'no-answer' : 'wrong';

      answerRaw.push(userAnswer);
      correctRaw.push(correctAnswer.answer);
    }

    // calculate scores
    const weight = paper?.weights?.[qid] || DEFAULT_SCORE;
    const localScore = status === 'correct' ? weight : 0;
    score += localScore;
    totalScore += weight;

    // record
    records.push({
      id: question.id,
      name: question.name ?? `${i + 1}`,
      status,
      answer: answerRaw.join(question.type === 'choice' ? ', ' : '\n'),
      correct: correctRaw.join(question.type === 'choice' ? ', ' : '\n'),
      score: localScore,
      totalScore: weight,
    })
  }

  const result: QuizResult = {
    id: resultId ?? uuidV4B64(),

    paperName: (record.nameOverride ?? paper?.name) || `Result #${record.id}`,

    startTime: record.startTime,
    timeUsed: record.timeUsed,

    answers: { ...record.answers },
    correct: correctAnswers,

    records,
    score,
    totalScore,
    percentage: score / (totalScore || 1),
  };

  return result;
}