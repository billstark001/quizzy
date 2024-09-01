// src/components/Layout.js
import React from 'react';
import { Box, Button, Container } from '@chakra-ui/react';
import { HashRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import EntryPage from './pages/EntryPage';

export const AppLayout = ({ children }: React.PropsWithChildren<object>) => {
  const navigate = useNavigate();
  const location = useLocation();
  if (location.pathname.startsWith('/w/') || location.pathname == '/w') {
    return <>{children}</>;
  }

  return (
    <>
      <Box minHeight="100vh" w='100vw'>
        <Box bg='blue.500' p={4}>
          <Button onClick={() => navigate('/')}> root </Button>
        </Box>
        <Container maxW="container.xl" pt={8}>
          {children}
        </Container>
      </Box>
    </>
  );
};

export const App = () => {
  return <HashRouter basename='/'>
    <AppLayout>
      <Routes>
        <Route path='/' element={<EntryPage />} />
      </Routes>
    </AppLayout>
  </HashRouter>;
}

export default App;