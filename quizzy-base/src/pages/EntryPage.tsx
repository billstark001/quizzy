import { withHandler } from "#/utils";
import { Button, HStack, VStack } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export const EntryPage = () => {

  const { t } = useTranslation();
  const navigate = useNavigate();


  const handlerTest = withHandler(async () => {
    await fetch('https://www.baidu.com');
    throw new Error('test error');
  });

  return <VStack align='flex-start'>
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
    <Button onClick={handlerTest}>handler test</Button>
  </VStack>
};


export default EntryPage;