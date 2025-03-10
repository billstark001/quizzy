import TagSelector from "@/components/TagSelector";
import useTags from "@/data/tags";
import { useSelection } from "@/utils/react";

export const TagsPage = () => {
  const t = useTags();
  const s = useSelection();

  return <>
    <TagSelector tags={t.tagList} isSelected={s.isSelected} toggleSelected={s.toggleSelected} />
  </>;
};

export default TagsPage;