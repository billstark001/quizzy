import { QuestionPanel } from "@/components/question-display/QuestionPanel";
import { Question } from "@quizzy/common/types";
import { Button, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, ModalProps } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

export const QuestionPreviewModal = (props: Omit<ModalProps, 'children'> & {
  question?: Question;
}) => {
  const { question, ...dPreview } = props;
  const { t } = useTranslation();

  return <Modal {...dPreview} size='5xl'>
    <ModalOverlay />
    <ModalContent>
      <ModalCloseButton />
      <ModalHeader>
        {t('modal.questionPreview.header')}
      </ModalHeader>
      <ModalBody>
        <QuestionPanel
          height='68vh'
          overflowY='scroll'
          question={question as any}
          displaySolution
        />
      </ModalBody>
      <ModalFooter>
        <Button onClick={() => dPreview.onClose()}>
          {t('common.btn.close')}
        </Button>
      </ModalFooter>
    </ModalContent>
  </Modal>;
};

export default QuestionPreviewModal;