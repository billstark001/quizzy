import { TestPageTestBlank, TestPageTestChoice } from "@/test-pages";
import { Button } from "@chakra-ui/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export const EntryPage = () => {

  return <TestPageTestBlank />;
  // return <TestPageTestChoice />;
  const [count, setCount] = useState(0);

  const { t } = useTranslation();


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