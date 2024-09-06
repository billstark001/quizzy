import Pagination from "#/components/Pagination";
import { BaseQuestionPanel, BlankQuestionPanelProps, ChoiceQuestionPanelProps, QuestionPanel, QuestionPanelProps, TextQuestionPanelProps } from "#/components/QuestionPanel";
import { Answers, BlankAnswers, ChoiceAnswers, ChoiceQuestion, Question, TextAnswers } from "#/types";
import { formatMilliseconds } from "#/utils";
import { QuestionSelectionModal } from "#/components/QuestionSelectionModal";
import { DragHandleIcon } from "@chakra-ui/icons";
import { Box, Button, HStack, IconButton, Progress, useDisclosure, VStack } from "@chakra-ui/react";
import { Dispatch, ReactNode, SetStateAction, useState } from "react";
import { useTranslation } from "react-i18next";


export type QuestionDisplayProps = {
  question: Question,
  answers: Answers,
  setAnswers: Dispatch<SetStateAction<Answers>>,
  currentQuestion: number,
  totalQuestions: number,
  onQuestionChanged?: (num: number) => void | Promise<void>,

  previewQuestion?: Question,
  onPreviewQuestionChanged?: (num: number) => void | Promise<void>,

  // exam state
  examTitle?: ReactNode,
  currentTime?: number, // in milliseconds
  totalTime?: number, // in milliseconds
  isResult?: boolean,
}

export const TextQuestionSymbol = Symbol('TextQuestion');

export const QuestionDisplay = (props: QuestionDisplayProps) => {
  const {
    question,
    answers,
    setAnswers,

    currentQuestion,
    totalQuestions,
    onQuestionChanged,

    previewQuestion,
    onPreviewQuestionChanged,

    examTitle,
    currentTime,
    totalTime,
    isResult,
  } = props;

  const [questionSelect, setQuestionSelect] = useState(currentQuestion);

  const [expandSolution, setExpandSolution] = useState(false);

  const hasCurrentTime = currentTime != null;
  const hasTotalTime = totalTime != null;
  const hasBoth = hasCurrentTime && hasTotalTime;
  const hasEither = hasCurrentTime || hasTotalTime;
  const timeRatio = hasBoth
    ? currentTime / totalTime
    : -1;
  

  const choice: Partial<ChoiceQuestionPanelProps> = {
    get(id) {
      return (answers as ChoiceAnswers).answer[id];
    },
    set(id, set) {
      setAnswers((a) => ({ ...a as ChoiceAnswers, answer: {
        ...(a as ChoiceAnswers).answer,
        [id]: set,
      }}));
    },
  };

  const blank: Partial<BlankQuestionPanelProps> = {
    get(id) {
      return (answers as BlankAnswers).answer[id];
    },
    set(id, set) {
      setAnswers((a) => ({ ...a as BlankAnswers, answer: {
        ...(a as BlankAnswers).answer,
        [id]: set,
      }}));
    },
  };

  const text: Partial<TextQuestionPanelProps> = {
    get() {
      return (answers as TextAnswers).answer;
    },
    set(set) {
      setAnswers((a) => ({ ...a as TextAnswers, answer: set }));
    },
  };

  const { type } = question;
  const getterAndSetter: Partial<QuestionPanelProps> =
    type === 'text' ? text :
      type === 'choice' ? choice : blank;

  const { t } = useTranslation();
  const q = useDisclosure();

  return <VStack alignItems='stretch' minH='700px'>
    <HStack w='100%' alignItems='flex-end'>
      <Box as='header'>{examTitle}</Box>
      <Box>{t('page.question.count', { current: currentQuestion, total: totalQuestions })}</Box>
      <Box flex={1} />
      <HStack>
        {hasBoth && <Progress hasStripe maxW='200px' minW='100px' value={timeRatio * 100} />}
        {(!hasBoth && hasEither) && <Progress maxW='200px' minW='100px' isIndeterminate />}
        {hasCurrentTime && <Box>{formatMilliseconds(currentTime)}</Box>}
        {hasBoth && <Box>{' / '}</Box>}
        {hasTotalTime && <Box>{formatMilliseconds(totalTime)}</Box>}
      </HStack>
    </HStack>
    <QuestionPanel
      flex={1}
      displaySolution={!!isResult}
      question={question as ChoiceQuestion} state={isResult ? 'display' : 'select'}
      expandSolution={expandSolution} setExpandSolution={setExpandSolution}
      {...getterAndSetter as object}
    />
    <Pagination
      nearPages={3}
      currentPage={currentQuestion} totalPages={totalQuestions} setPage={onQuestionChanged} />
    <HStack justifyContent='space-between' width='100%'>
      <Button colorScheme='red'>{t('page.question.exit')}</Button>
      <Button colorScheme='blue'>{t('page.question.prev')}</Button>
      <Box flex={1} minWidth={0}></Box>
      <IconButton colorScheme='blue' aria-label={t('page.question.questions')} icon={<DragHandleIcon />} 
        onClick={() => {
          setQuestionSelect(currentQuestion);
          q.onOpen();
        }} />
      <Button colorScheme='blue'>{t('page.question.next')}</Button>
      <Button colorScheme='teal'>{t('page.question.stop')}</Button>
    </HStack>
    <QuestionSelectionModal 
      index={questionSelect} total={totalQuestions} 
      current={currentQuestion}
      setIndex={(i) => {
        setQuestionSelect(i);
        return onPreviewQuestionChanged?.(i);
      }} onSelect={onQuestionChanged}
      {...q}
      question={<BaseQuestionPanel w='100%' question={previewQuestion ?? question} />}
    />
  </VStack>;
};