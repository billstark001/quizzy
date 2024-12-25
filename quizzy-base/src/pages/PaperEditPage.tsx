import { PaperEdit } from "@/components/PaperEdit";
import { QuestionEdit } from "@/components/QuestionEdit";
import { BaseQuestionPanel } from "@/components/QuestionPanel";
import { QuestionSelectionModal } from "@/components/QuestionSelectionModal";
import { defaultQuestion, defaultQuizPaper, Question, QuizPaper } from "@quizzy/common/types";
import { ID } from "@quizzy/common/types";
import { openDialog, standaloneToast, withHandler } from "@/utils";
import { useDisclosureWithData } from "@/utils/disclosure";
import { applyPatch, Patch } from "@quizzy/common/utils";
import { EditorContextProvider, useEditor, usePatch } from "@/utils/react-patch";
import { uuidV4B64 } from "@quizzy/common/utils";
import { Quizzy, QuizzyCache, QuizzyCacheRaw, QuizzyRaw } from "@/data";
import QuestionPreviewModal from "@/modals/QuestionPreviewModal";
import { useAsyncMemo } from "@/utils/react-async";
import { DragHandleIcon } from "@chakra-ui/icons";
import { Box, Button, Divider, HStack, IconButton, useCallbackRef, useDisclosure, VStack } from "@chakra-ui/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";


type EditState = Readonly<{
  question?: Question,
  paper: QuizPaper,
  questions: Readonly<Record<ID, Question>>,
}>;

type EditPatch = Readonly<({
  target: 'question';
} & (
    { opr?: 'patch'; value: Patch<Question>; }
    | { opr: 'replace-keep' | 'replace-remove'; value: Question; }
  )) | {
    target: 'paper';
    opr?: 'patch';
    value: Patch<QuizPaper>;
  }>;

const applyEditPatch = (base: EditState, patch: EditPatch): EditState => {
  const { target, opr, value } = patch;
  if (target === 'question' && (['replace-keep', 'replace-remove'].includes(opr ?? ''))) {
    const oldId = base.question?.id;
    return {
      ...base,
      question: value as Question,
      questions: (opr === 'replace-keep' && oldId) ? {
        ...base.questions,
        [oldId]: base.question, // keep the cache
      } : base.questions // discard the cache
    };
  }
  return {
    ...base,
    [target]: applyPatch(base[target] ?? {}, value),
  }
};

const RECORD_KEY = 'edit:paper';

export const PaperEditPage = (props: { paper?: string }) => {

  // navigate
  const navigate = useNavigate();

  // params
  const {
    paper: paperIdProp,
  } = props;

  const [questionIndex, setQuestionIndex] = useState(1);

  // fetch the paper and question we need
  const fetchPaper = withHandler(async (): Promise<Readonly<QuizPaper> | undefined> => {
    // try to get paper and question by index
    const paper = paperIdProp
      ? await (QuizzyRaw.getQuizPaper(paperIdProp).catch(() => void 0)) ?? undefined
      : undefined;
    return paper ?? undefined;
  }, { def: undefined, deps: [paperIdProp], notifySuccess: undefined, });

  const { data: paper } = useAsyncMemo(fetchPaper, [paperIdProp]);
  const paperId = paper?.id;

  const fetchQuestion = withHandler(async (questionIndexOverride?: number, paperOverride?: QuizPaper): Promise<Readonly<Question> | undefined> => {
    // try to get question inside paper by index
    const paperLogical = paperOverride ?? paper;
    if (paperLogical) {
      const questionId = paperLogical.questions[(questionIndexOverride ?? questionIndex) - 1] || undefined;
      const question = questionId
        ? (await (QuizzyRaw.getQuestions([questionId])).catch(() => void 0))?.[0] ?? undefined
        : undefined;
      return question ?? undefined;
    }
    return undefined;
  }, { def: undefined, deps: [paper, questionIndex], notifySuccess: undefined, });

  // const { data: question } = useAsyncMemo(fetchQuestion, [paper, questionIndex]);
  // const [question, setQuestion] = useState<Readonly<Question>>();
  // const questionId = question?.id;

  const dQuestionSelect = useDisclosure();
  const { t } = useTranslation();

  // at this point, paper <-> paperId, question <-> questionId are linked
  const sessionId = paperId
    ? `paper:${paperId}`
    : `paper:<blank>`;

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

  // initialized or ids changed
  // it resets the old edit record
  useEffect(() => void (async () => {
    // try to read data from local cache, apply if successful
    let cachedState: Partial<EditState> | undefined = await (QuizzyCacheRaw.loadRecord(RECORD_KEY, sessionId)
      .catch(() => void 0));
    if (cachedState && !await openDialog({
      id: 'load-cached-result',
      desc: 'There is a cached result. Do you want to load it?',
      type: 'load-discard',
    })) {
      // discard the cache
      cachedState = undefined;
      await (QuizzyCacheRaw.clearRecord(RECORD_KEY, sessionId).catch(() => void 0));
    }
    const state: EditState = {
      question: cachedState?.question
        ?? await fetchQuestion()
        ?? undefined,
      paper: cachedState?.paper
        ?? paper
        ?? defaultQuizPaper(),
      questions: { ...cachedState?.questions }
    }
    if (cachedState?.question || cachedState?.paper) {
      standaloneToast({
        status: 'info',
        title: t('page.edit.dataLoaded.title'),
        description: t('page.edit.dataLoaded.desc'),
      });
    }
    lastQuestionTotalStep.current = 0;
    setEditingState(state);
    patch.onClear(state);
  })().catch(console.error), [paperId]);

  // save record
  const saveRecordToCache = useCallbackRef(
    () => QuizzyCache.dumpRecord(RECORD_KEY, editingState, sessionId)
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
    onChange: (value) => patch.onEdit({ target: 'question', value }),
  });
  const editorPaper = useEditor({
    value: editingState.paper,
    onChange: (value) => patch.onEdit({ target: 'paper', value }),
  });

  // current question preview
  const [questionPreviewIndex, setQuestionPreviewIndex] = useState(1);
  const [questionPreview, setQuestionPreview] = useState<Question>();

  const selectQuestionPreview = useCallback((index: number) => {
    const q = editingState.paper.questions?.[index - 1];
    setQuestionPreviewIndex(index);
    Quizzy.getQuestions([q ?? '']).then(([question]) => setQuestionPreview(question));
  }, [setQuestionPreviewIndex, setQuestionPreview, editingState.paper.questions]);

  // select different questions
  const lastQuestionTotalStep = useRef(0);
  const selectQuestionPaperMode = useCallback(async (index: number) => {
    // ask user to save if edited
    setQuestionIndex(index);
    const newQuestion = await fetchQuestion(index, editingState.paper);
    if (!newQuestion) {
      await openDialog('Failed to fetch the question.');
      return;
    }
    const hasEdit = patch.totalStep != lastQuestionTotalStep.current;
    lastQuestionTotalStep.current = patch.totalStep + 1;
    // save or discard the current edit if has edit
    const doSave = hasEdit && await openDialog(<>
      Do you want to temporarily save or discard the current changes?
    </>, 'save-discard');
    patch.onEdit({
      target: 'question',
      opr: doSave ? 'replace-keep' : 'replace-remove',
      value: newQuestion,
    });
  }, [
    fetchQuestion, setQuestionIndex, 
    patch.totalStep, patch.onEdit, 
    lastQuestionTotalStep, editingState.paper,
  ]);

  // save & delete current edition
  const save = useCallback(async () => {
    if (!await openDialog(<div>
      <div>Are you sure? The changes cannot be undone.</div>
      {Object.values(editingState.questions ?? {}).map(q => q?.id
        ? <span id={q.id}>{q.id} {q.title}</span>
        : undefined
      )}
    </div>, 'alert-confirm')) {
      // the save request is rejected
      return;
    }
    // the save request is accepted
    if (paperId) {
      await Quizzy.updateQuizPaper(paperId, editingState.paper);
    }
    if (editingState.question) {
      await Quizzy.updateQuestion(editingState.question.id, editingState.question);
    }
    for (const q of Object.values(editingState.questions ?? {})) {
      if (!q?.id) continue;
      await Quizzy.updateQuestion(q.id, q);
    }
    await QuizzyCache.clearRecord(RECORD_KEY, sessionId);
  }, [paperId, editingState]);

  const deleteCurrent = useCallback(async () => {
    if (!await openDialog(<>
      Are you sure? The changes cannot be undone.
    </>, 'alert-confirm')) {
      // the delete request is rejected
      return;
    }
    await Quizzy.deleteQuizPaper(paperId ?? '');
    navigate('/papers');
  }, [paperId]);

  // preview
  const { data: dPreviewQuestion, ...dPreview } = useDisclosureWithData<Question | undefined>(undefined);

  // question edit
  const questionMap = useRef<Record<number, ID>>({});

  const onAddQuestion = withHandler(async (newIndex: number) => {
    const [newQuestionId] = await QuizzyRaw.importQuestions(
      defaultQuestion({ id: uuidV4B64() }),
    );
    questionMap.current[newIndex] = newQuestionId;
    return true;
  }, { cache: true, deps: [questionMap], def: false });

  const onQuestionSort = useCallback((newOrderOfIndex: readonly number[]) => {
    const oldOrderOfId = editingState.paper.questions ?? [];
    const newOrderOfId = newOrderOfIndex.map(
      i => (i <= oldOrderOfId.length 
        ? oldOrderOfId[i - 1] 
        : questionMap.current?.[i]) ?? ''
    );
    patch.onEdit({ target: 'paper', value: { questions: newOrderOfId }});
    questionMap.current = {};
  }, [questionMap, editingState.paper.questions, patch.onEdit]);

  // render

  if (paper == undefined) {
    return <>ERROR: NO QUIZ PAPER</>
  }

  return <>
    <VStack alignItems='stretch' onKeyDown={patch.onKeyInput} tabIndex={0}>

      {/* toolbar */}
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

      {/* paper edit */}
      <EditorContextProvider value={editorPaper}>
        <PaperEdit />
      </EditorContextProvider>
      <HStack justifyContent='space-between'>
        <Box>{t('page.edit.nowEditing', { questionIndex })}</Box>
        <IconButton colorScheme='blue' aria-label={t('page.question.questions')} icon={<DragHandleIcon />}
          onClick={() => {
            selectQuestionPreview(1);
            questionMap.current = {};
            dQuestionSelect.onOpen();
          }} />
      </HStack>

      <Divider />

      {editingState.question != undefined ? <EditorContextProvider value={editorQuestion}>
        <QuestionEdit />
      </EditorContextProvider> : undefined}

    </VStack>

    <QuestionSelectionModal
      selected={questionIndex} total={editingState.paper.questions?.length || 0}
      preview={questionPreviewIndex}
      onSelectPreview={selectQuestionPreview}
      onSelect={selectQuestionPaperMode}
      allowEdit
      onAdd={onAddQuestion}
      onEdit={onQuestionSort}
      {...dQuestionSelect}
    >
      {questionPreview && <BaseQuestionPanel w='100%' question={questionPreview} />}
    </QuestionSelectionModal>
    
    <QuestionPreviewModal {...dPreview} question={dPreviewQuestion} />

  </>;
};