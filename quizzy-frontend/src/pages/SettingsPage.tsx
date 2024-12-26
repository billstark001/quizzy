import { withHandler } from "@/utils";
import { downloadFile, uploadFile } from "@/utils/html";
import { QuizzyRaw } from "@/data";
import { Button, Divider, HStack, Switch, VStack } from "@chakra-ui/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";


const refreshIndices = withHandler(
  async (force: boolean) => {
    const count = await QuizzyRaw.refreshSearchIndices(force);
    console.log(`${count} records updated`);
    return count;
  },
  {
    async: true,
    cache: false,
  }
);

const deleteUnlinked = withHandler(
  async () => {
    const count = await QuizzyRaw.deleteUnlinked();
    console.log(`${count} records deleted`);
    return count;
  },
  {
    async: true,
    cache: false,
  }
)

const exportData = withHandler(
  async () => {
    const data = await QuizzyRaw.exportData();
    const dataStr = JSON.stringify(data);
    const blob = new Blob([dataStr], { type: 'application/json' });
    await downloadFile(blob, 'export.json');
  },
  { async: true, cache: false }
);

const importData = withHandler(
  async () => {
    const file = await uploadFile();
    const text = await file.text();
    const json = JSON.parse(text);
    await QuizzyRaw.importData(json);
  },
  { async: true, cache: false }
);

export const SettingsPage = () => {

  const { t } = useTranslation();

  const [force, setForce] = useState(false);

  return <VStack alignItems='flex-start' width='100%'>
    <HStack>
      <Button onClick={() => refreshIndices(force)}>{t('page.settings.btn.refreshIndices')}</Button>
      <Switch isChecked={force} onChange={(e) => setForce(e.target.checked)}>force</Switch>
      <Button onClick={deleteUnlinked}>{t('page.settings.btn.deleteUnlinked')}</Button>
    </HStack>
    <Divider />
    <HStack>
      <Button onClick={importData}>{t('page.settings.btn.importData')}</Button>
      <Button onClick={exportData}>{t('page.settings.btn.exportData')}</Button>
    </HStack>
    <Divider />
  </VStack>;
};

export default SettingsPage;