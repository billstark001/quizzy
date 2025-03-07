import { KeywordIndexed, TagSearchResult } from "@quizzy/base/types";
import {
  Button, DialogRootProps, Input, useCallbackRef, UseDisclosureReturn, VStack,
  Wrap
} from "@chakra-ui/react";
import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Quizzy } from "@/data";
import { debounce, DebounceReturn } from "@/utils/debounce";
import { getChangedArray } from "@/utils/array";
import TagList from "./common/TagList";
import { 
  DialogRoot, DialogBody, DialogCloseTrigger, 
  DialogContent, DialogFooter, DialogHeader 
} from "./ui/dialog";
import { getDialogController } from "@/utils/chakra";

export type TagSelectState = {
  tagIndex?: number,
  isCategory?: boolean,
};

const _d = (): TagSearchResult => ({
  question: [], questionTags: [], paper: [], paperTags: [],
});

export const TagSelectDialog = (props: Omit<DialogRootProps, 'children' | 'onSelect'> & {
  object: Readonly<KeywordIndexed>,
  onChange?: (patch: Partial<KeywordIndexed>) => void | Promise<void>,
  onSelect?: (tag: string) => void,
  dbIndex?: string,
} & TagSelectState & UseDisclosureReturn) => {

  const {
    isCategory, tagIndex,
    object, onChange, onSelect,
    ...dialogProps
  } = props;

  const { open, onClose } = dialogProps;

  const { t } = useTranslation();

  const [currentTag, setCurrentTag] = useState('');
  const [origArr, setOrigArr] = useState<readonly string[]>([]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const origArr = (isCategory ? object.categories : object.tags) ?? [];
    setOrigArr(origArr ?? []);
    const orig = (tagIndex == null ? undefined : origArr?.[tagIndex]) ?? '';
    setCurrentTag(orig);
  }, [open]);

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
    const result = currentTag ? await Quizzy.generateTagHint(currentTag) : undefined;
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

  const getRenderedTags = (t: string[], isTag = false, isPaper = false) =>
    <TagList tags={t} onClick={(_, x) => setCurrentTag(x)}
      tagStyle={{
        border: isTag ? '1px solid gray' : undefined,
        backgroundColor: isPaper ? undefined : 'transparent',
      }}
    />;

  return <DialogRoot closeOnInteractOutside={false} 
    {...dialogProps} {...getDialogController(dialogProps)}>
    <DialogContent>
      <DialogCloseTrigger />
      <DialogHeader>{t('dialog.tagSelect.header')}</DialogHeader>
      <DialogBody as={VStack} alignItems='stretch'>
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
      </DialogBody>
      <DialogFooter justifyContent='space-between'>
        <Button colorPalette='red' onClick={onClose}>{t('common.btn.cancel')}</Button>
        <Button colorPalette='purple' onClick={submitTag}>{t('common.btn.save')}</Button>
      </DialogFooter>
    </DialogContent>
  </DialogRoot>;
};

export default TagSelectDialog;