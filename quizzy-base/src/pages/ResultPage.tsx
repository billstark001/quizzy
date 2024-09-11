import Sheet, { Column } from "#/components/Sheet";
import { ID, QuizResult } from "#/types";
import { Quizzy } from "@/data";
import { useAsyncEffect } from "@/utils/react";
import { Box, VStack } from "@chakra-ui/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

export type ResultPageParams = {
  rid: ID;
};

export const ResultPage = () => {

  const { rid } = useParams();
  const [result, setResult] = useState<QuizResult>();

  useAsyncEffect(async () => {
    const r = await Quizzy.getQuizResult(rid ?? '');
    setResult(r || undefined);
  }, [rid]);

  const { t } = useTranslation();

  if (!result) {
    return <>NO RESULT</>;
  }

  const { paperName, startTime, timeUsed, score, total } = result;

  return <VStack alignItems='flex-start'>

    <Box>{t('page.result.paperName', { paperName })}</Box>
    <Box>{t('page.result.times', { startTime, timeUsed })}</Box>
    <Box>{t('page.result.score', { score, total, percentage: score / total })}</Box>

    <Sheet data={result.records}>
      <Column field='name' />
      <Column field='answer' />
      <Column field='correct' />
      <Column field='score' />
      <Column field='weight' />
    </Sheet>

  </VStack>;

};

export default ResultPage;