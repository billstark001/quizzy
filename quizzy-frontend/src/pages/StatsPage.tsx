
import Sheet, { withSheetRow, Column } from "@/components/Sheet";
import { Stat, StatUnit, stringifyUnit } from "@quizzy/common/types";
import { Quizzy } from "@/data";
import { useAsyncEffect } from "@/utils/react-async";
import { Button, HStack } from "@chakra-ui/react";
import { atom, useAtom } from "jotai";
import { DateTime } from "luxon";
import { useTranslation } from "../../node_modules/react-i18next";
import { useNavigate } from "react-router-dom";

const statsAtom = atom<readonly Stat[]>([]);

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
    }} colorScheme="blue">
      {t('btn.goto')}
    </Button>
    <Button onClick={async () => {
      await Quizzy.deleteStat(item.id);
      await refresh();
    }} colorScheme='red'>
      {t('btn.delete')}
    </Button>
  </HStack>;
});

export const StatsPage = () => {
  const [stats, setStats] = useAtom(statsAtom);

  // refresh stats
  const refresh = () => Quizzy.listStats().then(setStats);
  useAsyncEffect(refresh, []);

  return <Sheet data={stats}>
    <Column field='time' render={(x: number) => DateTime.fromMillis(x || 0).toISO()} />
    <Column field='grossCount' render={(x: StatUnit) => stringifyUnit(x)} />
    <Column field='grossScore' render={(x: StatUnit) => stringifyUnit(x)} />
    <Column field='grossPercentage' render={(x: StatUnit) => stringifyUnit(x, true)} />
    <Column>
      <GotoButton refresh={refresh} />
    </Column>
  </Sheet>

};

export default StatsPage;
