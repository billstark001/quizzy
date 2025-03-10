import Pagination from "@/components/Pagination";
import { Answers, BlankAnswers, ChoiceAnswers, ChoiceQuestion, Question, TextAnswers } from "@quizzy/base/types";
import { formatMilliseconds } from "@/utils/time";
import { RxDragHandleDots2 } from "react-icons/rx";
import { Box, Button, HStack, IconButton, Progress, StackProps, useDisclosure, VStack } from "@chakra-ui/react";
import { Dispatch, ElementType, ReactNode, SetStateAction, useState } from "react";
import { useTranslation } from "react-i18next";
import { getTagStyle } from "@/utils/react";
import { BlankQuestionPanelProps, TextQuestionPanelProps } from "./BlankQuestionPanel";
import { ChoiceQuestionPanelProps } from "./ChoiceQuestionPanel";
import { QuestionPanelProps } from "./QuestionPanel";
import { QuestionSelectionDialog } from "../QuestionSelectionDialog";
import BaseQuestionPanelWithBookmark from "./BaseQuestionPanelWithBookmark";
import QuestionPanelWithBookmark from "./QuestionPanelWithBookmark";


export type QuestionDisplayProps = {
  question?: Question,
  answers: Answers,
  setAnswers?: Dispatch<SetStateAction<Answers>>,
  currentQuestion: number,
  totalQuestions: number,
  onQuestionChanged?: (num: number) => void | Promise<void>,
  onPrev?: (current: number) => void | Promise<void>,
  onNext?: (current: number) => void | Promise<void>,

  previewQuestion?: Question,
  onPreviewQuestionChanged?: (num: number) => void | Promise<void>,

  // exam state
  examTitle?: ReactNode,
  currentTime?: number, // in milliseconds
  totalTime?: number, // in milliseconds
  isResult?: boolean,

  // page shift
  onExit?: () => void,
  onSubmit?: () => void,
  
  panelStyle?: ElementType<StackProps> | StackProps,
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
    onPrev, onNext,

    previewQuestion,
    onPreviewQuestionChanged,

    examTitle,
    currentTime,
    totalTime,
    isResult,

    onExit,
    onSubmit,

    panelStyle,
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
      return !!(answers as ChoiceAnswers)?.answer[id];
    },
    set(id, set, multi) {
      setAnswers?.((a) => ({ ...a as ChoiceAnswers, answer: {
        ...(multi ? (a as ChoiceAnswers).answer : {}),
        [id]: set,
      }}));
    },
  };

  const blank: Partial<BlankQuestionPanelProps> = {
    get(id) {
      return (answers as BlankAnswers)?.answer[id] ?? '';
    },
    set(id, set) {
      setAnswers?.((a) => ({ ...a as BlankAnswers, answer: {
        ...(a as BlankAnswers).answer,
        [id]: set,
      }}));
    },
  };

  const text: Partial<TextQuestionPanelProps> = {
    get() {
      return (answers as TextAnswers)?.answer ?? '';
    },
    set(set) {
      setAnswers?.((a) => ({ ...a as TextAnswers, answer: set }));
    },
  };

  const { type } = question ?? { type: 'choice' };
  const getterAndSetter: Partial<QuestionPanelProps> =
    type === 'text' ? text :
      type === 'choice' ? choice : blank;

  const { t } = useTranslation();
  const q = useDisclosure();

  return <VStack alignItems='stretch' minH='700px'>
    <HStack w='100%' alignItems='flex-end'>
      <Box as='header'>{examTitle}</Box>
      <Box>{t('panel.question.count', { current: currentQuestion, total: totalQuestions })}</Box>
      <Box flex={1} />
      <HStack>
        {hasBoth && (
          <Progress.Root maxW='200px' minW='100px' value={timeRatio * 100} striped>
            <Progress.Track>
              <Progress.Range />
            </Progress.Track>
          </Progress.Root>
        )}
        {(!hasBoth && hasEither) && (
          <Progress.Root maxW='200px' minW='100px' value={null}>
            <Progress.Track>
              <Progress.Range />
            </Progress.Track>
          </Progress.Root>
        )}
        {hasCurrentTime && <Box>{formatMilliseconds(currentTime)}</Box>}
        {hasBoth && <Box>{' / '}</Box>}
        {hasTotalTime && <Box>{formatMilliseconds(totalTime)}</Box>}
      </HStack>
    </HStack>
    {question && <QuestionPanelWithBookmark
      overflowY='auto'
      flex={1}
      {...getTagStyle(panelStyle, true, VStack) as {}}
      displaySolution={!!isResult}
      question={question as ChoiceQuestion} state={isResult ? 'display' : 'select'}
      expandSolution={expandSolution} setExpandSolution={setExpandSolution}
      {...getterAndSetter as object}
    />}
    <Pagination
      nearPages={3}
      currentPage={currentQuestion} totalPages={totalQuestions} setPage={onQuestionChanged} />
    <HStack justifyContent='space-between' width='100%'>
      <Button colorPalette='red' onClick={onExit}>{t('panel.question.btn.exit')}</Button>
      <Button colorPalette='purple' 
        onClick={
          onPrev ? () => onPrev(currentQuestion) :
          () => currentQuestion > 1 && onQuestionChanged?.(currentQuestion - 1)
        }
      >{t('panel.question.btn.prev')}</Button>
      <Box flex={1} minWidth={0}></Box>
      <IconButton colorPalette='purple' aria-label={t('panel.question.btn.questions')}  
        onClick={() => {
          setQuestionSelect(currentQuestion);
          q.onOpen();
        }}><RxDragHandleDots2 /></IconButton>
      <Button colorPalette='purple'
        onClick={
          onNext ? () => onNext(currentQuestion) :
          () => currentQuestion < totalQuestions && onQuestionChanged?.(currentQuestion + 1)
        }
      >{t('panel.question.btn.next')}</Button>
      <Button colorPalette='teal' onClick={onSubmit}>{t('panel.question.btn.submit')}</Button>
    </HStack>
    <QuestionSelectionDialog 
      preview={questionSelect} total={totalQuestions} 
      selected={currentQuestion}
      onSelectPreview={(i) => {
        setQuestionSelect(i);
        return onPreviewQuestionChanged?.(i);
      }} onSelect={onQuestionChanged}
      {...q}
    >
      {question ? <BaseQuestionPanelWithBookmark w='100%' question={previewQuestion ?? question} /> : <></>}
    </QuestionSelectionDialog>
  </VStack>;
};