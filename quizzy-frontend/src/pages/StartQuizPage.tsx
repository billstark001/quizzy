import { PaperCard } from "@/components/PaperCard";
import { useSelection } from "@/utils/react";
import { Quizzy } from "@/data";
import { usePapers } from "@/data/papers";
import {
  Button,
  HStack,
  Tabs,
  useCallbackRef,
  VStack,
  Wrap,
} from "@chakra-ui/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";


export const StartQuizPage = () => {

  const { t } = useTranslation();

  // selections
  const sPapers = useSelection();
  const sTags = useSelection();
  const sCategories = useSelection();

  const selectionByTab = [sPapers, sTags, sCategories];


  const [tabIndex, setTabIndex] = useState(0);
  const onTabIndexChange = useCallbackRef((i: number) => {
    setTabIndex(i);
    selectionByTab[i]?.setSelectedRecord({});
  });

  const { value: papers, start, startRandom, navigate } = usePapers();

  const startRandom2 = async (ids: string[], isTag?: boolean) => {
    const ids2 = Object.fromEntries(ids.map(x => [x, 1]));
    const record = await Quizzy.startQuiz(isTag
      ? { type: 'random-tag', tags: ids2 }
      : { type: 'random-category', categories: ids2 }
    );
    const p = new URLSearchParams({
      record: record.id,
      q: '1',
    });
    navigate('/quiz?' + p.toString());
  };

  const startRandomWithTab = async (ids: string[]) => {
    if (tabIndex === 0) {
      return await startRandom(ids);
    }
    return await startRandom2(ids, tabIndex === 1);
  };

  // global
  const startRandomDisabled = !selectionByTab[tabIndex]?.isAnySelected;

  const tabs = <Tabs.Root variant='enclosed' onValueChange={(e) => onTabIndexChange(Number(e.value))}>
    <Tabs.List>
      <Tabs.Trigger value="0">{t('dialog.startQuiz.tab.paper')}</Tabs.Trigger>
      <Tabs.Trigger value="1">{t('dialog.startQuiz.tab.tag')}</Tabs.Trigger>
      <Tabs.Trigger value="2">{t('dialog.startQuiz.tab.category')}</Tabs.Trigger>
    </Tabs.List>

    <Tabs.Content value="0">
      <VStack alignItems='stretch'>
        <Wrap>
          {papers.map(p => <PaperCard
            key={p.id}
            paper={p}
            selected={sPapers.isSelected(p.id)}
            onSelect={(s) => sPapers.setSelected(p.id, s)}
            onStart={() => start(p.id)}
          />)}
        </Wrap>
      </VStack>
    </Tabs.Content>

    <Tabs.Content value="1">
      TODO
    </Tabs.Content>

    <Tabs.Content value="2">
      TODO
    </Tabs.Content>
  </Tabs.Root>;

  return <VStack alignItems='stretch'>
    {tabs}
    <HStack>
      <Button
        colorPalette="purple" disabled={startRandomDisabled}
        onClick={() => startRandomWithTab(selectionByTab[tabIndex].getAllSelected())}
      >
        {t('dialog.startQuiz.btn.startRandom')}
      </Button>
    </HStack>
  </VStack>;
};

export default StartQuizPage;