
import Sheet, { withSheetRow, Column } from "#/components/Sheet";
import { QuizResult, ID } from "#/types";
import { Quizzy } from "@/data";
import { useAsyncEffect } from "@/utils/react";
import { Button } from "@chakra-ui/react";
import { atom, useAtom } from "jotai";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";


const resultsAtom = atom<readonly QuizResult[]>([]);
const paperNamesAtom = atom<Readonly<Record<ID, string>>>({});

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
  const [paperNames, setPaperNames] = useAtom(paperNamesAtom);

  // refresh results
  useAsyncEffect(
    () => Quizzy.listQuizResults().then(setResults),
    []
  );

  // fetch paper names
  useAsyncEffect(async () => {
    if (!results) {
      return;
    }
    const papers = await Quizzy.getQuizPaperNames(...results.map(r => r.paperId));
    const record: Record<ID, string> = {
      ...paperNames,
    };
    for (let i = 0; i < results.length; ++i) {
      record[results[i].paperId] = papers[i] || '<none>';
    }
    setPaperNames(record);
  }, [results]);

  return <Sheet data={results}>
    <Column field='paperId' render={(x) => paperNames[x]} />
    <Column field='startTime' />
    <Column field='timeUsed' />
    <Column>
      <GotoButton />
    </Column>
  </Sheet>

  return 'TODO';
};

export default ResultsPage;
