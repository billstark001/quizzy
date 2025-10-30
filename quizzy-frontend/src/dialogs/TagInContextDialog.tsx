import { Button, Input, VStack, Text, Box, HStack, IconButton } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { IoAddOutline, IoCloseOutline } from "react-icons/io5";
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
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [newAlternative, setNewAlternative] = useState('');

  useEffect(() => {
    if (tag) {
      setMainName(tag.mainName);
      // Filter out the mainName from alternatives
      const alts = tag.alternatives.filter(alt => alt !== tag.mainName);
      setAlternatives(alts);
    } else if (initialName) {
      setMainName(initialName);
      setAlternatives([]);
    }
  }, [tag, initialName]);

  const handleAddAlternative = () => {
    const trimmed = newAlternative.trim();
    if (trimmed && !alternatives.includes(trimmed)) {
      setAlternatives([...alternatives, trimmed]);
      setNewAlternative('');
    }
  };

  const handleRemoveAlternative = (index: number) => {
    setAlternatives(alternatives.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    if (!mainName.trim()) {
      return;
    }
    
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
          {/* Alternatives */}
          <VStack alignItems="flex-start" gap={2}>
            <Text fontWeight="bold">{t('dialog.tagEdit.alternatives')}</Text>
            
            {!isNewTag && alternatives.length === 0 && (
              <Text fontSize="sm" color="gray.600">
                {t('dialog.tagInContext.noAlternatives')}
              </Text>
            )}

            {/* Alternative list */}
            {alternatives.length > 0 && (
              <VStack alignItems="stretch" width="100%" gap={1}>
                {alternatives.map((alt, index) => (
                  <HStack key={index} p={2} bg="gray.50" borderRadius="md">
                    <Text flex="1">{alt}</Text>
                    {isNewTag && (
                      <IconButton
                        aria-label="Remove alternative"
                        size="sm"
                        variant="ghost"
                        colorPalette="red"
                        onClick={() => handleRemoveAlternative(index)}
                      >
                        <IoCloseOutline />
                      </IconButton>
                    )}
                  </HStack>
                ))}
              </VStack>
            )}

            {/* Add new alternative (only for new tags) */}
            {isNewTag && (
              <>
                <HStack width="100%">
                  <Input
                    value={newAlternative}
                    onChange={(e) => setNewAlternative(e.target.value)}
                    placeholder={t('dialog.tagEdit.addAlternativePlaceholder')}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddAlternative();
                      }
                    }}
                  />
                  <IconButton
                    aria-label="Add alternative"
                    onClick={handleAddAlternative}
                    colorPalette="purple"
                    disabled={!newAlternative.trim()}
                  >
                    <IoAddOutline />
                  </IconButton>
                </HStack>
                <Text fontSize="xs" color="gray.600">
                  {t('dialog.tagEdit.alternativesHint')}
                </Text>
              </>
            )}
          </VStack>
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
