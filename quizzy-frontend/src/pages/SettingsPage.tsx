import { withHandler } from "@/utils";
import { downloadFile, uploadFile } from "@/utils/html";
import { QuizzyRaw } from "@/data";
import { Box, Button, Divider, HStack, Select, Switch, VStack } from "@chakra-ui/react";
import { useRef, useState } from "react";

import { useTranslation } from "react-i18next";
import i18n, { getSystemLanguage } from "@/data/lang-entry";


const refreshIndices = withHandler(
  async (force: boolean) => {
    const count = await QuizzyRaw.refreshSearchIndices(force);
    return count;
  },
  {
    async: true,
    cache: false,
    notifySuccess(count) {
      return i18n.t('page.settings.toast.recordsUpdated', { count });
    },
  }
);

const deleteUnlinked = withHandler(
  async () => {
    const count = await QuizzyRaw.deleteUnlinked();
    return count;
  },
  {
    async: true,
    cache: false,
    notifySuccess(count) {
      return i18n.t('page.settings.toast.recordsDeleted', { count });
    },
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

  const { t, i18n } = useTranslation();


  const [force, setForce] = useState(false);

  const langSelectRef = useRef<HTMLSelectElement>(null);

  return <VStack alignItems='stretch' width='100%'>
    <HStack>
      <Button onClick={() => refreshIndices(force)}>{t('page.settings.btn.refreshIndices')}</Button>
      <Switch isChecked={force} onChange={(e) => setForce(e.target.checked)}>
        {t('page.settings.switch.forceRefresh')}
      </Switch>
      <Button onClick={deleteUnlinked}>{t('page.settings.btn.deleteUnlinked')}</Button>
    </HStack>
    <Divider />
    <HStack>
      <Button onClick={importData}>{t('page.settings.btn.importData')}</Button>
      <Button onClick={exportData}>{t('page.settings.btn.exportData')}</Button>
    </HStack>
    <Divider />
    <HStack>
      <Box>{t('page.settings.selectLanguage')}</Box>
      <Select
        ref={langSelectRef}
        maxW='50%'
        onChange={(e) => i18n.changeLanguage(e.target.value || undefined)}>
        <option value=''>{t('common.select.default')}</option>
        {['en', 'ja', 'zh'].map(l => <option key={l} value={l}>
          {t('meta.lang.' + l)}
        </option>)}
      </Select>
      <Button onClick={() => {
        const l = getSystemLanguage();
        i18n.changeLanguage(l);
        if (langSelectRef.current) {
          langSelectRef.current.value = l.length > 2 ? l.substring(0, 2) : l;
        }
      }}>{t('page.settings.autoDetect')}</Button>
    </HStack>
  </VStack>;
};

export default SettingsPage;