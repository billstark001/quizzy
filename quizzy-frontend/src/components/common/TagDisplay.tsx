import { Tag as ChakraTag } from "@chakra-ui/react";
import { Tag, TagBase } from "@quizzy/base/types";


export type TagDisplayProps = {
  tags?: (string | TagBase | Tag)[];
  isCategory?: boolean;
}

export const TagDisplay = (props: TagDisplayProps) => {
  const { tags, isCategory } = props;
  return tags?.map((tag) => {
    const tagDisp = typeof tag === 'string'
      ? tag
      : tag.mainName;
    const tagId = typeof tag === "string"
      ? `tag-${tag}`
      : `tag-o-${(tag as Tag).id || tag.mainName}`;

    return <ChakraTag.Root key={tagId} variant={isCategory ? 'outline' : undefined}>
      <ChakraTag.Label>{tagDisp}</ChakraTag.Label>
    </ChakraTag.Root>;
  });
};

export default TagDisplay;