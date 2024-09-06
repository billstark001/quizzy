import { Button, HStack, VStack } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export const EntryPage = () => {

  const { t } = useTranslation();
  const navigate = useNavigate();

  return <VStack align='flex-start'>
    <HStack>
      <Button onClick={() => navigate('/paper')}>
        {t('btn.entry.paper')}
      </Button>
    </HStack>
  </VStack>
};


export default EntryPage;