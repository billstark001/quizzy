import { PaperCard } from "@/components/PaperCard";
import { TagListResult } from "@quizzy/common/types";
import { useSelection } from "@/utils/react";
import { useAsyncMemo } from "@/utils/react-async";
import { Quizzy } from "@/data";
import { usePapers } from "@/data/atoms";
import {
  Button,
  HStack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tag,
  useCallbackRef,
  VStack,
  Wrap,
} from "@chakra-ui/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";


const defaultTagListResult = (): TagListResult => ({
  questionCategories: [],
  questionTags: [],
  paperCategories: [],
  paperTags: [],
});

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

  // tab 0

  // tab 1 & 2
  const { data: tagListResult } = useAsyncMemo(
    () => Quizzy.listTags().then(x => x ?? defaultTagListResult()),
    [],
  );
  const getRenderedTags = (t?: string[], isTag = true, isPaper = false) => t?.map(x => <Tag
    key={x} cursor='pointer' onClick={() => (isTag ? sTags : sCategories).toggleSelected(x)}
    colorScheme={(isTag ? sTags : sCategories).isSelected(x) ? 'blue' : undefined}
    border={isPaper ? '1px solid gray' : undefined}
    transition='all 0.3s ease'
    userSelect='none'
  >{x}</Tag>);

  // global
  const startRandomDisabled = !selectionByTab[tabIndex]?.isAnySelected;

  const tabs = <Tabs variant='enclosed' onChange={onTabIndexChange}>
    <TabList>
      <Tab>{t('modal.startQuiz.tab.paper')}</Tab>
      <Tab>{t('modal.startQuiz.tab.tag')}</Tab>
      <Tab>{t('modal.startQuiz.tab.category')}</Tab>
    </TabList>

    <TabPanels>
      <TabPanel as={VStack} alignItems='stretch'>
        <Wrap>
          {papers.map(p => <PaperCard
            key={p.id}
            paper={p}
            selected={sPapers.isSelected(p.id)}
            onSelect={(s) => sPapers.setSelected(p.id, s)}
            onStart={() => start(p.id)}
          />)}
        </Wrap>
      </TabPanel>
      <TabPanel>
        <Wrap>
          {getRenderedTags(tagListResult?.paperTags, true, true)}
          {getRenderedTags(tagListResult?.questionTags)}
        </Wrap>
      </TabPanel>
      <TabPanel>
        <Wrap>
          {getRenderedTags(tagListResult?.paperCategories, false, true)}
          {getRenderedTags(tagListResult?.questionCategories, false)}
        </Wrap>
      </TabPanel>
    </TabPanels>
  </Tabs>;

  return <VStack alignItems='stretch'>
    {tabs}
    <HStack>
      <Button
        colorScheme="blue" isDisabled={startRandomDisabled}
        onClick={() => startRandomWithTab(selectionByTab[tabIndex].getAllSelected())}
      >
        {t('modal.startQuiz.btn.startRandom')}
      </Button>
    </HStack>
  </VStack>;
};

export default StartQuizPage;