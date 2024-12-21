import { QuestionDisplay } from "#/components/QuestionDisplay";
import Sheet, { Column, withSheetRow } from "#/components/Sheet";
import { Question, QuizResult, QuizResultRecordRow } from "#/types";
import { ID } from "#/types/technical";
import { useDisclosureWithData } from "#/utils/disclosure";
import { Quizzy } from "@/data";
import { useAsyncEffect } from "#/utils/react-async";
import { Box, Button, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, VStack } from "@chakra-ui/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

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
  const [result, setResult] = useState<QuizResult>();

  useAsyncEffect(async () => {
    const r = await Quizzy.getQuizResult(rid ?? '');
    setResult(r || undefined);
  }, [rid]);

  const { t } = useTranslation();


  const { paperName, startTime, timeUsed, score, totalScore: total } = result ?? {};

  // question view

  const d = useDisclosureWithData<{ qid: string, qIndex: number }>({
    qid: '', 
    qIndex: 0,
  });
  const { data, onOpen, onClose } = d;
  const { qid, qIndex } = data;

  const [question, setQuestion] = useState<Question>();
  const [pIndex, setPIndex] = useState<number>(0);
  const [preview, setPreview] = useState<Question>();

  const totalQuestions = result?.records.length ?? 0;

  // hooks to update
  useAsyncEffect(() => Quizzy.getQuestions([qid ?? ''])
    .then(q => q.length && setQuestion(q[0])), [qid]);
  useAsyncEffect(() => Quizzy.getQuestions([result?.records?.[pIndex - 1]?.id ?? ''])
    .then(q => q.length && setPreview(q[0])), [result, pIndex]);
  
  const setQIndex = (qIndex: number) => {
    return onOpen({ qid: result?.records?.[qIndex - 1]?.id ?? '', qIndex });
  };


  if (!result) {
    return <>NO RESULT</>;
  }

  return <>
    <VStack alignItems='flex-start'>

      <Box>{t('page.result.paperName', { paperName })}</Box>
      <Box>{t('page.result.times', { startTime, timeUsed })}</Box>
      <Box>{t('page.result.score', { score, total, percentage: (score ?? 0) / (total ?? 1) })}</Box>

      <Sheet data={result.records}>
        <Column field='name' />
        <Column field='answer' />
        <Column field='correct' />
        <Column field='status' />
        <Column field='score' />
        <Column>
          <ResultDisplayButton onClick={onOpen} />
        </Column>
      </Sheet>

    </VStack>

    <Modal {...d} size='6xl' closeOnOverlayClick={false}>

      <ModalOverlay />
      <ModalContent my={5}>
        <ModalHeader>{t('page.result.modal.header')}</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={5}>
          <QuestionDisplay isResult
            question={question}
            answers={result.answers[qid ?? '']}
            currentQuestion={qIndex}
            totalQuestions={totalQuestions}
            previewQuestion={preview}
            onPreviewQuestionChanged={setPIndex}
            onQuestionChanged={setQIndex}
            onExit={onClose}
            panelStyle={<VStack maxH='70vh' />}
          />
        </ModalBody>
      </ModalContent>
    </Modal>

  </>;

};

export default ResultPage;