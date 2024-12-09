import { PaperEdit } from "#/components/PaperEdit";
import { QuestionEdit } from "#/components/QuestionEdit";
import { BaseQuestionPanel, QuestionPanel } from "#/components/QuestionPanel";
import { QuestionSelectionModal } from "#/components/QuestionSelectionModal";
import { defaultQuestion, defaultQuizPaper, Question, QuizPaper } from "#/types";
import { ID } from "#/types/technical";
import { openDialog, standaloneToast, withHandler } from "#/utils";
import { useDisclosureWithData } from "#/utils/disclosure";
import { applyPatch, Patch } from "#/utils/patch";
import { EditorContextProvider, useEditor, usePatch } from "#/utils/react-patch";
import { Quizzy, QuizzyCache, QuizzyCacheRaw, QuizzyRaw } from "@/data";
import { useAsyncMemo } from "@/utils/react";
import { ParamsDefinition, useParsedSearchParams } from "@/utils/react-router";
import { DragHandleIcon } from "@chakra-ui/icons";
import { Box, Button, Divider, HStack, IconButton, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, useCallbackRef, useDisclosure, VStack } from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";


export type EditParams = {
  paper: string;
  question: string;
};

const _parser: ParamsDefinition<EditParams> = {
  paper: 'string',
  question: "string",
};

type FetchedState = Readonly<{
  paper: QuizPaper;
  paperId: string;
} | {
  paper?: undefined;
  paperId?: undefined;
}>;

type FetchedQuestionState = Readonly<{
  question: Question;
  questionId: string;
} | {
  question?: undefined;
  questionId?: undefined;
}>;

type EditState = Readonly<{
  question: Question,
  paper: QuizPaper,
  questions: Readonly<Record<ID, Question>>,
}>;

type EditPatch = Readonly<{
  target: 'question';
  replace?: false;
  value: Patch<Question>;
} | {
  target: 'paper';
  replace?: false;
  value: Patch<QuizPaper>;
} | {
  target: 'question';
  replace: true;
  value: Question;
}>;

const applyEditPatch = (base: EditState, patch: EditPatch): EditState => {
  const { target, replace, value } = patch;
  // TODO handle question
  return {
    ...base,
    [target]: replace ? value : applyPatch(base[target], value),
  }
};

export const EditPage = () => {

  // navigate
  const navigate = useNavigate();

  // params
  const [searchParams, setSearchParams] = useParsedSearchParams(_parser);
  const {
    paper: paperIdProp,
    question: questionIdProp
  } = searchParams;

  const [questionIndex, setQuestionIndex] = useState(1);

  // fetch the paper and question we need
  const fetchPaper = withHandler(async (): Promise<FetchedState> => {
    // try to get paper and question by index
    const paper = paperIdProp
      ? await (QuizzyRaw.getQuizPaper(paperIdProp).catch(() => void 0)) ?? undefined
      : undefined;
    if (paper) {
      return { paperId: paperIdProp!, paper };
    }
    return {};
  }, { def: {} as FetchedState, deps: [paperIdProp], notifySuccess: undefined, });

  const { data: data1 } = useAsyncMemo(fetchPaper, [paperIdProp]);
  const { paperId, paper } = data1 ?? {} as FetchedState;

  const fetchQuestion = withHandler(async (): Promise<FetchedQuestionState> => {
    // first try to get question inside paper by index
    if (paper) {
      const questionId = paper.questions[questionIndex - 1] || undefined;
      const question = questionId
        ? (await (QuizzyRaw.getQuestions([questionId])).catch(() => void 0))?.[0] ?? undefined
        : undefined;
      if (question) {
        return { questionId: questionId!, question };
      }
    }
    // at this point, paper fetching is failed
    // then try to get question by id
    if (questionIdProp) {
      const question = (await QuizzyRaw.getQuestions([questionIdProp]))?.[0];
      if (question) {
        return { question, questionId: questionIdProp! };
      }
    }
    return {};
  }, { def: {} as FetchedQuestionState, deps: [paper, questionIndex, questionIdProp], notifySuccess: undefined, });

  const { data: dataQuestion } = useAsyncMemo(fetchQuestion, [paper, questionIndex, questionIdProp]);
  const { questionId, question } = dataQuestion ?? {} as FetchedQuestionState;

  const dQuestionSelect = useDisclosure();
  const { t } = useTranslation();

  // at this point, paper <-> paperId, question <-> questionId are linked
  const sessionId = paperId
    ? `paper:${paperId}+${questionIndex}`
    : `question:${questionId}`;

  // editing states
  const [editingState, setEditingState] = useState<EditState>(() => ({
    question: defaultQuestion(),
    paper: defaultQuizPaper(),
    questions: {},
  }));

  // patch & update patch
  const patch = usePatch({
    value: editingState, setValue: setEditingState, maxLength: 16,
    applyPatch: applyEditPatch,
  });
  const patchPaper = (value: Partial<QuizPaper>) => patch.onEdit({
    target: 'paper', value
  });
  const patchQuestion = (value: Partial<Question>) => patch.onEdit({
    target: 'question', value,
  });
  const patchPaperRef = useCallbackRef(patchPaper);
  const patchQuestionRef = useCallbackRef(patchQuestion);

  // this executes when initialized or ids changed
  // it resets the old edit record
  useEffect(() => void (async () => {
    // try to read data from local cache, apply if successful
    let cachedState: Partial<EditState> | undefined = await (QuizzyCacheRaw.loadRecord('edit', sessionId)
      .catch(() => void 0));
    if (cachedState && !await openDialog({
      id: 'load-cached-result',
      desc: 'There is a cached result. Do you want to load it?',
      type: 'load-discard',
    })) {
      // discard the cache
      cachedState = undefined;
      await (QuizzyCacheRaw.clearRecord('edit', sessionId).catch(() => void 0));
    }
    const state: EditState = {
      question: cachedState?.question ?? question ?? defaultQuestion(),
      paper: cachedState?.paper ?? paper ?? defaultQuizPaper(),
      questions: { ...cachedState?.questions }
    }
    if (cachedState?.question || cachedState?.paper) {
      standaloneToast({
        status: 'info',
        title: t('page.edit.dataLoaded.title'),
        description: t('page.edit.dataLoaded.desc'),
      });
    }
    setEditingState(state);
    patch.onClear(state);
  })().catch(console.error), [questionId, paperId]);

  // save record
  const saveRecordToCache = useCallbackRef(
    () => QuizzyCache.dumpRecord('edit', editingState, sessionId)
  );
  // auto save
  useEffect(() => {
    const interval = setInterval(() => {
      saveRecordToCache();
    }, 1000 * 60 * 2);
    return () => {
      clearInterval(interval);
    }
  }, []);

  // editors
  const editorQuestion = useEditor({
    value: editingState.question,
    onChange: patchQuestionRef,
  });
  const editorPaper = useEditor({
    value: editingState.paper,
    onChange: patchPaperRef,
  });

  // current question preview
  const [questionPreviewIndex, setQuestionPreviewIndex] = useState(1);
  const [questionPreview, setQuestionPreview] = useState<Question>();

  const selectQuestionPreview = useCallback((index: number) => {
    const q = paper?.questions?.[index - 1];
    setQuestionPreviewIndex(index);
    Quizzy.getQuestions([q ?? '']).then(([question]) => setQuestionPreview(question));
  }, [setQuestionPreviewIndex, setQuestionPreview, paper]);

  // select different questions
  const selectQuestionPaperMode = useCallback(async (index: number) => {
    // ask user to save if edited
    if (patch.totalStep === 0 || await openDialog(<>
      Are you sure? The unsaved changes will be discarded.
    </>, 'alert-confirm')) {
      // this means to discard
      setQuestionIndex(index);
    }
  }, [setSearchParams, setQuestionIndex, patch]);

  // save & delete current edition
  const save = useCallback(async () => {
    if (!await openDialog(<>
      Are you sure? The changes cannot be undone.
    </>, 'alert-confirm')) {
      // the save request is rejected
      return;
    }
    if (paperId) {
      await Quizzy.updateQuizPaper(paperId, editingState.paper);
    }
    await Quizzy.updateQuestion(questionId ?? '', editingState.question);
    // await refresh();
    // after the refresh, edit state is automatically cleared
  }, [paperId, questionId, editingState]);

  const deleteCurrent = useCallback(async () => {
    if (!await openDialog(<>
      Are you sure? The changes cannot be undone.
    </>, 'alert-confirm')) {
      // the delete request is rejected
      return;
    }
    if (paperId) {
      await Quizzy.deleteQuizPaper(paperId);
      navigate('/papers');
    } else {
      await Quizzy.deleteQuestion(questionId ?? '');
      navigate('/questions');
    }
  }, [paperId, questionId]);

  // preview
  const { data: dPreviewQuestion, ...dPreview } = useDisclosureWithData<Question | undefined>(undefined);

  // render

  return <>
    <VStack alignItems='stretch' onKeyDown={patch.onKeyInput} tabIndex={0}>
      <HStack>
        <Button onClick={patch.onUndo}>undo</Button>
        <Button onClick={patch.onRedo}>redo</Button>
        <Button onClick={save}>save</Button>
        <Button onClick={saveRecordToCache}>save draft</Button>
        <Button onClick={deleteCurrent}>delete</Button>
        <Button onClick={() => {
          dPreview.onOpen(editorQuestion.fakeValue ?? editorQuestion.value);
        }}>preview</Button>
      </HStack>

      <Divider />

      {paper != undefined ? <>
        {/* paper mode */}
        <EditorContextProvider value={editorPaper}>
          <PaperEdit />
        </EditorContextProvider>
        <HStack justifyContent='space-between'>
          <Box>{t('page.edit.nowEditing', { questionIndex })}</Box>
          <IconButton colorScheme='blue' aria-label={t('page.question.questions')} icon={<DragHandleIcon />}
            onClick={() => {
              selectQuestionPreview(1);
              dQuestionSelect.onOpen();
            }} />
        </HStack>

        <Divider />
      </> : <>
        {/* question mode */}
      </>}

      {question != undefined ? <EditorContextProvider value={editorQuestion}>
        <QuestionEdit />
      </EditorContextProvider> : undefined}

    </VStack>

    <QuestionSelectionModal
      selected={questionIndex} total={paper?.questions?.length || 0}
      preview={questionPreviewIndex}
      onSelectPreview={selectQuestionPreview}
      onSelect={selectQuestionPaperMode}
      allowEdit
      onAdd={() => true}
      onEdit={(i) => console.log(i)}
      {...dQuestionSelect}
    >
      {questionPreview && <BaseQuestionPanel w='100%' question={questionPreview} />}
    </QuestionSelectionModal>

    <Modal {...dPreview} size='5xl'>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader>
          {t('page.edit.preview.header')}
        </ModalHeader>
        <ModalBody>
          <QuestionPanel
            height='68vh'
            overflowY='scroll'
            question={dPreviewQuestion as any}
            displaySolution
          />
        </ModalBody>
        <ModalFooter>
          <Button onClick={() => dPreview.onClose()}>
            {t('btn.close')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>

  </>;
};