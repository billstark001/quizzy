import { HStack, IconButtonProps, Separator, VStack } from "@chakra-ui/react";
import { BOOKMARK_DEFAULT_CSS_COLOR } from "@quizzy/base/types";
import {
  Box,
  IconButton,
} from "@chakra-ui/react";

import { MenuContent, MenuItem, MenuRoot } from "../ui/menu";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import BookmarkDispIcon from "./BookmarkDispIcon";
import { IoBookmark, IoBookmarkOutline } from "react-icons/io5";
import { openDialog } from "../handler";
import { useTranslation } from "react-i18next";


export type BookmarkIconProps = {
  itemId: string;
  isQuestion?: boolean;
  insideDialog?: boolean;
} & IconButtonProps;

export const BookmarkIcon = (props: BookmarkIconProps) => {

  const { itemId, isQuestion = false, insideDialog, ...rest } = props;

  const b = useBookmarks();
  const queryKey = [`bookmark-${isQuestion ? 'q' : 'p'}`, itemId, b.timestamp] as const;

  const c = useQueryClient();
  const qBookmarks = useQuery({
    queryKey,
    queryFn: async () => {
      const bms = await b.getBookmarks(itemId, isQuestion);
      const bmMap: Record<string, boolean | undefined> = {};
      for (const b of bms) {
        bmMap[b.id] = true;
      }
      return [bms, bmMap] as [typeof bms, typeof bmMap];
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const [bookmarks, bookmarksMap] = qBookmarks.data ?? [[], {}];

  const { t } = useTranslation();

  const addBookmark = async (x: string) => {
    await b.addBookmark(itemId, x, isQuestion);
    c.invalidateQueries({ queryKey });
  };

  const toggleBookmark = async (x: string) => {
    const isAdded = !!bookmarksMap[x];
    if (isAdded) {
      await b.clearBookmark(itemId, x, isQuestion);
    } else {
      await b.addBookmark(itemId, x, isQuestion);
    }
    c.invalidateQueries({ queryKey });
  };

  const clearBookmarks = async () => {
    await b.clearAllBookmarks(itemId, isQuestion);
    c.invalidateQueries({ queryKey });
  };

  const onIconClicked = async () => {
    setOpen(false);
    if (bookmarks.length >= 2) {
      if (await openDialog(
        t('btn.bookmark.dialog.clearAll'),
        'ok-cancel',
        'clear-all-bookmarks'
      )) {
        await clearBookmarks();
      }
    } else if (bookmarks.length === 1) {
      await toggleBookmark(bookmarks[0].id);
    } else {
      await addBookmark('default');
    }
  };

  const [open, setOpen] = useState(false);

  // BUG chakra has a bug to close the menu on hover
  // this is to prevent closing
  const [noClose, setNoClose] = useState(0);
  const _i = (e: any) => {
    e.preventDefault();
    insideDialog && setNoClose(x => x + 1);
  };
  const _ii = { onMouseEnter: _i };


  const anchorRef = useRef<HTMLButtonElement | null>(null);

  return <>

    <IconButton
      backgroundColor='gray.subtle'
      aria-label='bookmark'
      ref={anchorRef}
      onClick={onIconClicked}
      onContextMenu={(e) => {
        e.preventDefault();
        insideDialog && setNoClose(1);
        setOpen(true);
      }}
      border='1px solid'
      borderColor='gray.emphasized'
      boxShadow='0 0 10px #7773'
      {...rest}
    >
      <BookmarkDispIcon colors={
        bookmarks.map(x => x.dispCssColor ?? BOOKMARK_DEFAULT_CSS_COLOR)
      } />
    </IconButton>

    <MenuRoot
      positioning={{
        getAnchorRect() {
          return anchorRef.current!.getBoundingClientRect()
        },
        hideWhenDetached: true,
      }}
      open={open}
      onOpenChange={(e) => {
        if (!e.open) {
          if (noClose > 0) {
            insideDialog && setNoClose(x => x - 1);
          } else {
            setOpen(false);
          }
        }
      }}
      closeOnSelect={false}
      onSelect={({ value }) => {
        setOpen(false);
        if (value === 'add-bm') {
          toggleBookmark('default');
        }
        if (value === 'add-report') {
          toggleBookmark('reported');
        }
        if (value === 'clear-all') {
          clearBookmarks();
        }
      }}
    >
      <MenuContent
        zIndex={2000}
      >
        <MenuItem value="add-bm" {..._ii}>
          {t('btn.bookmark.btn.' + (bookmarksMap['default'] ? 'remove' : 'add'))}
        </MenuItem>
        <MenuItem value="add-report" {..._ii}>
          {t('btn.bookmark.btn.' + (bookmarksMap['reported'] ? 'removeReport' : 'report'))}
        </MenuItem>
        <MenuItem value="clear-all" {..._ii}>
          {t('btn.bookmark.btn.clearAll')}
        </MenuItem>


        <Separator />

        <Box fontSize='sm' p={2} userSelect='none'>
          {t('btn.bookmark.btn.addTo')}
        </Box>

        <VStack
          px={2}
          pb={2}
          alignItems='stretch'
        >
          {b.bookmarkTypes.map((bm) => {
            return <HStack
              key={bm.id}
              border='1px solid'
              fontSize='sm'
              borderColor='gray.muted'
              cursor='pointer'
              borderRadius={6}
              maxH='50vh'
              overflowY='auto'
              p={1}
              onClick={() => {
                insideDialog && setNoClose(x => x + 1);
                toggleBookmark(bm.id);
              }}
            >
              <Box color={bm.dispCssColor ?? BOOKMARK_DEFAULT_CSS_COLOR}>
                {bookmarksMap[bm.id] ? <IoBookmark /> : <IoBookmarkOutline />}
              </Box>
              {bm.name}
            </HStack>
          })}

        </VStack>
      </MenuContent>
    </MenuRoot>
  </>
};

export default BookmarkIcon;