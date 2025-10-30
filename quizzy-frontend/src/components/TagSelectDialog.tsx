import { Question, TagSearchResult, Tag } from "@quizzy/base/types";
import {
  Button, Input, useCallbackRef, VStack,
  Wrap
} from "@chakra-ui/react";
import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { QuizzyWrapped } from "@/data";
import { debounce, DebounceReturn } from "@/utils/debounce";
import { getChangedArray } from "@/utils/array";
import TagList from "./common/TagList";
import {
  DialogRoot, DialogBody, DialogCloseTrigger,
  DialogContent, DialogFooter, DialogHeader
} from "./ui/dialog";
import { DialogRootNoChildrenProps, UseDialogYieldedRootProps, useDialog } from "@/utils/chakra";
import TagInContextDialog, { TagInContextDialogData, TagInContextDialogResult } from "@/dialogs/TagInContextDialog";

export type TagSelectState = {
  object: Readonly<{
    tagIds?: string[];
    categoryIds?: string[];
  }>;
  tagIndex?: number,
  isCategory?: boolean,
  contextType?: 'question' | 'paper',
};

const _d = (): TagSearchResult => ({
  question: [], questionTags: [], paper: [], paperTags: [],
});

export const TagSelectDialog = (
  props: DialogRootNoChildrenProps & 
  UseDialogYieldedRootProps<TagSelectState, Partial<Question>>
) => {

  const {
    data, submit,
    ...dialogProps
  } = props;

  const { object, tagIndex, isCategory, contextType = 'question' } = data ?? {};

  const { t } = useTranslation();
  const tagInContextDialog = useDialog<TagInContextDialogData, TagInContextDialogResult>(TagInContextDialog);

  const [currentTag, setCurrentTag] = useState('');
  const [origArr, setOrigArr] = useState<readonly string[]>([]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const origArr = isCategory 
      ? (object?.categoryIds ?? [])
      : (object?.tagIds ?? []);
    setOrigArr(origArr ?? []);
    
    // If editing an existing tag, resolve the ID to name
    const origId = (tagIndex == null ? undefined : origArr?.[tagIndex]) ?? '';
    if (origId) {
      QuizzyWrapped.getTagById(origId).then(tag => {
        if (tag) {
          setCurrentTag(tag.mainName);
        } else {
          setCurrentTag('');
        }
      });
    } else {
      setCurrentTag('');
    }
    setListExpanded(false);
  }, [open, object, tagIndex, isCategory]);

  const submitTag = useCallback(async () => {
    if (!currentTag.trim()) {
      return;
    }
    
    // Check if tag already exists
    const existingTag = await QuizzyWrapped.getTag(currentTag).catch(() => null);
    
    let finalTag: Tag | null = existingTag;
    
    // If tag doesn't exist, show dialog to confirm creation
    if (!existingTag) {
      const result = await tagInContextDialog.open({
        initialName: currentTag,
        contextType,
      });
      
      if (result.action === 'cancel') {
        return; // User cancelled
      }
      
      if (result.action === 'add') {
        // Create the new tag with user's input
        finalTag = await QuizzyWrapped.getTag({
          mainName: result.mainName,
          alternatives: result.alternatives,
        });
      }
    }
    
    if (!finalTag) {
      return;
    }
    
    const tagId = finalTag.id;
    
    // Update using tag IDs (new system)
    const resultObject = {
      [isCategory ? 'categoryIds' : 'tagIds']: tagIndex == null
        ? [...origArr, tagId]
        : getChangedArray(origArr, tagIndex, tagId)
    };
    submit(resultObject);
  }, [submit, currentTag, isCategory, tagIndex, origArr, contextType, tagInContextDialog]);

  // display list
  const [listExpanded, setListExpanded] = useState(false);
  const [tagSearch, setTagSearch] = useState(_d);

  const performSearch = useCallback(async (currentTag: string) => {
    const result = currentTag ? await QuizzyWrapped.generateTagHint(currentTag) : undefined;
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

  return <>
    <DialogRoot closeOnInteractOutside={false}
      {...dialogProps}>
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
          <Button colorPalette='red' onClick={() => submit({})}>{t('common.btn.cancel')}</Button>
          <Button colorPalette='purple' onClick={submitTag}>{t('common.btn.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
    <tagInContextDialog.Root />
  </>;
};

export default TagSelectDialog;