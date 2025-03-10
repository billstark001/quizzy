import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Quizzy } from ".";
import { BOOKMARK_DEFAULT_CSS_COLOR, BookmarkBase, BookmarkType, defaultBookmarkType, ID } from "@quizzy/base/types";
import { useCallback, useMemo } from "react";

export const useBookmarks = () => {

  const c = useQueryClient();

  const qBookmarkTypes = useQuery({
    queryKey: ['bookmarks'],
    queryFn: () => Quizzy.listBookmarkTypes(),
    refetchOnWindowFocus: false,
  });

  const bookmarkMap = useMemo(() => {
    const ret: Map<string, Readonly<BookmarkType>> = new Map();
    for (const bm of qBookmarkTypes.data ?? []) {
      ret.set(bm.id, bm);
    }
    return ret;
  }, [qBookmarkTypes.data]);

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
    const bookmarks = await Quizzy.listBookmarks(
      id, isQuestion
    );
    const typedBookmarks = bookmarks
      .map((bookmark) => bookmarkMap.get(bookmark.typeId) ?? defaultBookmarkType({
        dispCssColor: BOOKMARK_DEFAULT_CSS_COLOR,
        name: '#' + bookmark.id,
      }));
    return typedBookmarks;
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
    bookmarkTypes: qBookmarkTypes.data ?? [],
    addBookmark,
    clearBookmark,
    clearAllBookmarks,
    getBookmarks,
    createBookmarkType: mCreateBookmarkType.mutate,
    updateBookmarkType: mUpdateBookmarkType.mutate,
    deleteBookmarkType: mDeleteBookmarkType.mutate,
  };

};