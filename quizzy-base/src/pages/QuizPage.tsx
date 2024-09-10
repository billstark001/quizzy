import { QuestionDisplay } from "#/components/QuestionDisplay";
import { Answers, Question, QuizPaper, QuizRecord } from "#/types";
import { Quizzy } from "@/data";
import { useAsyncEffect } from "@/utils/react";
import { ParamsDefinition, parseSearchParams, useParsedSearchParams } from "@/utils/react-router";
import { Box } from "@chakra-ui/react";
import { SetStateAction, useState } from "react";
import { useNavigate } from "react-router-dom";


export type QuizPageParams = {
  record: string;
  q?: number;
};

const _parser: ParamsDefinition<QuizPageParams> = {
  record: 'string',
  q: 'number',
};

export const QuizPage = () => {
  const [searchParams, setSearchParams] = useParsedSearchParams(_parser);
  const { record: recordId, q: _q } = searchParams;
  const qIndex = !_q || _q < 1 ? 1 : Math.round(_q);

  const navigate = useNavigate();

  const [record, setRecord] = useState<QuizRecord | undefined>(undefined);
  useAsyncEffect(
    () => Quizzy.getQuizRecord(recordId ?? '').then(setRecord),
    [recordId]
  );

  const [paper, setPaper] = useState<QuizPaper | undefined>(undefined);
  const [question, setQuestion] = useState<Question | undefined>(undefined);
  const [previewQuestion, setPreviewQuestion] = useState<Question | undefined>(undefined);
  useAsyncEffect(
    () => record && Quizzy.getQuizPaper(record.paperId).then(setPaper),
    [record?.paperId]
  );
  useAsyncEffect(
    async () => {
      if (!paper) {
        return;
      }
      const [q] = await Quizzy.getQuestions([paper.questions[qIndex - 1]]);
      setQuestion(q);
      Quizzy.updateQuiz(recordId, { lastQuestion: qIndex });
    },
    [paper, qIndex]
  );

  const _A = record?.answers[question?.id ?? ''];
  const currentAnswers = (!_A || Object.keys(_A).length == 0 ? undefined : _A) ?? {
    type: question?.type ?? 'choice',
    answer: question?.type === 'text' ? '' : [],
  } as Answers;
  const setCurrentAnswers = async (a: SetStateAction<Answers>) => {
    if (typeof a === 'function') {
      a = a(currentAnswers);
    }
    await Quizzy.updateQuiz(record?.id ?? '', {
      answers: {
        [question?.id ?? '']: a,
      }
    });
    setRecord(await Quizzy.getQuizRecord(record?.id ?? ''));
  };

  const onPreviewQuestionChanged = async (qIndex: number) => {
    setPreviewQuestion(
      (await Quizzy.getQuestions([paper?.questions[qIndex - 1] ?? '']))[0]
    );
  };

  const _setCurrentAnswers = (a: SetStateAction<Answers>) => setCurrentAnswers(a).catch(console.error);

  if (!record || !paper || !question) {
    return <Box>NO RECORD</Box>;
  }

  return <QuestionDisplay
    question={question} answers={currentAnswers}
    totalQuestions={paper.questions.length} currentQuestion={qIndex}
    setAnswers={_setCurrentAnswers}
    previewQuestion={previewQuestion}
    onPreviewQuestionChanged={onPreviewQuestionChanged}
    onQuestionChanged={(q) => setSearchParams((p) => ({ ...parseSearchParams(p, _parser), q } as any))}
    onExit={() => navigate('/')}
    onSubmit={async () => {
      const id = await Quizzy.endQuiz(recordId);
      navigate('/result/' + id);
    }}
  />;

};

export default QuizPage;