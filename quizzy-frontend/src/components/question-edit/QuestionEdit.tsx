import { Question } from "@quizzy/base/types";
import {
  Box, Button, HStack,
  Input, NativeSelect, Switch,
  Textarea, TextareaProps, VStack
} from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useEditorContext } from "@/utils/react-patch";
import { MdAdd } from "react-icons/md";
import { ChoiceQuestionOptionsEdit } from "./ChoiceQuestionOptionsEdit";
import { normalizeOptionOrBlankArray } from "@quizzy/base/db/question-id";
import { BlankQuestionBlanksEdit } from "./BlankQuestionBlankEdit";
import EditForm, { EditFormItem } from "../common/EditForm";
import TagList, { TagButton } from "../common/TagList";
import { IoAddOutline } from "react-icons/io5";
import TagSelectDialog, { TagSelectState } from "../TagSelectDialog";
import { useDialog } from "@/utils/chakra";


const _adjustHeight = (t: HTMLTextAreaElement) => {
  const scrollHeight = window.scrollY;
  t.style.height = '5px';
  t.style.height = `${t.scrollHeight + 10}px`;
  requestAnimationFrame(() => window.scrollTo(0, scrollHeight));
};

export const Textarea2 = (props: Omit<TextareaProps, 'children'>) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const { onInput, ...rest } = props;
  // const onInput2: FormEventHandler<HTMLTextAreaElement> = useCallback((e) => {
  //   _adjustHeight(e.target as any); 
  //   onInput?.(e);
  // }, [onInput]);
  useEffect(
    () => void (ref.current && _adjustHeight(ref.current)),
    [ref, props.value]
  );
  return <Textarea resize='none' minH='4em' onInput={onInput} {...rest} ref={ref}>
  </Textarea>;
}

export const QuestionEdit = () => {

  const editor = useEditorContext<Question>();
  const { value: question, onChangeImmediate, edit } = editor;

  const { t } = useTranslation();

  // tags
  const dTag = useDialog<TagSelectState, Partial<Question>>(TagSelectDialog);

  const open = async (tagIndex?: number, isCategory = false) => {
    const result = await dTag.open({
      object: question,
      tagIndex, isCategory,
    });
    onChangeImmediate(result);
  }
  
  return <EditForm>
    <EditFormItem label={t('page.edit.title')}>
      <Input {...edit('title', { debounce: true })} />
    </EditFormItem>

    <EditFormItem label={t('page.edit.type')}>
      <NativeSelect.Root {...edit('type')}>
        <NativeSelect.Field>
          <option value=''>{t('common.select.default')}</option>
          {['choice', 'blank', 'text'].map(x => (
            <option key={x} value={x}>{t('meta.question.type.' + x)}</option>
          ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
    </EditFormItem>

    <EditFormItem label={t('page.edit.tags')}>
      <TagList tags={question.tags}
        onDoubleClick={(_, __, i) => open(i)}
      >
        <TagButton onClick={() => open()}><IoAddOutline /></TagButton>
      </TagList>
    </EditFormItem>

    <EditFormItem label={t('page.edit.categories')}>
      <TagList tags={question.categories}
        onDoubleClick={(_, __, i) =>
          open(i, true)}
      >
        <TagButton onClick={() =>
          open(undefined, true)}><IoAddOutline /></TagButton>
      </TagList>
    </EditFormItem>

    <EditFormItem label={t('page.edit.content')}>
      <Textarea2 {...edit('content', { debounce: true })} />
    </EditFormItem>

    {question.type === 'choice' && <EditFormItem label={
      <VStack alignItems='flex-start'>
        <Box>{t('page.edit.choice._')}</Box>
        <Button onClick={() => {
          onChangeImmediate({
            options: normalizeOptionOrBlankArray(
              [{ content: '' }, ...(question.options ?? [])]
            )
          })
        }}><MdAdd /> {t('page.edit.choice.addTop')}</Button>
        <HStack>
          <Box>{t('page.edit.choice.multiple')}</Box>
          <Switch.Root {...edit('multiple', { debounce: true, key: 'checked' })}>
            <Switch.HiddenInput />
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Root>
        </HStack>
      </VStack>
    }>
      <ChoiceQuestionOptionsEdit question={question} />
    </EditFormItem>}

    {question.type === 'blank' && <EditFormItem label={
      <VStack alignItems='flex-start'>
        <Box>{t('page.edit.blank._')}</Box>
        <Button onClick={() => {
          onChangeImmediate({
            blanks: normalizeOptionOrBlankArray(
              [{ key: 'key-0' }, ...(question.blanks ?? [])]
            )
          })
        }}><MdAdd /> {t('page.edit.choice.addTop')}</Button>
      </VStack>
    }>
      <BlankQuestionBlanksEdit question={question} />
    </EditFormItem>}

    <EditFormItem label={t('page.edit.solution')}>
      <Textarea2 {...edit('solution', { debounce: true })} />
    </EditFormItem>

    <dTag.Root />

  </EditForm>;

};