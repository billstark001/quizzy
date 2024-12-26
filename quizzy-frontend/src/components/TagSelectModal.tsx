import { KeywordIndexed, TagSearchResult } from "@quizzy/common/types";
import {
  Button, Input, Modal, ModalBody,
  ModalCloseButton, ModalContent, ModalFooter,
  ModalHeader, ModalOverlay, ModalProps, Tag, useCallbackRef, VStack,
  Wrap
} from "@chakra-ui/react";
import { useState, useCallback, useEffect, useRef } from "react";
import { getChangedArray } from "./QuestionEdit";
import { useTranslation } from "react-i18next";
import { Quizzy } from "@/data";
import { debounce, DebounceReturn } from "@/utils/debounce";

export type TagSelectState = {
  tagIndex?: number,
  isCategory?: boolean,
};

const _d = (): TagSearchResult => ({
  question: [], questionTags: [], paper: [], paperTags: [],
});

export const TagSelectModal = (props: Omit<ModalProps, 'children' | 'onSelect'> & {
  object: Readonly<KeywordIndexed>,
  onChange?: (patch: Partial<KeywordIndexed>) => void | Promise<void>,
  onSelect?: (tag: string) => void,
  dbIndex?: string,
} & TagSelectState) => {

  const {
    isCategory, tagIndex,
    object, onChange, onSelect,
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
    await onChange?.({
      [isCategory ? 'categories' : 'tags']: tagIndex == null
        ? [...origArr, currentTag]
        : getChangedArray(origArr, tagIndex, currentTag)
    });
    onSelect?.(currentTag);
    onClose();
  }, [onChange, onSelect, onClose, currentTag, isCategory, tagIndex, origArr]);

  // display list
  const [listExpanded, setListExpanded] = useState(false);
  const [tagSearch, setTagSearch] = useState(_d);

  const performSearch = useCallback(async (currentTag: string) => {
    const result = currentTag ? await Quizzy.findTags(currentTag) : undefined;
    const l = result
      ? result.paper.length + result.paperTags.length + result.question.length + result.questionTags.length
      : 0;
    if (l) {
      setListExpanded(true);
      setTagSearch(result!);
    } else {
      setListExpanded(false);
    }
  }, [currentTag]);

  const performSearchRef = useCallbackRef(performSearch);

  const debouncedSearch = useRef<DebounceReturn<typeof performSearch>>(undefined);
  useEffect(() => {
    debouncedSearch.current?.clear();
    debouncedSearch.current = debounce(performSearch, 500);
  }, [performSearchRef, debouncedSearch]);

  const getRenderedTags = (t: string[], isTag = false, isPaper = false) => t.map(x => <Tag 
    key={x} cursor='pointer' onClick={() => setCurrentTag(x)}
    border={isTag ? '1px solid gray' : undefined}
    background={isPaper ? undefined : 'transparent'}
  >{x}</Tag>);

  return <Modal closeOnOverlayClick={false} {...modalProps}>
    <ModalOverlay />
    <ModalContent>
      <ModalCloseButton />
      <ModalHeader>{t('modal.tagSelect.header')}</ModalHeader>
      <ModalBody as={VStack} alignItems='stretch'>
        <Input value={currentTag} onChange={(e) => {
          setCurrentTag(e.target.value);
          debouncedSearch.current?.(e.target.value);
        }} />
        {listExpanded && <Wrap>
          {getRenderedTags(tagSearch.questionTags, true)}
          {getRenderedTags(tagSearch.question)}
          {getRenderedTags(tagSearch.paperTags, true, true)}
          {getRenderedTags(tagSearch.paper, false, true)}
        </Wrap>}
      </ModalBody>
      <ModalFooter justifyContent='space-between'>
        <Button colorScheme='red' onClick={onClose}>{t('common.btn.cancel')}</Button>
        <Button colorScheme='blue' onClick={submitTag}>{t('common.btn.save')}</Button>
      </ModalFooter>
    </ModalContent>
  </Modal>;
};

export default TagSelectModal;