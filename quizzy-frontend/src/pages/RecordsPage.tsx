import Sheet, { Column, withSheetRow } from "@/components/common/Sheet";
import { QuizRecord } from "@quizzy/base/types";
import { ID } from "@quizzy/base/types";
import { dispDuration } from "@/utils/time";
import { QuizzyWrapped } from "@/data";
import { Button, HStack, VStack, Heading, Text, Spinner, Box, Center, Icon } from "@chakra-ui/react";
import { atom, useAtom } from "jotai";
import { DateTime } from "luxon";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiFileText } from "react-icons/fi";

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
  const { t } = useTranslation();

  const { data: records, isLoading } = useQuery({
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

  if (isLoading) {
    return (
      <VStack h="400px" justifyContent="center" alignItems="center">
        <Spinner size="xl" color="purple.500" />
        <Text color="gray.500">{t('common.loading')}</Text>
      </VStack>
    );
  }

  if (!records || records.length === 0) {
    return (
      <VStack alignItems="stretch" gap={4}>
        <Box>
          <Heading size="lg" mb={2}>{t('page.records.title')}</Heading>
          <Text color="gray.600">{t('page.records.subtitle')}</Text>
        </Box>
        <Center py={16}>
          <VStack gap={4}>
            <Icon fontSize="6xl" color="gray.300">
              <FiFileText />
            </Icon>
            <Heading size="md" color="gray.600">{t('page.records.empty.title')}</Heading>
            <Text color="gray.500">{t('page.records.empty.description')}</Text>
          </VStack>
        </Center>
      </VStack>
    );
  }

  return (
    <VStack alignItems="stretch" gap={4}>
      <Box>
        <Heading size="lg" mb={2}>{t('page.records.title')}</Heading>
        <Text color="gray.600">
          {t('page.records.subtitle')} ({records.length} {t('page.records.recordCount')})
        </Text>
      </Box>
      <Sheet 
        data={records}
        striped
        interactive
        stickyHeader
      >
        <Column 
          field='paperId' 
          header={t('page.records.table.paper')}
          render={(x) => paperNames[x] || t('common.ph.empty')} 
          mainField
        />
        <Column 
          field='startTime' 
          header={t('page.records.table.startTime')}
          render={(x: number) => DateTime.fromMillis(x || 0).toLocaleString(DateTime.DATETIME_MED)} 
        />
        <Column 
          field='timeUsed' 
          header={t('page.records.table.timeUsed')}
          render={dispDuration} 
        />
        <Column 
          field='lastQuestion' 
          header={t('page.records.table.progress')}
          render={(x) => x || 1} 
        />
        <Column header={t('page.records.table.actions')}>
          <ResumeButton refresh={refresh} />
        </Column>
      </Sheet>
    </VStack>
  );
};

export default RecordsPage;