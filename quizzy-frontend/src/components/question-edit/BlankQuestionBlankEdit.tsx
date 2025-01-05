import { BlankQuestionBlank, BlankQuestion } from "@quizzy/common/types";
import {
  Box, HStack, IconButton,
  Input, Switch,
  VStack
} from "@chakra-ui/react";
import { FocusEventHandler, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useEditorContext } from "@/utils/react-patch";
import { MdAdd, MdDelete } from "react-icons/md";
import { RxDragHandleDots2 } from "react-icons/rx";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { normalizeOptionOrBlankArray } from "@quizzy/common/db/question-id";

type BlankEditProps = {
  option?: BlankQuestionBlank;
  index: number;
  id: string;
  onChange?: (index: number, value: Partial<BlankQuestionBlank>) => void;
  onBlur?: FocusEventHandler<HTMLDivElement>;
  onAdd?: (index: number) => void;
  onDelete?: (index: number) => void;
};

const BlankEdit = (props: BlankEditProps) => {
  const { option: blank, index, id, onChange, onBlur, onAdd, onDelete } = props;
  const { t } = useTranslation();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <VStack
      ref={setNodeRef}
      w="100%"
      p="0.5em"
      transformOrigin="top left"
      border="1px solid"
      borderColor="gray.400"
      borderRadius="1em"
      alignItems='stretch'
      style={style}
      onBlur={onBlur}
    >

      <Input
        value={blank?.answer}
        onChange={(e) => onChange?.(index, { answer: e.target.value })}
      />

      <HStack justifyContent='stretch'>
        <HStack>
        <Box whiteSpace='nowrap'>{t('panel.blankEdit.key')}</Box>
          <Input
            value={blank?.key}
            onChange={(e) => onChange?.(index, { key: e.target.value })}
          />
          <Box whiteSpace='nowrap'>{t('panel.blankEdit.answerIsRegExp')}</Box>
          <Switch
            isChecked={blank ? !!blank.answerIsRegExp : undefined}
            onChange={(e) =>
              onChange?.(index, { answerIsRegExp: !!e.target.checked })
            }
          />
          <Box whiteSpace='nowrap'>{t('panel.blankEdit.answerFlag')}</Box>
          <Input
            value={blank?.answerFlag}
            onChange={(e) => onChange?.(index, { answerFlag: e.target.value })}
          />
        </HStack>

        <IconButton
          aria-label={t("common.btn.edit")}
          {...attributes}
          {...listeners}
        >
          <RxDragHandleDots2 />
        </IconButton>
        <IconButton
          aria-label={t("common.btn.edit")}
          onClick={() => onAdd?.(index)}
        >
          <MdAdd />
        </IconButton>
        <IconButton
          aria-label={t("common.btn.edit")}
          onClick={() => onDelete?.(index)}
        >
          <MdDelete />
        </IconButton>
      </HStack>

    </VStack>
  );
};

export const BlankQuestionBlanksEdit = (props: {
  question: BlankQuestion;
}) => {
  const { question } = props;
  const {
    onChangeDebounced,
    onChangeImmediate,
    fakeValue,
    clearDebouncedChanges,
  } = useEditorContext<BlankQuestion>();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;


      if (over && active.id !== over.id) {
        const oldIndex = parseInt(active.id as string);
        const newIndex = parseInt(over.id as string);

        const newOptionList = normalizeOptionOrBlankArray(arrayMove(
          question.blanks,
          oldIndex,
          newIndex
        ));
        onChangeImmediate({ blanks: newOptionList });
      }
    },
    [question, onChangeImmediate]
  );

  const onChange = useCallback(
    (index: number, value: Partial<BlankQuestionBlank>) => {
      const newOptionList = question.blanks.map((x) => ({ ...x }));
      newOptionList[index] = { ...newOptionList[index], ...value };
      onChangeDebounced({ blanks: newOptionList });
    },
    [question, onChangeDebounced]
  );

  const handleAdd = useCallback(
    (index: number) => {
      const newOptionList = question.blanks.map((x) => ({ ...x }));
      newOptionList.splice(index + 1, 0, { key: 'key-' + (index + 1), answer: "" });
      onChangeImmediate({ blanks: normalizeOptionOrBlankArray(newOptionList) });
    },
    [question, onChangeImmediate]
  );

  const handleDelete = useCallback(
    (index: number) => {
      const newOptionList = question.blanks.map((x) => ({ ...x }));
      newOptionList.splice(index, 1);
      onChangeImmediate({ blanks: normalizeOptionOrBlankArray(newOptionList) });
    },
    [question, onChangeImmediate]
  );

  const items = (fakeValue ?? question).blanks ?? [];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((_, i) => String(i))}
        strategy={verticalListSortingStrategy}
      >
        <VStack>
          {items.map((option, index) => (
            <BlankEdit
              key={option.id || `item-${index}`}
              id={String(index)}
              option={option}
              index={index}
              onChange={onChange}
              onBlur={clearDebouncedChanges}
              onAdd={handleAdd}
              onDelete={handleDelete}
            />
          ))}
        </VStack>
      </SortableContext>
    </DndContext>
  );
};