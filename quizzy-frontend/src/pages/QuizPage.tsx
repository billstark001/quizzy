import { QuestionDisplay } from "@/components/question-display/QuestionDisplay";
import { Answers, Question, QuizRecord, QuizRecordEvent } from "@quizzy/common/types";
import { openDialog } from "@/utils";
import { Quizzy } from "@/data";
import { useAsyncEffect } from "@/utils/react-async";
import { ParamsDefinition, useParsedSearchParams } from "@/utils/react-router";
import { Box, Button, VStack } from "@chakra-ui/react";
import { SetStateAction, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";


export type QuizPageParams = {
  record: string;
  q?: number;
};

const _parser: ParamsDefinition<QuizPageParams> = {
  record: 'string',
  q: 'number',
};

const _getQuestion = async (record: Readonly<QuizRecord> | undefined, qIndex: number) => (await Quizzy.getQuestions([record?.questionOrder?.[qIndex - 1] ?? '']))[0];

export const QuizPage = () => {
  const [searchParams, setSearchParams] = useParsedSearchParams(_parser);
  const { record: recordId, q: _q } = searchParams;
  const qIndex = !_q || _q < 1 ? 1 : Math.round(_q);

  const navigate = useNavigate();

  const [record, setRecord] = useState<QuizRecord>();
  const [question, setQuestion] = useState<Question>();

  useAsyncEffect(async () => {
    const record = await Quizzy.getQuizRecord(recordId ?? '');
    setRecord(record);
    setQuestion(await _getQuestion(record, qIndex));
  }, [recordId]);

  const [previewQuestion, setPreviewQuestion] = useState<Question>();
  const onPreviewQuestionChanged = useCallback(async (qIndex: number) => {
    setPreviewQuestion(await _getQuestion(record, qIndex));
  }, [setPreviewQuestion, record]);

  // event

  const onSubmit = useCallback(async () => {
    const [_, event] = await Quizzy.updateQuiz({
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
      setQuestion(event.question ?? await _getQuestion(record, event.questionIndex));
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
    const [newRecord, event] = await Quizzy.updateQuiz({
      currentTime: Date.now(),
      id: record?.id ?? '',
      type: 'answer',
      questionId: question?.id ?? '',
      answers: a,
    });
    setRecord(newRecord);
    await handleEvent(event);
  }, [currentAnswers, record, question, setRecord, setQuestion, setSearchParams, handleEvent]);


  // question shifting
  const onQuestionChanged = useCallback(async (q: number) => {
    setSearchParams({ q });
    setQuestion(await _getQuestion(record, q));
  }, [record]);

  const onNext = useCallback(async () => {
    const [newRecord, event] = await Quizzy.updateQuiz({
      id: recordId ?? '',
      type: 'forward',
      currentTime: Date.now(),
    });
    setRecord(newRecord);
    await handleEvent(event);
  }, [recordId, handleEvent]);

  const onExit = useCallback(() => {
    navigate('/records');
  }, [navigate]);
  
  useEffect(() => {
    Quizzy.updateQuiz({
      id: recordId ?? '',
      type: 'resume',
      currentTime: Date.now(),
    }).catch(console.error)
    return () => void Quizzy.updateQuiz({
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