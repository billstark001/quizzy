import { useQuery } from "@tanstack/react-query";
import { Quizzy } from ".";
import { TagListResult } from "@quizzy/base/types";


const defaultTagListResult = (): TagListResult => ({
  questionCategories: [],
  questionTags: [],
  paperCategories: [],
  paperTags: [],
});

const _r = defaultTagListResult();

export const useTags = () => {

  const qTagList = useQuery({
    queryKey: ['tag-list'],
    queryFn: () => Quizzy.listTags(),
    initialData: [],
  });

  const qTempTagList = useQuery({
    queryKey: ['temp-tag-list'],
    queryFn: () => Quizzy.listTagsInPapersAndQuestions(),
    initialData: _r,
  });


  return {
    tagList: qTagList.data,
    tempTagList: qTempTagList.data,
  }
};

export default useTags;