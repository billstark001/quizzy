import { getOptionOrBlankId } from "@quizzy/base/db/question-id";
import { ChoiceQuestion } from "@quizzy/base/types";
import { ID } from "@quizzy/base/types";
import { numberToLetters } from "@quizzy/base/utils";
import {
  Box,
  Text,
  Code,
  HStack,
  VStack,
  StackProps
} from "@chakra-ui/react";

import { QuestionPanelState, BaseQuestionPanel } from "./BaseQuestionPanel";
import Markdown from "@/markdown/markdown-renderer";
import { Components } from "react-markdown";
import { useColorMode } from "../ui/color-mode";


export type ChoiceQuestionPanelProps = {
  question: ChoiceQuestion;
  set?(id: ID, set: boolean, multiple: boolean): void;
  get?(id: ID): boolean;
} & QuestionPanelState & StackProps;

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

const rs: Components = {
  p: props => {
    const { children } = props;
    return <Text>{children}</Text>;
  },
};

export const ChoiceQuestionPanel = (props: ChoiceQuestionPanelProps) => {
  const {
    question,
    state,
    set, get,
    ...sol
  } = props;

  const { options, multiple } = question;
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const isDisplay = state === 'display';

  const isMultiChoice = multiple
    ?? ((options?.filter(x => x.shouldChoose)?.length ?? 0) > 1);

  return <BaseQuestionPanel question={question} {...sol}>
    <VStack
      alignItems='flex-start'
      w='100%'
      p='0.5em 1em'
    >
      {options?.map((o, i) => {
        const id = getOptionOrBlankId(o, i, question);
        const selected = !!get?.(id);
        const [c1, c2, c3, c4] = getOptionColor(selected, isDisplay ? !!o.shouldChoose : undefined, isDark);
        return <HStack key={id}
          w='100%' p='0.5em'
          backgroundColor={c1}
          border='1px solid' borderColor='gray.400' borderRadius='1em'
          onClick={isDisplay ? undefined : () => set?.(id, !selected, isMultiChoice)}
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
          >
            <Code m='auto' background='transparent' fontSize='xl'>
              {numberToLetters(i + 1)}
            </Code>
          </Box>
          <Markdown components={rs} children={o.content} />
        </HStack>;
      })}

    </VStack>

  </BaseQuestionPanel>;

};

export default ChoiceQuestionPanel;