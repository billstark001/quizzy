import { ExportFormat } from "@quizzy/base/types";
import { useState } from "react";
import { DialogRoot, DialogBackdrop, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter, Button, VStack, Switch, Text } from "@chakra-ui/react";
import { Radio, RadioGroup } from "@/components/ui/radio";
import { useTranslation } from "react-i18next";

interface ExportDialogProps {
  open: boolean;
  entityType: 'paper' | 'question';
  onExport: (format: ExportFormat, options: {
    keepIds?: boolean;
    removeIndices?: boolean;
    keepIdsInComplete?: boolean;
  }) => void;
  onCancel: () => void;
}

export const ExportDialog = ({
  open,
  entityType,
  onExport,
  onCancel,
}: ExportDialogProps) => {
  const { t } = useTranslation();
  const [format, setFormat] = useState<ExportFormat>('complete');
  const [keepIds, setKeepIds] = useState(true);
  const [removeIndices, setRemoveIndices] = useState(false);
  const [keepIdsInComplete, setKeepIdsInComplete] = useState(false);

  const handleExport = () => {
    onExport(format, {
      keepIds: format === 'separate' ? keepIds : undefined,
      removeIndices: format === 'separate' ? removeIndices : undefined,
      keepIdsInComplete: format === 'complete' ? keepIdsInComplete : undefined,
    });
  };

  return (
    <DialogRoot open={open} onOpenChange={(e) => !e.open && onCancel()} size="lg">
      <DialogBackdrop />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t('dialog.export.title', { type: t(`meta.${entityType}`) })}
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <VStack alignItems="stretch" gap={4}>
            <Text>{t('dialog.export.selectFormat')}</Text>
            
            <RadioGroup value={format} onValueChange={(details) => setFormat(details.value as ExportFormat)}>
              <VStack alignItems="stretch" gap={3}>
                <Radio value="separate">
                  <VStack alignItems="flex-start" gap={1}>
                    <Text fontWeight="semibold">{t('dialog.export.format.separate.title')}</Text>
                    <Text fontSize="sm" color="gray.600">
                      {t('dialog.export.format.separate.description')}
                    </Text>
                  </VStack>
                </Radio>
                
                {format === 'separate' && (
                  <VStack alignItems="stretch" gap={2} ml={6}>
                    <Switch.Root checked={keepIds} onCheckedChange={(e) => setKeepIds(e.checked)}>
                      <Switch.HiddenInput />
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                      <Switch.Label>{t('dialog.export.options.keepIds')}</Switch.Label>
                    </Switch.Root>
                    <Switch.Root checked={removeIndices} onCheckedChange={(e) => setRemoveIndices(e.checked)}>
                      <Switch.HiddenInput />
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                      <Switch.Label>{t('dialog.export.options.removeIndices')}</Switch.Label>
                    </Switch.Root>
                  </VStack>
                )}

                <Radio value="complete">
                  <VStack alignItems="flex-start" gap={1}>
                    <Text fontWeight="semibold">{t('dialog.export.format.complete.title')}</Text>
                    <Text fontSize="sm" color="gray.600">
                      {t('dialog.export.format.complete.description')}
                    </Text>
                  </VStack>
                </Radio>
                
                {format === 'complete' && (
                  <VStack alignItems="stretch" gap={2} ml={6}>
                    <Switch.Root checked={keepIdsInComplete} onCheckedChange={(e) => setKeepIdsInComplete(e.checked)}>
                      <Switch.HiddenInput />
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                      <Switch.Label>{t('dialog.export.options.keepIdsInComplete')}</Switch.Label>
                    </Switch.Root>
                  </VStack>
                )}

                <Radio value="text">
                  <VStack alignItems="flex-start" gap={1}>
                    <Text fontWeight="semibold">{t('dialog.export.format.text.title')}</Text>
                    <Text fontSize="sm" color="gray.600">
                      {t('dialog.export.format.text.description')}
                    </Text>
                  </VStack>
                </Radio>
              </VStack>
            </RadioGroup>
          </VStack>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {t('common.btn.cancel')}
          </Button>
          <Button onClick={handleExport} colorPalette="blue">
            {t('dialog.export.btnExport')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
};

export default ExportDialog;
