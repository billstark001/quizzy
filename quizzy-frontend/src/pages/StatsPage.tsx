
import Sheet, { withSheetRow, Column } from "@/components/common/Sheet";
import { Stat, StatUnit, stringifyUnit } from "@quizzy/base/types";
import { QuizzyWrapped } from "@/data";
import { Button, HStack, VStack, Heading, Text, Spinner, Box, Center, Icon } from "@chakra-ui/react";
import { DateTime } from "luxon";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FiBarChart2 } from "react-icons/fi";

type _K = {
  refresh: () => void | Promise<void>,
};
const GotoButton = withSheetRow<Stat, _K>((props) => {
  const { item, refresh } = props;

  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!item) {
    return <></>;
  }
  return <HStack>
    <Button onClick={() => {
      navigate('/stat/' + item.id);
    }} colorPalette="purple">
      {t('common.btn.view')}
    </Button>
    <Button onClick={async () => {
      await QuizzyWrapped.deleteStat(item.id);
      await refresh();
    }} colorPalette='red'>
      {t('common.btn.delete')}
    </Button>
  </HStack>;
});

export const StatsPage = () => {
  const { t } = useTranslation();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: () => QuizzyWrapped.listStats(),
    initialData: [],
    refetchOnWindowFocus: false,
  });

  const c = useQueryClient();

  if (isLoading) {
    return (
      <VStack h="400px" justifyContent="center" alignItems="center">
        <Spinner size="xl" color="purple.500" />
        <Text color="gray.500">{t('common.loading')}</Text>
      </VStack>
    );
  }

  if (!stats || stats.length === 0) {
    return (
      <VStack alignItems="stretch" gap={4}>
        <Box>
          <Heading size="lg" mb={2}>{t('page.stats.title')}</Heading>
          <Text color="gray.600">{t('page.stats.subtitle')}</Text>
        </Box>
        <Center py={16}>
          <VStack gap={4}>
            <Icon as={FiBarChart2} fontSize="6xl" color="gray.300" />
            <Heading size="md" color="gray.600">{t('page.stats.empty.title')}</Heading>
            <Text color="gray.500">{t('page.stats.empty.description')}</Text>
          </VStack>
        </Center>
      </VStack>
    );
  }

  return (
    <VStack alignItems="stretch" gap={4}>
      <Box>
        <Heading size="lg" mb={2}>{t('page.stats.title')}</Heading>
        <Text color="gray.600">
          {t('page.stats.subtitle')} ({stats.length} {t('page.stats.statCount')})
        </Text>
      </Box>
      <Sheet 
        data={stats}
        striped
        interactive
        stickyHeader
      >
        <Column 
          field='time' 
          header={t('page.stats.table.time')}
          render={(x: number) => DateTime.fromMillis(x || 0).toLocaleString(DateTime.DATETIME_MED)} 
          mainField
        />
        <Column 
          field='grossCount' 
          header={t('page.stats.table.count')}
          render={(x: StatUnit) => stringifyUnit(x)} 
        />
        <Column 
          field='grossScore' 
          header={t('page.stats.table.score')}
          render={(x: StatUnit) => stringifyUnit(x)} 
        />
        <Column 
          field='grossPercentage' 
          header={t('page.stats.table.percentage')}
          render={(x: StatUnit) => stringifyUnit(x, true)} 
        />
        <Column header={t('page.stats.table.actions')}>
          <GotoButton refresh={() => c.invalidateQueries({ queryKey: ['stats'] })} />
        </Column>
      </Sheet>
    </VStack>
  );

};

export default StatsPage;
