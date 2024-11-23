import { QuestionDisplay } from "#/components/QuestionDisplay";
import { Answers, Question } from "#/types";
import { Quizzy } from "@/data";
import { useAsyncMemo } from "@/utils/react";
import { ParamsDefinition, useParsedSearchParams } from "@/utils/react-router";
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

  const { data: record, refresh: refreshRecord } = useAsyncMemo(
    async () => {
      return await Quizzy.getQuizRecord(recordId ?? '')
    },
    [recordId],
  );


  const { data: paper } = useAsyncMemo(
    async () => record ? await Quizzy.getQuizPaper(record.paperId) : undefined,
    [record?.paperId]
  );

  const { data: question } = useAsyncMemo(
    async () => {
      if (!paper) {
        return;
      }
      const [q] = await Quizzy.getQuestions([paper.questions[qIndex - 1]]);
      await Quizzy.updateQuiz(recordId ?? '', { lastQuestion: qIndex });
      return q;
    },
    [paper, qIndex]
  );

  const [previewQuestion, setPreviewQuestion] = useState<Question | undefined>(undefined);
  const onPreviewQuestionChanged = async (qIndex: number) => {
    setPreviewQuestion(
      (await Quizzy.getQuestions([paper?.questions[qIndex - 1] ?? '']))[0]
    );
  };
  

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
    refreshRecord();
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
    onQuestionChanged={(q) => setSearchParams({ q })}
    onExit={() => navigate('/')}
    onSubmit={async () => {
      const id = await Quizzy.endQuiz(recordId ?? '');
      navigate('/result/' + id);
    }}
  />;

};

export default QuizPage;