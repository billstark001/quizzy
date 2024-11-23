import { QuestionEdit } from "#/components/QuestionEdit";
import { Question } from "#/types";
import { withHandler } from "#/utils";
import { QuizzyRaw } from "@/data";
import { useAsyncMemo } from "@/utils/react";
import { ParamsDefinition, useParsedSearchParams } from "@/utils/react-router";


export type EditParams = {
  paper: string;
  q: number;
  question: string;
};

const _parser: ParamsDefinition<EditParams> = {
  paper: 'string',
  q: "number",
  question: "string",
};

type _S = readonly [Question | undefined, string | undefined, boolean];

export const EditPage = () => {
  const [searchParams] = useParsedSearchParams(_parser);
  const { paper: paperId, q: questionIndex, question: questionIdOrig } = searchParams;

  // fetch question and id

  const fetchData = withHandler(async (): Promise<_S> => {
    // first try to get question by id
    let question: Question | null | undefined = undefined;
    try {
      if (questionIdOrig) {
        question = (await QuizzyRaw.getQuestions([questionIdOrig]))?.[0];
      }
    } catch {}
    if (question) {
      return [question, questionIdOrig, false];
    }
    // then try to get question by paper and index
    const paper = paperId ? await QuizzyRaw.getQuizPaper(paperId) : null;
    if (paper) {
      const qid = paper.questions[questionIndex ?? 1] ?? '';
      question = (await QuizzyRaw.getQuestions([qid]))?.[0];
      if (question) {
        return [question, qid, true];
      }
    }
    return [undefined, undefined, false];
  }, { def: [undefined, undefined, false] as _S, deps: [paperId, questionIndex, questionIdOrig], notifySuccess: undefined, });

  const { data: _q } = useAsyncMemo(fetchData, [paperId, questionIndex, questionIdOrig]);
  const [question, questionId, paperMode] = _q ?? [undefined, undefined, false];

  // TODO paper mode

  if (question == undefined) {
    return 'ERROR: QUESTION NOT FOUND';
  }

  return <QuestionEdit 
    question={question}
    onChange={() => {}}
    onSave={() => {}}
  />;
};