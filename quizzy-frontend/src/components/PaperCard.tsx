import { QuizPaper } from "@quizzy/base/types";
import { AiOutlineCheck } from "react-icons/ai";
import {
  Card, Heading, CardBody, Stack, Text, Image,
  Button, ButtonGroup, CardFooter, Divider, useColorMode,
  CardProps, Wrap,
  Tag,
  IconButton,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

export type PaperCardProps = Omit<CardProps, 'children' | 'onSelect'> & {
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

  const useSelect = selected != null || onSelect != null;


  return <Card w='sm' {...cardProps}>
    <CardBody>
      <Image
        src={paper.img ?? DEFAULT_IMG}
        alt={paper.name}
        aspectRatio={16 / 9}
        backgroundColor={colorMode === "dark" ? "gray.600" : 'gray.200'}
        borderRadius='lg'
      />
      <Stack mt='6' spacing='3'>
        <Heading size='md'>
          {paper.name}
        </Heading>
        <Text>
          {paper.desc}
        </Text>
        <Wrap>
          {paper.categories?.map((t, i) => <Tag key={i} border='1px solid gray'>{t}</Tag>)}
          {paper.tags?.map((t, i) => <Tag key={i}>{t}</Tag>)}
        </Wrap>
      </Stack>
    </CardBody>
    <Divider />
    <CardFooter>
      <ButtonGroup as={Wrap} spacing='2' justifyContent='flex-end'>
        {useSelect && <IconButton 
          icon={<AiOutlineCheck />} aria-label="check"
          colorScheme={selected ? 'purple' : undefined}
          onClick={() => onSelect?.(!selected)}
        />}
        <Button variant='solid' colorScheme='purple' onClick={onStart}>
          {t('common.btn.start')}
        </Button>
        {onRevise && <Button variant='ghost' colorScheme='purple' onClick={onRevise}>
          {t('common.btn.revise')}
        </Button>}
        {onEdit && <Button variant='ghost' colorScheme='purple' onClick={onEdit}>
          {t('common.btn.edit')}
        </Button>}
      </ButtonGroup>
    </CardFooter>
  </Card>

};