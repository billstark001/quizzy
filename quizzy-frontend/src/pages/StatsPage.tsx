
import Sheet, { withSheetRow, Column } from "@/components/common/Sheet";
import { Stat, StatUnit, stringifyUnit } from "@quizzy/base/types";
import { QuizzyWrapped } from "@/data";
import { Button, HStack } from "@chakra-ui/react";
import { DateTime } from "luxon";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: () => QuizzyWrapped.listStats(),
    initialData: [],
    refetchOnWindowFocus: false,
  });

  const c = useQueryClient();

  return <Sheet data={stats}>
    <Column field='time' render={(x: number) => DateTime.fromMillis(x || 0).toISO()} />
    <Column field='grossCount' render={(x: StatUnit) => stringifyUnit(x)} />
    <Column field='grossScore' render={(x: StatUnit) => stringifyUnit(x)} />
    <Column field='grossPercentage' render={(x: StatUnit) => stringifyUnit(x, true)} />
    <Column>
      <GotoButton refresh={() => c.invalidateQueries({ queryKey: ['stats'] })} />
    </Column>
  </Sheet>

};

export default StatsPage;
