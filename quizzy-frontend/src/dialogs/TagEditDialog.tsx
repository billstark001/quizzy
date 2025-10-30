import { Button, Input, VStack } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  DialogRoot, DialogBody, DialogCloseTrigger,
  DialogContent, DialogFooter, DialogHeader
} from "@/components/ui/dialog";
import { DialogRootNoChildrenProps, UseDialogYieldedRootProps } from "@/utils/chakra";
import { Tag } from "@quizzy/base/types";

export type TagEditDialogData = {
  tag: Tag;
};

export type TagEditDialogResult = {
  mainName: string;
  alternatives: string[];
} | undefined;

export const TagEditDialog = (
  props: DialogRootNoChildrenProps & 
  UseDialogYieldedRootProps<TagEditDialogData, TagEditDialogResult>
) => {
  const { data, submit, ...dialogProps } = props;
  const { tag } = data ?? {};
  const { t } = useTranslation();

  const [mainName, setMainName] = useState('');
  const [alternativesText, setAlternativesText] = useState('');

  useEffect(() => {
    if (tag) {
      setMainName(tag.mainName);
      // Join alternatives with comma, filtering out the mainName
      const alts = tag.alternatives.filter(alt => alt !== tag.mainName);
      setAlternativesText(alts.join(', '));
    }
  }, [tag]);

  const handleSubmit = () => {
    if (!mainName.trim()) {
      return;
    }
    
    // Parse alternatives from comma-separated text
    const alternatives = alternativesText
      .split(',')
      .map(alt => alt.trim())
      .filter(alt => alt.length > 0);
    
    submit({ mainName: mainName.trim(), alternatives });
  };

  return (
    <DialogRoot closeOnInteractOutside={false} {...dialogProps}>
      <DialogContent>
        <DialogCloseTrigger />
        <DialogHeader>{t('dialog.tagEdit.header')}</DialogHeader>
        <DialogBody as={VStack} alignItems="stretch" gap={4}>
          <VStack alignItems="flex-start" gap={2}>
            <label htmlFor="tag-name">{t('dialog.tagEdit.mainName')}</label>
            <Input
              id="tag-name"
              value={mainName}
              onChange={(e) => setMainName(e.target.value)}
              placeholder={t('dialog.tagEdit.mainNamePlaceholder')}
            />
          </VStack>
          <VStack alignItems="flex-start" gap={2}>
            <label htmlFor="tag-alternatives">{t('dialog.tagEdit.alternatives')}</label>
            <Input
              id="tag-alternatives"
              value={alternativesText}
              onChange={(e) => setAlternativesText(e.target.value)}
              placeholder={t('dialog.tagEdit.alternativesPlaceholder')}
            />
          </VStack>
        </DialogBody>
        <DialogFooter justifyContent="space-between">
          <Button colorPalette="red" onClick={() => submit(undefined)}>
            {t('common.btn.cancel')}
          </Button>
          <Button colorPalette="purple" onClick={handleSubmit}>
            {t('common.btn.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
};

export default TagEditDialog;
