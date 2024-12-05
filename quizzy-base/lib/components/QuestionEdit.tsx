import { ChoiceQuestion, ChoiceQuestionOption, Question } from "#/types";
import { useDisclosureWithData } from "#/utils/disclosure";
import { numberToLetters } from "#/utils/string";
import { AddIcon, DeleteIcon, DragHandleIcon } from "@chakra-ui/icons";
import { Box, BoxProps, Button, Code, Grid, HStack, IconButton, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select, Switch, Tag, Textarea, TextareaProps, useCallbackRef, useDisclosure, VStack, Wrap } from "@chakra-ui/react";
import { FocusEventHandler, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { QuestionSelectionModal } from "./QuestionSelectionModal";
import { BaseQuestionPanel } from "./QuestionPanel";
import { debounce, DebounceProps, DebounceReturn } from "#/utils/debounce";

export type QuestionUpdater = (patch: Partial<Question>) => void | Promise<void>;

export type QuestionEditProps = {
  question: Question;
  onChange?: QuestionUpdater;
};

const getChangedArray = <T,>(arr: T[], index: number, value: T) => {
  return arr.map((x, i) => i == index ? value : x);
};

const ChoiceBox = ({ children, ...props }: BoxProps) => <Box
  minH='3em' minW='3em' borderRadius='0.7em'
  display='flex' justifyContent='center' alignItems='center'
  mr='0.5em' {...props}
>
  {children}
</Box>;

type _E = {
  index: number,
  type: 'drag-start' | 'drag' | 'drop' | 'drag-end' | 'add' | 'delete',
  target: HTMLDivElement,
};
type ChoiceQuestionOptionEditProps = {
  option: ChoiceQuestionOption,
  index: number,
  move?: 'up' | 'down',
  onChange?: (index: number, value: Partial<ChoiceQuestionOption>) => void,
  onBlur?: FocusEventHandler<HTMLDivElement>,
  onEvent?: (event: _E) => void,
};

export const ChoiceQuestionOptionEdit = (props: ChoiceQuestionOptionEditProps) => {

  const { option, index, move, onChange, onEvent, onBlur } = props;
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);

  const [draggable, setDraggable] = useState(false);

  return <HStack
    draggable={draggable} opacity={draggable ? 0.3 : undefined}
    w='100%' p='0.5em' transformOrigin='top left'
    border='1px solid' borderColor='gray.400' borderRadius='1em'
    transition="all 0.3s ease"
    transform={move ? `translateY(${move === 'up' ? '-40%' : '40%'})` : undefined}
    ref={ref}
    onDragStart={() => onEvent?.({ index, type: 'drag-start', target: ref.current! })}
    onDragOver={draggable ? undefined : (e) => e.preventDefault()}
    onDragEnter={() => {
      onEvent?.({ index, type: 'drag', target: ref.current! })
    }}
    onDrop={draggable ? undefined : (e) => {
      e.preventDefault();
      onEvent?.({ index, type: 'drop', target: ref.current! });
    }}
    onDragEnd={draggable ? () => {
      onEvent?.({ index, type: 'drag-end', target: ref.current! });
      setDraggable(false);
    } : undefined}
    onBlur={onBlur}
  >
    <ChoiceBox>
      <Code m='auto' background='transparent' fontSize='xl'>
        {numberToLetters(index + 1)}
      </Code>
    </ChoiceBox>
    <Input value={option.content} onChange={(e) => onChange?.(index, { content: e.target.value })} />
    <Switch isChecked={!!option.shouldChoose} onChange={(e) => onChange?.(index, { shouldChoose: !!e.target.checked })} />
    <IconButton aria-label={t('page.edit.editButton')}
      onMouseDown={() => setDraggable(true)}
      onMouseUp={() => setDraggable(false)}
      onMouseLeave={() => setDraggable(false)}
    ><DragHandleIcon /></IconButton>
    <IconButton aria-label={t('page.edit.editButton')}
      onClick={() => onEvent?.({ index, type: 'add', target: ref.current! })}
    ><AddIcon /></IconButton>
    <IconButton aria-label={t('page.edit.editButton')}
      onClick={() => onEvent?.({ index, type: 'delete', target: ref.current! })}
    ><DeleteIcon /></IconButton>
  </HStack>;
};

export const ChoiceQuestionOptionsEdit = (props: {
  question: ChoiceQuestion;
  onChangeDebounced: QuestionUpdater;
  onChangeDebouncedClear: () => void;
  onChangeImmediate: QuestionUpdater;
}) => {
  const { question, onChangeDebounced, onChangeImmediate, onChangeDebouncedClear } = props;
  const [draggingIndex, setDraggingIndex] = useState<number>();
  const [hoverIndex, setHoverIndex] = useState(-1);

  const isDragging = draggingIndex != null;
  const ref = useRef<HTMLDivElement>(null);

  const onEvent = useCallback((e: _E) => {
    const { index, type } = e;
    if (type === 'drag-start') {
      setDraggingIndex(index);
      setHoverIndex(index);
    } else if (type === 'drag' && isDragging) {
      setHoverIndex(index);
    } else if ((type === 'drag-end' || type === 'drop') && isDragging) {
      if (type === 'drop') {
        const newOptionList = question.options.map(x => ({ ...x }));
        const removed = newOptionList.splice(draggingIndex, 1)[0];
        newOptionList.splice(index, 0, removed);
        onChangeImmediate({ options: newOptionList });
      }
      setDraggingIndex(undefined);
      setHoverIndex(-1);
    } else if (type === 'add') {
      const newOptionList = question.options.map(x => ({ ...x }));
      newOptionList.splice(index + 1, 0, { content: '' });
      onChangeImmediate({ options: newOptionList });
    } else if (type === 'delete') {
      const newOptionList = question.options.map(x => ({ ...x }));
      newOptionList.splice(index, 1);
      onChangeImmediate({ options: newOptionList });
    }
  }, [setDraggingIndex, setHoverIndex, draggingIndex, question, onChangeImmediate]);

  const onChange2 = useCallback((index: number, value: Partial<ChoiceQuestionOption>) => {
    const newOptionList = question.options.map(x => ({ ...x }));
    newOptionList[index] = { ...newOptionList[index], ...value };
    onChangeDebounced({ options: newOptionList });
  }, [question, onChangeDebounced]);

  return <VStack
    ref={ref}
    backgroundColor={isDragging ? '#7f7f7f20' : undefined}
    outline={isDragging ? '1px solid gray' : undefined}
    borderRadius={4}
    transition="all 0.3s ease"
    onDragOver={(e) => e.preventDefault()}
    onDrop={() => onEvent({ index: hoverIndex, type: 'drop', target: ref.current! })}
  >
    {question.options.map((option, i) => <ChoiceQuestionOptionEdit
      key={i} move={isDragging
        ? i > draggingIndex && i <= hoverIndex ? 'up'
          : i < draggingIndex && i >= hoverIndex ? 'down'
            : undefined
        : undefined}
      option={option} index={i} onEvent={onEvent} onChange={onChange2}
      onBlur={onChangeDebouncedClear}
    />)}
  </VStack>;
};

const _adjustHeight = (t: HTMLTextAreaElement) => {
  const scrollHeight = window.scrollY;
  t.style.height = '5px';
  t.style.height = `${t.scrollHeight + 10}px`;
  requestAnimationFrame(() => window.scrollTo(0, scrollHeight));
};

const Textarea2 = (props: Omit<TextareaProps, 'children'>) => {
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

const debounceProps: DebounceProps<QuestionUpdater> = {
  merge(current, last) {
    if (last == null) {
      return current;
    }
    return [{ ...last[0], ...current[0] }] as [Partial<Question>];
  },
} as const;


export const QuestionEdit = (props: QuestionEditProps) => {

  const { question: questionProp, onChange: onChangeProp } = props;

  // question displayed to debounce
  const [questionDisplay, setQuestionDisplay] = useState<Question>();
  const question = questionDisplay ?? questionProp;

  const onChangeRef = useRef<QuestionUpdater>();
  useEffect(() => {
    onChangeRef.current = onChangeProp;
  }, [onChangeProp]);

  // this commits change to patch logically
  const onChangeLogical = useCallback((patch: Partial<Question>) => {
    console.log(patch);
    onChangeRef.current?.(patch);
    setQuestionDisplay(undefined);
  }, [onChangeRef, setQuestionDisplay]);

  // this debounces the logical commission
  const onChangeDebouncedRef = useRef<DebounceReturn<QuestionUpdater>>();
  useEffect(() => {
    onChangeDebouncedRef.current = debounce((onChangeLogical), 5000, debounceProps);
  }, [onChangeLogical]);
  if (!onChangeDebouncedRef.current) {
    onChangeDebouncedRef.current = debounce((onChangeLogical), 5000, debounceProps);
  }

  // this debounces and 'deceives' user
  const onChangeDebounced = useCallback((patch: Partial<Question>) => {
    setQuestionDisplay({ ...question, ...patch } as Question);
    onChangeDebouncedRef.current!(patch);
  }, [onChangeDebouncedRef, setQuestionDisplay, question]);

  // this commits logically and removes displayed question
  const onChangeImmediate = useCallback((patch: Partial<Question>) => {
    onChangeDebouncedRef.current!.clear();
    onChangeLogical(patch);
  }, [onChangeDebouncedRef, onChangeLogical]);

  const { t } = useTranslation();

  // pagination
  const q = useDisclosure();

  // tags

  const { data: editTag, ...dTag } = useDisclosureWithData<{
    index?: number,
    orig?: string,
  }>({});
  const [currentTag, setCurrentTag] = useState('');
  const startEditingTag = useCallback((index?: number) => {
    const orig = (index == null ? undefined : question.tags?.[index]) ?? '';
    setCurrentTag(orig);
    dTag.onOpen({ index, orig });
  }, [dTag.onOpen, setCurrentTag, question]);
  const submitTag = useCallback(async () => {
    const tags = question.tags ?? [];
    await onChangeImmediate({
      tags: editTag.index == null
        ? [...tags, currentTag]
        : getChangedArray(tags, editTag.index, currentTag)
    });
    dTag.onClose();
  }, [onChangeImmediate, currentTag]);

  return <>
    <Grid templateColumns='160px 1fr' gap={2}>
      <HStack gridColumn='1 / 3' justifyContent='space-between'>
        <Box>{t('page.edit.nowEditing')}</Box>
        <IconButton colorScheme='blue' aria-label={t('page.question.questions')} icon={<DragHandleIcon />}
          onClick={() => {
            // setQuestionSelect(currentQuestion);
            q.onOpen();
          }} />
      </HStack>
      {/* title */}
      <Box>{t('page.edit.title')}</Box>
      <Input
        value={question.title || ''}
        onChange={async (e) => await onChangeDebounced({ title: e.target.value })}
        onBlur={onChangeDebouncedRef.current!.clear}
      />
      {/* <EditButton value={editingTitle} setValue={setEditingTitle} /> */}

      {/* type */}
      <Box>{t('page.edit.type')}</Box>
      <Select
        value={question.type || ''}
        onChange={async (e) =>
          e.target.value
          && await onChangeImmediate({ type: e.target.value as Question['type'] })}
      >
        <option value=''>{t('page.edit.typeSelect')}</option>
        {['choice', 'blank', 'text'].map(x => <option key={x}
          value={x}>{t('question.type.' + x)}</option>)}
      </Select>

      {/* tags */}
      <Box>{t('page.edit.tags')}</Box>
      <Wrap>
        {(question.tags ?? []).map((t, i) => <Tag key={t}
          onDoubleClick={() => startEditingTag(i)}
        ><Box>{t}</Box></Tag>)}

        <IconButton
          onClick={() => startEditingTag(undefined)}
          aria-label={t('page.edit.addButton')}
          size='xs'
          icon={<AddIcon />}
        />
      </Wrap>

      {/* content */}
      <Box>{t('page.edit.content')}</Box>
      <HStack alignItems='flex-end' alignSelf='flex-end'>
        <Textarea2
          value={question.content}
          onChange={async (e) => await onChangeDebounced({ content: e.target.value })}
          onBlur={onChangeDebouncedRef.current!.clear}
        />
      </HStack>

      {question.type === 'choice' && <>
        <VStack alignItems='flex-start'>
          <Box>{t('page.edit.choice')}</Box>
          <Button leftIcon={<AddIcon />} onClick={() => {
            onChangeImmediate({ options: [{ content: '' }, ...question.options] })
          }}>{t('page.edit.choice.addTop')}</Button>
          <HStack>
            <Box>{t('page.edit.choice.multiple')}</Box>
            <Switch isChecked={!!question.multiple} onChange={(e) => onChangeDebounced({ multiple: !!e.target.checked })}
              onBlur={onChangeDebouncedRef.current!.clear} />
          </HStack>
        </VStack>
        <ChoiceQuestionOptionsEdit question={question}
          onChangeDebounced={onChangeDebounced}
          onChangeImmediate={onChangeImmediate}
          onChangeDebouncedClear={onChangeDebouncedRef.current!.clear}
        />
      </>}


      {/* solution */}
      <Box>{t('page.edit.solution')}</Box>
      <HStack alignItems='flex-end' alignSelf='flex-end'>
        <Textarea2
          value={question.solution}
          onChange={async (e) => await onChangeDebounced({ solution: e.target.value })}
          onBlur={onChangeDebouncedRef.current!.clear}
        />
      </HStack>
    </Grid>


    <Modal {...dTag} closeOnOverlayClick={false}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader>{t('page.edit.modal.tag.title')}</ModalHeader>
        <ModalBody as={VStack}>
          <Input value={currentTag} onChange={(e) => setCurrentTag(e.target.value)} />
        </ModalBody>
        <ModalFooter justifyContent='space-between'>
          <Button colorScheme='red' onClick={dTag.onClose}>{t('btn.cancel')}</Button>
          <Button colorScheme='blue' onClick={submitTag}>{t('btn.save')}</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>

    <QuestionSelectionModal
      index={20} total={80}
      current={25}

      {...q}
      question={question ? <BaseQuestionPanel w='100%' question={question} /> : <></>}
    />
  </>;
};