import { Question } from "#/types";
import { useDisclosureWithData } from "#/utils/disclosure";
import { AddIcon, EditIcon } from "@chakra-ui/icons";
import { Button, HStack, IconButton, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Tag, VStack, Wrap } from "@chakra-ui/react";
import { SetStateAction, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";


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

export const QuestionEdit = (props: QuestionEditProps) => {

  const { question, onChange, onSave } = props;
  
  const { t } = useTranslation();

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
    await onChange({ tags: editTag.index == null 
      ? [...tags, currentTag] 
      : getChangedArray(tags, editTag.index, currentTag)});
    dTag.onClose();
  }, [onChange]);



  return <>
    <VStack>
      <span>{t('page.edit.nowEditing')}</span>
      {/* title */}
      <HStack>
        <span>{t('page.edit.title')}</span>
        <Input 
          value={question.title || ''} 
          onChange={async (e) => await onChange({ title: e.target.value })}
          isReadOnly={!editingTitle}
        />
        <EditButton value={editingTitle} setValue={setEditingTitle} />
      </HStack>
      {/* tags */}
      <Wrap>
        <span>{t('page.edit.tags')}</span>
        {(question.tags ?? []).map((t, i) => <Tag
          onDoubleClick={() => startEditingTag(i)}
        >{t}</Tag>)}
        
        { editingTags && <IconButton 
          onClick={() => startEditingTag(undefined)}
          aria-label={t('page.edit.addButton')}
          size='xs'
          icon={<AddIcon />}
        />}
        <EditButton value={editingTags} setValue={setEditingTags} />
      </Wrap>
    </VStack>


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
  </>;
};