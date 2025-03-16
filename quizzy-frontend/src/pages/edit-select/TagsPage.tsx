import PageToolbar from "@/components/PageToolbar";
import TagSelector from "@/components/TagSelector";
import useTags from "@/data/tags";
import SearchByTagDialog, { SearchByTagDialogData } from "@/dialogs/SearchByTagDialog";
import { useDialog } from "@/utils/chakra";
import { useSelection } from "@/utils/react";
import { Button, VStack } from "@chakra-ui/react";
import { Question } from "@quizzy/base/types";
import { useTranslation } from "react-i18next";

export const TagsPage = ({ preview }: { preview?: (q: Question | undefined) => undefined }) => {
  const tags = useTags();
  const s = useSelection();
  const { t } = useTranslation();

  const dSearch = useDialog<SearchByTagDialogData, any>(SearchByTagDialog);

  return <VStack alignItems='stretch'>
    <PageToolbar>
      <Button onClick={() => {
        tags.tagList.forEach(t => s.setSelected(t.id, true));
      }}>
        {t('common.btn.selectAll')}
      </Button>
      <Button onClick={() => {
        s.clearSelection();
      }} disabled={!s.isAnySelected}>
        {t('common.btn.clearSelect')}
      </Button>
      <Button disabled={!s.isAnySelected} onClick={() => {
        const selectedTags = tags.tagList.filter(x => s.isSelected(x.id));
        dSearch.open({ tags: selectedTags, preview });
      }}>
        {t('page.edit.btn.searchByTags')}
      </Button>
    </PageToolbar>
    <TagSelector tags={tags.tagList} isSelected={s.isSelected} toggleSelected={s.toggleSelected} />

    <dSearch.Root />
  </VStack>;
};

export default TagsPage;