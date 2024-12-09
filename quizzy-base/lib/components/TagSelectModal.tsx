import { KeywordIndexed } from "#/types/technical";
import {
  Button, Input, Modal, ModalBody,
  ModalCloseButton, ModalContent, ModalFooter,
  ModalHeader, ModalOverlay, ModalProps, VStack
} from "@chakra-ui/react";
import { useState, useCallback, useEffect } from "react";
import { getChangedArray } from "./QuestionEdit";
import { useTranslation } from "react-i18next";

export type TagSelectState = {
  tagIndex?: number,
  isCategory?: boolean,
};

export const TagSelectModal = (props: Omit<ModalProps, 'children'> & {
  object: Readonly<KeywordIndexed>,
  onChange: (patch: Partial<KeywordIndexed>) => void
} & TagSelectState) => {

  const {
    isCategory, tagIndex,
    object, onChange,
    ...modalProps
  } = props;

  const { isOpen, onClose } = modalProps;

  const { t } = useTranslation();

  const [currentTag, setCurrentTag] = useState('');
  const [origArr, setOrigArr] = useState<readonly string[]>([]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const origArr = (isCategory ? object.categories : object.tags) ?? [];
    setOrigArr(origArr ?? []);
    const orig = (tagIndex == null ? undefined : origArr?.[tagIndex]) ?? '';
    setCurrentTag(orig);
  }, [isOpen]);

  const submitTag = useCallback(async () => {
    await onChange({
      [isCategory ? 'categories' : 'tags']: tagIndex == null
        ? [...origArr, currentTag]
        : getChangedArray(origArr, tagIndex, currentTag)
    });
    onClose();
  }, [onChange, onClose, currentTag, isCategory, tagIndex, origArr]);


  return <Modal closeOnOverlayClick={false} {...modalProps}>
    <ModalOverlay />
    <ModalContent>
      <ModalCloseButton />
      <ModalHeader>{t('page.edit.modal.tag.title')}</ModalHeader>
      <ModalBody as={VStack}>
        <Input value={currentTag} onChange={(e) => setCurrentTag(e.target.value)} />
      </ModalBody>
      <ModalFooter justifyContent='space-between'>
        <Button colorScheme='red' onClick={onClose}>{t('btn.cancel')}</Button>
        <Button colorScheme='blue' onClick={submitTag}>{t('btn.save')}</Button>
      </ModalFooter>
    </ModalContent>
  </Modal>;
};

export default TagSelectModal;