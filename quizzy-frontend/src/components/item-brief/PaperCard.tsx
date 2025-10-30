import { QuizPaper } from "@quizzy/base/types";
import { AiOutlineCheck } from "react-icons/ai";
import {
  Card, Heading, Text, Image,
  Button, Wrap, IconButton,
  Box,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { useColorMode } from "../ui/color-mode";
import BookmarkIcon from "../bookmark/BookmarkIcon";
import TagDisplay from "./TagDisplay";
import { useTagResolver } from "@/hooks/useTagResolver";

export type PaperCardProps = Omit<Card.RootProps, 'children' | 'onSelect'> & {
  paper: QuizPaper,
  selected?: boolean,
  onSelect?: (selected: boolean) => void,
  onStart?: () => void,
  onRevise?: () => void,
  onEdit?: () => void,
};

const DEFAULT_IMG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAACWCAYAAADwkd5lAAAALElEQVR4nO3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAAAAAAAAAAAAAAAAAPwZV4AAAcb7wVwAAAAASUVORK5CYII=';

export const PaperCard = (props: PaperCardProps) => {
  const {
    paper,
    selected,
    onSelect,
    onStart,
    onRevise,
    onEdit,
    ...cardProps
  } = props;

  const { t } = useTranslation();
  const { colorMode } = useColorMode();
  
  // Resolve tag IDs to Tag objects
  const { displayTags, displayCategories } = useTagResolver(
    undefined, // no legacy tags field
    paper.tagIds,
    undefined, // no legacy categories field
    paper.categoryIds
  );

  const useSelect = selected != null || onSelect != null;

  return (
    <Card.Root w='sm' {...cardProps}>
      <Card.Body>
        <Image
          src={paper.img ?? DEFAULT_IMG}
          alt={paper.name}
          aspectRatio={16 / 9}
          backgroundColor={colorMode === "dark" ? "gray.600" : 'gray.200'}
          borderRadius='lg'
        />
        <Heading size='md' mt='6'>
          {paper.name}
        </Heading>
        <Text mt='2'>
          {paper.desc}
        </Text>
        <Wrap mt='3'>
          <TagDisplay tags={displayCategories} isCategory />
          <TagDisplay tags={displayTags} />
        </Wrap>
      </Card.Body>
      <Card.Footer justifyContent="space-between">
        {useSelect && (
          <IconButton 
            children={<AiOutlineCheck />} 
            aria-label="check"
            colorPalette={selected ? 'purple' : undefined}
            onClick={() => onSelect?.(!selected)}
            mr="2"
          />
        )}

        <BookmarkIcon
          itemId={paper.id}
        />

        <Box flex='1' />

        <Button variant='solid' colorPalette='purple' onClick={onStart}>
          {t('common.btn.start')}
        </Button>
        {onRevise && (
          <Button variant='ghost' colorPalette='purple' onClick={onRevise} ml="2">
            {t('common.btn.revise')}
          </Button>
        )}
        {onEdit && (
          <Button variant='ghost' colorPalette='purple' onClick={onEdit} ml="2">
            {t('common.btn.edit')}
          </Button>
        )}
      </Card.Footer>
    </Card.Root>
  );
};