import Sheet, { Column, withSheetRow } from "@/components/common/Sheet";
import { QuizRecord } from "@quizzy/base/types";
import { ID } from "@quizzy/base/types";
import { dispDuration } from "@/utils/time";
import { QuizzyWrapped } from "@/data";
import { Button, HStack } from "@chakra-ui/react";
import { atom, useAtom } from "jotai";
import { DateTime } from "luxon";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type _K = {
  refresh: () => void | Promise<void>,
};

const paperNamesAtom = atom<Readonly<Record<ID, string>>>({});

const ResumeButton = withSheetRow<QuizRecord, _K>((props) => {
  const { item, refresh } = props;

  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!item) {
    return <></>;
  }

  return <HStack>
    <Button onClick={async () => {
      const params = new URLSearchParams({
        record: item.id,
        q: String(item.lastQuestion || 1),
      })
      await QuizzyWrapped.updateQuiz({
        type: 'resume',
        currentTime: Date.now(),
        id: item.id,
      });
      navigate('/quiz?' + params.toString());
    }} colorPalette='purple'>
      {t('common.btn.continue')}
    </Button>
    <Button onClick={async () => {
      await QuizzyWrapped.deleteQuizRecord(item.id);
      await refresh();
    }} colorPalette='red'>
      {t('common.btn.delete')}
    </Button>
  </HStack>
});

const getPaperNames = async (records?: QuizRecord[], current?: Record<ID, string>) => {
  if (!records) {
    return;
  }
  const papers = await QuizzyWrapped.getQuizPaperNames(...records.map(r => r.paperId ?? ''));
  const updated: Record<ID, string> = {
    ...current,
  };
  for (let i = 0; i < records.length; ++i) {
    updated[records[i].paperId ?? ''] = papers[i] || '<none>';
  }
  return updated;
};

export const RecordsPage = () => {

  const { data: records } = useQuery({
    queryKey: ['records'],
    queryFn: () => QuizzyWrapped.listQuizRecords(),
    refetchOnWindowFocus: false,
    initialData: [],
  });

  const c = useQueryClient();

  const [paperNames, setPaperNames] = useAtom(paperNamesAtom);
  const { mutate: refresh } = useMutation({
    mutationFn: async () => {
      const names = await getPaperNames(records, paperNames);
      return names;
    },
    onSuccess: (d) => {
      c.invalidateQueries({ queryKey: ['records']});
      d && setPaperNames(d);
    }
  });

  return <Sheet data={records}>
    <Column field='paperId' render={(x) => paperNames[x]} />
    <Column field='startTime' render={(x: number) => DateTime.fromMillis(x || 0).toISO()} />
    <Column field='timeUsed' render={dispDuration} />
    <Column field='lastQuestion' render={(x) => x || 1} />
    <Column>
      <ResumeButton refresh={refresh} />
    </Column>
  </Sheet>
};

export default RecordsPage;