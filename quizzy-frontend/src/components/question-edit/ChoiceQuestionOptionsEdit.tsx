import { ChoiceQuestion, ChoiceQuestionOption } from "@quizzy/base/types";
import { numberToLetters } from "@quizzy/base/utils";
import {
  Box, BoxProps, Code, HStack, IconButton,
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
import { normalizeOptionOrBlankArray } from "@quizzy/base/db/question-id";

const ChoiceBox = ({ children, ...props }: BoxProps) => (
  <Box
    minH="3em"
    minW="3em"
    borderRadius="0.7em"
    display="flex"
    justifyContent="center"
    alignItems="center"
    mr="0.5em"
    {...props}
  >
    {children}
  </Box>
);

type OptionEditProps = {
  option?: ChoiceQuestionOption;
  index: number;
  id: string;
  onChange?: (index: number, value: Partial<ChoiceQuestionOption>) => void;
  onBlur?: FocusEventHandler<HTMLDivElement>;
  onAdd?: (index: number) => void;
  onDelete?: (index: number) => void;
};

const OptionEdit = (props: OptionEditProps) => {
  const { option, index, id, onChange, onBlur, onAdd, onDelete } = props;
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
    <HStack
      ref={setNodeRef}
      w="100%"
      p="0.5em"
      transformOrigin="top left"
      border="1px solid"
      borderColor="gray.400"
      borderRadius="1em"
      style={style}
      onBlur={onBlur}
    >
      <ChoiceBox>
        <Code m="auto" background="transparent" fontSize="xl">
          {numberToLetters(index + 1)}
        </Code>
      </ChoiceBox>
      <Input
        value={option?.content}
        onChange={(e) => onChange?.(index, { content: e.target.value })}
      />
      <Switch
        isChecked={option ? !!option.shouldChoose : undefined}
        onChange={(e) =>
          onChange?.(index, { shouldChoose: !!e.target.checked })
        }
      />
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
  );
};

export const ChoiceQuestionOptionsEdit = (props: {
  question: ChoiceQuestion;
}) => {
  const { question } = props;
  const {
    onChangeDebounced,
    onChangeImmediate,
    fakeValue,
    clearDebouncedChanges,
  } = useEditorContext<ChoiceQuestion>();

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
          question.options,
          oldIndex,
          newIndex
        ));
        onChangeImmediate({ options: newOptionList });
      }
    },
    [question, onChangeImmediate]
  );

  const onChange = useCallback(
    (index: number, value: Partial<ChoiceQuestionOption>) => {
      const newOptionList = question.options.map((x) => ({ ...x }));
      newOptionList[index] = { ...newOptionList[index], ...value };
      onChangeDebounced({ options: newOptionList });
    },
    [question, onChangeDebounced]
  );

  const handleAdd = useCallback(
    (index: number) => {
      const newOptionList = question.options.map((x) => ({ ...x }));
      newOptionList.splice(index + 1, 0, { content: "" });
      onChangeImmediate({ options: normalizeOptionOrBlankArray(newOptionList) });
    },
    [question, onChangeImmediate]
  );

  const handleDelete = useCallback(
    (index: number) => {
      const newOptionList = question.options.map((x) => ({ ...x }));
      newOptionList.splice(index, 1);
      onChangeImmediate({ options: normalizeOptionOrBlankArray(newOptionList) });
    },
    [question, onChangeImmediate]
  );

  const items = (fakeValue ?? question).options ?? [];

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
            <OptionEdit
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