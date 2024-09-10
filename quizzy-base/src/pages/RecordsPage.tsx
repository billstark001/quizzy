import Sheet, { Column, withSheetRow } from "#/components/Sheet";
import { ID, QuizRecord } from "#/types";
import { Quizzy } from "@/data";
import { useAsyncEffect } from "@/utils/react";
import { Button, HStack } from "@chakra-ui/react";
import { atom, useAtom } from "jotai";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";


const recordsAtom = atom<readonly QuizRecord[]>([]);
const paperNamesAtom = atom<Readonly<Record<ID, string>>>({});

type _K = {
  refresh: () => void | Promise<void>,
};
const ResumeButton = withSheetRow<QuizRecord, _K>((props) => {
  const { item, refresh } = props;

  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!item) {
    return <></>;
  }
  
  return <HStack>
    <Button onClick={() => {
      const params = new URLSearchParams({
        record: item.id,
        q: String(item.lastQuestion || 1),
      })
      navigate('/quiz?' + params.toString());
    }} colorScheme='blue'>
      {t('btn.continue')}
    </Button>
    <Button onClick={async () => {
      await Quizzy.deleteQuizRecord(item.id);
      await refresh();
    }} colorScheme='red'>
      {t('btn.delete')}
    </Button>
  </HStack>
});

export const RecordsPage = () => {
  
  const [records, setRecords] = useAtom(recordsAtom);
  const [paperNames, setPaperNames] = useAtom(paperNamesAtom);

  // refresh records
  const refresh = () => Quizzy.listQuizRecords().then(setRecords);
  useAsyncEffect(refresh, []);

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
      <ResumeButton refresh={refresh}/>
    </Column>
  </Sheet>
};

export default RecordsPage;