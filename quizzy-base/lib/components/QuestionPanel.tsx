import { BaseQuestion, ChoiceQuestion, ID } from "#/types";
import { AddIcon, MinusIcon } from "@chakra-ui/icons";
import { 
  Box, 
  Text,
  Code, 
  HStack, 
  VStack
} from "@chakra-ui/react";
import ChakraUIRenderer from "chakra-ui-markdown-renderer";
import { Dispatch, PropsWithChildren, SetStateAction, useState } from "react";
import ReactMarkdown from "react-markdown";


type _S = {
  displaySolution?: boolean;
  expandSolution?: boolean;
  setExpandSolution?: Dispatch<SetStateAction<boolean>>;
  solutionText?: React.ReactNode;
};

export type BaseQuestionPanelProps = PropsWithChildren<{
  question: BaseQuestion;
} & _S>;

const r = ChakraUIRenderer();
const rs = ChakraUIRenderer({
  p: props => {
    const { children } = props;
    return <Text>{children}</Text>;
  },
});

export const BaseQuestionPanel = (props: BaseQuestionPanelProps) => {
  const { question, children, 
    displaySolution, expandSolution, setExpandSolution,
    solutionText,
  } = props;
  const { solution } = question;
  const isSolutionExpansionControlled = !!setExpandSolution || expandSolution != null;
  const [expand, setExpand] = useState(false);

  const expandState = isSolutionExpansionControlled ? !!expandSolution : expand;
  const setExpandState = isSolutionExpansionControlled ? setExpandSolution : setExpand;

  const { title, content } = question;

  return <VStack 
    alignItems='flex-start' 
    backgroundColor='gray.  '
    padding='1.5em'
    border='1px solid'
    borderColor='gray.500'
    borderRadius='2em'
  >
    {title && <ReactMarkdown components={r} children={title} />}
    <ReactMarkdown components={r} children={content} /> 
    {children}
    {solution == null || !displaySolution ? null : <VStack
      padding='1em'
      border='1px solid'
      borderColor='gray.400'
      w='100%'
      borderRadius='1em'
    >
      <HStack justifyContent='space-between' w='100%'>
        <Box>{solutionText ?? 'Solution'}</Box>
        <Box 
          display='flex' justifyContent='center' alignItems='center'
          w='32px' h='32px'
          backgroundColor='gray.300'
          borderRadius='114514'
          cursor='pointer'
          onClick={() => setExpandState?.((s) => !s)}
        >
          {expandState ? <MinusIcon /> : <AddIcon />}
        </Box>
      </HStack>
      {expandState && <Box w='100%'>
        <ReactMarkdown components={r} children={solution ?? ''} />
      </Box>}
    </VStack>}
  </VStack>;
};

export type ChoiceQuestionPanelProps = {
  question: ChoiceQuestion;
  state?: 'select' | 'display';
  set?(id: ID, set: boolean): void;
  get?(id: ID): boolean;
} & _S

const getOptionColor = (selected: boolean, correct?: boolean | null | undefined): [string, string] => {
  const isSelect = correct == null;
  if (isSelect) {
    return selected
      ? ['cyan.100', 'cyan.300']
      : ['gray.100', 'gray.300'];
  } else {
    return selected
      ? (correct ? ['green.100', 'green.300'] : ['red.100', 'red.300'])
      : (correct ? ['teal.100', 'teal.300'] : ['gray.100', 'gray.300']);
  }
};

export const ChoiceQuestionPanel = (props: ChoiceQuestionPanelProps) => {
  const { 
    question,
    state,
    set, get,
    ...sol
  } = props;

  const { options } = question;

  return <BaseQuestionPanel question={question} {...sol}>
    <VStack 
      alignItems='flex-start'
      w='100%'
      p='0.5em 1em'
    >
      {options.map((o, i) => {
        const [c1, c2] = getOptionColor(!!get?.(o.id), state === 'display' ? o.shouldChoose : undefined);
        return <HStack key={`${o.id}+${i}`}
          w='100%' p='0.5em'
          backgroundColor={c1}
          border='1px solid' borderColor='gray.400' borderRadius='1em'>
          <Box 
            minH='3em' minW='3em' borderRadius='0.7em' 
            display='flex' justifyContent='center' alignItems='center'
            backgroundColor={c2}
            mr='0.5em'
          ><Code m='auto' background='transparent' fontSize='xl'>{o.seq}</Code></Box>
          <ReactMarkdown components={rs} children={o.content} />
        </HStack>;
      })}

    </VStack>

  </BaseQuestionPanel>;

};