import { Box, Button, Stack, StackProps, Text, VStack, Wrap } from "@chakra-ui/react";
import { Question } from "@quizzy/base/types";
import BookmarkIcon from "../bookmark/BookmarkIcon";
import { useTranslation } from "react-i18next";
import TagDisplay from "./TagDisplay";
import { useNavigate } from "react-router-dom";
import { useTagResolver } from "@/hooks/useTagResolver";

export type QuestionCardProps = {
  question?: Question;
  preview?: (item?: Question) => void;
} & StackProps;

const truncate = (s: string, l = 320) => {
  return (s.length > l
    ? s.substring(0, l) + '……'
    : s).replace(/[\n\r\s]+/g, ' ')
};


export const QuestionCard = (props: QuestionCardProps) => {

  const { question, preview, ...rest } = props;
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Resolve tag IDs to Tag objects
  const { displayTags, displayCategories } = useTagResolver(
    undefined, // no legacy tags field
    question?.tagIds,
    undefined, // no legacy categories field
    question?.categoryIds
  );

  const nav = () => {
    const params = new URLSearchParams({ question: question?.id ?? '' }).toString();
    navigate('/edit?' + params);
  }

  const dispId = `#${question?.id || '<EMPTY>'}`

  return <Stack
    direction={['column', 'row']}
    border='1px solid'
    borderColor='gray.muted'
    boxShadow='0 0 10px #7773'
    borderRadius='20px'
    padding={6}
    gap={6}
    alignItems='stretch'
    {...rest}
  >
    <VStack alignItems='flex-start' flex='1' gap={4}>
      <Text fontSize='sm'>{dispId}</Text>
      <Text fontSize='xl'>{question?.title ?? dispId}</Text>
      <Wrap>
        <TagDisplay tags={displayCategories} isCategory />
        <TagDisplay tags={displayTags} />
      </Wrap>
      <Text>
        {truncate(question?.content || '<EMPTY>')}
      </Text>
    </VStack>

    <Stack 
      direction={['row', 'column']}
    justifyContent='space-between' alignItems='flex-end'>
      <BookmarkIcon itemId={question?.id ?? ''} isQuestion />
      <Box flex='1' />
      <Button onClick={() => preview?.(question)}>
        {t('common.btn.preview')}
      </Button>
      <Button onClick={nav}>
        {t('common.btn.edit')}
      </Button>
    </Stack>

  </Stack>
};

export default QuestionCard;