import { PaperEdit } from "#/components/PaperEdit";
import { QuestionEdit } from "#/components/QuestionEdit";
import { BaseQuestionPanel, QuestionPanel } from "#/components/QuestionPanel";
import { QuestionSelectionModal } from "#/components/QuestionSelectionModal";
import { defaultQuestion, defaultQuizPaper, Question, QuizPaper } from "#/types";
import { standaloneToast, withHandler } from "#/utils";
import { useDisclosureWithData } from "#/utils/disclosure";
import { EditorContextProvider, useEditor, usePatch } from "#/utils/react-patch";
import { Quizzy, QuizzyCache, QuizzyCacheRaw, QuizzyRaw } from "@/data";
import { useAsyncMemo } from "@/utils/react";
import { ParamsDefinition, useParsedSearchParams } from "@/utils/react-router";
import { DragHandleIcon } from "@chakra-ui/icons";
import { AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, Box, Button, Divider, HStack, IconButton, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, useCallbackRef, useDisclosure, VStack } from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";


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

type _S = Readonly<({
  paper: QuizPaper;
  paperId: string;
} | {
  paper?: undefined;
  paperId?: undefined;
}) & ({
  question: Question;
  questionId: string;
} | {
  question?: undefined;
  questionId?: undefined;
})>;

type _E = Readonly<{
  question: Question,
  paper: QuizPaper,
}>;

export const EditPage = () => {

  // navigate
  const navigate = useNavigate();

  // alert dialog

  const dAlert = useDisclosure();
  const [alertType, setAlertType] = useState<string>('save');
  const cancelRef = useRef<any>();
  const { openAlert, closeAlert } = useMemo(() => {
    let promise: Promise<boolean> | undefined = undefined;
    let resolve: ((value: boolean) => void) | undefined = undefined;
    return {
      openAlert: (type: string) => {
        setAlertType(type);
        if (promise) {
          return promise;
        }
        promise = new Promise((res) => {
          resolve = res;
          dAlert.onOpen();
        });
        return promise;
      },
      closeAlert: (accept: boolean) => {
        resolve?.(accept);
        promise = undefined;
        resolve = undefined;
        dAlert.onClose();
      }
    }
  }, [dAlert.onOpen, dAlert.onClose]);

  // params
  const [searchParams, setSearchParams] = useParsedSearchParams(_parser);
  const {
    paper: paperIdProp,
    q: questionIndexProp,
    question: questionIdProp
  } = searchParams;
  const questionIndex = Math.max(Number.isNaN(questionIndexProp)
    ? 0 : questionIndexProp!, 1);

  // fetch the paper and question we need
  const fetchData = withHandler(async (): Promise<_S> => {
    // first try to get paper and question by index
    const paper = paperIdProp
      ? await (QuizzyRaw.getQuizPaper(paperIdProp).catch(() => void 0)) ?? undefined
      : undefined;
    if (paper) {
      const questionId = paper.questions[questionIndex - 1] || undefined;
      const question = questionId
        ? (await (QuizzyRaw.getQuestions([questionId])).catch(() => void 0))?.[0] ?? undefined
        : undefined;
      if (question) {
        return { paperId: paperIdProp!, paper, questionId: questionId!, question };
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
  }, { def: {} as _S, deps: [paperIdProp, questionIndex, questionIdProp], notifySuccess: undefined, });


  const dQuestionSelect = useDisclosure();
  const { t } = useTranslation();

  const { data, refresh } = useAsyncMemo(fetchData, [paperIdProp, questionIndex, questionIdProp]);
  const { paperId, paper, questionId, question } = data ?? ({} as _S);

  // at this point, paper <-> paperId, question <-> questionId are linked
  const sessionId = paperId
    ? `paper:${paperId}+${questionIndex}`
    : `question:${questionId}`;

  // editing states
  const [editingState, setEditingState] = useState<_E>(() => ({
    question: defaultQuestion(),
    paper: defaultQuizPaper()
  }));

  // patch & update patch
  const patch = usePatch({
    value: editingState, setValue: (v) => {
      setEditingState(v);
    }, maxLength: 16
  });
  const patchPaper = (pp: Partial<QuizPaper>) => patch.onEdit({
    paper: { ...editingState.paper, ...pp }
  });
  const patchQuestion = (pp: Partial<Question>) => patch.onEdit({
    question: { ...editingState.question, ...pp } as any
  });
  const patchPaperRef = useCallbackRef(patchPaper);
  const patchQuestionRef = useCallbackRef(patchQuestion);

  // this executes when initialized or ids changed
  // it resets the old edit record
  useEffect(() => void (async () => {
    // try to read data from local cache, apply if successful
    let cachedState: Partial<_E> | undefined = await (QuizzyCacheRaw.loadRecord('edit', sessionId)
      .catch(() => void 0));
    if (cachedState && !await openAlert('loadCache')) {
      // discard the cache
      cachedState = undefined;
      await (QuizzyCacheRaw.clearRecord('edit', sessionId).catch(() => void 0));
    }
    const state: _E = {
      question: cachedState?.question ?? question ?? defaultQuestion(),
      paper: cachedState?.paper ?? paper ?? defaultQuizPaper(),
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
    if (patch.totalStep === 0 || await openAlert('discard')) {
      // this means to discard
      setSearchParams({ q: index });
    }
  }, [setSearchParams, patch, openAlert]);

  // save current edition
  const save = useCallback(async () => {
    if (!await openAlert('save')) {
      // the save request is rejected
      return;
    }
    if (paperId) {
      await Quizzy.updateQuizPaper(paperId, editingState.paper);
    }
    await Quizzy.updateQuestion(questionId ?? '', editingState.question);
    // await refresh();
    // after the refresh, edit state is automatically cleared
  }, [paperId, questionId, editingState, refresh]);

  const deleteCurrent = useCallback(async () => {
    if (!await openAlert('delete')) {
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

  if (question == undefined) {
    return 'ERROR: QUESTION NOT FOUND';
  }

  return <>
    <VStack alignItems='stretch'>
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

      <EditorContextProvider value={editorQuestion}>
        <QuestionEdit />
      </EditorContextProvider>

    </VStack>

    <QuestionSelectionModal
      current={questionIndex} total={paper?.questions?.length || 1}
      index={questionPreviewIndex}
      setIndex={selectQuestionPreview}
      onSelect={selectQuestionPaperMode}
      {...dQuestionSelect}
      question={questionPreview ? <BaseQuestionPanel w='100%' question={questionPreview} /> : <></>}
    />

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

    <AlertDialog
      {...dAlert}
      leastDestructiveRef={cancelRef}
      onClose={() => closeAlert(false)}
    >
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize='lg' fontWeight='bold'>
            {t('page.edit.alert.' + alertType)}
          </AlertDialogHeader>

          <AlertDialogBody>
            {alertType === 'loadCache' ? <>
              There is a cached result. Do you want to load it?
            </> : undefined}
            {alertType === 'discard' ? <>
              Are you sure? The unsaved changes will be discarded.
            </> : undefined}
            {alertType === 'save' || alertType === 'delete' ? <>
              Are you sure? The changes cannot be undone.
            </> : undefined}
          </AlertDialogBody>

          <AlertDialogFooter>
            <Button ref={cancelRef}
              colorScheme={alertType === 'loadCache' ? 'red' : undefined}
              onClick={() => closeAlert(false)}>
              {alertType === 'loadCache' ? 'Discard' : 'Cancel'}
            </Button>
            <Button
              colorScheme={alertType === 'loadCache' ? 'green' : 'red'}
              onClick={() => closeAlert(true)} ml={3}>
              {alertType === 'loadCache' ? 'Load' : 'Confirm'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>

  </>;
};