import { PaperCard } from "@/components/PaperCard";
import { useSelection } from "@/utils/react";
import { Quizzy } from "@/data";
import { usePapers } from "@/data/papers";
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
import useTags from "@/data/tags";

type _S = {
  sTagsIsSelected: (id: string) => boolean;
  sTagsToggleSelected: (id: string) => void;
  sCategoriesIsSelected: (id: string) => boolean;
  sCategoriesToggleSelected: (id: string) => void;
};

const RenderedTags = (props: {
  t?: string[],
  isTag?: boolean,
  isPaper?: boolean,
} & _S) => {
  const { 
    t, isTag = true, isPaper = false,
    sTagsIsSelected, sTagsToggleSelected,
    sCategoriesIsSelected, sCategoriesToggleSelected,
  } = props;
  // TODO this is too slow
  return <>
    {t?.map(x => <Tag
      key={x} cursor='pointer' 
      onClick={() => (isTag ? sTagsToggleSelected : sCategoriesToggleSelected)(x)}
      colorScheme={(isTag ? sTagsIsSelected : sCategoriesIsSelected)(x) ? 'purple' : undefined}
      border={isPaper ? '1px solid gray' : undefined}
      transition='all 0.3s ease'
      userSelect='none'
    >{x}</Tag>)}
  </>;
};

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
  const tags = useTags();

  const _s = {
    sTagsIsSelected: sTags.isSelected,
    sTagsToggleSelected: sTags.toggleSelected,
    sCategoriesIsSelected: sCategories.isSelected,
    sCategoriesToggleSelected: sCategories.toggleSelected,
  };


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
          <RenderedTags t={tags.tempTagList.paperTags} isPaper={true} {..._s} />
          <RenderedTags t={tags.tempTagList.questionTags} {..._s} />
        </Wrap>
      </TabPanel>
      <TabPanel>
        <Wrap>
          <RenderedTags t={tags.tempTagList.paperCategories} isPaper={true} isTag={false} {..._s} />
          <RenderedTags t={tags.tempTagList.questionCategories} isTag={false} {..._s} />
        </Wrap>
      </TabPanel>
    </TabPanels>
  </Tabs>;

  return <VStack alignItems='stretch'>
    {tabs}
    <HStack>
      <Button
        colorScheme="purple" isDisabled={startRandomDisabled}
        onClick={() => startRandomWithTab(selectionByTab[tabIndex].getAllSelected())}
      >
        {t('modal.startQuiz.btn.startRandom')}
      </Button>
    </HStack>
  </VStack>;
};

export default StartQuizPage;