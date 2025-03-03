import useTags from "@/data/tags";
import { Button } from "@chakra-ui/react";


export const TagsPage = () => {
  const t = useTags();

  return <>
  <Button onClick={() => {
    console.time('tag');
    const d = t.findBadTags();
    console.timeEnd('tag');
  }}>find bad tags</Button>
  </>;
};

export default TagsPage;