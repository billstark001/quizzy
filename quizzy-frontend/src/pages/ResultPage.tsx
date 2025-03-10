import { QuestionDisplay } from "@/components/question-display/QuestionDisplay";
import Sheet, { Column, withSheetRow } from "@/components/common/Sheet";
import { QuizResultRecordRow } from "@quizzy/base/types";
import { ID } from "@quizzy/base/types";
import { Quizzy } from "@/data";
import { Box, Button, Separator, VStack } from "@chakra-ui/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { StatPanel } from "@/components/StatPanel";
import { useQuery } from "@tanstack/react-query";
import { DialogBody, DialogCloseTrigger, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { useDialog } from "@/utils/chakra";

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
  const { data: result } = useQuery({
    queryKey: ['result', rid],
    queryFn: () => Quizzy.getQuizResult(rid ?? ''),
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
    queryFn: () => Quizzy.getQuestion(qid ?? ''),
  });



  const [pIndex, setPIndex] = useState<number>(0);
  const previewQuestionId = result?.records?.[pIndex - 1]?.id ?? '';
  const { data: preview } = useQuery({
    queryKey: ['question', previewQuestionId],
    queryFn: () => Quizzy.getQuestion(previewQuestionId),
  });

  const totalQuestions = result?.records.length ?? 0;

  const setQIndex = (qIndex: number) => {
    setDState({ qid: result?.records?.[qIndex - 1]?.id ?? '', qIndex });
    d.open();
  };


  if (!result) {
    return <>NO RESULT</>;
  }

  const stat = result?.stat;

  return <>
    <VStack alignItems='stretch'>

      <Box>{t('page.result.paperName', { paperName })}</Box>
      <Box>{t('page.result.times', { startTime, timeUsed })}</Box>
      <Box>{t('page.result.score', { score, total, percentage: (score ?? 0) / (total ?? 1) })}</Box>

      <Separator />

      <Sheet data={result.records}>
        <Column field='name' />
        <Column field='answer' />
        <Column field='correct' />
        <Column field='status' />
        <Column field='score' />
        <Column>
          <ResultDisplayButton onClick={(x) => {
            setDState(x);
            d.open();
          }} />
        </Column>
      </Sheet>

      <Separator />
      {stat ? <StatPanel stat={stat} /> : <>NO STAT</>}

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