
import Sheet, { withSheetRow, Column } from "#/components/Sheet";
import { QuizResult, ID } from "#/types";
import { Quizzy } from "@/data";
import { useAsyncEffect } from "@/utils/react";
import { Button } from "@chakra-ui/react";
import { atom, useAtom } from "jotai";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";


const resultsAtom = atom<readonly QuizResult[]>([]);

const GotoButton = withSheetRow<QuizResult>((props) => {
  const { item } = props;

  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!item) {
    return <></>;
  }
  return <Button onClick={() => {
    navigate('/result/' + item.id);
  }}>
    {t('btn.goto')}
  </Button>
});

export const ResultsPage = () => {
  const [results, setResults] = useAtom(resultsAtom);

  // refresh results
  useAsyncEffect(
    () => Quizzy.listQuizResults().then(setResults),
    []
  );

  return <Sheet data={results}>
    <Column field='paperName' />
    <Column field='startTime' />
    <Column field='timeUsed' />
    <Column field='score' />
    <Column field='total' />
    <Column>
      <GotoButton />
    </Column>
  </Sheet>

  return 'TODO';
};

export default ResultsPage;
