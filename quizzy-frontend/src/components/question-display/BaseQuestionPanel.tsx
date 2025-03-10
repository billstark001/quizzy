import { BaseQuestion } from "@quizzy/base/types";
import {
  Box,
  HStack,
  VStack,
  StackProps,
} from "@chakra-ui/react";
import { Dispatch, ReactNode, SetStateAction, useState } from "react";
import Markdown from '@/markdown/markdown-renderer';

import { FiMinus } from "react-icons/fi";
import { MdAdd } from "react-icons/md";
import { Components } from "react-markdown";

import { useColorMode } from "../ui/color-mode";


export type QuestionPanelState = {
  state?: 'select' | 'display';

  displaySolution?: boolean;
  expandSolution?: boolean;
  setExpandSolution?: Dispatch<SetStateAction<boolean>>;
  solutionTitle?: React.ReactNode;

  bookmark?: ReactNode;
};

export type BaseQuestionPanelProps = {
  components?: Components;
  question: BaseQuestion;
} & QuestionPanelState & StackProps;

export const BaseQuestionPanel = (props: BaseQuestionPanelProps) => {
  const { components, question, children,
    displaySolution, expandSolution, setExpandSolution,
    solutionTitle,
    bookmark,
    ...divProps
  } = props;
  const { solution } = question;
  const isSolutionExpansionControlled = !!setExpandSolution || expandSolution != null;
  const [expand, setExpand] = useState(false);

  const expandState = isSolutionExpansionControlled ? !!expandSolution : expand;
  const setExpandState = isSolutionExpansionControlled ? setExpandSolution : setExpand;

  const { title, content } = question;
  const { colorMode } = useColorMode();

  return <VStack
    alignItems='flex-start'
    padding='1.5em'
    border='1px solid'
    borderColor='gray.500'
    borderRadius='1.6em'
    position='relative'
    {...divProps}
  >
    {bookmark}
    {title && <Markdown children={title} />}
    <Box w='100%' flex={1}>
      <Markdown components={components} children={content} />
    </Box>
    {children}
    {solution == null || !displaySolution ? null : <VStack
      padding='1em'
      border='1px solid'
      borderColor='gray.400'
      w='100%'
      borderRadius='1em'
    >
      <HStack justifyContent='space-between' w='100%'>
        <Box>{solutionTitle ?? 'Solution'}</Box>
        <Box
          display='flex' justifyContent='center' alignItems='center'
          w='32px' h='32px'
          backgroundColor={colorMode == 'dark' ? 'gray.500' : 'gray.300'}
          borderRadius='114514'
          cursor='pointer'
          transition="background-color 0.3s ease"
          onClick={() => setExpandState?.((s) => !s)}
          _hover={{
            backgroundColor: 'gray.400',
          }}
          _active={{
            backgroundColor: 'gray.600',
          }}
        >
          {expandState ? <FiMinus /> : <MdAdd />}
        </Box>
      </HStack>
      {expandState && <Box w='100%' flex={1}>
        <Markdown children={solution ?? ''} />
      </Box>}
    </VStack>}
  </VStack>;
};


export default BaseQuestionPanel;