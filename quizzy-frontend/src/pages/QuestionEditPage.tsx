import { QuestionEdit } from "@/components/question-edit/QuestionEdit";
import { defaultQuestion, Question } from "@quizzy/base/types";
import { openDialog, withHandler } from "@/components/handler";
import { applyPatch, Patch } from "@quizzy/base/utils";
import { EditorContextProvider, useEditor, usePatch } from "@/utils/react-patch";
import { Quizzy, QuizzyCache, QuizzyCacheRaw, QuizzyRaw } from "@/data";
import QuestionPreviewDialog from "@/dialogs/QuestionPreviewDialog";
import { Button, Separator, HStack, useCallbackRef, VStack, Box } from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import BookmarkIcon from "@/components/bookmark/BookmarkIcon";
import { useDialog } from "@/utils/chakra";

const RECORD_KEY = 'edit:question';

export const QuestionEditPage = (props: { question?: string }) => {

  // navigate
  const navigate = useNavigate();

  // params
  const {
    question: questionIdProp,
  } = props;

  const { t } = useTranslation();

  // fetch the question we need
  const fetchQuestion = withHandler(async (): Promise<Readonly<Question> | undefined> => {
    // try to get question by id
    const question = questionIdProp
      ? await (QuizzyRaw.getQuestion(questionIdProp).catch(() => void 0)) ?? undefined
      : undefined;
    return question ?? undefined;
  }, { def: undefined, deps: [questionIdProp], notifySuccess: undefined, });

  const { data: question } = useQuery({
    queryKey: ['question', questionIdProp],
    queryFn: fetchQuestion,
  });
  const questionId = question?.id;

  const sessionId = questionId
    ? `question:${questionId}`
    : `question:<blank>`;

  // editing states
  const [editingState, setEditingState] = useState<Question>(defaultQuestion);

  // patch & update patch
  const patch = usePatch<Question, Patch<Question>>({
    value: editingState, setValue: setEditingState, maxLength: 16,
    applyPatch: applyPatch,
  });

  // initialized or ids changed
  // it resets the old edit record
  useEffect(() => void (async () => {
    // try to read data from local cache, apply if successful
    let cachedState: Question | undefined = await (QuizzyCacheRaw.loadRecord(RECORD_KEY, sessionId)
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
    const state = cachedState ?? await fetchQuestion() ?? defaultQuestion();
    setEditingState(state);
    patch.onClear(state);
  })().catch(console.error), [questionId]);

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
    value: editingState,
    onChange: patch.onEdit,
  });


  // save & delete current edition
  const save = useCallback(async () => {
    if (!await openDialog(<div>
      <div>Are you sure? The changes cannot be undone.</div>
    </div>, 'alert-confirm')) {
      // the save request is rejected
      return;
    }
    // the save request is accepted
    if (questionId) {
      await Quizzy.updateQuestion(questionId, editingState);
    }
    await QuizzyCache.clearRecord(RECORD_KEY, sessionId);
  }, [questionId, editingState]);

  const deleteCurrent = useCallback(async () => {
    if (!await openDialog(<>
      Are you sure? The changes cannot be undone.
    </>, 'alert-confirm')) {
      // the delete request is rejected
      return;
    }
    await Quizzy.deleteQuestion(questionId ?? '');
    navigate('/questions');
  }, [questionId]);

  // preview

  const dPreview = useDialog<Question | undefined, any>(QuestionPreviewDialog);

  // render

  if (question == undefined) {
    return <>ERROR: NO QUIZ QUESTION</>
  }

  return <>
    <VStack alignItems='stretch' onKeyDown={patch.onKeyInput} tabIndex={0}>

      {/* toolbar */}
      <HStack>
        <Button onClick={patch.onUndo}>{t('page.edit.btn.undo')}</Button>
        <Button onClick={patch.onRedo}>{t('page.edit.btn.redo')}</Button>
        <Button onClick={save}>{t('page.edit.btn.save')}</Button>
        <Button onClick={saveRecordToCache}>{t('page.edit.btn.saveDraft')}</Button>
        <Button onClick={deleteCurrent}>{t('page.edit.btn.delete')}</Button>
        <Button onClick={() => {
          dPreview.open(editorQuestion.fakeValue ?? editorQuestion.value);
        }}>{t('page.edit.btn.preview')}</Button>
        <Box flex='1' p={1} />
        <BookmarkIcon
          itemId={editorQuestion.fakeValue?.id ?? editorQuestion.value?.id ?? ''}
          isQuestion
        />
      </HStack>

      <Separator />
      <EditorContextProvider value={editorQuestion}>
        <QuestionEdit />
      </EditorContextProvider>

    </VStack>

    <dPreview.Root />
  </>;
};