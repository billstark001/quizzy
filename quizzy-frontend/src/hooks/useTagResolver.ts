import { useQuery } from "@tanstack/react-query";
import { QuizzyWrapped } from "@/data";
import { ID, Tag } from "@quizzy/base/types";
import { useMemo } from "react";

/**
 * Hook to resolve tag IDs to Tag objects
 * Supports both string-based tags (legacy) and ID-based tags (new system)
 */
export const useTagResolver = (
  tags?: string[],
  tagIds?: ID[],
  categories?: string[],
  categoryIds?: ID[]
) => {
  // Fetch tags by IDs
  const { data: resolvedTags } = useQuery({
    queryKey: ['tags-by-ids', tagIds],
    queryFn: () => {
      if (!tagIds || tagIds.length === 0) {
        return [];
      }
      return QuizzyWrapped.getTagsByIds(tagIds);
    },
    enabled: !!tagIds && tagIds.length > 0,
    staleTime: 60000, // Cache for 1 minute
  });

  const { data: resolvedCategories } = useQuery({
    queryKey: ['categories-by-ids', categoryIds],
    queryFn: () => {
      if (!categoryIds || categoryIds.length === 0) {
        return [];
      }
      return QuizzyWrapped.getTagsByIds(categoryIds);
    },
    enabled: !!categoryIds && categoryIds.length > 0,
    staleTime: 60000, // Cache for 1 minute
  });

  // Combine resolved tags with string tags (for backward compatibility)
  const [displayTags, displayTagsMap] = useMemo(() => {
    const result: (string | Tag)[] = [];
    const resultMap: Record<string, Tag> = {};

    // Add resolved tag objects (preferred)
    if (resolvedTags && resolvedTags.length > 0) {
      resolvedTags.forEach(tag => {
        if (tag) {
          result.push(tag);
          resultMap[tag.id] = tag;
        }
      });
    }

    // Add string tags (fallback for legacy data or during migration)
    if (tags && tags.length > 0 && (!tagIds || tagIds.length === 0)) {
      result.push(...tags);
    }

    return [result, resultMap];
  }, [tags, tagIds, resolvedTags]);

  const [displayCategories, displayCategoriesMap] = useMemo(() => {
    const result: (string | Tag)[] = [];
    const resultMap: Record<string, Tag> = {};

    // Add resolved category objects (preferred)
    if (resolvedCategories && resolvedCategories.length > 0) {
      resolvedCategories.forEach(cat => {
        if (cat) {
          result.push(cat);
          resultMap[cat.id] = cat;
        }
      });
    }

    // Add string categories (fallback for legacy data or during migration)
    if (categories && categories.length > 0 && (!categoryIds || categoryIds.length === 0)) {
      result.push(...categories);
    }

    return [result, resultMap];
  }, [categories, categoryIds, resolvedCategories]);

  return {
    displayTags,
    displayCategories,
    displayTagsMap,
    displayCategoriesMap,
    isLoading: (tagIds && tagIds.length > 0 && !resolvedTags) ||
      (categoryIds && categoryIds.length > 0 && !resolvedCategories),
  };
};

export default useTagResolver;
