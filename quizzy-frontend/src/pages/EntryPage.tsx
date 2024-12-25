import StartQuizModal from "@/modals/StartQuizModal";
import { Button, HStack, useDisclosure, VStack } from "@chakra-ui/react";
import { useTranslation } from "../../node_modules/react-i18next";
import { useNavigate } from "react-router-dom";

export const EntryPage = () => {

  const { t } = useTranslation();
  const navigate = useNavigate();


  const dQuiz = useDisclosure();

  return <>
    <VStack align='flex-start'>
      <HStack>
        <Button onClick={() => navigate('/questions')}>
          {t('btn.entry.questions')}
        </Button>
        <Button onClick={() => navigate('/papers')}>
          {t('btn.entry.papers')}
        </Button>
        <Button onClick={() => navigate('/records')}>
          {t('btn.entry.records')}
        </Button>
        <Button onClick={() => navigate('/results')}>
          {t('btn.entry.results')}
        </Button>
        <Button onClick={() => navigate('/stats')}>
          {t('btn.entry.stats')}
        </Button>
      </HStack>
      <Button onClick={dQuiz.onOpen}>{t('btn.entry.startQuiz')}</Button>
    </VStack>

    <StartQuizModal {...dQuiz} />
  </>
};


export default EntryPage;