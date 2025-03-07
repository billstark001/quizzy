import { QuestionPanel } from "@/components/question-display/QuestionPanel";
import { Question } from "@quizzy/base/types";
import { Button, DialogRootProps, UseDisclosureReturn } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { 
  DialogRoot, DialogBody, DialogCloseTrigger, 
  DialogContent, DialogFooter, DialogHeader, 
} from "@/components/ui/dialog";
import { getDialogController } from "@/utils/chakra";

export const QuestionPreviewDialog = (props: Omit<DialogRootProps, 'children'> & {
  question?: Question;
} & UseDisclosureReturn) => {
  const { question, ...dPreview } = props;
  const { t } = useTranslation();

  return <DialogRoot {...dPreview} {...getDialogController(dPreview)} size='xl'>
    <DialogContent>
      <DialogCloseTrigger />
      <DialogHeader>
        {t('dialog.questionPreview.header')}
      </DialogHeader>
      <DialogBody>
        <QuestionPanel
          height='68vh'
          overflowY='au to'
          question={question as any}
          displaySolution
        />
      </DialogBody>
      <DialogFooter>
        <Button onClick={() => dPreview.onClose()}>
          {t('common.btn.close')}
        </Button>
      </DialogFooter>
    </DialogContent>
  </DialogRoot>;
};

export default QuestionPreviewDialog;