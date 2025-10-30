import { Button, Input, VStack, Text, Box } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  DialogRoot, DialogBody, DialogCloseTrigger,
  DialogContent, DialogFooter, DialogHeader
} from "@/components/ui/dialog";
import { DialogRootNoChildrenProps, UseDialogYieldedRootProps } from "@/utils/chakra";
import { Tag } from "@quizzy/base/types";

export type TagInContextDialogData = {
  tag?: Tag; // undefined means new tag
  initialName?: string; // for new tags
  contextType: 'question' | 'paper'; // which context we're in
};

export type TagInContextDialogResult = 
  | { action: 'add'; mainName: string; alternatives: string[] }
  | { action: 'remove' }
  | { action: 'cancel' };

export const TagInContextDialog = (
  props: DialogRootNoChildrenProps & 
  UseDialogYieldedRootProps<TagInContextDialogData, TagInContextDialogResult>
) => {
  const { data, submit, ...dialogProps } = props;
  const { tag, initialName, contextType } = data ?? {};
  const { t } = useTranslation();

  const isNewTag = !tag;
  const [mainName, setMainName] = useState('');
  const [alternativesText, setAlternativesText] = useState('');

  useEffect(() => {
    if (tag) {
      setMainName(tag.mainName);
      // Join alternatives with comma, filtering out the mainName
      const alts = tag.alternatives.filter(alt => alt !== tag.mainName);
      setAlternativesText(alts.join(', '));
    } else if (initialName) {
      setMainName(initialName);
      setAlternativesText('');
    }
  }, [tag, initialName]);

  const handleAdd = () => {
    if (!mainName.trim()) {
      return;
    }
    
    // Parse alternatives from comma-separated text
    const alternatives = alternativesText
      .split(',')
      .map(alt => alt.trim())
      .filter(alt => alt.length > 0);
    
    submit({ action: 'add', mainName: mainName.trim(), alternatives });
  };

  const handleRemove = () => {
    submit({ action: 'remove' });
  };

  const handleCancel = () => {
    submit({ action: 'cancel' });
  };

  return (
    <DialogRoot closeOnInteractOutside={false} {...dialogProps}>
      <DialogContent>
        <DialogCloseTrigger />
        <DialogHeader>
          {isNewTag 
            ? t('dialog.tagInContext.headerNew') 
            : t('dialog.tagInContext.headerExisting')}
        </DialogHeader>
        <DialogBody as={VStack} alignItems="stretch" gap={4}>
          {isNewTag && (
            <Box>
              <Text fontSize="sm" color="gray.600">
                {t('dialog.tagInContext.newTagDescription')}
              </Text>
            </Box>
          )}
          <VStack alignItems="flex-start" gap={2}>
            <label htmlFor="tag-name">{t('dialog.tagEdit.mainName')}</label>
            <Input
              id="tag-name"
              value={mainName}
              onChange={(e) => setMainName(e.target.value)}
              placeholder={t('dialog.tagEdit.mainNamePlaceholder')}
              disabled={!isNewTag} // Can't edit name of existing tag here
            />
          </VStack>
          {isNewTag && (
            <VStack alignItems="flex-start" gap={2}>
              <label htmlFor="tag-alternatives">{t('dialog.tagEdit.alternatives')}</label>
              <Input
                id="tag-alternatives"
                value={alternativesText}
                onChange={(e) => setAlternativesText(e.target.value)}
                placeholder={t('dialog.tagEdit.alternativesPlaceholder')}
              />
            </VStack>
          )}
          {!isNewTag && (
            <VStack alignItems="flex-start" gap={2}>
              <Text fontSize="sm" fontWeight="bold">{t('dialog.tagEdit.alternatives')}</Text>
              <Text fontSize="sm" color="gray.600">
                {tag?.alternatives.filter(alt => alt !== tag?.mainName).join(', ') || t('dialog.tagInContext.noAlternatives')}
              </Text>
            </VStack>
          )}
        </DialogBody>
        <DialogFooter justifyContent="space-between">
          <Button colorPalette="red" onClick={handleCancel}>
            {t('common.btn.cancel')}
          </Button>
          <Box display="flex" gap={2}>
            {!isNewTag && (
              <Button colorPalette="orange" onClick={handleRemove}>
                {t('dialog.tagInContext.removeFrom', { 
                  context: contextType === 'question' 
                    ? t('dialog.tagInContext.question') 
                    : t('dialog.tagInContext.paper') 
                })}
              </Button>
            )}
            {isNewTag && (
              <Button colorPalette="purple" onClick={handleAdd}>
                {t('common.btn.add')}
              </Button>
            )}
          </Box>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
};

export default TagInContextDialog;
