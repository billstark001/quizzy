import { PaperEdit } from "#/components/PaperEdit";
import { QuestionEdit } from "#/components/QuestionEdit";
import { BaseQuestionPanel, QuestionPanel } from "#/components/QuestionPanel";
import { QuestionSelectionModal } from "#/components/QuestionSelectionModal";
import { Question, QuizPaper } from "#/types";
import { withHandler } from "#/utils";
import { useDisclosureWithData } from "#/utils/disclosure";
import { EditorContextProvider, useEditor, usePatch } from "#/utils/react-patch";
import { Quizzy, QuizzyRaw } from "@/data";
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

type _S = readonly [QuizPaper | undefined, Question | undefined, string | undefined];

export const EditPage = () => {
  const [searchParams, setSearchParams] = useParsedSearchParams(_parser);
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

  const { data: _q, refresh } = useAsyncMemo(fetchData, [paperId, questionIndex, questionIdOrig]);
  const [paper, question, questionId] = _q ?? [undefined, undefined, undefined];

  const [editState, setEditState] = useState<{
    question: Question,
    paper: QuizPaper,
  }>({
    question: { id: '', type: 'choice', content: '', options: [] },
    paper: { id: '', name: '', questions: [] },
  });

  // patch & update patch
  const patch = usePatch({
    value: editState, setValue: (v) => {
      setEditState(v);
    }, maxLength: 16
  });
  const patchPaper = (pp: Partial<QuizPaper>) => patch.onEdit({
    paper: { ...editState.paper, ...pp }
  });
  const patchQuestion = (pp: Partial<Question>) => patch.onEdit({
    question: { ...editState.question, ...pp } as any
  });
  const patchPaperRef = useCallbackRef(patchPaper);
  const patchQuestionRef = useCallbackRef(patchQuestion);

  // this executes when initialized
  // it resets the old edit record
  useEffect(() => {
    const e = { ...editState };
    if (question) {
      e.question = question;
    }
    if (paper) {
      e.paper = paper;
    }
    setEditState(e);
    patch.onClear(e);
  }, [question, paper]);

  // editor
  const editorQuestion = useEditor({
    value: editState.question,
    onChange: patchQuestionRef,
  });
  const editorPaper = useEditor({
    value: editState.paper,
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

  // select & save

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

  const selectQuestionPaperMode = useCallback(async (index: number) => {
    // ask user to save if edited
    if (patch.totalStep === 0 || await openAlert('discard')) {
      // this means to discard
      setSearchParams({ q: index });
    }
  }, [setSearchParams, patch, openAlert]);

  const save = useCallback(async () => {
    if (!await openAlert('save')) {
      // the save request is rejected
      return;
    }
    if (paperId) {
      await Quizzy.updateQuizPaper(paperId, editState.paper);
    }
    await Quizzy.updateQuestion(questionId ?? '', editState.question);
    // await refresh();
    // after the refresh, edit state is automatically cleared
  }, [paperId, questionId, editState, refresh]);

  const navigate = useNavigate();
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
              q.onOpen();
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
      {...q}
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
            Are you sure? 
            {alertType === 'discard' ? <>The unsaved changes will be discarded.</> : undefined}
            {alertType === 'save' || alertType === 'delete' ? <>The changes cannot be undone.</> : undefined}
          </AlertDialogBody>

          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={() => closeAlert(false)}>
              Cancel
            </Button>
            <Button colorScheme='red' onClick={() => closeAlert(true)} ml={3}>
              Confirm
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>

  </>;
};