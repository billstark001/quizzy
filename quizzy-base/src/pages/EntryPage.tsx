import { TestPageTestBlank, TestPageTestChoice } from "@/test-pages";
import { Button, HStack, VStack } from "@chakra-ui/react";
import { useState } from "react";
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

  return <TestPageTestBlank />;
  // return <TestPageTestChoice />;
  const [count, setCount] = useState(0);



  return <>
    <div>
      <Button onClick={() => setCount((count) => count + 1)}>
        count is {count}
      </Button>
      <p >
        I18n test: {t('test')}
      </p>
    </div>
  </>
};


export default EntryPage;