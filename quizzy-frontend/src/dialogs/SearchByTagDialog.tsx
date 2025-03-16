import QuestionCard, { QuestionCardProps } from "@/components/item-brief/QuestionCard";
import { DialogBody, DialogCloseTrigger, DialogContent, DialogFooter, DialogHeader, DialogRoot } from "@/components/ui/dialog";
import { Quizzy } from "@/data";
import { DialogRootNoChildrenProps, UseDialogYieldedRootProps } from "@/utils/chakra";
import { Button, VStack } from "@chakra-ui/react";
import { Tag } from "@quizzy/base/types";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export type SearchByTagDialogData = {
  tags: readonly Tag[],
  isCategory?: boolean,
  preview?: QuestionCardProps['preview']
};

export const SearchByTagDialog = (
  props: DialogRootNoChildrenProps
    & UseDialogYieldedRootProps<SearchByTagDialogData | undefined, any>
) => {
  const { data, submit, ...rest } = props;
  const open = rest.open;
  const { tags, preview } = data ?? {};

  const [searchCondition, setSearchCondition] = useState<string>();
  // const [currentPage, setCurrentPage] = useState(0);
  const currentPage = 0;

  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const cond = tags?.map(t => t.mainName);
    setSearchCondition(cond?.join(' ') ?? '');
  }, [open]);

  const qSearch = useQuery({
    queryKey: ['search-result', JSON.stringify(searchCondition ?? null)],
    queryFn: () => {
      if (!searchCondition) {
        return null;
      }
      return Quizzy.findQuestionByTags(searchCondition, 50, currentPage);
    },
    refetchOnWindowFocus: false,
  });

  const {
    result,
    // totalPages,
  } = qSearch.data ?? {};

  const { t } = useTranslation();


  return <DialogRoot size='cover' closeOnInteractOutside={false} {...rest}>
    <DialogContent>
      <DialogCloseTrigger />

      <DialogHeader>
        {t('dialog.searchByTag.header')}
      </DialogHeader>

      <DialogBody overflowY='auto'>
        <VStack alignItems='stretch' p={2} overflow='visible'>
          {result?.map((q) => <QuestionCard
            key={q.id}
            question={q}
            preview={preview}
          />)}
        </VStack>
      </DialogBody>


      <DialogFooter>
        <Button colorPalette='red' ref={cancelButtonRef} onClick={submit}>
          {t('common.btn.close')}
        </Button>
      </DialogFooter>

    </DialogContent>
  </DialogRoot>
};

export default SearchByTagDialog;