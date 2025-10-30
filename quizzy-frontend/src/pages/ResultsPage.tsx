
import Sheet, { withSheetRow, Column } from "@/components/common/Sheet";
import { QuizResult, Stat } from "@quizzy/base/types";
import { dispDuration } from "@/utils/time";
import { QuizzyWrapped } from "@/data";
import { Button, Separator, HStack, VStack, Checkbox, Heading, Text, Spinner, Box, Center, Icon } from "@chakra-ui/react";
import { DateTime } from "luxon";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useSelection } from "@/utils/react";
import { useCallback } from "react";
import { openDialog } from "@/components/handler";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FiCheckCircle } from "react-icons/fi";

type _K = {
  refresh: () => void | Promise<void>,
};
const GotoButton = withSheetRow<QuizResult, _K>((props) => {
  const { item, refresh } = props;

  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!item) {
    return <></>;
  }
  return <HStack>
    <Button onClick={() => {
      navigate('/result/' + item.id);
    }} colorPalette="purple">
      {t('common.btn.view')}
    </Button>
    <Button onClick={async () => {
      await QuizzyWrapped.deleteQuizResult(item.id);
      await refresh();
    }} colorPalette='red'>
      {t('common.btn.delete')}
    </Button>
  </HStack>;
});

const Selector = withSheetRow<QuizResult, Omit<Checkbox.RootProps, 'checked' | 'onCheckedChange'> & {
  setSelected: (id: string, selected?: boolean) => void;
  isSelected: (id: string) => boolean;
}>((props) => {
  const { item, isSelected, setSelected, index: _, isHeader: __, ...other } = props;
  const selected = item ? isSelected(item.id) : false;
  
  return (
    <Checkbox.Root 
      checked={selected}
      onCheckedChange={(e) => item && setSelected(item.id, !!e.checked)}
      disabled={!item}
      {...other}
    >
      <Checkbox.HiddenInput />
      <Checkbox.Control>
        <Checkbox.Indicator />
      </Checkbox.Control>
    </Checkbox.Root>
  );
});

export const ResultsPage = () => {
  const { t } = useTranslation();

  const { data: results, isLoading } = useQuery({
    queryKey: ['results'],
    queryFn: () => QuizzyWrapped.listQuizResults(),
    initialData: [],
    refetchOnWindowFocus: false,
  });

  const c = useQueryClient();

  const s = useSelection();

  // stats

  const navigate = useNavigate();

  const refreshStats = useCallback(async (ids: string[]) => {
    const promises = ids.map((id) => QuizzyWrapped.generateStats(id))
    const ret = await Promise.all(promises);
    return ret;
  }, []);

  const generateStats = useCallback(async (ids: string[]) => {
    const ret = await QuizzyWrapped.generateStats(...ids);
    if (!ret) {
      return;
    }
    if ((ret as Stat).id) {
      const doNavigate = await openDialog(
        <>{t('page.results.statGenComplete')}</>,
        'ok-cancel', 'stat-gen'
      );
      if (doNavigate) {
        navigate(`/stat/${(ret as Stat).id}`);
      }
    }
  }, [navigate, t]);

  if (isLoading) {
    return (
      <VStack h="400px" justifyContent="center" alignItems="center">
        <Spinner size="xl" color="purple.500" />
        <Text color="gray.500">{t('common.loading')}</Text>
      </VStack>
    );
  }

  if (!results || results.length === 0) {
    return (
      <VStack alignItems="stretch" gap={4}>
        <Box>
          <Heading size="lg" mb={2}>{t('page.results.title')}</Heading>
          <Text color="gray.600">{t('page.results.subtitle')}</Text>
        </Box>
        <Center py={16}>
          <VStack gap={4}>
            <Icon fontSize="6xl" color="gray.300">
              <FiCheckCircle />
            </Icon>
            <Heading size="md" color="gray.600">{t('page.results.empty.title')}</Heading>
            <Text color="gray.500">{t('page.results.empty.description')}</Text>
          </VStack>
        </Center>
      </VStack>
    );
  }

  return <VStack alignItems='stretch' gap={4}>
    <Box>
      <Heading size="lg" mb={2}>{t('page.results.title')}</Heading>
      <Text color="gray.600">
        {t('page.results.subtitle')} ({results.length} {t('page.results.resultCount')})
      </Text>
    </Box>
    <HStack wrap="wrap">
      <Button 
        disabled={!s.isAnySelected} 
        onClick={() => refreshStats(s.getAllSelected())}
        colorPalette="purple"
        variant="outline"
        size="sm"
      >
        {t('page.results.btn.refreshStats')}
      </Button>
      <Button 
        disabled={!s.isAnySelected} 
        onClick={() => generateStats(s.getAllSelected())}
        colorPalette="purple"
        size="sm"
      >
        {t('page.results.btn.createStats')}
      </Button>
      {s.isAnySelected && (
        <Text fontSize="sm" color="gray.600">
          {t('page.results.selectedCount', { count: s.getAllSelected().length })}
        </Text>
      )}
    </HStack>
    <Separator />
    <Sheet 
      data={results}
      striped
      interactive
      stickyHeader
    >
      <Column header={t('page.results.table.select')}>
        <Selector setSelected={s.setSelected} isSelected={s.isSelected} />
      </Column>
      <Column 
        field='paperName' 
        header={t('page.results.table.paper')}
        mainField
      />
      <Column 
        field='startTime' 
        header={t('page.results.table.startTime')}
        render={(x: number) => DateTime.fromMillis(x || 0).toLocaleString(DateTime.DATETIME_MED)} 
      />
      <Column 
        field='timeUsed' 
        header={t('page.results.table.timeUsed')}
        render={dispDuration} 
      />
      <Column 
        field='score' 
        header={t('page.results.table.score')}
        render={(score, item) => `${score} / ${item.totalScore}`}
      />
      <Column 
        field='totalScore' 
        header={t('page.results.table.percentage')}
        render={(total, item) => `${((item.score / total) * 100).toFixed(1)}%`}
      />
      <Column header={t('page.results.table.actions')}>
        <GotoButton refresh={() => c.invalidateQueries({ queryKey: ['results'] })} />
      </Column>
    </Sheet>
  </VStack>

};

export default ResultsPage;
