import { useBookmarks } from "@/data/bookmarks";
import { Box, Button, Collapsible, HStack, Separator, VStack } from "@chakra-ui/react";
import { BOOKMARK_DEFAULT_CSS_COLOR, BookmarkType } from "@quizzy/base/types";
import { useTranslation } from "react-i18next";
import { IoBookmark } from "react-icons/io5";

const BookmarkItem = (props: { bm: BookmarkType }) => {

  const { bm } = props;
  const { t } = useTranslation();

  return <Collapsible.Root unmountOnExit>
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
      <Box padding="4" >
        {t('page.edit.tab.paper')}
      </Box>
      TODO
      <Separator />
      <Box padding="4" >
        {t('page.edit.tab.question')}
      </Box>
      TODO
    </Collapsible.Content>
  </Collapsible.Root>;
};

export const BookmarksPage = () => {
  const b = useBookmarks();

  return <VStack alignItems='stretch'>
    {b.bookmarkTypes.map((bm) => <BookmarkItem
      bm={bm}
      key={bm.id} />)}
  </VStack>;
};

export default BookmarksPage;