import { QuestionConflict, ConflictResolutionDecision, ConflictResolutionAction } from "@quizzy/base/types";
import { useState } from "react";
import { Button, VStack, HStack, Box, Text } from "@chakra-ui/react";
import { Radio, RadioGroup } from "@/components/ui/radio";
import { useTranslation } from "react-i18next";
import { DialogHeader, DialogBody, DialogContent, DialogFooter, DialogRoot, DialogTitle } from "@/components/ui/dialog";

interface ConflictResolutionDialogProps {
  open: boolean;
  conflicts: QuestionConflict[];
  onResolve: (decisions: ConflictResolutionDecision[]) => void;
  onCancel: () => void;
}

export const ConflictResolutionDialog = ({
  open,
  conflicts,
  onResolve,
  onCancel,
}: ConflictResolutionDialogProps) => {
  const { t } = useTranslation();
  const [decisions, setDecisions] = useState<Map<string, ConflictResolutionAction>>(
    new Map(conflicts.map(c => [c.imported.id!, 'keep-both']))
  );

  const handleDecisionChange = (questionId: string, action: ConflictResolutionAction) => {
    setDecisions(new Map(decisions.set(questionId, action)));
  };

  const handleResolveAll = (action: ConflictResolutionAction) => {
    const newDecisions = new Map<string, ConflictResolutionAction>();
    conflicts.forEach(c => newDecisions.set(c.imported.id!, action));
    setDecisions(newDecisions);
  };

  const handleSubmit = () => {
    const resolvedDecisions: ConflictResolutionDecision[] = Array.from(decisions.entries()).map(
      ([questionId, action]) => ({ questionId, action })
    );
    onResolve(resolvedDecisions);
  };

  return (
    <DialogRoot open={open} onOpenChange={(e) => !e.open && onCancel()} size="xl">
      <DialogContent maxHeight="80vh" overflowY="auto">
        <DialogHeader>
          <DialogTitle>{t('dialog.conflictResolution.title')}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <VStack alignItems="stretch" gap={4}>
            <Text>{t('dialog.conflictResolution.message', { count: conflicts.length })}</Text>
            
            <HStack justifyContent="flex-end" gap={2}>
              <Button size="sm" onClick={() => handleResolveAll('keep-existing')}>
                {t('dialog.conflictResolution.keepAllExisting')}
              </Button>
              <Button size="sm" onClick={() => handleResolveAll('use-imported')}>
                {t('dialog.conflictResolution.useAllImported')}
              </Button>
              <Button size="sm" onClick={() => handleResolveAll('keep-both')}>
                {t('dialog.conflictResolution.keepAllBoth')}
              </Button>
            </HStack>

            {conflicts.map((conflict, index) => (
              <Box key={conflict.imported.id} p={4} borderWidth={1} borderRadius="md">
                <Text fontWeight="bold" mb={2}>
                  {t('dialog.conflictResolution.conflict')} {index + 1}
                </Text>
                
                <Box mb={3}>
                  <Text fontSize="sm" fontWeight="semibold">{t('dialog.conflictResolution.content')}:</Text>
                  <Text fontSize="sm">{conflict.existing.content.substring(0, 100)}...</Text>
                </Box>

                <RadioGroup
                  value={decisions.get(conflict.imported.id!) || 'keep-both'}
                  onValueChange={(details) => handleDecisionChange(conflict.imported.id!, details.value as ConflictResolutionAction)}
                >
                  <VStack alignItems="stretch" gap={2}>
                    <Radio value="keep-existing">
                      {t('dialog.conflictResolution.keepExisting')}
                    </Radio>
                    <Radio value="use-imported">
                      {t('dialog.conflictResolution.useImported')}
                    </Radio>
                    <Radio value="keep-both">
                      {t('dialog.conflictResolution.keepBoth')}
                    </Radio>
                  </VStack>
                </RadioGroup>
              </Box>
            ))}
          </VStack>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {t('common.btn.cancel')}
          </Button>
          <Button onClick={handleSubmit} colorPalette="blue">
            {t('common.btn.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
};

export default ConflictResolutionDialog;
