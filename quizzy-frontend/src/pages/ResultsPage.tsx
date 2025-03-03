
import Sheet, { withSheetRow, Column } from "@/components/common/Sheet";
import { QuizResult, Stat } from "@quizzy/base/types";
import { dispDuration } from "@/utils/time";
import { Quizzy } from "@/data";
import { Button, Checkbox, CheckboxProps, Divider, HStack, VStack } from "@chakra-ui/react";
import { DateTime } from "luxon";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useSelection } from "@/utils/react";
import { useCallback } from "react";
import { openDialog } from "@/components/handler";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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
    }} colorScheme="purple">
      {t('common.btn.view')}
    </Button>
    <Button onClick={async () => {
      await Quizzy.deleteQuizResult(item.id);
      await refresh();
    }} colorScheme='red'>
      {t('common.btn.delete')}
    </Button>
  </HStack>;
});

const Selector = withSheetRow<QuizResult, CheckboxProps & {
  setSelected: (id: string, selected?: boolean) => void;
  isSelected: (id: string) => boolean;
}>((props) => {
  const { item, isSelected, setSelected, index: _, isHeader: __, ...other } = props;
  const selected = item ? isSelected(item.id) : false;
  return <Checkbox
    isChecked={selected}
    onChange={item ? (e) => setSelected(item.id, e.target.checked) : undefined}
    isDisabled={!item}
    {...other} />;
});


export const ResultsPage = () => {

  const { data: results } = useQuery({
    queryKey: ['results'],
    queryFn: () => Quizzy.listQuizResults(),
    initialData: [],
    refetchOnWindowFocus: false,
  });

  const c = useQueryClient();

  const s = useSelection();

  // stats

  const navigate = useNavigate();

  const refreshStats = useCallback(async (ids: string[]) => {
    const promises = ids.map((id) => Quizzy.generateStats(id))
    const ret = await Promise.all(promises);
    return ret;
  }, []);

  const generateStats = useCallback(async (ids: string[]) => {
    const ret = await Quizzy.generateStats(...ids);
    if (!ret) {
      return;
    }
    if ((ret as Stat).id) {
      const doNavigate = await openDialog(
        <>stat generation complete. goto?</>,
        'ok-cancel', 'stat-gen'
      );
      if (doNavigate) {
        navigate(`/stat/${(ret as Stat).id}`);
      }
    }
  }, [navigate]);

  return <VStack alignItems='stretch'>
    <HStack>
      <Button isDisabled={!s.isAnySelected} onClick={() => refreshStats(s.getAllSelected())}>refresh stat</Button>
      <Button isDisabled={!s.isAnySelected} onClick={() => generateStats(s.getAllSelected())}>create stat</Button>
    </HStack>
    <Divider />
    <Sheet data={results}>
      <Column>
        <Selector setSelected={s.setSelected} isSelected={s.isSelected} />
      </Column>
      <Column field='paperName' />
      <Column field='startTime' render={(x: number) => DateTime.fromMillis(x || 0).toISO()} />
      <Column field='timeUsed' render={dispDuration} />
      <Column field='score' />
      <Column field='totalScore' />
      <Column>
        <GotoButton refresh={() => c.invalidateQueries({ queryKey: ['results'] })} />
      </Column>
    </Sheet>
  </VStack>

};

export default ResultsPage;
