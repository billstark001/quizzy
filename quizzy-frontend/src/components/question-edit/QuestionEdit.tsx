import { Question } from "@quizzy/common/types";
import { useDisclosureWithData } from "@/utils/disclosure";
import {
  Box, Button, HStack,
  Input, Select, Switch,
  SwitchProps, Textarea, TextareaProps, VStack
} from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useEditorContext } from "@/utils/react-patch";
import TagSelectModal, { TagSelectState } from "../TagSelectModal";
import { MdAdd } from "react-icons/md";
import { ChoiceQuestionOptionsEdit } from "./ChoiceQuestionOptionsEdit";
import { normalizeOptionOrBlankArray } from "@quizzy/common/db/question-id";
import { BlankQuestionBlanksEdit } from "./BlankQuestionBlankEdit";
import EditForm, { EditFormItem } from "../common/EditForm";
import TagList, { TagButton } from "../common/TagList";
import { IoAddOutline } from "react-icons/io5";


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

  const { data: editTag, ...dTag } = useDisclosureWithData<TagSelectState>({});

  return <EditForm>
    <EditFormItem label={t('page.edit.title')}>
      <Input {...edit('title', { debounce: true })} />
    </EditFormItem>

    <EditFormItem label={t('page.edit.type')}>
      <Select {...edit('type')}>
        <option value=''>{t('common.select.default')}</option>
        {['choice', 'blank', 'text'].map(x => <option key={x}
          value={x}>{t('meta.question.type.' + x)}</option>)}
      </Select>
    </EditFormItem>

    <EditFormItem label={t('page.edit.tags')}>
      <TagList tags={question.tags}
        onDoubleClick={(_, __, i) => dTag.onOpen({ tagIndex: i })}
      >
        <TagButton onClick={() => dTag.onOpen()} icon={<IoAddOutline />} />
      </TagList>
    </EditFormItem>

    <EditFormItem label={t('page.edit.categories')}>
      <TagList tags={question.categories}
        onDoubleClick={(_, __, i) =>
          dTag.onOpen({ tagIndex: i, isCategory: true })}
      >
        <TagButton onClick={() =>
          dTag.onOpen({ isCategory: true })} icon={<IoAddOutline />} />
      </TagList>
    </EditFormItem>

    <EditFormItem label={t('page.edit.content')}>
      <Textarea2 {...edit('content', { debounce: true })} />
    </EditFormItem>

    {question.type === 'choice' && <EditFormItem label={
      <VStack alignItems='flex-start'>
        <Box>{t('page.edit.choice._')}</Box>
        <Button leftIcon={<MdAdd />} onClick={() => {
          onChangeImmediate({
            options: normalizeOptionOrBlankArray(
              [{ content: '' }, ...(question.options ?? [])]
            )
          })
        }}>{t('page.edit.choice.addTop')}</Button>
        <HStack>
          <Box>{t('page.edit.choice.multiple')}</Box>
          <Switch {...edit<SwitchProps>('multiple', { debounce: true, key: 'isChecked' })} />
        </HStack>
      </VStack>
    }>
      <ChoiceQuestionOptionsEdit question={question} />
    </EditFormItem>}

    {question.type === 'blank' && <EditFormItem label={
      <VStack alignItems='flex-start'>
        <Box>{t('page.edit.blank._')}</Box>
        <Button leftIcon={<MdAdd />} onClick={() => {
          onChangeImmediate({
            blanks: normalizeOptionOrBlankArray(
              [{ key: 'key-0' }, ...(question.blanks ?? [])]
            )
          })
        }}>{t('page.edit.choice.addTop')}</Button>
      </VStack>
    }>
      <BlankQuestionBlanksEdit question={question} />
    </EditFormItem>}

    <EditFormItem label={t('page.edit.solution')}>
      <Textarea2 {...edit('solution', { debounce: true })} />
    </EditFormItem>

    <TagSelectModal
      {...dTag} {...editTag}
      object={question} onChange={onChangeImmediate}
    />

  </EditForm>;

};