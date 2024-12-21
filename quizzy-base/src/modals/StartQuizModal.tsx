import { 
  Modal, ModalBody, ModalCloseButton, 
  ModalContent, ModalFooter, ModalHeader,
  ModalOverlay, ModalProps,
  Tabs,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";


export const StartQuizModal = (props: Omit<ModalProps, 'children'> & {

}) => {

  const { t } = useTranslation();

  return <Modal 
    closeOnOverlayClick={false} 
    size='4xl'
    {...props}
  >
    <ModalOverlay />
    <ModalContent>
      <ModalCloseButton />
      <ModalHeader>{t('modal.startQuiz.header')}</ModalHeader>
      <ModalBody>

      </ModalBody>
      <ModalFooter>
        
      </ModalFooter>
    </ModalContent>
  </Modal>
};

export default StartQuizModal;