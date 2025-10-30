import { QuestionDisplay } from "@/components/question-display/QuestionDisplay";
import { Answers, Question, QuizRecord, QuizRecordEvent } from "@quizzy/base/types";
import { openDialog } from "@/components/handler";
import { QuizzyWrapped } from "@/data";
import { ParamsDefinition, useParsedSearchParams } from "@/utils/react-router";
import { Box, Button, VStack } from "@chakra-ui/react";
import { SetStateAction, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";


export type QuizPageParams = {
  record: string;
  q?: number;
};

const _parser: ParamsDefinition<QuizPageParams> = {
  record: 'string',
  q: 'number',
};

const _getQuestion = async (record: Readonly<QuizRecord> | undefined, qIndex: number) => 
  await QuizzyWrapped.getQuestion(record?.questionOrder?.[qIndex - 1] ?? '');

export const QuizPage = () => {
  const [searchParams, setSearchParams] = useParsedSearchParams(_parser);
  const { record: recordId, q: _q } = searchParams;
  const qIndex = !_q || _q < 1 ? 1 : Math.round(_q);

  const navigate = useNavigate();

  const c = useQueryClient();

  const { data: record } = useQuery({
    queryKey: ['record', recordId ?? ''],
    queryFn: () => QuizzyWrapped.getQuizRecord(recordId ?? ''),
  });

  const questionId = record?.questionOrder?.[qIndex - 1] ?? '';
  const { data: question } = useQuery({
    queryKey: ['question', questionId],
    queryFn: () => QuizzyWrapped.getQuestion(questionId),
  });

  const [previewQuestion, setPreviewQuestion] = useState<Question>();
  const onPreviewQuestionChanged = useCallback(async (qIndex: number) => {
    setPreviewQuestion(await _getQuestion(record, qIndex));
  }, [setPreviewQuestion, record]);

  // event

  const onSubmit = useCallback(async () => {
    const [_, event] = await QuizzyWrapped.updateQuiz({
      type: 'submit',
      id: recordId ?? '',
      currentTime: Date.now(),
    });
    if (event?.type === 'submit') {
      navigate('/result/' + event.resultId);
    }
  }, [recordId]);

  const handleEvent = useCallback(async (event?: QuizRecordEvent) => {
    if (event?.type === 'goto') {
      setSearchParams({ q: event.questionIndex });
    } else if (event?.type === 'submit') {
      navigate('/result/' + event.resultId);
    } else if (event?.type === 'exhausted') {
      const doSubmit = event.isForward && await openDialog(<>
        This is the last question. Submit?
      </>, 'ok-cancel', 'quiz-submit');
      if (doSubmit){
        await onSubmit();
      }
    }
  }, [record, onSubmit]);


  // answers

  const currentAnswers = useMemo(() => {
    const _A = record?.answers[question?.id ?? ''];
    return (!_A || Object.keys(_A).length == 0 ? undefined : _A) ?? {
      type: question?.type ?? 'choice',
      answer: question?.type === 'text' ? '' : [],
    } as Answers;
  }, [record, question]);

  const setCurrentAnswers = useCallback(async (a: SetStateAction<Answers>) => {
    if (typeof a === 'function') {
      a = a(currentAnswers);
    }
    const [, event] = await QuizzyWrapped.updateQuiz({
      currentTime: Date.now(),
      id: recordId ?? '',
      type: 'answer',
      questionId,
      answers: a,
    });
    c.invalidateQueries({ queryKey: ['record', recordId] });
    await handleEvent(event);
  }, [currentAnswers, recordId, c, questionId, setSearchParams, handleEvent]);


  // question shifting
  const onQuestionChanged = useCallback(async (q: number) => {
    const [, event] = await QuizzyWrapped.updateQuiz({
      id: recordId ?? '',
      type: 'goto',
      currentTime: Date.now(),
      target: q,
    });
    c.invalidateQueries({ queryKey: ['record', recordId] });
    await handleEvent(event);
  }, [record]);

  const onNext = useCallback(async () => {
    const [, event] = await QuizzyWrapped.updateQuiz({
      id: recordId ?? '',
      type: 'forward',
      currentTime: Date.now(),
    });
    c.invalidateQueries({ queryKey: ['record', recordId] });
    await handleEvent(event);
  }, [recordId, handleEvent]);

  const onExit = useCallback(() => {
    navigate('/records');
  }, [navigate]);
  
  useEffect(() => {
    QuizzyWrapped.updateQuiz({
      id: recordId ?? '',
      type: 'resume',
      currentTime: Date.now(),
    }).catch(console.error)
    return () => void QuizzyWrapped.updateQuiz({
      id: recordId ?? '',
      type: 'hard-pause',
      currentTime: Date.now(),
    }).catch(console.error);
  }, []);


  const _setCurrentAnswers = (a: SetStateAction<Answers>) => setCurrentAnswers(a).catch(console.error);

  if (!record || !question) {
    return <VStack>
      <Box>NO QUESTION</Box>
      { record != null && <Button onClick={onNext}>start</Button>}
    </VStack>;
  }
  
  return <QuestionDisplay
    question={question} answers={currentAnswers}
    totalQuestions={record.questionOrder.length} currentQuestion={qIndex}
    setAnswers={_setCurrentAnswers}
    previewQuestion={previewQuestion}
    onPreviewQuestionChanged={onPreviewQuestionChanged}
    onQuestionChanged={onQuestionChanged}
    onNext={onNext}
    onExit={onExit}
    onSubmit={onSubmit}
  />;

};

export default QuizPage;