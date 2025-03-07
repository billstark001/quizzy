import { Box, Wrap } from "@chakra-ui/react";
import { Tag as TagType } from "@quizzy/base/types";
import { useTranslation } from "react-i18next";

export type TagSelectorProps = {
  tags?: TagType[],
  isSelected?: (id: string) => boolean;
  toggleSelected?: (id: string) => void;
};

export const TagSelector = (props: TagSelectorProps) => {
  const {
    tags,
    isSelected,
    toggleSelected,
  } = props;

  const { i18n } = useTranslation();

  const ret = <Wrap>
    {tags?.map(t => <Box
      key={t.id} 
      onClick={() => toggleSelected?.(t.id)}
      backgroundColor={isSelected?.(t.id) ? 'purple.muted' : 'gray.muted'}
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

export default TagSelector;