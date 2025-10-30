import { withHandler } from "@/components/handler";
import { downloadFile, uploadFile } from "@/utils/html";
import { Quizzy } from "@/data";
import { Box, Button, Separator, HStack, Switch, VStack, Wrap, NativeSelect, Input } from "@chakra-ui/react";
import { DialogRoot, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogActionTrigger } from "@/components/ui/dialog";
import { useEffect, useRef, useState } from "react";

import { useTranslation } from "react-i18next";
import i18n, { getSystemLanguage } from "@/data/lang-entry";
import useTags from "@/data/tags";

const _u = {
  async: true,
  cache: false,
  notifySuccess(count: number) {
    return i18n.t('page.settings.toast.recordsUpdated', { count });
  },
};

const _d = {
  async: true,
  cache: false,
  notifySuccess(count: number) {
    return i18n.t('page.settings.toast.recordsDeleted', { count });
  },
};

const refreshIndices = withHandler(
  Quizzy.refreshSearchIndices.bind(Quizzy),
  _u,
);

const deleteUnlinked = withHandler(
  Quizzy.deleteUnlinked.bind(Quizzy),
  _d,
);

const deleteLogicallyDeleted = withHandler(
  Quizzy.deleteLogicallyDeleted.bind(Quizzy),
  _d,
);

const normalizeQuestions = withHandler(
  Quizzy.normalizeQuestions.bind(Quizzy),
  _u,
);

const migrateTagsToIds = withHandler(
  Quizzy.migrateTagsToIds.bind(Quizzy),
  {
    async: true,
    cache: false,
    notifySuccess(result: { questionsUpdated: number; papersUpdated: number; tagsCreated: number }) {
      return i18n.t('page.settings.toast.tagMigrationCompleted', {
        questionsUpdated: result.questionsUpdated,
        papersUpdated: result.papersUpdated,
        tagsCreated: result.tagsCreated,
      });
    },
  },
);

const removeLegacyTagFields = withHandler(
  Quizzy.removeLegacyTagFields.bind(Quizzy),
  {
    async: true,
    cache: false,
    notifySuccess(result: { questionsUpdated: number; papersUpdated: number }) {
      return i18n.t('page.settings.toast.legacyFieldsRemoved', {
        questionsUpdated: result.questionsUpdated,
        papersUpdated: result.papersUpdated,
      });
    },
  },
);

const exportData = withHandler(
  async () => {
    const data = await Quizzy.exportData();
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
    await Quizzy.importData(json);
  },
  { async: true, cache: false }
);

const resetDatabase = withHandler(
  Quizzy.resetDatabase.bind(Quizzy),
  {
    async: true,
    cache: false,
    notifySuccess(count: number) {
      return i18n.t('page.settings.toast.databaseReset', { count });
    },
  },
);

export const SettingsPage = () => {

  const { t, i18n } = useTranslation();


  const [force, setForce] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<{
    completed: boolean;
    timestamp?: number;
    result?: any;
  }>({ completed: false });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');

  const langSelectRef = useRef<HTMLSelectElement>(null);

  const tags = useTags();

  const recordAllRecordableTags = withHandler(
    tags.recordAllRecordableTags,
    { cache: true }
  );

  // Load migration status on mount
  useEffect(() => {
    Quizzy.getMigrationStatus().then(setMigrationStatus);
  }, []);

  return <VStack alignItems='stretch' width='100%'>
    <Wrap>

      <HStack>
        <Button onClick={() => refreshIndices(force, true)}>{t('page.settings.btn.refreshIndices')}</Button>
        <Switch.Root checked={force} onCheckedChange={(e) => setForce(e.checked)}>
          <Switch.HiddenInput />
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          <Switch.Label>
            {t('page.settings.switch.forceRefresh')}
          </Switch.Label>
        </Switch.Root>
      </HStack>

      <Button onClick={() => deleteUnlinked(true)}>
        {t('page.settings.btn.deleteUnlinked')}
      </Button>
      <Button onClick={deleteLogicallyDeleted}>
        {t('page.settings.btn.deleteLogicallyDeleted')}
      </Button>
      <Button onClick={normalizeQuestions}>
        {t('page.settings.btn.normalizeQuestions')}
      </Button>
      <Button onClick={recordAllRecordableTags}>
        {t('page.settings.btn.recordAllRecordableTags')}
      </Button>
    </Wrap>
    <Separator />
    <Wrap>
      <Button 
        onClick={async () => {
          await migrateTagsToIds();
          const status = await Quizzy.getMigrationStatus();
          setMigrationStatus(status);
        }}
        disabled={migrationStatus.completed}
      >
        {t('page.settings.btn.migrateTagsToIds')}
      </Button>
      {migrationStatus.completed && (
        <Box color="green.500">
          {t('page.settings.text.tagMigrationCompleted')}
          {migrationStatus.result && ` (${t('page.settings.text.questionsUpdated')}: ${migrationStatus.result.questionsUpdated}, ${t('page.settings.text.papersUpdated')}: ${migrationStatus.result.papersUpdated}, ${t('page.settings.text.tagsCreated')}: ${migrationStatus.result.tagsCreated})`}
        </Box>
      )}
      <Button 
        onClick={removeLegacyTagFields}
        disabled={!migrationStatus.completed}
        colorPalette="orange"
      >
        {t('page.settings.btn.removeLegacyTagFields')}
      </Button>
    </Wrap>
    <Separator />
    <Wrap>
      <Button onClick={importData}>{t('page.settings.btn.importData')}</Button>
      <Button onClick={exportData}>{t('page.settings.btn.exportData')}</Button>
    </Wrap>
    <Separator />
    <HStack>
      <Box>{t('page.settings.selectLanguage')}</Box>

      <NativeSelect.Root maxW='50%'>
        <NativeSelect.Field
          ref={langSelectRef}
          onChange={(e) => i18n.changeLanguage(e.target.value || undefined)}
          placeholder={t('common.select.default')}
        >
          {['en', 'ja', 'zh'].map(l => (
            <option key={l} value={l}>
              {t('meta.lang.' + l)}
            </option>
          ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>

      <Button onClick={() => {
        const l = getSystemLanguage();
        i18n.changeLanguage(l);
        if (langSelectRef.current) {
          langSelectRef.current.value = l.length > 2 ? l.substring(0, 2) : l;
        }
      }}>{t('page.settings.autoDetect')}</Button>
    </HStack>
    <Separator />
    <Box>
      <Button 
        onClick={() => {
          setShowResetConfirm(true);
          setResetConfirmText('');
        }}
        colorPalette="red"
      >
        {t('page.settings.btn.resetDatabase')}
      </Button>
    </Box>

    <DialogRoot 
      open={showResetConfirm} 
      onOpenChange={(e) => setShowResetConfirm(e.open)}
      size="lg"
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('page.settings.dialog.resetDatabase.title')}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <VStack alignItems="stretch" gap={4}>
            <Box color="red.500">
              {t('page.settings.dialog.resetDatabase.message')}
            </Box>
            <Box>
              <Box mb={2}>{t('page.settings.dialog.resetDatabase.confirmText')}</Box>
              <Input 
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                placeholder={t('page.settings.dialog.resetDatabase.confirmPlaceholder')}
              />
            </Box>
          </VStack>
        </DialogBody>
        <DialogFooter>
          <DialogActionTrigger asChild>
            <Button variant="outline">{t('common.btn.cancel')}</Button>
          </DialogActionTrigger>
          <Button
            colorPalette="red"
            disabled={resetConfirmText !== 'DELETE ALL'}
            onClick={async () => {
              if (resetConfirmText === 'DELETE ALL') {
                await resetDatabase();
                setShowResetConfirm(false);
                setResetConfirmText('');
                // Reload the page after reset
                window.location.reload();
              }
            }}
          >
            {t('page.settings.btn.resetDatabase')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  </VStack>;
};

export default SettingsPage;