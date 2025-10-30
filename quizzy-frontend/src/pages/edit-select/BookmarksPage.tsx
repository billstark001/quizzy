import PageToolbar from "@/components/PageToolbar";
import { PaperCard } from "@/components/item-brief/PaperCard";
import QuestionCard, { QuestionCardProps } from "@/components/item-brief/QuestionCard";
import { QuizzyWrapped, Quizzy } from "@/data";
import { useBookmarks } from "@/data/bookmarks";
import { BookmarkEditDialog } from "@/dialogs/BookmarkEditDialog";
import { useDialog } from "@/utils/chakra";
import { Box, Button, Collapsible, HStack, Loader, Separator, VStack, Wrap } from "@chakra-ui/react";
import { BOOKMARK_DEFAULT_CSS_COLOR, BookmarkType, Question } from "@quizzy/base/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { IoBookmark } from "react-icons/io5";


const BookmarkItemInner = (props: { bm: BookmarkType, preview?: QuestionCardProps['preview'] }) => {

  const { bm, preview } = props;
  const { t } = useTranslation();

  const queryKey = ['bm-list-result', bm.id] as const;

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const papers = await Quizzy.listQuizPaperByBookmark(bm.id);
      const questions = await Quizzy.listQuestionByBookmark(bm.id);
      return {
        papers,
        questions,
      };
    }
  });

  return <>
    {(query.isLoading || query.isFetching) &&
      <Box h={10}>
        Loading...
        <Loader />
      </Box>}
    {query.data && <>

      <Box padding="4" >
        {t(query.data?.papers.length ? 'page.edit.tab.paper' : 'page.edit.toast.noPaper')}
      </Box>
      <Wrap alignItems='stretch' p={2} overflow='visible'>
        {query.data?.papers.map((q) => <PaperCard
          key={q.id}
          paper={q}
        />)}
      </Wrap>

      <Separator />

      <Box padding="4" >
        {t(query.data?.questions.length ? 'page.edit.tab.question' : 'page.edit.toast.noQuestion')}
      </Box>
      <VStack alignItems='stretch' p={2} overflow='visible'>
        {query.data?.questions.map((q) => <QuestionCard
          key={q.id}
          question={q}
          preview={preview}
        />)}
      </VStack>
    </>}
  </>;

};

const BookmarkItem = (props: { 
  bm: BookmarkType, 
  preview?: QuestionCardProps['preview'],
  edit?: (bm: BookmarkType) => void,
}) => {

  const { bm, preview, edit } = props;
  const { t } = useTranslation();
  const c = useQueryClient();

  return <Collapsible.Root lazyMount>
    <Collapsible.Trigger
      as={HStack}
      border='1px solid'
      fontSize='lg'
      borderColor='gray.muted'
      cursor='pointer'
      borderRadius={12}
      maxH='50vh'
      overflowY='auto'
      py={2}
      px={3}
      gap={3}
    >
      <Box color={bm.dispCssColor ?? BOOKMARK_DEFAULT_CSS_COLOR}
        fontSize='1.5em'
      >
        <IoBookmark />
      </Box>
      <Box>{bm.name}</Box>
      <Box flex='1' />

      <Button onClick={(e) => {
        e.stopPropagation();
        c.invalidateQueries({ queryKey: ['bm-list-result'] });
      }}>{t('common.btn.refresh')}</Button>
      <Button onClick={(e) => {
        e.stopPropagation();
        edit?.(bm);
      }}>{t('common.btn.edit')}</Button>

    </Collapsible.Trigger>

    <Collapsible.Content>
      <BookmarkItemInner bm={bm} preview={preview} />
    </Collapsible.Content>

  </Collapsible.Root>;
};

export const BookmarksPage = ({ preview }: { preview?: (q: Question | undefined) => undefined }) => {
  const b = useBookmarks();
  const { t } = useTranslation();
  const c = useQueryClient();

  const dEdit = useDialog<BookmarkType | undefined, BookmarkType | undefined>(BookmarkEditDialog);

  const startEdit = async (data: BookmarkType | undefined) => {
    const res = await dEdit.open(data);
    if (!res) {
      return;
    }
    if (!data) {
      // this is a newly created one
      delete (res as any).id;
      await QuizzyWrapped.createBookmarkType(res);
    } else {
      // this is an existent one
      await QuizzyWrapped.updateBookmarkType(res.id, res);
    }
    c.invalidateQueries({ queryKey: ['bookmarks'] });
    c.invalidateQueries({ queryKey: ['bookmark-p'] });
    c.invalidateQueries({ queryKey: ['bookmark-q'] });
  }

  return <VStack alignItems='stretch'>
    <PageToolbar>
      <Button onClick={() => startEdit(undefined)}>
        {t('page.edit.btn.create')}
      </Button>
    </PageToolbar>

    {b.bookmarkTypes.map((bm) => <BookmarkItem
      bm={bm}
      preview={preview}
      edit={startEdit}
      key={bm.id}
    />)}

    <dEdit.Root />
  </VStack>;
};

export default BookmarksPage;