import { withHandler } from "#/utils";
import { Quizzy, QuizzyRaw } from "@/data";
import { Button, Divider, HStack, VStack } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";


const refreshIndices = withHandler(
  () => QuizzyRaw.refreshSearchIndices(true),
  {
    async: true,
    cache: false,
  }
);

const exportData = async () => {
  const data = await Quizzy.exportData();
  const dataStr = JSON.stringify(data);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'export.json';
  link.click();
  URL.revokeObjectURL(url);
};

const _importData = withHandler(
  (d) => QuizzyRaw.importData(d),
  { async: true, cache: false }
);

const importData = async () => {
  const input = document.createElement("input");
  input.type = 'file';
  input.oninput = async () => {
    const f = input.files?.[0];
    if (!f) {
      return;
    }
    const text = await f.text();
    const json = JSON.parse(text);
    return await _importData(json);
  };
  input.click();
};


export const SettingsPage = () => {

  const { t } = useTranslation();

  return <VStack alignItems='flex-start' width='100%'>
    <HStack>
      <Button onClick={refreshIndices}>{t('btn.setting.refreshIndices')}</Button>
      <Button onClick={importData}>{t('btn.setting.importData')}</Button>
      <Button onClick={exportData}>{t('btn.setting.exportData')}</Button>
    </HStack>
    <Divider />
  </VStack>;
};

export default SettingsPage;