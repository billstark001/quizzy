import { Question } from "@quizzy/base/types";
import { Button } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { 
  DialogRoot, DialogBody, DialogCloseTrigger, 
  DialogContent, DialogFooter, DialogHeader, 
} from "@/components/ui/dialog";
import { DialogRootNoChildrenProps, UseDialogYieldedRootProps } from "@/utils/chakra";
import QuestionPanelWithBookmark from "@/components/question-display/QuestionPanelWithBookmark";

export const QuestionPreviewDialog = (
  props: DialogRootNoChildrenProps & UseDialogYieldedRootProps<Question, any>,
) => {
  const { data: question, submit, ...dPreview } = props;
  const { t } = useTranslation();

  return <DialogRoot size='xl' {...dPreview}>
    <DialogContent>
      <DialogCloseTrigger />
      <DialogHeader>
        {t('dialog.questionPreview.header')}
      </DialogHeader>
      <DialogBody>
        <QuestionPanelWithBookmark
          height='68vh'
          overflowY='au to'
          question={question as any}
          displaySolution
        />
      </DialogBody>
      <DialogFooter>
        <Button onClick={submit}>
          {t('common.btn.close')}
        </Button>
      </DialogFooter>
    </DialogContent>
  </DialogRoot>;
};

export default QuestionPreviewDialog;