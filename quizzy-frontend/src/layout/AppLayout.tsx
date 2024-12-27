import React from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SidebarWithHeader from './SideBar';
import { IoHome, IoNewspaper, IoSettings, IoStatsChart } from "react-icons/io5";
import { RiFileHistoryFill } from "react-icons/ri";
import { GrScorecard } from "react-icons/gr";
import { MdEditSquare } from 'react-icons/md';
import { Text } from '@chakra-ui/react';

const Logo = () => {
  return <Text fontSize="2xl" fontFamily="monospace" fontWeight="bold">
    Quizzy
  </Text>;
};

export const AppLayout = ({ children }: React.PropsWithChildren<object>) => {
  const location = useLocation();

  if (location.pathname.startsWith('/w/') || location.pathname == '/w') {
    return <>{children}</>;
  }

  const { t } = useTranslation();

  return <SidebarWithHeader logo={<Logo />} items={[
    { name: t('nav.root'), to: '/', icon: <IoHome /> },
    { name: t('nav.startQuiz'), to: '/start-quiz', icon: <IoNewspaper /> },
    { name: t('nav.continueQuiz'), to: '/records', icon: <RiFileHistoryFill /> },
    { name: t('nav.results'), to: '/results', icon: <GrScorecard /> },
    { name: t('nav.stats'), to: '/stats', icon: <IoStatsChart /> },
    { name: t('nav.edit'), to: '/edit-select', icon: <MdEditSquare /> },
    { name: t('nav.settings'), to: '/settings', icon: <IoSettings /> },
  ]}>
    {children}
  </SidebarWithHeader>;
};

export default AppLayout;