import React, { useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SidebarWithHeader from './Sidebar';
import { IoHome, IoNewspaper, IoSettings, IoStatsChart } from "react-icons/io5";
import { RiFileHistoryFill } from "react-icons/ri";
import { GrScorecard } from "react-icons/gr";
import { MdEditSquare } from 'react-icons/md';
import { Box, Flex } from '@chakra-ui/react';
import { LayoutContext, LogoEnvironmentContext, useLayoutContextScheme } from './layout-context';
import QuizzyLogo from './QuizzyLogo';


const Logo = () => {
  const logoEnv = useContext(LogoEnvironmentContext);
  const { collapsed } = useContext(LayoutContext);
  return <Flex 
    fontSize="2xl" fontFamily="monospace" fontWeight="bold"
    alignItems='center'
  >
    <Box fontSize='2em' color='inherit'>
      <QuizzyLogo />
    </Box>
    {(logoEnv === 'menu' || !collapsed) && <span>Quizzy</span>}
  </Flex>;
};

export const AppLayout = ({ children }: React.PropsWithChildren<object>) => {
  const location = useLocation();

  if (location.pathname.startsWith('/w/') || location.pathname == '/w') {
    return <>{children}</>;
  }

  const { t } = useTranslation();

  const lc = useLayoutContextScheme();

  return <LayoutContext.Provider value={lc}>
    <SidebarWithHeader logo={<Logo />} items={[
      { name: t('nav.root'), to: '/', icon: <IoHome /> },
      { name: t('nav.startQuiz'), to: '/start-quiz', icon: <IoNewspaper /> },
      { name: t('nav.continueQuiz'), to: '/records', icon: <RiFileHistoryFill /> },
      { name: t('nav.results'), to: '/results', icon: <GrScorecard /> },
      { name: t('nav.stats'), to: '/stats', icon: <IoStatsChart /> },
      { name: t('nav.edit'), to: '/edit-select', icon: <MdEditSquare /> },
      { name: t('nav.settings'), to: '/settings', icon: <IoSettings /> },
    ]}>
      {children}
    </SidebarWithHeader>
  </LayoutContext.Provider>;
};

export default AppLayout;