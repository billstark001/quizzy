import { Question } from "@quizzy/base/types";
import {
  Box, Button, DataList, HStack,
  Input, NativeSelect, Switch,
  Textarea, TextareaProps, useBreakpointValue, VStack
} from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useEditorContext } from "@/utils/react-patch";
import { MdAdd } from "react-icons/md";
import { ChoiceQuestionOptionsEdit } from "./ChoiceQuestionOptionsEdit";
import { normalizeOptionOrBlankArray } from "@quizzy/base/db/question-id";
import { BlankQuestionBlanksEdit } from "./BlankQuestionBlankEdit";
import { TagButton } from "../common/TagList";
import TagListResolved from "../common/TagListResolved";
import { IoAddOutline } from "react-icons/io5";
import TagSelectDialog, { TagSelectState } from "../TagSelectDialog";
import { useDialog } from "@/utils/chakra";
import { Quizzy } from "@/data";
import TagInContextDialog, { TagInContextDialogData, TagInContextDialogResult } from "@/dialogs/TagInContextDialog";


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
  const tagInContextDialog = useDialog<TagInContextDialogData, TagInContextDialogResult>(TagInContextDialog);

  const open = async (tagIndex?: number, isCategory = false) => {
    const result = await dTag.open({
      object: question,
      tagIndex, 
      isCategory,
      contextType: 'question',
    });
    onChangeImmediate(result);
  }

  // Handle click on existing tag - show dialog with remove option
  const handleTagClick = async (tagId: string, index: number, isCategory = false) => {
    const tag = await Quizzy.getTagById(tagId);
    if (!tag) return;

    const result = await tagInContextDialog.open({
      tag,
      contextType: 'question',
    });

    if (result && result.action === 'remove') {
      // Remove tag from question
      const fieldName = isCategory ? 'categoryIds' : 'tagIds';
      const currentIds = question[fieldName] ?? [];
      const newIds = currentIds.filter((_, i) => i !== index);
      onChangeImmediate({ [fieldName]: newIds });
    }
  };

  const o = useBreakpointValue({
    base: 'vertical',
    md: 'horizontal',
  }) as any;

  return <DataList.Root orientation={o}>
    <DataList.Item >
      <DataList.ItemLabel>{t('page.edit.title')}</DataList.ItemLabel>
      <Input {...edit('title', { debounce: true })} />
    </DataList.Item>

    <DataList.Item >
      <DataList.ItemLabel>{t('page.edit.type')}</DataList.ItemLabel>
      <NativeSelect.Root {...edit('type')}>
        <NativeSelect.Field>
          <option value=''>{t('common.select.default')}</option>
          {['choice', 'blank', 'text'].map(x => (
            <option key={x} value={x}>{t('meta.question.type.' + x)}</option>
          ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
    </DataList.Item>

    <DataList.Item >
      <DataList.ItemLabel>{t('page.edit.tags')}</DataList.ItemLabel>
      <TagListResolved tagIds={question.tagIds}
        onClick={(_e, tagId, i) => handleTagClick(tagId, i, false)}
      >
        <TagButton onClick={() => open()}><IoAddOutline /></TagButton>
      </TagListResolved>
    </DataList.Item>

    <DataList.Item >
      <DataList.ItemLabel>{t('page.edit.categories')}</DataList.ItemLabel>
      <TagListResolved tagIds={question.categoryIds}
        onClick={(_e, tagId, i) => handleTagClick(tagId, i, true)}
      >
        <TagButton onClick={() =>
          open(undefined, true)}><IoAddOutline /></TagButton>
      </TagListResolved>
    </DataList.Item>

    <DataList.Item >
      <DataList.ItemLabel>{t('page.edit.content')}</DataList.ItemLabel>
      <Textarea2 {...edit('content', { debounce: true })} />
    </DataList.Item>

    {question.type === 'choice' && <DataList.Item>
      <DataList.ItemLabel as={VStack} alignItems='flex-start'>
        <Box>{t('page.edit.choice._')}</Box>
        <Button size='sm'
          p={1} variant='outline' minH={0}
          onClick={() => {
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
      </DataList.ItemLabel>
      <DataList.ItemValue as={VStack} alignItems='stretch'>

        <ChoiceQuestionOptionsEdit question={question} />
      </DataList.ItemValue>
    </DataList.Item>}

    {question.type === 'blank' && <DataList.Item>
      <DataList.ItemLabel as={VStack} alignItems='flex-start'>
        <Box>{t('page.edit.blank._')}</Box>
        <Button size='sm'
          p={1} variant='outline' minH={0}
          onClick={() => {
            onChangeImmediate({
              blanks: normalizeOptionOrBlankArray(
                [{ key: 'key-0' }, ...(question.blanks ?? [])]
              )
            })
          }}><MdAdd /> {t('page.edit.blank.addTop')}</Button>
      </DataList.ItemLabel>
      <BlankQuestionBlanksEdit question={question} />
    </DataList.Item>}

    <DataList.Item >
      <DataList.ItemLabel>{t('page.edit.solution')}</DataList.ItemLabel>
      <Textarea2 {...edit('solution', { debounce: true })} />
    </DataList.Item>

    <dTag.Root />
    <tagInContextDialog.Root />

  </DataList.Root>;

};