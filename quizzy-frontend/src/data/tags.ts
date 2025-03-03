import { useQuery } from "@tanstack/react-query";
import { Quizzy } from ".";
import { Tag, TempTagListResult } from "@quizzy/base/types";
import { useCallback } from "react";


const defaultTempTagListResult = (): TempTagListResult => ({
  questionCategories: [],
  questionTags: [],
  paperCategories: [],
  paperTags: [],
});

const _r = defaultTempTagListResult();

const _tt = (
  tagList: Tag[],
) => {
  const mainNameSet = new Map<string, string>();
  const alternativeSet = new Map<string, string>();
  const tagMap = new Map<string, Tag>();

  for (const tag of tagList) {
    // TODO add repeat detection
    tagMap.set(tag.id, tag);
    mainNameSet.set(tag.mainName, tag.id);
    Object.entries(tag.mainNames ?? {})
      .forEach(([, x]) => x && mainNameSet.set(x, tag.id));
    tag.alternatives.forEach(x => alternativeSet.set(x, tag.id));
  }

  return {
    tagMap, 
    mainNameSet,
    alternativeSet,
  };
};

type _T = {
  tagsCanReplaceToId: {
      [k: string]: string;
  };
  tagsRecordedInAlternative: {
      [k: string]: string;
  };
  tagsCanBuildRecord: string[];
  categoriesCanBuildRecord: string[];
};

const _t = (
  tempTagList: TempTagListResult,
  t: ReturnType<typeof _tt>,
): _T => {
  const {
    tagMap,
    mainNameSet,
    alternativeSet,
  } = t;

  const tagsCanReplaceToId = new Map<string, string>();
  const tagsRecordedInAlternative = new Map<string, string>();
  const tagsCanBuildRecord = new Set<string>();
  const categoriesCanBuildRecord = new Set<string>();
  
  for (const [key, arr] of Object.entries(tempTagList)) {
    const isCategory = key.endsWith('Categories');
    for (const tag of arr) {
      if (tagMap.has(tag)) {
        continue;
      }
      let t1: string | undefined;
      if ((t1 = mainNameSet.get(tag))) {
        tagsCanReplaceToId.set(tag, t1);
      } else if ((t1 = alternativeSet.get(tag))) {
        tagsRecordedInAlternative.set(tag, t1);
      } else {
        if (isCategory) {
          categoriesCanBuildRecord.add(tag);
        } else {
          tagsCanBuildRecord.add(tag);
        }
      }
    }
  }

  return {
    tagsCanReplaceToId: Object.fromEntries(tagsCanReplaceToId),
    tagsRecordedInAlternative: Object.fromEntries(tagsRecordedInAlternative),
    tagsCanBuildRecord: Array.from(tagsCanBuildRecord),
    categoriesCanBuildRecord: Array.from(categoriesCanBuildRecord),
  };
};


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

  const tagList = qTagList.data;
  const tempTagList = qTempTagList.data;

  const findBadTags = useCallback(() => {
    const t = _tt(tagList);
    const r = _t(tempTagList, t);
    return r;
  }, [tagList, tempTagList]);


  return {
    tagList,
    tempTagList,
    findBadTags,
  }
};

export default useTags;