import {
  IconButton,
  IconButtonProps,
  Tag, TagProps, 
  Wrap,
  WrapProps
} from "@chakra-ui/react";

import { MouseEvent as M } from "react";


export type TagListProps = Omit<WrapProps, 'onClick' | 'onDoubleClick' | 'onContextMenu'> & {
  tags?: string[];
  keys?: string[];
  onClick?: (e: M<HTMLSpanElement, MouseEvent>, tag: string, index: number) => void;
  onDoubleClick?: (e: M<HTMLSpanElement, MouseEvent>, tag: string, index: number) => void;
  onContextMenu?: (e: M<HTMLSpanElement, MouseEvent>, tag: string, index: number) => void;
  tagStyle?: TagProps | ((tag: string, index: number) => TagProps);
};

export const TagList = (props: TagListProps) => {
  const { 
    tags, keys, 
    onClick, onDoubleClick, onContextMenu, 
    tagStyle, children, ...rest 
  } = props;
  const isTagStyleFunction = typeof tagStyle === "function";
  return <Wrap {...rest}>
    {tags?.map((x, i) => <Tag 
      key={keys?.[i] || `tag-${i}-${x}`} cursor={(onClick || onDoubleClick) ? 'pointer' : undefined}
      {...(isTagStyleFunction ? tagStyle(x, i) : tagStyle)}
      onClick={(e) => onClick?.(e, x, i)}
      onDoubleClick={(e) => onDoubleClick?.(e, x, i)}
      onContextMenu={(e) => onContextMenu?.(e, x, i)}
    >{x}</Tag>)}
    {children}
  </Wrap>;
};

export const TagButton = (props: Omit<IconButtonProps, 'aria-label'>) => {
  return <IconButton aria-label='tag-button' size='xs' {...props} />;
}

export default TagList;