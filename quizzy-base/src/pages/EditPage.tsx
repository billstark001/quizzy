import { PaperEdit } from "#/components/PaperEdit";
import { QuestionEdit } from "#/components/QuestionEdit";
import { BaseQuestionPanel } from "#/components/QuestionPanel";
import { QuestionSelectionModal } from "#/components/QuestionSelectionModal";
import { Question, QuizPaper } from "#/types";
import { withHandler } from "#/utils";
import { EditorContextProvider, useEditor, usePatch } from "#/utils/react-patch";
import { Quizzy, QuizzyRaw } from "@/data";
import { useAsyncMemo } from "@/utils/react";
import { ParamsDefinition, useParsedSearchParams } from "@/utils/react-router";
import { DragHandleIcon } from "@chakra-ui/icons";
import { Box, Button, Divider, HStack, IconButton, useCallbackRef, useDisclosure, VStack } from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";


export type EditParams = {
  paper: string;
  q: number;
  question: string;
};

const _parser: ParamsDefinition<EditParams> = {
  paper: 'string',
  q: "number",
  question: "string",
};

type _S = readonly [QuizPaper | undefined, Question | undefined, string | undefined];

export const EditPage = () => {
  const [searchParams] = useParsedSearchParams(_parser);
  const { paper: paperId, q: _questionIndex, question: questionIdOrig } = searchParams;
  const questionIndex = _questionIndex ?? 1;

  // fetch question and id

  const fetchData = withHandler(async (): Promise<_S> => {
    // first try to get question by id
    let question: Question | null | undefined = undefined;
    try {
      if (questionIdOrig) {
        question = (await QuizzyRaw.getQuestions([questionIdOrig]))?.[0];
      }
    } catch { }
    if (question) {
      return [undefined, question, questionIdOrig];
    }
    // then try to get question by paper and index
    const paper = paperId ? await QuizzyRaw.getQuizPaper(paperId) : null;
    if (paper) {
      const qid = paper.questions[questionIndex - 1] ?? '';
      question = (await QuizzyRaw.getQuestions([qid]))?.[0];
      if (question) {
        return [paper, question, qid];
      }
    }
    return [undefined, undefined, undefined];
  }, { def: [undefined, undefined, undefined] as _S, deps: [paperId, questionIndex, questionIdOrig], notifySuccess: undefined, });


  const q = useDisclosure();
  const { t } = useTranslation();

  const { data: _q } = useAsyncMemo(fetchData, [paperId, questionIndex, questionIdOrig]);
  const [paper, question, questionId] = _q ?? [undefined, undefined, undefined];

  const [editState, setEditState] = useState<{
    question: Question,
    paper: QuizPaper,
  }>({
    question: { id: '', type: 'choice', content: '', options: [] },
    paper: { id: '', name: '', questions: [] },
  });

  // patch & update patch
  const p = usePatch({
    value: editState, setValue: (v) => {
      setEditState(v);
    }, maxLength: 16
  });
  const pp = (pp: Partial<QuizPaper>) => p.onEdit({
    paper: { ...editState.paper, ...pp }
  });
  const pq = (pp: Partial<Question>) => p.onEdit({
    question: { ...editState.question, ...pp } as any
  });
  const ppr = useCallbackRef(pp);
  const pqr = useCallbackRef(pq);
  useEffect(() => {
    const e = { ...editState };
    if (question) {
      e.question = question;
    }
    if (paper) {
      e.paper = paper;
    }
    setEditState(e);
    p.onClear(e);
  }, [question, paper]);

  // TODO paper mode


  const editor1 = useEditor({
    value: editState.question,
    onChange: pqr,
  });
  const editor2 = useEditor({
    value: editState.paper,
    onChange: ppr,
  });

  // current question preview
  const [questionPreviewIndex, setQuestionPreviewIndex] = useState(1);
  const [questionPreview, setQuestionPreview] = useState<Question>();


  const selectQuestionPreview = useCallback((index: number) => {
    const q = paper?.questions?.[index - 1];
    setQuestionPreviewIndex(index);
    Quizzy.getQuestions([q ?? '']).then(([question]) => setQuestionPreview(question));
  }, [setQuestionPreviewIndex, setQuestionPreview, paper]);

  // render
  if (question == undefined) {
    return 'ERROR: QUESTION NOT FOUND';
  }

  return <VStack alignItems='stretch'>
    <HStack>
      <Button onClick={p.onUndo}>undo</Button>
      <Button onClick={p.onRedo}>redo</Button>
      <Button>save [TODO]</Button>
    </HStack>

    <Divider />

    {paper != undefined && <>
      <EditorContextProvider value={editor2}>
        <PaperEdit />
      </EditorContextProvider>
      <HStack justifyContent='space-between'>
        <Box>{t('page.edit.nowEditing', { q: questionIndex })}</Box>
        <IconButton colorScheme='blue' aria-label={t('page.question.questions')} icon={<DragHandleIcon />}
          onClick={() => {
            selectQuestionPreview(1);
            q.onOpen();
          }} />
      </HStack>

      <Divider />
    </>}

    <EditorContextProvider value={editor1}>
      <QuestionEdit />
    </EditorContextProvider>
    <QuestionSelectionModal
      current={questionIndex} total={paper?.questions?.length || 1}
      index={questionPreviewIndex}
      setIndex={selectQuestionPreview}
      {...q}
      question={questionPreview ? <BaseQuestionPanel w='100%' question={questionPreview} /> : <></>}
    />

  </VStack>;
};