import {
  Box, Button, HStack, Modal, ModalBody, ModalCloseButton, ModalContent,
  ModalFooter, ModalHeader, ModalOverlay, ModalProps, Wrap
} from "@chakra-ui/react";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";


export type QuestionSelectionModalProps = Omit<ModalProps, "children"> & {
  index: number;
  total: number;
  setIndex?: (index: number) => void;
  question?: ReactNode;
  header?: ReactNode
};


export const QuestionSelectionModal = (props: QuestionSelectionModalProps) => {
  const { index, total, question, header, setIndex, ...modalProps } = props;

  const { t } = useTranslation();


  return <Modal
    closeOnOverlayClick={false}
    size='4xl'
    {...modalProps}
  >
    <ModalOverlay />
    <ModalContent maxH='80vh'>
      <ModalHeader>
        {header ?? t('modal.select.header')}
      </ModalHeader>
      <ModalCloseButton />
      <ModalBody as={HStack} alignItems='flex-start'>
        <Wrap>
          {Array(total).fill(0).map((_, i) => <Button
            w={10}
            colorScheme={index === i + 1 ? 'blue' : undefined}
            onClick={() => setIndex?.(i + 1)}
          >
            {i + 1}
          </Button>)}
        </Wrap>
        <Box w={80} h='100%'>
          {question}
        </Box>
      </ModalBody>
      <ModalFooter as={HStack} justifyContent='space-between'>
        <Button onClick={modalProps.onClose}>{t('modal.general.btn.close')}</Button>
        <Button>{t('modal.select.btn.select')}</Button>
      </ModalFooter>
    </ModalContent>

  </Modal>
};