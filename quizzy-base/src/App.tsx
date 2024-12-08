// src/components/Layout.js
import React from 'react';
import { Box, Button, Container, useColorMode, VStack } from '@chakra-ui/react';
import { HashRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import EntryPage from './pages/EntryPage';
import PaperSelectionPage from './pages/PaperSelectionPage';
import QuizPage from './pages/QuizPage';
import SettingsPage from './pages/SettingsPage';
import RecordsPage from './pages/RecordsPage';
import ResultsPage from './pages/ResultsPage';
import ResultPage from './pages/ResultPage';
import StatsPage from './pages/StatsPage';
import { useTranslation } from 'react-i18next';
import { EditPage } from './pages/EditPage';
import QuestionPage from './pages/QuestionPage';

export const AppLayout = ({ children }: React.PropsWithChildren<object>) => {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname.startsWith('/w/') || location.pathname == '/w') {
    return <>{children}</>;
  }

  const { toggleColorMode } = useColorMode();
  const { t } = useTranslation();

  return <VStack minHeight="100vh" w='100vw' alignItems='stretch' gap={0}>
    <Box bg='blue.500' p={4} pos='sticky'>
      <Button onClick={() => navigate('/')}> 
        {t('btn.entry.root')}
      </Button>
      <Button onClick={toggleColorMode}>
        {t('btn.colorMode.toggle')}
      </Button>
      <Button onClick={() => navigate('/settings')}>
        {t('btn.entry.settings')}
      </Button>
    </Box>
    <Container maxW="container.xl" py={8} flex={1}>
      {children}
    </Container>
  </VStack>;
};

export const App = () => {
  return <HashRouter basename='/'>
    <AppLayout>
      <Routes>
        <Route path='/' element={<EntryPage />} />
        <Route path='/settings' element={<SettingsPage />} />

        <Route path='/papers' element={<PaperSelectionPage />} />
        <Route path='/questions' element={<QuestionPage />} />
        <Route path='/records' element={<RecordsPage />} />
        <Route path='/results' element={<ResultsPage />} />

        <Route path='/quiz' element={<QuizPage />} />
        <Route path='/edit' element={<EditPage />} />
        <Route path='/result/:rid' element={<ResultPage />} />
        <Route path='/stats' element={<StatsPage />} />
      </Routes>
    </AppLayout>
  </HashRouter>;
}

export default App;