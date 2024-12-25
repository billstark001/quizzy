import { usePatch } from "@/utils/react-patch";
import { AddIcon, MinusIcon, QuestionIcon } from "@chakra-ui/icons";
import {
  Box, Button, HStack, IconButton, IconButtonProps, Modal, ModalBody, ModalCloseButton, ModalContent,
  ModalFooter, ModalHeader, ModalOverlay, ModalProps, Switch, useCallbackRef, Wrap
} from "@chakra-ui/react";
import { ReactNode, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS as CssDnD } from '@dnd-kit/utilities';


export type QuestionSelectionModalProps = Omit<ModalProps, "children"> & {
  children?: ReactNode;
  header?: ReactNode;

  total: number;
  preview: number;
  selected?: number;
  onSelectPreview?: (index: number) => void;
  onSelect?: (index: number) => void;

  allowEdit?: boolean;
  onAdd?: (index: number) => boolean | Promise<boolean>;
  onEdit?: (indices: readonly number[]) => void;
};

const smallIcon = <IconButton
  display='none' className='h'
  minWidth={5} fontSize={10} borderRadius={500}
  width={5} height={5} padding={0} zIndex={10}
  position='absolute' top={0} left={0}
  transformOrigin='0 0' transform='translate(-50%, -50%)'
  aria-label=""
  sx={{
    '& > *': {
      transform: 'translateY(-1px)'
    }
  }}
/>;
const smallIconProps = smallIcon.props as Readonly<IconButtonProps>;
const smallIconCenterProps: Readonly<IconButtonProps> = {
  ...smallIconProps,
  left: '50%',
};
const smallIconRightProps: Readonly<IconButtonProps> = {
  ...smallIconProps,
  left: undefined,
  right: 0,
  transform: 'translate(50%, -50%)',
};

type ModalEditState = Readonly<{
  isEditing: boolean;
  totalAtStart: number;
  nextIndex: number;
  // order: readonly number[];
}>;

type RenderButtonProps = {
  indexOfPaper: number;
  indexOfArray: number;
  preview?: number;
  selected?: number;
  isEditing?: boolean;
  add: (i: number) => Promise<void>;
  remove: (i: number) => void;
  onSelectPreview?: (i: number) => void;
}

const RenderButton = (props: RenderButtonProps) => {

  const {
    indexOfPaper, indexOfArray, preview, selected,
    isEditing, add, remove, onSelectPreview
  } = props;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: indexOfArray });

  let indexButton = <Button
    w={12}
    colorScheme={preview === indexOfPaper ? 'blue' : undefined}
    onClick={() => onSelectPreview?.(indexOfPaper)}
    border={selected === indexOfPaper ? '1px solid' : 'none'}
    borderColor='gray.500'
  >
    {indexOfPaper}
  </Button>;

  if (isEditing) {
    const style = {
      transform: CssDnD.Transform.toString(transform),
      transition,
    };
    indexButton = <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {indexButton}
    </div>;
  }

  return <Box
    position='relative'
    sx={{
      '&:hover .h': { display: 'block' },
    }}
  >
    {indexButton}
    {isEditing && <>
      <IconButton
        {...smallIconProps}
        icon={<MinusIcon />} aria-label="remove" colorScheme="red"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          remove(indexOfArray);
        }}
      />
      <IconButton
        {...smallIconCenterProps}
        icon={<QuestionIcon />} aria-label="view" colorScheme="blue"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onSelectPreview?.(indexOfPaper)
        }}
      />
      <IconButton
        {...smallIconRightProps}
        icon={<AddIcon />} aria-label="add" colorScheme="green"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          return add(indexOfArray + 1);
        }}
      />
    </>}
  </Box>;

};

export const QuestionSelectionModal = (props: QuestionSelectionModalProps) => {
  const {
    preview, selected, total, children, header,
    onSelectPreview: onSelectPreviewProp, onSelect,
    allowEdit, onAdd, onEdit,
    ...modalProps
  } = props;

  const onSelectPreview = useCallbackRef(onSelectPreviewProp);

  const { t } = useTranslation();

  // select
  const onSelectClick = () => {
    onSelect?.(preview);
    modalProps.onClose();
  }


  // edit
  const totalArray = useMemo(
    () => Array(total).fill(0).map((_, i) => i + 1) as readonly number[],
    [total]
  );
  const [editState, setEditState] = useState<ModalEditState>({
    isEditing: false,
    totalAtStart: 0,
    nextIndex: 0,
  });
  const [editOrder, setEditOrder] = useState<readonly number[]>([]);
  const editPatch = usePatch({
    value: editOrder,
    setValue: setEditOrder,
    maxLength: 64,
    applyPatch: (_, p: readonly number[]) => p,
  });

  const startEdit = useCallback(() => {
    const _s: ModalEditState = {
      isEditing: true,
      totalAtStart: total | 0,
      nextIndex: (total | 0) + 1,
    };
    setEditState(_s);
    setEditOrder(totalArray);
    editPatch.onClear(totalArray);
  }, [setEditState, editPatch.onClear, total, totalArray]);

  const add = useCallback(async (indexAfterAddition: number) => {
    if (!await onAdd?.(editState.nextIndex)) {
      // user rejected addition
      return;
    }
    const currentOrder = [...editOrder];
    currentOrder.splice(indexAfterAddition, 0, editState.nextIndex);
    setEditState({ ...editState, nextIndex: editState.nextIndex + 1 });
    editPatch.onEdit(currentOrder);
  }, [editState, setEditState, editOrder, editPatch.onEdit, onAdd]);

  const remove = useCallback((indexToRemove: number) => {
    const currentOrder = [...editOrder];
    currentOrder.splice(indexToRemove, 1);
    editPatch.onEdit(currentOrder);
  }, [editState, editPatch.onEdit]);

  const insert = useCallback((indexActive: number, indexAfterInsertion: number) => {
    if (indexActive === indexAfterInsertion || Number.isNaN(indexActive) || Number.isNaN(indexAfterInsertion)) {
      return;
    }
    const currentOrder = [...editOrder];
    const [itemActive] = currentOrder.splice(indexActive, 1);
    currentOrder.splice(indexAfterInsertion, 0, itemActive);
    editPatch.onEdit(currentOrder);
  }, [editState, editPatch.onEdit]);

  const endEdit = useCallback(() => {
    setEditState({ ...editState, isEditing: false });
    onEdit?.(editOrder);
    editPatch.onClear(editOrder);
  }, [setEditState, editState, editOrder, onEdit, editPatch.onClear]);


  // dnd

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );


  // render

  const { isEditing } = editState;

  return <Modal
    closeOnOverlayClick={false}
    size='4xl'
    {...modalProps}
  >
    <ModalOverlay />
    <ModalContent onKeyDown={isEditing ? editPatch.onKeyInput : undefined}>
      <ModalHeader>
        {header ?? t('modal.select.header')}
      </ModalHeader>
      <ModalCloseButton />
      <ModalBody>
        <HStack alignItems='flex-start' maxH='75vh'>
          <Wrap flex={2.4} overflowY='scroll' maxH='75vh' p={1} overflow='visible'>
            {isEditing ? <><DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={({ active, over }) => insert(Number(active.id), Number(over?.id))}
            >
              <SortableContext
                items={editOrder.map((_, i) => i)}
              >
                {editOrder.map((ip, ia) => <RenderButton
                  key={ip} indexOfPaper={ip} indexOfArray={ia}
                  preview={preview} selected={selected} isEditing={isEditing}
                  add={add} remove={remove} onSelectPreview={onSelectPreview}
                />)}
              </SortableContext>
              {!editOrder.length && <Button onClick={() => add(0)}>
                {t('modal.select.addFirst')}
              </Button>}
            </DndContext>
            </> : <>
              {totalArray.map((ip, ia) => <RenderButton
                key={ip} indexOfPaper={ip} indexOfArray={ia}
                preview={preview} selected={selected} isEditing={isEditing}
                add={add} remove={remove} onSelectPreview={onSelectPreview}
              />)}
              {!totalArray.length && <Box>No question</Box>}
            </>}
          </Wrap>
          <Box flex={1} overflowY='scroll' maxH='65vh'>
            {children}
          </Box>
        </HStack>
      </ModalBody>
      <ModalFooter as={HStack} justifyContent='space-between'>
        <Button onClick={modalProps.onClose}>{t('modal.general.btn.close')}</Button>
        <HStack>
          {allowEdit && <Switch isChecked={isEditing} onChange={isEditing ? endEdit : startEdit} />}
          <Button onClick={onSelectClick}>{t('modal.select.btn.select')}</Button>
        </HStack>
      </ModalFooter>
    </ModalContent>

  </Modal>
};