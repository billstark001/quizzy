import { useCallbackRef } from "@chakra-ui/react";
import { RefObject, useCallback, useRef } from "react";

export type UsePatchProps<T> = {
  value: T;
  setValue?: (patch: T) => void;
  shouldReplace?: (current: T, patch: Partial<T>) => boolean;
  maxLength?: number;
};

export type UsePatchReturn<T> = {
  onEdit: (patch: Partial<T>) => void;
  onUndo: () => boolean;
  onRedo: () => boolean;
  onClear: (initial: T) => void;
};

export const usePatch = <T>(props: UsePatchProps<T>) => {
  const { value, setValue: _setValue, maxLength: l, shouldReplace: _shouldReplace } = props;
  const maxLength = (!l || Number.isNaN(l) || l < 1) ? 1 : Math.floor(l);
  const setValue = useCallbackRef(_setValue);
  const shouldReplace = useCallbackRef(_shouldReplace);

  const historyRef = useRef<T[]>([]) as RefObject<T[]>;
  const pointerRef = useRef(0);
  const history = historyRef.current!;

  const onEdit = useCallback((patch: Partial<T>) => {
    if (pointerRef.current != 0) {
      history.splice(history.length - pointerRef.current, pointerRef.current);
      pointerRef.current = 0;

    }
    const newValue = { ...value, ...patch };
    setValue(newValue);
    if (shouldReplace?.(value, patch)) {
      history.pop();
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
  }, [setValue, history, pointerRef]);

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

  return {
    onEdit, 
    onUndo, 
    onRedo,
    onClear,
  } as UsePatchReturn<T>;
};