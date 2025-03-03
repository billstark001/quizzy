import { QuizRecord, QuizRecordOperation, QuizRecordInitiation, QuizRecordTactics, QuizRecordEvent } from "../types";
import { nextWeightedItem } from "../utils/random-seq";


export type TacticsParser = (t: Readonly<QuizRecordTactics>) => Promise<QuizRecordInitiation | undefined>;

export const startQuiz = async (tactics: Readonly<QuizRecordTactics>, currentTime: number, parser: TacticsParser) => {
  const initiation = await parser(tactics);
  if (!initiation) {
    throw new Error('Bad tactics parser return.');
  }
  const fullRecord: QuizRecord = {
    id: '',
    startTime: currentTime,
    timeUsed: 0,
    answers: {},
    ...initiation,
    paused: false,
    lastQuestion: 1,
    updateTime: currentTime,
  };
  return fullRecord;
};

export const updateQuiz = (
  record: QuizRecord,
  opr: QuizRecordOperation
): [QuizRecord, QuizRecordEvent | undefined] => {
  const { type: oprType, currentTime } = opr;
  // assume record.id === opr.id
  const { id: recordId, paperId, randomState, questionOrder, paused } = record;
  const isSequential = !!paperId;
  let ret: QuizRecord | undefined;
  let retEvent: QuizRecordEvent | undefined;
  let needsForward = false;
  const elapsedTime = paused ? 0 : (currentTime - (record.updateTime ?? record.startTime));
  const updateTimePayload = {
    updateTime: currentTime,
    timeUsed: (record.timeUsed || 0) + elapsedTime,
  };

  if (oprType === 'pause' || oprType === 'hard-pause') {
    ret = {
      ...record,
      ...updateTimePayload,
      paused: true,
    }
  }

  if (oprType === 'resume') {
    ret = {
      ...record,
      ...updateTimePayload,
      lastEnter: currentTime,
      paused: false,

    }
  }

  if (oprType === 'answer') {
    const { questionId, answers, withForward } = opr;
    ret = {
      ...record,
      ...updateTimePayload,
      answers: { ...record.answers, [questionId]: answers },
      lastQuestion: record.questionOrder.indexOf(questionId) + 1,
    };
    needsForward = withForward ?? false;
  }

  if (oprType === 'back') {
    const nextIndex = (record.lastQuestion || 1) - 1;
    if (!questionOrder[nextIndex - 1]) {
      retEvent = {
        type: 'exhausted',
        id: recordId,
      };
    } else {
      ret = {
        ...record,
        ...updateTimePayload,
        lastQuestion: nextIndex,
      };
      retEvent = {
        type: 'goto',
        id: recordId,
        questionIndex: nextIndex,
        questionId: questionOrder[nextIndex - 1],
      };
    }
  }

  if (oprType === 'goto') {
    const exists = !!questionOrder[opr.target - 1];
    if (!exists) {
      retEvent = {
        type: 'exhausted',
        id: recordId,
      };
    } else {
      const nextIndex = Number(opr.target);
      ret = {
        ...record,
        ...updateTimePayload,
        lastQuestion: nextIndex,
      };
      retEvent = {
        type: 'goto',
        id: recordId,
        questionIndex: nextIndex,
        questionId: questionOrder[nextIndex - 1],
      };
    }
  }

  if (oprType === 'forward' || needsForward) {
    const nextIndex = (record.lastQuestion || 1) + 1;
    const retPayload = ret != null ? ret : { ...record, ...updateTimePayload };
    if (nextIndex <= questionOrder.length) {
      // the question is assigned or generated
      ret = {
        ...retPayload,
        lastQuestion: nextIndex,
      };
      retEvent = {
        type: 'goto',
        id: recordId,
        questionIndex: ret.lastQuestion!,
        questionId: ret.questionOrder[nextIndex - 1],
      };
    } else if (isSequential) {
      // the list is exhausted
      retEvent = {
        type: 'exhausted',
        id: recordId,
        isForward: true,
      };
      ret = retPayload;
    } else {
      const [nextQuestion, nextState] = nextWeightedItem(randomState!);
      if (!nextQuestion) {
        retEvent = {
          type: 'exhausted',
          id: recordId,
          isForward: true,
        };
        ret = retPayload;
      } else {
        ret = {
          ...retPayload,
          lastQuestion: questionOrder.length + 1,
          questionOrder: [...questionOrder, nextQuestion],
          randomState: nextState,
          paperId: undefined,
        };
        retEvent = {
          type: 'goto',
          id: recordId,
          questionIndex: ret.lastQuestion!,
          questionId: nextQuestion,
        };
      }
    }
  }

  if (oprType === 'submit') {
    ret = {
      ...record,
      ...updateTimePayload,
      paused: true,
    };
    retEvent = {
      type: 'submit',
      id: recordId,
      resultId: '',
    };
  }

  if (ret == null) {
    // something bad happened
    throw new Error(`Unsupported operation type ${JSON.stringify(oprType)}`);
  }

  return [ret, retEvent];
};