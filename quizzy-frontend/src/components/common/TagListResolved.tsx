import { ID } from "@quizzy/base/types";
import { useQuery } from "@tanstack/react-query";
import { Quizzy } from "@/data";
import TagList, { TagListProps } from "./TagList";
import { useMemo } from "react";

export type TagListResolvedProps = Omit<TagListProps, 'tags' | 'keys'> & {
  tagIds?: ID[];
};

/**
 * TagList component that resolves tag IDs to tag names
 */
export const TagListResolved = (props: TagListResolvedProps) => {
  const { tagIds, ...rest } = props;

  // Fetch tags by IDs
  const { data: resolvedTags } = useQuery({
    queryKey: ['tags-resolved', tagIds],
    queryFn: async () => {
      if (!tagIds || tagIds.length === 0) {
        return [];
      }
      return await Quizzy.getTagsByIds(tagIds);
    },
    enabled: !!tagIds && tagIds.length > 0,
    staleTime: 60000, // Cache for 1 minute
  });

  // Convert resolved tags to names
  const tagNames = useMemo(() => {
    if (!resolvedTags) return [];
    return resolvedTags.map(tag => tag?.mainName || '<Unknown>');
  }, [resolvedTags]);

  return <TagList tags={tagNames} keys={tagIds} {...rest} />;
};

export default TagListResolved;
