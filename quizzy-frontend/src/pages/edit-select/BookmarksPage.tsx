import PageToolbar from "@/components/PageToolbar";
import { PaperCard } from "@/components/PaperCard";
import QuestionCard, { QuestionCardProps } from "@/components/question-brief/QuestionCard";
import { QuizzyRaw } from "@/data";
import { useBookmarks } from "@/data/bookmarks";
import QuestionPreviewDialog from "@/dialogs/QuestionPreviewDialog";
import { useDialog } from "@/utils/chakra";
import { Box, Button, Collapsible, HStack, Loader, Separator, VStack, Wrap } from "@chakra-ui/react";
import { BOOKMARK_DEFAULT_CSS_COLOR, BookmarkType, Question } from "@quizzy/base/types";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { IoBookmark } from "react-icons/io5";


const BookmarkItemInner = (props: { bm: BookmarkType, preview?: QuestionCardProps['preview'] }) => {

  const { bm, preview } = props;
  const { t } = useTranslation();

  const queryKey = ['bm-list-result', bm.id] as const;

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const papers = await QuizzyRaw.listQuizPaperByBookmark(bm.id);
      const questions = await QuizzyRaw.listQuestionByBookmark(bm.id);
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
        {t('page.edit.tab.paper')}
      </Box>
      <Wrap alignItems='stretch' p={2} overflow='visible'>
        {query.data?.papers.map((q) => <PaperCard
          key={q.id}
          paper={q}
        />)}
      </Wrap>

      <Separator />

      <Box padding="4" >
        {t('page.edit.tab.question')}
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

const BookmarkItem = (props: { bm: BookmarkType, preview?: QuestionCardProps['preview'] }) => {

  const { bm, preview } = props;
  const { t } = useTranslation();

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

      <Button>{t('common.btn.edit')}</Button>

    </Collapsible.Trigger>

    <Collapsible.Content>
      <BookmarkItemInner bm={bm} preview={preview} />
    </Collapsible.Content>

  </Collapsible.Root>;
};

export const BookmarksPage = () => {
  const b = useBookmarks();
  const { t } = useTranslation();

  const dPreview = useDialog<Question | undefined, any>(QuestionPreviewDialog);

  return <VStack alignItems='stretch'>
    <PageToolbar>
      <Button>
        {t('page.edit.btn.create')}
      </Button>
    </PageToolbar>

    {b.bookmarkTypes.map((bm) => <BookmarkItem
      bm={bm}
      preview={dPreview.open}
      key={bm.id}
    />)}

    <dPreview.Root />
  </VStack>;
};

export default BookmarksPage;