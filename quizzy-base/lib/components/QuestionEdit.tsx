import { ChoiceQuestionOption, Question } from "#/types";
import { useDisclosureWithData } from "#/utils/disclosure";
import { numberToLetters } from "#/utils/string";
import { AddIcon, DeleteIcon, DragHandleIcon, EditIcon } from "@chakra-ui/icons";
import { Box, BoxProps, Button, Code, Grid, HStack, IconButton, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select, Tag, Textarea, TextareaProps, useDisclosure, VStack, Wrap } from "@chakra-ui/react";
import { SetStateAction, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import { QuestionSelectionModal } from "./QuestionSelectionModal";
import { BaseQuestionPanel } from "./QuestionPanel";


export type QuestionEditProps = {
  question: Question;
  onChange: (patch: Partial<Question>) => void | Promise<void>;
  onSave: (question: Question) => void | Promise<void>;
};

const EditButton = (props: { value?: boolean, setValue?: (x: SetStateAction<boolean>) => void }) => {
  const { value, setValue } = props;
  const { t } = useTranslation();
  return <IconButton
    colorScheme={value ? 'blue' : undefined}
    onClick={() => setValue?.(x => !x)}
    aria-label={t('page.edit.editButton')}
    icon={<EditIcon />}
  />;
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

export const ChoiceQuestionOptionEdit = (props: {
  option: ChoiceQuestionOption,
  index: number,
}) => {

  const { option, index, } = props;
  const { t } = useTranslation();

  return <HStack
    w='100%' p='0.5em'
    border='1px solid' borderColor='gray.400' borderRadius='1em'
    transition="background-color 0.3s ease"
  >
    <ChoiceBox>
      <Code m='auto' background='transparent' fontSize='xl'>
        {numberToLetters(index + 1)}
      </Code>
    </ChoiceBox>
    <Input value={option.content} />
    <IconButton aria-label={t('page.edit.editButton')}><DragHandleIcon /></IconButton>
    <IconButton aria-label={t('page.edit.editButton')}><AddIcon /></IconButton>
    <IconButton aria-label={t('page.edit.editButton')}><DeleteIcon /></IconButton>
  </HStack>;
};

const _textAreaStyle: TextareaProps = {
  resize: 'none',
  minH: '4em',
  onInput(e) {
    const t = (e.target as HTMLTextAreaElement);
    t.style.height = '5px';
    t.style.height = `${t.scrollHeight}px`;
  }
}

export const QuestionEdit = (props: QuestionEditProps) => {

  const { question, onChange, onSave } = props;

  const { t } = useTranslation();

  // pagination
  const q = useDisclosure();

  // title
  const [editingTitle, setEditingTitle] = useState(false);

  // tags

  const [editingTags, setEditingTags] = useState(false);
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
    await onChange({
      tags: editTag.index == null
        ? [...tags, currentTag]
        : getChangedArray(tags, editTag.index, currentTag)
    });
    dTag.onClose();
  }, [onChange]);

  // content

  const [editingContent, setEditingContent] = useState(false);

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
        onChange={async (e) => await onChange({ title: e.target.value })}
        isReadOnly={!editingTitle}
      />
      {/* <EditButton value={editingTitle} setValue={setEditingTitle} /> */}

      {/* type */}
      <Box>{t('page.edit.type')}</Box>
      <Select
        value={question.type || ''}
        onChange={async (e) => await onChange({ title: e.target.value })}
      >
        <option value=''>{t('page.edit.typeSelect')}</option>
        {['choice', 'blank', 'text'].map(x => <option
          value={x}>{t('question.type.' + x)}</option>)}
      </Select>

      {/* tags */}
      <Box>{t('page.edit.tags')}</Box>
      <Wrap>
        {(question.tags ?? []).map((t, i) => <Tag
          onDoubleClick={() => startEditingTag(i)}
        >{t}</Tag>)}

        {editingTags && <IconButton
          onClick={() => startEditingTag(undefined)}
          aria-label={t('page.edit.addButton')}
          size='xs'
          icon={<AddIcon />}
        />}
        <EditButton value={editingTags} setValue={setEditingTags} />
      </Wrap>

      {/* content */}
      <Box>{t('page.edit.content')}</Box>
      <HStack alignItems='flex-end' alignSelf='flex-end'>
        <Textarea
          value={question.content}
          onChange={async (e) => await onChange({ content: e.target.value })}
          {..._textAreaStyle}
        />
      </HStack>

      {question.type === 'choice' && <>
        <VStack alignItems='flex-start'>
          <Box>{t('page.edit.choice')}</Box>
          <Button leftIcon={<AddIcon />}>{t('page.edit.choice.addTop')}</Button>
        </VStack>
        <VStack>
          {question.options.map((option, i) => <ChoiceQuestionOptionEdit
            option={option} index={i}
          />)}
        </VStack>
      
      </>}


      {/* solution */}
      <Box>{t('page.edit.solution')}</Box>
      <HStack alignItems='flex-end' alignSelf='flex-end'>
        <Textarea
          value={question.solution}
          onChange={async (e) => await onChange({ solution: e.target.value })}
          {..._textAreaStyle}
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