import { useCallbackRef } from "@chakra-ui/react";
import { KeyboardEventHandler, RefObject, useCallback, useRef } from "react";

export type UsePatchProps<T> = {
  value: T;
  setValue?: (patch: T) => void;
  shouldReplace?: (current: T, patch: Partial<T>, lastPatch: Partial<T> | undefined) => boolean;
  maxLength?: number;
};

export type UsePatchReturn<T, Tag = HTMLDivElement> = {
  onEdit: (patch: Partial<T>) => void;
  onUndo: () => boolean;
  onRedo: () => boolean;
  onClear: (initial: T) => void;
  onKeyInput: KeyboardEventHandler<Tag>;
};

const isMac = navigator.platform.indexOf("Mac") >= 0 ||
  navigator.platform === "iPhone";
const modifierKey = isMac ? 'metaKey' : 'ctrlKey';

export const usePatch = <T extends object, Tag = HTMLDivElement>(
  props: UsePatchProps<T>
): UsePatchReturn<T, Tag> => {
  const { value, setValue: _setValue, maxLength: l, shouldReplace: _shouldReplace } = props;
  const maxLength = (!l || Number.isNaN(l) || l < 1) ? 1 : Math.floor(l);
  const setValue = useCallbackRef(_setValue);
  const shouldReplace = useCallbackRef(_shouldReplace);

  const historyRef = useRef<T[]>([]) as RefObject<T[]>;
  const lastPatchRef = useRef<Partial<T> | undefined>(undefined);
  const pointerRef = useRef(0);
  const history = historyRef.current!;

  const onEdit = useCallback((patch: Partial<T>) => {
    if (pointerRef.current != 0) {
      history.splice(history.length - pointerRef.current, pointerRef.current);
      pointerRef.current = 0;

    }
    const newValue = { ...value, ...patch };
    setValue(newValue);
    if (shouldReplace?.(value, patch, lastPatchRef.current)) {
      lastPatchRef.current = { ...lastPatchRef.current, ...patch };
      history.pop();
    } else {
      lastPatchRef.current = patch;
    }
    history.push(newValue);
    if (history.length > maxLength) {
      history.splice(0, history.length - maxLength);
    }
  }, [value, setValue, history, pointerRef]);

  const onUndo = useCallback(() => {
    if (pointerRef.current >= history.length - 1) {
      return false;
    }
    setValue(history[history.length - pointerRef.current - 2]);
    pointerRef.current += 1;
    return true;
  }, [setValue, shouldReplace, history, pointerRef, lastPatchRef]);

  const onRedo = useCallback(() => {
    if (pointerRef.current <= 0) {
      return false;
    }
    setValue(history[history.length - pointerRef.current]);
    pointerRef.current -= 1;
    return true;
  }, [setValue, history, pointerRef]);

  const onClear = useCallback((initial: T) => {
    history.splice(0, history.length, initial);
    pointerRef.current = 0;
  }, [history, pointerRef]);

  const onKeyInput: KeyboardEventHandler<Tag> = useCallback((event) => {
    if (event[modifierKey]) {
      event.preventDefault();
      if (event.shiftKey && event.key.toLowerCase() === 'z') {
        onRedo();
      }
      else if (!event.shiftKey && event.key.toLowerCase() === 'z') {
        onUndo();
      }
      else if (event.key.toLowerCase() === 'y') {
        onRedo();
      }
    }
  }, [onRedo, onUndo]);

  return {
    onEdit,
    onUndo,
    onRedo,
    onClear,
    onKeyInput,
  };
};

