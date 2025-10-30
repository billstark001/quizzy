import { Button, Input, VStack, HStack, IconButton, Text } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { IoAddOutline, IoCloseOutline } from "react-icons/io5";
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
  mainNames: Record<string, string | undefined>;
  alternatives: string[];
} | undefined;

const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
];

export const TagEditDialog = (
  props: DialogRootNoChildrenProps & 
  UseDialogYieldedRootProps<TagEditDialogData, TagEditDialogResult>
) => {
  const { data, submit, ...dialogProps } = props;
  const { tag } = data ?? {};
  const { t } = useTranslation();

  const [mainName, setMainName] = useState('');
  const [mainNames, setMainNames] = useState<Record<string, string | undefined>>({});
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [newAlternative, setNewAlternative] = useState('');

  useEffect(() => {
    if (tag) {
      setMainName(tag.mainName);
      setMainNames(tag.mainNames || {});
      // Filter out the mainName from alternatives
      const alts = tag.alternatives.filter(alt => alt !== tag.mainName);
      setAlternatives(alts);
    }
  }, [tag]);

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

  const handleMainNameChange = (lang: string, value: string) => {
    setMainNames({ ...mainNames, [lang]: value || undefined });
  };

  const handleSubmit = () => {
    if (!mainName.trim()) {
      return;
    }
    
    submit({ 
      mainName: mainName.trim(), 
      mainNames,
      alternatives 
    });
  };

  return (
    <DialogRoot closeOnInteractOutside={false} {...dialogProps}>
      <DialogContent maxW="600px">
        <DialogCloseTrigger />
        <DialogHeader>{t('dialog.tagEdit.header')}</DialogHeader>
        <DialogBody as={VStack} alignItems="stretch" gap={4}>
          {/* Main Name */}
          <VStack alignItems="flex-start" gap={2}>
            <label htmlFor="tag-name">{t('dialog.tagEdit.mainName')}</label>
            <Input
              id="tag-name"
              value={mainName}
              onChange={(e) => setMainName(e.target.value)}
              placeholder={t('dialog.tagEdit.mainNamePlaceholder')}
            />
          </VStack>

          {/* Multilingual Names */}
          <VStack alignItems="flex-start" gap={2}>
            <Text fontWeight="bold">{t('dialog.tagEdit.multilingualNames')}</Text>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <HStack key={lang.code} width="100%">
                <Text minW="80px" fontSize="sm">{lang.label}:</Text>
                <Input
                  value={mainNames[lang.code] || ''}
                  onChange={(e) => handleMainNameChange(lang.code, e.target.value)}
                  placeholder={`${lang.label} name`}
                />
              </HStack>
            ))}
          </VStack>

          {/* Alternatives */}
          <VStack alignItems="flex-start" gap={2}>
            <Text fontWeight="bold">{t('dialog.tagEdit.alternatives')}</Text>
            
            {/* Alternative list */}
            {alternatives.length > 0 && (
              <VStack alignItems="stretch" width="100%" gap={1}>
                {alternatives.map((alt, index) => (
                  <HStack key={index} p={2} bg="gray.50" borderRadius="md">
                    <Text flex="1">{alt}</Text>
                    <IconButton
                      aria-label="Remove alternative"
                      size="sm"
                      variant="ghost"
                      colorPalette="red"
                      onClick={() => handleRemoveAlternative(index)}
                    >
                      <IoCloseOutline />
                    </IconButton>
                  </HStack>
                ))}
              </VStack>
            )}

            {/* Add new alternative */}
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
