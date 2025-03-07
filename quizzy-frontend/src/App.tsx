// src/components/Layout.js
import { HashRouter, Route, Routes } from 'react-router-dom';
import EntryPage from './pages/EntryPage';
import PaperSelectionPage from './pages/PaperSelectionPage';
import QuizPage from './pages/QuizPage';
import SettingsPage from './pages/SettingsPage';
import RecordsPage from './pages/RecordsPage';
import ResultsPage from './pages/ResultsPage';
import ResultPage from './pages/ResultPage';
import StatsPage from './pages/StatsPage';
import { PaperEditPage } from './pages/PaperEditPage';
import QuestionPage from './pages/QuestionPage';
import { useParsedSearchParams } from './utils/react-router';
import { QuestionEditPage } from './pages/QuestionEditPage';
import StatPage from './pages/StatPage';
import AppLayout from './layout/AppLayout';
import StartQuizPage from './pages/StartQuizPage';

import { Tabs } from '@chakra-ui/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './data/query';
import TagsPage from './pages/TagsPage';

const EditPage = () => {

  const [searchParams] = useParsedSearchParams<{ paper: string, question: string }>({
    paper: 'string',
    question: "string",
  });

  const { paper, question } = searchParams;
  if (paper) {
    return <PaperEditPage paper={paper} />;
  }
  return <QuestionEditPage question={question} />;

};

const EditSelectPage = () => {
  return <Tabs.Root variant="enclosed" defaultValue='paper'>
    <Tabs.List>
      <Tabs.Trigger value="paper">paper</Tabs.Trigger>
      <Tabs.Trigger value="question">question</Tabs.Trigger>
      <Tabs.Trigger value="tag">tag</Tabs.Trigger>
    </Tabs.List>
    <Tabs.Content value="paper"><PaperSelectionPage /></Tabs.Content>
    <Tabs.Content value="question"><QuestionPage /></Tabs.Content>
    <Tabs.Content value="tag"><TagsPage /></Tabs.Content>
  </Tabs.Root>;
};

export const App = () => {
  return <QueryClientProvider client={queryClient}>
    <HashRouter basename='/'>
      <AppLayout>
        <Routes>
          <Route path='/' element={<EntryPage />} />
          <Route path='/settings' element={<SettingsPage />} />

          <Route path='/start-quiz' element={<StartQuizPage />} />
          <Route path='/edit-select' element={<EditSelectPage />} />
          <Route path='/records' element={<RecordsPage />} />
          <Route path='/results' element={<ResultsPage />} />

          <Route path='/quiz' element={<QuizPage />} />
          <Route path='/edit' element={<EditPage />} />
          <Route path='/result/:rid' element={<ResultPage />} />
          <Route path='/stats' element={<StatsPage />} />
          <Route path='/stat/:sid' element={<StatPage />} />
        </Routes>
      </AppLayout>
    </HashRouter>
  </QueryClientProvider>;
}

export default App;