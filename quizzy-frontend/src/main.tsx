import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ChakraProvider, ColorModeScript, extendTheme } from '@chakra-ui/react';

import './data/lang-entry';

const config = {
  initialColorMode: 'system',
  useSystemColorMode: true,
};

const theme = extendTheme({ config });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </React.StrictMode>,
);
