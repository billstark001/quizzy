import { QuizPaper } from "#/types";
import {
  Card, Heading, CardBody, Stack, Text, Image,
  Button, ButtonGroup, CardFooter, Divider, useColorMode,
  CardProps, Wrap,
  Tag,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

export type PaperCardProps = Omit<CardProps, 'children'> & {
  paper: QuizPaper,
  onStart?: () => void,
  onRevise?: () => void,
  onEdit?: () => void,
};

const DEFAULT_IMG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAACWCAYAAADwkd5lAAAALElEQVR4nO3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAAAAAAAAAAAAAAAAAPwZV4AAAcb7wVwAAAAASUVORK5CYII=';

export const PaperCard = (props: PaperCardProps) => {
  const {
    paper,
    onStart,
    onRevise,
    onEdit,
    ...cardProps
  } = props;

  const { t } = useTranslation();
  const { colorMode } = useColorMode();


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
        <Button variant='solid' colorScheme='blue' onClick={onStart}>
          {t('card.paper.start')}
        </Button>
        {onRevise && <Button variant='ghost' colorScheme='blue' onClick={onRevise}>
          {t('card.paper.revise')}
        </Button>}
        {onEdit && <Button variant='ghost' colorScheme='blue' onClick={onEdit}>
          {t('card.paper.edit')}
        </Button>}
      </ButtonGroup>
    </CardFooter>
  </Card>

};