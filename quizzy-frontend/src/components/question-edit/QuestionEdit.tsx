import { Question } from "@quizzy/common/types";
import { useDisclosureWithData } from "@/utils/disclosure";
import {
  Box, Button, Grid, HStack, IconButton,
  Input, Select, Switch,
  SwitchProps, Tag, Textarea, TextareaProps, VStack, Wrap
} from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useEditorContext } from "@/utils/react-patch";
import TagSelectModal, { TagSelectState } from "../TagSelectModal";
import { MdAdd } from "react-icons/md";
import { ChoiceQuestionOptionsEdit } from "./ChoiceQuestionOptionsEdit";
import { normalizeOptionOrBlankArray } from "@quizzy/common/db/question-id";
import { BlankQuestionBlanksEdit } from "./BlankQuestionBlankEdit";


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

  return <>
    <Grid templateColumns='160px 1fr' gap={2}>

      {/* title */}
      <Box>{t('page.edit.title')}</Box>
      <Input {...edit('title', { debounce: true })} />
      {/* <EditButton value={editingTitle} setValue={setEditingTitle} /> */}

      {/* type */}
      <Box>{t('page.edit.type')}</Box>
      <Select {...edit('type')}>
        <option value=''>{t('common.select.default')}</option>
        {['choice', 'blank', 'text'].map(x => <option key={x}
          value={x}>{t('meta.question.type.' + x)}</option>)}
      </Select>

      {/* tags */}
      <Box>{t('page.edit.tags')}</Box>
      <Wrap>
        {(question.tags ?? []).map((t, i) => <Tag key={t}
          onDoubleClick={() => dTag.onOpen({ tagIndex: i })}
        ><Box>{t}</Box></Tag>)}

        <IconButton
          onClick={() => dTag.onOpen()}
          aria-label={t('page.edit.addButton')}
          size='xs'
          icon={<MdAdd />}
        />
      </Wrap>

      {/* categories */}
      <Box>{t('page.edit.categories')}</Box>
      <Wrap>
        {(question.categories ?? []).map((t, i) => <Tag key={t}
          onDoubleClick={() => dTag.onOpen({ tagIndex: i, isCategory: true })}
        ><Box>{t}</Box></Tag>)}

        <IconButton
          onClick={() => dTag.onOpen({ isCategory: true })}
          aria-label={t('page.edit.addButton')}
          size='xs'
          icon={<MdAdd />}
        />
      </Wrap>

      {/* content */}
      <Box>{t('page.edit.content')}</Box>
      <HStack alignItems='flex-end' alignSelf='flex-end'>
        <Textarea2 {...edit('content', { debounce: true })} />
      </HStack>

      {question.type === 'choice' && <>
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
        <ChoiceQuestionOptionsEdit question={question} />
      </>}

      {question.type === 'blank' && <>
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
        <BlankQuestionBlanksEdit question={question} />
      </>}


      {/* solution */}
      <Box>{t('page.edit.solution')}</Box>
      <HStack alignItems='flex-end' alignSelf='flex-end'>
        <Textarea2 {...edit('solution', { debounce: true })} />
      </HStack>
    </Grid>

    <TagSelectModal
      {...dTag} {...editTag}
      object={question} onChange={onChangeImmediate}
    />

  </>;
};