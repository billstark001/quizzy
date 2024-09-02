// src/components/Layout.js
import React from 'react';
import { Box, Button, Container, useColorMode, VStack } from '@chakra-ui/react';
import { HashRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import EntryPage from './pages/EntryPage';

export const AppLayout = ({ children }: React.PropsWithChildren<object>) => {
  const navigate = useNavigate();
  const location = useLocation();
  if (location.pathname.startsWith('/w/') || location.pathname == '/w') {
    return <>{children}</>;
  }

  const { toggleColorMode} = useColorMode();

  return (
    <>
      <VStack minHeight="100vh" w='100vw' alignItems='stretch' gap={0}>
        <Box bg='blue.500' p={4} pos='sticky'>
          <Button onClick={() => navigate('/')}> root </Button>
          <Button onClick={toggleColorMode}> toggle color mode </Button>
        </Box>
        <Container maxW="container.xl" py={8} flex={1}>
          {children}
        </Container>
      </VStack>
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