import PaperSelectionPage from './PaperSelectionPage';
import QuestionPage from './QuestionPage';

import { Tabs } from '@chakra-ui/react';
import TagsPage from './TagsPage';
import { useTranslation } from 'react-i18next';
import BookmarksPage from './BookmarksPage';
import { useDialog } from '@/utils/chakra';
import { Question } from '@quizzy/base/types';
import QuestionPreviewDialog from '@/dialogs/QuestionPreviewDialog';


export const EditSelectPage = () => {
  const { t } = useTranslation();

  const dPreview = useDialog<Question | undefined, any>(QuestionPreviewDialog);

  return <Tabs.Root variant="enclosed" defaultValue='paper'>
    <Tabs.List>
      <Tabs.Trigger value="paper">
        {t('page.edit.tab.paper')}
      </Tabs.Trigger>
      <Tabs.Trigger value="question">
        {t('page.edit.tab.question')}
      </Tabs.Trigger>
      <Tabs.Trigger value="tag">
        {t('page.edit.tab.tag')}
      </Tabs.Trigger>
      <Tabs.Trigger value="bookmark">
        {t('page.edit.tab.bookmark')}
      </Tabs.Trigger>
    </Tabs.List>
    <Tabs.Content value="paper"><PaperSelectionPage /></Tabs.Content>
    <Tabs.Content value="question"><QuestionPage preview={(q) => void dPreview.open(q)} /></Tabs.Content>
    <Tabs.Content value="tag"><TagsPage preview={(q) => void dPreview.open(q)} /></Tabs.Content>
    <Tabs.Content value="bookmark"><BookmarksPage preview={(q) => void dPreview.open(q)} /></Tabs.Content>

    <dPreview.Root />
  </Tabs.Root>;
};

export default EditSelectPage;