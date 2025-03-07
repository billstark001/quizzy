import useTags from "@/data/tags";
import { useSelection } from "@/utils/react";
import { Box, Button, useColorMode, Wrap } from "@chakra-ui/react";
import { Tag as TagType } from "@quizzy/base/types";
import { useTranslation } from "react-i18next";

type _S = {
  isSelected: (id: string) => boolean;
  toggleSelected: (id: string) => void;
};

const RenderedTags = (props: {
  tags?: TagType[],
} & _S) => {
  const {
    tags,
    isSelected,
    toggleSelected,
  } = props;

  const { i18n } = useTranslation();
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const ret = <Wrap>
    {tags?.map(t => <Box
      key={t.id} 
      onClick={() => toggleSelected(t.id)}
      backgroundColor={isDark
        ? (isSelected(t.id) ? 'purple.700' : 'gray.700')
        : (isSelected(t.id) ? 'purple.100' : 'gray.100')
      }
      cursor='pointer'
      borderRadius='3px'
      padding='2px 7px'
      transition='all 0.1s ease'
      userSelect='none'
      _hover={{ opacity: 0.9 }}
    >
      <span>{
        t.mainNames[i18n.language]
        || t.mainNames[i18n.language.substring(0, 2)]
        || t.mainName
      }</span>
    </Box>)}
  </Wrap>;

  return ret;
};

export const TagsPage = () => {
  const t = useTags();
  const s = useSelection();

  return <>
    <Button onClick={async () => {
      console.time('tag');
      t.recordAllRecordableTags();
      console.timeEnd('tag');
    }}>find bad tags</Button>

    <RenderedTags tags={t.tagList} isSelected={s.isSelected} toggleSelected={s.toggleSelected} />

  </>;
};

export default TagsPage;