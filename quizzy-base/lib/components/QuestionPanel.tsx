import { BaseQuestion, BLANK_PREFIX, BlankQuestion, ChoiceQuestion, ID, Question, TextQuestion } from "#/types";
import { AddIcon, MinusIcon } from "@chakra-ui/icons";
import { 
  Box, 
  Text,
  Code, 
  HStack, 
  VStack,
  Input,
  useColorMode,
  HTMLChakraProps
} from "@chakra-ui/react";
import ChakraUIRenderer from "chakra-ui-markdown-renderer";
import { createContext, Dispatch, SetStateAction, useCallback, useContext, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";


type _S = {
  state?: 'select' | 'display';
  displaySolution?: boolean;
  expandSolution?: boolean;
  setExpandSolution?: Dispatch<SetStateAction<boolean>>;
  solutionTitle?: React.ReactNode;
};

export type BaseQuestionPanelProps = {
  components?: ReturnType<typeof ChakraUIRenderer>;
  question: BaseQuestion;
} & _S & HTMLChakraProps<'div'>;

const r = ChakraUIRenderer();
const rs = ChakraUIRenderer({
  p: props => {
    const { children } = props;
    return <Text>{children}</Text>;
  },
});

export const BaseQuestionPanel = (props: BaseQuestionPanelProps) => {
  const { components, question, children, 
    displaySolution, expandSolution, setExpandSolution,
    solutionTitle,
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
    backgroundColor='gray.  '
    padding='1.5em'
    border='1px solid'
    borderColor='gray.500'
    borderRadius='2em'
    {...divProps}
  >
    {title && <ReactMarkdown components={r} children={title} />}
    <Box w='100%' flex={1}>
      <ReactMarkdown components={components ?? r} children={content} /> 
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
          {expandState ? <MinusIcon /> : <AddIcon />}
        </Box>
      </HStack>
      {expandState && <Box w='100%' flex={1}>
        <ReactMarkdown components={r} children={solution ?? ''} />
      </Box>}
    </VStack>}
  </VStack>;
};

export type ChoiceQuestionPanelProps = {
  question: ChoiceQuestion;
  set?(id: ID, set: boolean): void;
  get?(id: ID): boolean;
} & _S & HTMLChakraProps<'div'>;

const getOptionColor = (selected: boolean, correct?: boolean | null | undefined, isDark?: boolean): [string, string, string, string] => {
  const isSelect = correct == null;
  const normalConc = isDark ? 700 : 100;
  const activeConc = isDark ? 600 : 300;
  const hoverConc = isDark ? 500 : 200;
  const hoverActiveConc = isDark ? 800 : 400;
  const _t = (c: string) => [`${c}.${normalConc}`, `${c}.${activeConc}`, 
    `${c}.${hoverConc}`, `${c}.${hoverActiveConc}`] as [string, string, string, string];
  if (isSelect) {
    return _t(selected ? 'blue' : 'gray');
  } else {
    return _t(selected
      ? (correct ? 'green' : 'red')
      : (correct ? 'teal' : 'gray'));
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
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const isDisplay = state === 'display';

  return <BaseQuestionPanel question={question} {...sol}>
    <VStack 
      alignItems='flex-start'
      w='100%'
      p='0.5em 1em'
    >
      {options.map((o, i) => {
        const id = o.id ?? `${question.id}-${i}`;
        const selected = !!get?.(o.id ?? `${question.id}-${i}`);
        const [c1, c2, c3, c4] = getOptionColor(selected, isDisplay ? o.shouldChoose : undefined, isDark);
        return <HStack key={`${o.id}+${i}`}
          w='100%' p='0.5em'
          backgroundColor={c1}
          border='1px solid' borderColor='gray.400' borderRadius='1em'
          onClick={isDisplay ? undefined : () => set?.(id, !selected)}
          cursor={isDisplay ? undefined : 'pointer'}
          transition="background-color 0.3s ease"
          _hover={isDisplay ? undefined : { backgroundColor: c3 }}
          _active={isDisplay ? undefined : { backgroundColor: c4 }}
        >
          <Box 
            minH='3em' minW='3em' borderRadius='0.7em' 
            display='flex' justifyContent='center' alignItems='center'
            backgroundColor={c2}
            mr='0.5em'
          ><Code m='auto' background='transparent' fontSize='xl'>{i}</Code></Box>
          <ReactMarkdown components={rs} children={o.content} />
        </HStack>;
      })}

    </VStack>

  </BaseQuestionPanel>;

};

type _FBP = {
  get(key: string): string;
  set(key: string, value: string): void;
}

const fillBlankContext = createContext<_FBP>({
  get() { return '';},
  set() {},
});

const rc = ChakraUIRenderer({
  code: props => {
    const { inline, children, node, className } = props;
    const { get, set } = useContext(fillBlankContext);

    if (inline) {
      const _c = node.children[0];
      const isBlank = _c && _c.type === 'text' && (_c.value?.startsWith(BLANK_PREFIX));
      const blankKey = isBlank ? _c.value.substring(BLANK_PREFIX.length) : '';

      if (isBlank) {
        return <Box as='span' display='inline-table'>
          <Input p={1} borderColor='gray.300' display='table-cell'
            value={get(blankKey)} size='sm' borderRadius='lg' fontSize='md'
            onChange={(e) => set(blankKey, e.target.value)}
          />
        </Box>
      }
      return <Code p={0.5} children={children} />;
    }
    return (
      <Code
        className={className}
        whiteSpace="break-spaces"
        display="block"
        w="full"
        p={2}
        children={children}
      />
    );
  },
});

export type BlankQuestionPanelProps = {
  question: BlankQuestion;
  set?(id: ID, set: string): void;
  get?(id: ID): string;
} & _S & HTMLChakraProps<'div'>;

export const BlankQuestionPanel = (props: BlankQuestionPanelProps) => {
  const { 
    question,
    state,
    set, get,
    ...sol
  } = props;

  const { blanks } = question;
  const KeyIdMap = useMemo(() => {
    const ret: Record<string, ID> = {};
    for (const { id, key } of blanks) {
      ret[key] = id;
    }
    return ret;
  }, [blanks]);

  const fbpGet = useCallback(
    (key: string) => get?.(KeyIdMap[key] ?? '') ?? '',
    [get, KeyIdMap]
  );

  const fbpSet = useCallback(
    (key: string, value: string) => KeyIdMap[key] != null ? set?.(KeyIdMap[key], value) : undefined,
    [set, KeyIdMap]
  );

  return <fillBlankContext.Provider value={{
    get: fbpGet,
    set: fbpSet,
  }}>
    <BaseQuestionPanel question={question} components={rc} {...sol} />
  </fillBlankContext.Provider>;
};


export type TextQuestionPanelProps = {
  question: TextQuestion;
  set?(set: string): void;
  get?(): string;
} & _S & HTMLChakraProps<'div'>;


export type QuestionPanelProps = BlankQuestionPanelProps | ChoiceQuestionPanelProps | TextQuestionPanelProps;

export const QuestionPanel = (props: QuestionPanelProps) => {
  const question = props.question as Question;
  if (question.type === 'choice') {
    return <ChoiceQuestionPanel {...props as ChoiceQuestionPanelProps} />;
  }
  if (question.type === 'blank') {
    return <BlankQuestionPanel {...props as BlankQuestionPanelProps} />;
  }
  return <>Unsupported</>;
};