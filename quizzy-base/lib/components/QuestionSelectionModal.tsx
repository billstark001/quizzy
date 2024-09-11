import {
  Box, Button, HStack, Modal, ModalBody, ModalCloseButton, ModalContent,
  ModalFooter, ModalHeader, ModalOverlay, ModalProps, Wrap
} from "@chakra-ui/react";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";


export type QuestionSelectionModalProps = Omit<ModalProps, "children"> & {
  index: number;
  current?: number;
  total: number;
  setIndex?: (index: number) => void;
  onSelect?: (index: number) => void;
  question?: ReactNode;
  header?: ReactNode
};


export const QuestionSelectionModal = (props: QuestionSelectionModalProps) => {
  const { 
    index, current, total, question, header, 
    setIndex, onSelect,
    ...modalProps 
  } = props;

  const { t } = useTranslation();
  const onSelectClick = () => {
    onSelect?.(index);
    modalProps.onClose();
  }


  return <Modal
    closeOnOverlayClick={false}
    size='4xl'
    {...modalProps}
  >
    <ModalOverlay />
    <ModalContent>
      <ModalHeader>
        {header ?? t('modal.select.header')}
      </ModalHeader>
      <ModalCloseButton />
      <ModalBody>
        <HStack alignItems='flex-start' maxH='75vh'>
          <Wrap flex={2.4} overflowY='scroll' maxH='75vh' p={1}>
            {Array(total).fill(0).map((_, i) => <Button
              w={12} key={i}
              colorScheme={index === i + 1 ? 'blue' : undefined}
              onClick={() => setIndex?.(i + 1)}
              border={current === i + 1 ? '1px solid' : 'none'}
              borderColor='gray.500'
            >
              {i + 1}
            </Button>)}
          </Wrap>
          <Box flex={1} overflowY='scroll' maxH='65vh'>
            {question}
          </Box>
        </HStack>
      </ModalBody>
      <ModalFooter as={HStack} justifyContent='space-between'>
        <Button onClick={modalProps.onClose}>{t('modal.general.btn.close')}</Button>
        <Button onClick={onSelectClick}>{t('modal.select.btn.select')}</Button>
      </ModalFooter>
    </ModalContent>

  </Modal>
};