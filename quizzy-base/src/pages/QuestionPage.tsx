import Pagination from "#/components/Pagination";
import { BaseQuestionPanel, BlankQuestionPanelProps, ChoiceQuestionPanelProps, QuestionPanel, QuestionPanelProps, TextQuestionPanelProps } from "#/components/QuestionPanel";
import { ChoiceQuestion, ID, Question } from "#/types";
import { formatMilliseconds } from "#/utils";
import { QuestionSelectionModal } from "@/components/QuestionSelectionModal";
import { DragHandleIcon } from "@chakra-ui/icons";
import { Box, Button, HStack, IconButton, Progress, useDisclosure, VStack } from "@chakra-ui/react";
import { ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";


export type QuestionPageProps = {
  question: Question,
  currentQuestion: number,
  totalQuestions: number,
  onQuestionChanged?: (num: number) => void | Promise<void>,

  // exam state
  examTitle?: ReactNode,
  currentTime?: number, // in milliseconds
  totalTime?: number, // in milliseconds
}

export const TextQuestionSymbol = Symbol('TextQuestion');

export const QuestionPage = (props: QuestionPageProps) => {
  const {
    question,
    currentQuestion,
    totalQuestions,
    onQuestionChanged,

    examTitle,
    currentTime,
    totalTime,
  } = props;

  const [expandSolution, setExpandSolution] = useState(false);
  const [answers, setAnswers] = useState<Record<ID | symbol, string>>({});

  const hasCurrentTime = currentTime != null;
  const hasTotalTime = totalTime != null;
  const hasBoth = hasCurrentTime && hasTotalTime;
  const hasEither = hasCurrentTime || hasTotalTime;
  const timeRatio = hasBoth
    ? currentTime / totalTime
    : -1;
  

  const choice: Partial<ChoiceQuestionPanelProps> = {
    get(id) {
      return !!answers[id];
    },
    set(id, set) {
      setAnswers((a) => ({ ...a, [id]: set ? '1' : '' }));
    },
  };

  const blank: Partial<BlankQuestionPanelProps> = {
    get(id) {
      return answers[id];
    },
    set(id, set) {
      setAnswers((a) => ({ ...a, [id]: set }));
    },
  };

  const text: Partial<TextQuestionPanelProps> = {
    get() {
      return answers[TextQuestionSymbol];
    },
    set(set) {
      setAnswers((a) => ({ ...a, [TextQuestionSymbol]: set }));
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
      question={question as ChoiceQuestion} state='select'
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
        onClick={q.onOpen} />
      <Button colorScheme='blue'>{t('page.question.next')}</Button>
      <Button colorScheme='teal'>{t('page.question.stop')}</Button>
    </HStack>
    <QuestionSelectionModal index={currentQuestion} total={totalQuestions} setIndex={onQuestionChanged} {...q}
      question={<BaseQuestionPanel w='100%' question={question} />}
    />
  </VStack>;
};