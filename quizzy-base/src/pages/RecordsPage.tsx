import Sheet, { Column, withSheetRow } from "#/components/Sheet";
import { ID, QuizRecord } from "#/types";
import { Quizzy } from "@/data";
import { useAsyncEffect } from "@/utils/react";
import { Button } from "@chakra-ui/react";
import { atom, useAtom } from "jotai";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";


const recordsAtom = atom<readonly QuizRecord[]>([]);
const paperNamesAtom = atom<Readonly<Record<ID, string>>>({});

const ResumeButton = withSheetRow<QuizRecord>((props) => {
  const { item } = props;

  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!item) {
    return <></>;
  }
  return <Button onClick={() => {
    const params = new URLSearchParams({
      record: item.id,
      q: String(item.lastQuestion || 1),
    })
    navigate('/quiz?' + params.toString());
  }}>
    {t('btn.continue')}
  </Button>
});

export const RecordsPage = () => {
  
  const [records, setRecords] = useAtom(recordsAtom);
  const [paperNames, setPaperNames] = useAtom(paperNamesAtom);

  // refresh records
  useAsyncEffect(
    () => Quizzy.listQuizRecords().then(setRecords),
    []
  );

  // fetch paper names
  useAsyncEffect(async () => {
    if (!records) {
      return;
    }
    const papers = await Quizzy.getQuizPaperNames(...records.map(r => r.paperId));
    const record: Record<ID, string> = {
      ...paperNames,
    };
    for (let i = 0; i < records.length; ++i) {
      record[records[i].paperId] = papers[i] || '<none>';
    }
    setPaperNames(record);
  }, [records]);

  return <Sheet data={records}>
    <Column field='paperId' render={(x) => paperNames[x]} />
    <Column field='startTime' />
    <Column field='timeUsed' />
    <Column field='lastQuestion' render={(x) => x || 1}/>
    <Column>
      <ResumeButton />
    </Column>
  </Sheet>
};

export default RecordsPage;