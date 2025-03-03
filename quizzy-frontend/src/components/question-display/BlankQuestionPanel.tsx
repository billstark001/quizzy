import { getOptionOrBlankId } from "@quizzy/base/db/question-id";
import { blankPattern, BlankQuestion, TextQuestion } from "@quizzy/base/types";
import { ID } from "@quizzy/base/types";
import {
  Box,
  Code,
  Input,
  HTMLChakraProps,
  Text
} from "@chakra-ui/react";
import { createContext, createElement, Fragment, PropsWithChildren, ReactNode, useCallback, useContext, useMemo } from "react";

import BaseQuestionPanel, { QuestionPanelState } from "./BaseQuestionPanel";
import { Components } from "react-markdown";
import { splitWithValues } from "@/utils/string";
import { PreContext } from "@/markdown/chakra-ui-markdown-renderer";

type _FBP = {
  get(key: string): string;
  set(key: string, value: string): void;
  valid(key: string): boolean;
}

const FillBlankContext = createContext<_FBP>({
  get() { return ''; },
  set() { },
  valid() { return false; },
});

const BlankInput = (props: {
  blankKey: string;
}) => {
  const { get, set, valid } = useContext(FillBlankContext);
  const { blankKey } = props;
  const invalid = !valid(blankKey);
  return <Box as='span' display='inline-table'>
    <Input p={1} borderColor='gray.300' display='table-cell'
      placeholder={invalid ? '<INVALID BLANK>' : blankKey} isInvalid={invalid} isDisabled={invalid}
      value={get(blankKey)} size='sm' borderRadius='lg' fontSize='md'
      onChange={(e) => set(blankKey, e.target.value)}
    />
  </Box>
};

const TextWithBlank = (props: PropsWithChildren<object>) => {
  let { children } = props;
  if (!Array.isArray(children)) {
    children = [children];
  }
  const transformedChildren: ReactNode[] = [];
  for (const child of (children as ReactNode[])) {
    if (typeof child !== 'string') {
      continue;
    }
    const [segments, matches] = splitWithValues(child, blankPattern);
    transformedChildren.push(segments[0]);
    for (let i = 0; i < matches.length; ++i) {
      transformedChildren.push(
        <BlankInput blankKey={matches[i][1]} />
      );
      transformedChildren.push(segments[i + 1]);
    }
  }
  return createElement(Fragment, null, ...transformedChildren);
}

const rc: Components = {
  p: props => {
    const { children } = props;
    return <Text mb={2}>
      <TextWithBlank>{children}</TextWithBlank>
    </Text>;
  },
  text: props => {
    const { children } = props;
    return <Text as='span'>
      <TextWithBlank>{children}</TextWithBlank>
    </Text>;
  },
  code: props => {
    const inline = !useContext(PreContext);
    const { children: _children, className } = props;

    const children = <TextWithBlank>{_children}</TextWithBlank>;

    if (inline) {
      return <Code px={2} py={1} children={children} />;
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
};

export type BlankQuestionPanelProps = {
  question: BlankQuestion;
  set?(id: ID, set: string): void;
  get?(id: ID): string;
} & QuestionPanelState & HTMLChakraProps<'div'>;

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
    blanks?.forEach((b, index) => {
      ret[b.key] = getOptionOrBlankId(b, index, question);
    });
    return ret as Readonly<Record<string, ID>>;
  }, [blanks]);

  const valid = useCallback(
    (key: string) => !!(KeyIdMap[key]),
    [KeyIdMap]
  );

  const fbpGet = useCallback(
    (key: string) => get?.(KeyIdMap[key] ?? '') ?? '',
    [get, KeyIdMap]
  );

  const fbpSet = useCallback(
    (key: string, value: string) => set?.(KeyIdMap[key], value),
    [set, KeyIdMap]
  );

  return <FillBlankContext.Provider value={{
    get: fbpGet,
    set: fbpSet,
    valid,
  }}>
    <BaseQuestionPanel question={question} components={rc} {...sol} />
  </FillBlankContext.Provider>;
};


export type TextQuestionPanelProps = {
  question: TextQuestion;
  set?(set: string): void;
  get?(): string;
} & QuestionPanelState & HTMLChakraProps<'div'>;

