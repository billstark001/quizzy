import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Quizzy, QuizzyRaw } from ".";
import { Tag, TempTagListResult } from "@quizzy/base/types";
import { useCallback, useMemo } from "react";
import { useCallbackRef } from "@chakra-ui/react";


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
  tagsWithNoReference: string[];
  tagsRecordedInAlternative: {
      [k: string]: [string, string];
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

  const tagsWithNoReference = new Set<string>(tagMap.keys());
  const tagsRecordedInAlternative = new Map<string, [string, string]>();
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
        tagsWithNoReference.delete(t1);
      } else if ((t1 = alternativeSet.get(tag))) {
        tagsRecordedInAlternative.set(tag, [t1, tagMap.get(t1)!.mainName]);
        tagsWithNoReference.delete(t1);
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
    tagsWithNoReference: Array.from(tagsWithNoReference),
    tagsRecordedInAlternative: Object.fromEntries(tagsRecordedInAlternative),
    tagsCanBuildRecord: Array.from(tagsCanBuildRecord),
    categoriesCanBuildRecord: Array.from(categoriesCanBuildRecord),
  };
};


export const useTags = () => {

  const c = useQueryClient();

  const qTagList = useQuery({
    queryKey: ['tag-list'],
    queryFn: () => Quizzy.listTags().then(x => {
      x.sort((a, b) => a.mainName.localeCompare(b.mainName));
      return x;
    }),
    initialData: [],
  });

  const qTempTagList = useQuery({
    queryKey: ['temp-tag-list'],
    queryFn: () => Quizzy.listTagsInPapersAndQuestions(),
    initialData: _r,
  });

  const tagList = qTagList.data;
  const tempTagList = qTempTagList.data;

  const parsedTagList = useMemo(() => _tt(tagList), [tagList]);

  const findBadTags = useCallback(() => {
    const r = _t(tempTagList, _tt(tagList));
    return r;
  }, [tagList, tempTagList]);

  const getTag = (name: string) => {
    name ??= '';
    const t = parsedTagList.mainNameSet.get(name);
    const isAlternative = t == null;
    const t2 = isAlternative
      ? parsedTagList.alternativeSet.get(name)
      : undefined;
    const tagObject = parsedTagList.tagMap.get(t || t2 || '');
    if (tagObject == null) {
      return {
        isAlternative: false,
      };
    }
    return {
      tag: tagObject as Readonly<Tag>,
      isAlternative,
    }
  }


  const recordAllRecordableTags = useCallbackRef(async () => {
    try {
      const d = findBadTags();
      for (const tag of d.tagsCanBuildRecord) {
        await QuizzyRaw.getTag(tag);
      }
      for (const tag of d.categoriesCanBuildRecord) {
        await QuizzyRaw.getTag(tag);
      }
    } catch (e) {
      console.error(e);
    } finally {
      c.invalidateQueries({ queryKey: ['tag-list'] });
    }
  });

  return {
    getTag,
    tagList,
    tempTagList,
    findBadTags,
    recordAllRecordableTags,
  }
};

export default useTags;