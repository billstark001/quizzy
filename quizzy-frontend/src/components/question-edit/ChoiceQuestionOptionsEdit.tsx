import { ChoiceQuestion, ChoiceQuestionOption } from "@quizzy/common/types";
import { numberToLetters } from "@quizzy/common/utils";
import {
  Box, BoxProps, Code, HStack, IconButton,
  Input, Switch,
  VStack} from "@chakra-ui/react";
import { FocusEventHandler, useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useEditorContext } from "@/utils/react-patch";
import { MdAdd, MdDelete } from "react-icons/md";
import { RxDragHandleDots2 } from "react-icons/rx";


const ChoiceBox = ({ children, ...props }: BoxProps) => <Box
  minH='3em' minW='3em' borderRadius='0.7em'
  display='flex' justifyContent='center' alignItems='center'
  mr='0.5em' {...props}
>
  {children}
</Box>;

type _E = {
  index: number,
  type: 'drag-start' | 'drag' | 'drop' | 'drag-end' | 'add' | 'delete',
  target: HTMLDivElement,
};
type ChoiceQuestionOptionEditProps = {
  option?: ChoiceQuestionOption,
  index: number,
  move?: 'up' | 'down',
  onChange?: (index: number, value: Partial<ChoiceQuestionOption>) => void,
  onBlur?: FocusEventHandler<HTMLDivElement>,
  onEvent?: (event: _E) => void,
};

export const ChoiceQuestionOptionEdit = (props: ChoiceQuestionOptionEditProps) => {

  const { option, index, move, onChange, onEvent, onBlur } = props;
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);

  const [draggable, setDraggable] = useState(false);

  return <HStack
    draggable={draggable} opacity={draggable ? 0.3 : undefined}
    w='100%' p='0.5em' transformOrigin='top left'
    border='1px solid' borderColor='gray.400' borderRadius='1em'
    transition="all 0.3s ease"
    transform={move ? `translateY(${move === 'up' ? '-40%' : '40%'})` : undefined}
    ref={ref}
    onDragStart={() => onEvent?.({ index, type: 'drag-start', target: ref.current! })}
    onDragOver={draggable ? undefined : (e) => e.preventDefault()}
    onDragEnter={() => {
      onEvent?.({ index, type: 'drag', target: ref.current! })
    }}
    onDrop={draggable ? undefined : (e) => {
      e.preventDefault();
      onEvent?.({ index, type: 'drop', target: ref.current! });
    }}
    onDragEnd={draggable ? () => {
      onEvent?.({ index, type: 'drag-end', target: ref.current! });
      setDraggable(false);
    } : undefined}
    onBlur={onBlur}
  >
    <ChoiceBox>
      <Code m='auto' background='transparent' fontSize='xl'>
        {numberToLetters(index + 1)}
      </Code>
    </ChoiceBox>
    <Input value={option?.content} onChange={(e) => onChange?.(index, { content: e.target.value })} />
    <Switch isChecked={option ? !!option.shouldChoose : undefined} onChange={(e) => onChange?.(index, { shouldChoose: !!e.target.checked })} />
    <IconButton aria-label={t('common.btn.edit')}
      onMouseDown={() => setDraggable(true)}
      onMouseUp={() => setDraggable(false)}
      onMouseLeave={() => setDraggable(false)}
    ><RxDragHandleDots2 /></IconButton>
    <IconButton aria-label={t('common.btn.edit')}
      onClick={() => onEvent?.({ index, type: 'add', target: ref.current! })}
    ><MdAdd /></IconButton>
    <IconButton aria-label={t('common.btn.edit')}
      onClick={() => onEvent?.({ index, type: 'delete', target: ref.current! })}
    ><MdDelete /></IconButton>
  </HStack>;
};

export const ChoiceQuestionOptionsEdit = (props: {
  question: ChoiceQuestion;
}) => {
  const { question } = props;
  const { onChangeDebounced, onChangeImmediate, fakeValue, clearDebouncedChanges } = useEditorContext<ChoiceQuestion>();

  const [draggingIndex, setDraggingIndex] = useState<number>();
  const [hoverIndex, setHoverIndex] = useState(-1);

  const isDragging = draggingIndex != null;
  const ref = useRef<HTMLDivElement>(null);

  const onEvent = useCallback((e: _E) => {
    const { index, type } = e;
    if (type === 'drag-start') {
      setDraggingIndex(index);
      setHoverIndex(index);
    } else if (type === 'drag' && isDragging) {
      setHoverIndex(index);
    } else if ((type === 'drag-end' || type === 'drop') && isDragging) {
      if (type === 'drop') {
        const newOptionList = question.options.map(x => ({ ...x }));
        const removed = newOptionList.splice(draggingIndex, 1)[0];
        newOptionList.splice(index, 0, removed);
        onChangeImmediate({ options: newOptionList });
      }
      setDraggingIndex(undefined);
      setHoverIndex(-1);
    } else if (type === 'add') {
      const newOptionList = question.options.map(x => ({ ...x }));
      newOptionList.splice(index + 1, 0, { content: '' });
      onChangeImmediate({ options: newOptionList });
    } else if (type === 'delete') {
      const newOptionList = question.options.map(x => ({ ...x }));
      newOptionList.splice(index, 1);
      onChangeImmediate({ options: newOptionList });
    }
  }, [setDraggingIndex, setHoverIndex, draggingIndex, question, onChangeImmediate]);

  const onChange2 = useCallback((index: number, value: Partial<ChoiceQuestionOption>) => {
    const newOptionList = question.options.map(x => ({ ...x }));
    newOptionList[index] = { ...newOptionList[index], ...value };
    onChangeDebounced({ options: newOptionList });
  }, [question, onChangeDebounced]);

  return <VStack
    ref={ref}
    backgroundColor={isDragging ? '#7f7f7f20' : undefined}
    outline={isDragging ? '1px solid gray' : undefined}
    borderRadius={4}
    transition="all 0.3s ease"
    onDragOver={(e) => e.preventDefault()}
    onDrop={() => onEvent({ index: hoverIndex, type: 'drop', target: ref.current! })}
  >
    {(fakeValue ?? question).options.map((option, i) => <ChoiceQuestionOptionEdit
      key={i} move={isDragging
        ? i > draggingIndex && i <= hoverIndex ? 'up'
          : i < draggingIndex && i >= hoverIndex ? 'down'
            : undefined
        : undefined}
      option={option} index={i} onEvent={onEvent} onChange={onChange2}
      onBlur={clearDebouncedChanges}
    />)}
  </VStack>;
};
