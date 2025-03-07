import {
  IconButton,
  IconButtonProps,
  Tag as ChakraTag, 
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
  tagStyle?: ChakraTag.RootProps | ((tag: string, index: number) => ChakraTag.RootProps);
  closable?: boolean;
  onClose?: (tag: string, index: number) => void;
};

export const TagList = (props: TagListProps) => {
  const { 
    tags, keys, 
    onClick, onDoubleClick, onContextMenu, 
    tagStyle, closable, onClose, children, ...rest 
  } = props;
  const isTagStyleFunction = typeof tagStyle === "function";
  
  return (
    <Wrap {...rest}>
      {tags?.map((tag, index) => (
        <ChakraTag.Root
          key={keys?.[index] || `tag-${index}-${tag}`}
          cursor={(onClick || onDoubleClick) ? 'pointer' : undefined}
          {...(isTagStyleFunction ? tagStyle(tag, index) : tagStyle)}
          onClick={(e) => onClick?.(e, tag, index)}
          onDoubleClick={(e) => onDoubleClick?.(e, tag, index)}
          onContextMenu={(e) => onContextMenu?.(e, tag, index)}
        >
          <ChakraTag.Label>{tag}</ChakraTag.Label>
          {closable && (
            <ChakraTag.EndElement>
              <ChakraTag.CloseTrigger onClick={() => onClose?.(tag, index)} />
            </ChakraTag.EndElement>
          )}
        </ChakraTag.Root>
      ))}
      {children}
    </Wrap>
  );
};

export const TagButton = (props: Omit<IconButtonProps, 'aria-label'>) => {
  return <IconButton aria-label='tag-button' size='xs' {...props} />;
};

export default TagList;