import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Quizzy } from ".";
import { BOOKMARK_DEFAULT_CSS_COLOR, BookmarkBase, BookmarkType, defaultBookmarkType, ID } from "@quizzy/base/types";
import { useCallback } from "react";

const getBookmarksNoMap = async (
  bookmarkMap: Map<string, Readonly<BookmarkType>> | undefined,
  id: ID,
  isQuestion = true
) => {
  const bookmarks = await Quizzy.listBookmarks(
    id, isQuestion
  );
  const typedBookmarks = bookmarks
    .map((bookmark) => bookmarkMap?.get(bookmark.typeId) ?? defaultBookmarkType({
      dispCssColor: BOOKMARK_DEFAULT_CSS_COLOR,
      name: '#' + bookmark.id,
    }));
  typedBookmarks.sort((a, b) => {
    if (a.name === 'default' || b.name === 'reported') {
      return -1;
    }
    if (b.name === "default" || a.name === 'reported') {
      return 1;
    }
    return a.name.localeCompare(b.name);
  });
  return typedBookmarks;
};

export const useBookmarks = () => {

  const c = useQueryClient();

  const qBookmarkTypes = useQuery({
    queryKey: ['bookmarks'],
    queryFn: async () => {
      const ret = await Quizzy.listBookmarkTypes();
      const map: Map<string, Readonly<BookmarkType>> = new Map();
      for (const bm of ret ?? []) {
        map.set(bm.id, bm);
      }
      return [ret, map] as [typeof ret, typeof map];
    },
    refetchOnWindowFocus: false,
  });

  const [bookmarkList, bookmarkMap] = qBookmarkTypes.data ?? [[], undefined];


  const addBookmark = useCallback(async (
    id: ID,
    bookmarkId: ID = 'default',
    isQuestion = true,
    note?: string,
  ) => {
    const tic: BookmarkBase = {
      typeId: bookmarkId,
      itemId: id,
      category: isQuestion ? 'question' : 'paper',
      note,
    };
    return await Quizzy.putBookmarkTIC(tic);
  }, []);

  const clearBookmark = useCallback(async (
    id: ID,
    bookmarkId: ID = 'default',
    isQuestion = true,
  ) => {
    const tic: BookmarkBase = {
      typeId: bookmarkId,
      itemId: id,
      category: isQuestion ? 'question' : 'paper',
    };
    return await Quizzy.deleteBookmarkTIC(tic);
  }, []);

  const clearAllBookmarks = useCallback(async (
    id: ID,
    isQuestion = true
  ) => {
    return await Quizzy.clearAllBookmarks(id, isQuestion);
  }, []);

  const getBookmarks = useCallback(async (
    id: ID,
    isQuestion = true
  ) => {
    return getBookmarksNoMap(bookmarkMap, id, isQuestion);
  }, [bookmarkMap]);

  const onSuccess = () => {
    c.invalidateQueries({ queryKey: ['bookmarks'] });
  }

  const mCreateBookmarkType = useMutation({
    mutationFn: Quizzy.createBookmarkType.bind(Quizzy),
    onSuccess,
  });

  const mUpdateBookmarkType = useMutation({
    mutationFn: ({ id, ...rest }: Partial<BookmarkType> & { id: ID }) => {
      return Quizzy.updateBookmarkType(id, rest);
    },
    onSuccess,
  });

  const mDeleteBookmarkType = useMutation({
    mutationFn: Quizzy.deleteBookmarkType.bind(Quizzy),
    onSuccess,
  });


  return {
    bookmarkTypes: bookmarkList,
    isBookmarkMapConstructed: !!bookmarkMap,
    addBookmark,
    clearBookmark,
    clearAllBookmarks,
    getBookmarks,
    createBookmarkType: mCreateBookmarkType.mutate,
    updateBookmarkType: mUpdateBookmarkType.mutate,
    deleteBookmarkType: mDeleteBookmarkType.mutate,
  };

};