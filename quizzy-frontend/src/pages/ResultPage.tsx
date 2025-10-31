import { QuestionDisplay } from "@/components/question-display/QuestionDisplay";
import Sheet, { Column, withSheetRow } from "@/components/common/Sheet";
import { QuizResultRecordRow } from "@quizzy/base/types";
import { ID } from "@quizzy/base/types";
import { QuizzyWrapped } from "@/data";
import { Box, Button, Separator, VStack, Heading, Text, Spinner, Center, Icon, HStack, Card, Grid } from "@chakra-ui/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { StatPanel } from "@/components/StatPanel";
import { useQuery } from "@tanstack/react-query";
import { DialogBody, DialogCloseTrigger, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { useDialog } from "@/utils/chakra";
import { FiAlertCircle, FiCalendar, FiClock, FiAward, FiTrendingUp, FiFileText } from "react-icons/fi";
import { DateTime } from "luxon";
import { dispDuration } from "@/utils/time";

export type ResultPageParams = {
  rid: ID;
};


type _K2 = { qid: string, qIndex: number };

type _K = {
  onClick: (qid: _K2) => void,
};

const ResultDisplayButton = withSheetRow<QuizResultRecordRow, _K>((props) => {
  const { item, index, onClick } = props;
  const { t } = useTranslation();

  if (!item) {
    return <></>;
  }

  const { id } = item;

  return <Button onClick={() => onClick({ qid: id, qIndex: (index ?? 0) + 1 })}>
    {t('page.result.btn.detail')}
  </Button>;
});

export const ResultPage = () => {

  const { rid } = useParams();
  const { data: result, isLoading } = useQuery({
    queryKey: ['result', rid],
    queryFn: () => QuizzyWrapped.getQuizResult(rid ?? ''),
  });

  const { t } = useTranslation();

  const { paperName, startTime, timeUsed, score, totalScore: total } = result ?? {};

  // question view

  const d = useDialog();
  const [dState, setDState] = useState<{ qid: string, qIndex: number }>({
    qid: '',
    qIndex: 0,
  });
  const { qid, qIndex } = dState;

  const { data: question } = useQuery({
    queryKey: ['question', qid ?? ''],
    queryFn: () => QuizzyWrapped.getQuestion(qid ?? ''),
  });



  const [pIndex, setPIndex] = useState<number>(0);
  const previewQuestionId = result?.records?.[pIndex - 1]?.id ?? '';
  const { data: preview } = useQuery({
    queryKey: ['question', previewQuestionId],
    queryFn: () => QuizzyWrapped.getQuestion(previewQuestionId),
  });

  const totalQuestions = result?.records.length ?? 0;

  const setQIndex = (qIndex: number) => {
    setDState({ qid: result?.records?.[qIndex - 1]?.id ?? '', qIndex });
    d.open();
  };

  // Loading state
  if (isLoading) {
    return (
      <VStack h="400px" justifyContent="center" alignItems="center">
        <Spinner size="xl" color="purple.500" />
        <Text color="gray.500">{t('page.result.loading')}</Text>
      </VStack>
    );
  }

  // Not found state
  if (!result) {
    return (
      <Center py={16}>
        <VStack gap={4}>
          <Icon as={FiAlertCircle} fontSize="6xl" color="gray.300" />
          <Heading size="md" color="gray.600">{t('page.result.notFound')}</Heading>
        </VStack>
      </Center>
    );
  }

  const stat = result?.stat;
  const percentage = total && total > 0 ? ((score ?? 0) / total * 100).toFixed(1) : '0.0';

  return <>
    <VStack alignItems='stretch' gap={6}>
      {/* Page Header */}
      <Box>
        <Heading size="lg" mb={2}>{t('page.result.title')}</Heading>
        <Text color="gray.600">{t('page.result.subtitle')}</Text>
      </Box>

      {/* Summary Cards */}
      <Box>
        <Heading size="md" mb={4}>{t('page.result.summary.title')}</Heading>
        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4}>
          <Card.Root>
            <Card.Body>
              <VStack alignItems="flex-start" gap={2}>
                <HStack>
                  <Icon as={FiFileText} color="purple.500" />
                  <Text fontSize="sm" color="gray.600">{t('page.result.summary.paper')}</Text>
                </HStack>
                <Text fontSize="lg" fontWeight="bold">{paperName || t('common.ph.empty')}</Text>
              </VStack>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body>
              <VStack alignItems="flex-start" gap={2}>
                <HStack>
                  <Icon as={FiCalendar} color="blue.500" />
                  <Text fontSize="sm" color="gray.600">{t('page.result.summary.startTime')}</Text>
                </HStack>
                <Text fontSize="lg" fontWeight="bold">
                  {startTime ? DateTime.fromMillis(startTime).toLocaleString(DateTime.DATETIME_MED) : '-'}
                </Text>
              </VStack>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body>
              <VStack alignItems="flex-start" gap={2}>
                <HStack>
                  <Icon as={FiClock} color="orange.500" />
                  <Text fontSize="sm" color="gray.600">{t('page.result.summary.timeUsed')}</Text>
                </HStack>
                <Text fontSize="lg" fontWeight="bold">{dispDuration(timeUsed ?? 0)}</Text>
              </VStack>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body>
              <VStack alignItems="flex-start" gap={2}>
                <HStack>
                  <Icon as={FiAward} color="yellow.500" />
                  <Text fontSize="sm" color="gray.600">{t('page.result.summary.score')}</Text>
                </HStack>
                <HStack>
                  <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                    {score ?? 0} / {total ?? 0}
                  </Text>
                  <Text fontSize="lg" color="gray.500">({percentage}%)</Text>
                </HStack>
              </VStack>
            </Card.Body>
          </Card.Root>
        </Grid>
      </Box>

      <Separator />

      {/* Question Results Table */}
      <Box>
        <Heading size="md" mb={4}>{t('page.result.table.title')}</Heading>
        <Sheet 
          data={result.records}
          striped
          interactive
          stickyHeader
        >
          <Column 
            field='name' 
            header={t('page.result.table.question')}
            mainField
          />
          <Column 
            field='answer' 
            header={t('page.result.table.answer')}
          />
          <Column 
            field='correct' 
            header={t('page.result.table.correct')}
          />
          <Column 
            field='status' 
            header={t('page.result.table.status')}
          />
          <Column 
            field='score' 
            header={t('page.result.table.score')}
          />
          <Column header={t('page.result.table.actions')}>
            <ResultDisplayButton onClick={(x) => {
              setDState(x);
              d.open();
            }} />
          </Column>
        </Sheet>
      </Box>

      <Separator />
      
      {/* Statistics Section */}
      <Box>
        <HStack mb={4}>
          <Icon as={FiTrendingUp} color="purple.500" fontSize="xl" />
          <Heading size="md">{t('page.result.statistics.title')}</Heading>
        </HStack>
        {stat ? (
          <StatPanel stat={stat} />
        ) : (
          <Center py={8}>
            <Text color="gray.500">{t('page.result.statistics.noStats')}</Text>
          </Center>
        )}
      </Box>

    </VStack>

    <d.Root size='xl' closeOnInteractOutside={false}>

      <DialogContent my={5}>
        <DialogHeader>{t('page.result.dialog.question.header')}</DialogHeader>
        <DialogCloseTrigger />
        <DialogBody pb={5}>
          <QuestionDisplay isResult
            question={question}
            answers={result.answers[qid ?? '']}
            currentQuestion={qIndex}
            totalQuestions={totalQuestions}
            previewQuestion={preview}
            onPreviewQuestionChanged={setPIndex}
            onQuestionChanged={setQIndex}
            onExit={() => d.submit(undefined)}
            panelStyle={<VStack maxH='70vh' />}
          />
        </DialogBody>
      </DialogContent>
    </d.Root>

  </>;

};

export default ResultPage;