import { useCallbackRef } from "@chakra-ui/react";
import { createContext, HTMLAttributes, KeyboardEventHandler, RefObject, useCallback, useContext, useEffect, useRef, useState } from "react";
import { debounce, DebounceProps, DebounceReturn } from "./debounce";
import QuickLRU from "quick-lru";
import { parseObjectPath } from "./patch";

export type UsePatchProps<T> = {
  value: T;
  setValue?: (patch: T) => void;
  shouldReplace?: (current: T, patch: Partial<T>, lastPatch: Partial<T> | undefined) => boolean;
  maxLength?: number;
};

export type UsePatchReturn<T, Tag = HTMLDivElement> = {
  onEdit: {
    (patch: Partial<T>, full?: false): void;
    (patch: T, full: true): void;
  }
  onUndo: () => boolean;
  onRedo: () => boolean;
  onClear: (initial: T) => void;
  onKeyInput: KeyboardEventHandler<Tag>;
  totalStep: number;
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
  const totalStepRef = useRef(0);
  const history = historyRef.current!;

  const onEdit = useCallback((patch: Partial<T>, full?: boolean) => {
    if (pointerRef.current != 0) {
      history.splice(history.length - pointerRef.current, pointerRef.current);
      pointerRef.current = 0;
    }
    const newValue: T = full ? patch as T : { ...value, ...patch };
    setValue(newValue);
    if (shouldReplace?.(value, patch, lastPatchRef.current)) {
      // the last step is merged with the current step
      lastPatchRef.current = full ? patch as T : { ...lastPatchRef.current, ...patch };
      history.pop();
    } else {
      // the current step is taken as a new step
      lastPatchRef.current = patch;
      totalStepRef.current += 1;
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
    totalStepRef.current -= 1;
    return true;
  }, [setValue, shouldReplace, history, pointerRef, lastPatchRef]);

  const onRedo = useCallback(() => {
    if (pointerRef.current <= 0) {
      return false;
    }
    setValue(history[history.length - pointerRef.current]);
    pointerRef.current -= 1;
    totalStepRef.current += 1;
    return true;
  }, [setValue, history, pointerRef]);

  const onClear = useCallback((initial: T) => {
    history.splice(0, history.length, initial);
    pointerRef.current = 0;
    totalStepRef.current = 0;
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
    totalStep: totalStepRef.current,
  };
};

export type EditorContextScheme<T extends object> = {
  value: T;
  onChangeDebounced: (patch: Partial<T>) => void;
  onChangeImmediate: (patch: Partial<T>) => void;
  hasDebouncedChanges: boolean;
  fakeValue: T | undefined;
  clearDebouncedChanges: () => void;
  edit: <P = HTMLAttributes<HTMLElement>, V = string>(path: string, props?: EditProps<V>) => P;
};

const EditorContext = createContext<EditorContextScheme<any>>({
  value: ({}),
  onChangeDebounced: () => void 0,
  onChangeImmediate: () => void 0,
  hasDebouncedChanges: false,
  fakeValue: undefined,
  clearDebouncedChanges: () => void 0,
  edit: (() => { }) as any,
});

export const EditorContextProvider = EditorContext.Provider;
export const useEditorContext = <T extends object>() => useContext(EditorContext) as EditorContextScheme<T>;

type Updater<T> = (patch: Partial<T>) => void;
export type EditorProps<T extends object> = {
  value: T;
  onChange: (patch: Partial<T>) => void;
  pathCache?: QuickLRU<string, string[]>;
};

export type EditProps<T = string> = ({
  key?: 'value';
  get?: (raw: T) => string;
  set?: (raw: string) => T;
} | {
  key: 'checked' | 'isChecked',
  get?: undefined,
  set?: undefined,
}) & {
  debounce?: boolean,
};

const debounceProps: DebounceProps<Updater<object>> = {
  merge(current, last) {
    if (last == null) {
      return current;
    }
    return [{ ...last[0], ...current[0] }] as [Partial<object>];
  },
} as const;

const pathCache = new QuickLRU<string, readonly string[]>({ maxSize: 1024 });

const _c = <T>(x: T) => x === undefined ? undefined : JSON.parse(JSON.stringify(x));

export const useEditor = <T extends object>(props: EditorProps<T>) => {
  const { value, onChange: onChangeProp, pathCache: pathCacheProp } = props;
  const cache = pathCacheProp ?? pathCache;
  const parsePath = useCallback((path: string): readonly string[] => {
    if (cache.has(path)) {
      return cache.get(path)!;
    }
    const ret = parseObjectPath(path);
    cache.set(path, ret);
    return ret;
  }, [cache]);

  // value displayed to debounce
  const [fakeValue, setFakeValue] = useState<T | undefined>(undefined);
  const [hasDebouncedChanges, setHasDebouncedChanges] = useState(false);

  const onChangeRef = useRef<Updater<T>>();
  useEffect(() => {
    onChangeRef.current = onChangeProp;
  }, [onChangeProp]);

  // this commits change to patch logically
  const onChangeLogical = useCallback((patch: Partial<T>) => {
    onChangeRef.current?.(patch);
    setFakeValue(undefined);
    setHasDebouncedChanges(false);
  }, [onChangeRef, setFakeValue, setHasDebouncedChanges]);

  // this debounces the logical commission
  const debouncedOnChangeLogicalRef = useRef<DebounceReturn<Updater<T>>>();
  useEffect(() => {
    debouncedOnChangeLogicalRef.current = debounce((onChangeLogical), 5000, debounceProps);
  }, [onChangeLogical]);
  if (!debouncedOnChangeLogicalRef.current) {
    debouncedOnChangeLogicalRef.current = debounce((onChangeLogical), 5000, debounceProps);
  }

  // this debounces and 'deceives' user
  const onChangeDebouncedUnstable = useCallback((patch: Partial<T>) => {
    setFakeValue({ ...value, ...patch });
    setHasDebouncedChanges(true);
    debouncedOnChangeLogicalRef.current!(patch);
  }, [debouncedOnChangeLogicalRef, setFakeValue, setHasDebouncedChanges, value]);

  const onChangeDebounced = useCallbackRef(onChangeDebouncedUnstable);

  // this commits logically and removes displayed value
  const onChangeImmediate = useCallback((patch: Partial<T>) => {
    debouncedOnChangeLogicalRef.current!.clear();
    onChangeLogical(patch);
  }, [debouncedOnChangeLogicalRef, onChangeLogical]);

  // functions for shortcut
  const getFromValue = useCallback((path: string, debounce?: boolean) => {
    const parsedPath = parsePath(path);
    let current = debounce
      ? (hasDebouncedChanges ? fakeValue : value)
      : value as any;
    for (const key of parsedPath) {
      current = current[key];
    }
    return current;
  }, [parsePath, value, fakeValue, hasDebouncedChanges]);
  // const getFromValueRef = useCallbackRef(getFromValue);

  const setToValue = useCallback((path: string, value2: any, debounce?: boolean) => {
    const parsedPath = parsePath(path);
    const onChange = debounce ? onChangeDebounced : onChangeImmediate;
    if (!parsedPath?.length) { // payload is the whole object
      onChange(value2);
      return;
    }
    const firstElement = parsedPath[0];
    const patch = {
      [firstElement]: _c((value as any)[firstElement])
    };
    let patchCurrent: any = patch;
    for (let i = 0; i < parsedPath.length; ++i) {
      if (i == parsedPath.length - 1) {
        patchCurrent[parsedPath[i]] = value2;
      }
      patchCurrent = patchCurrent[parsedPath[i]];
    }
    onChange(patch as any);
  }, [parsePath, value, onChangeDebounced, onChangeImmediate]);
  const setToValueRef = useCallbackRef(setToValue);

  const edit = useCallback(<P = HTMLAttributes<HTMLElement>, V = string>(path: string, props?: EditProps<V>) => {
    const { key, debounce, get, set } = props ?? {};
    const getKey = key || 'value';
    const setKey = (key === 'isChecked' ? 'checked' : key) || 'value';
    const current = getFromValue(path, debounce);
    return {
      [getKey as any]: (get ? get(current) : current) ?? '',
      onChange: (e: any) => {
        const rawValue = (e.target as any)[setKey];
        setToValueRef(path, set ? set(rawValue) : rawValue, debounce);
      },
      onBlur: debounce ? debouncedOnChangeLogicalRef.current!.clear : undefined,
    } as P;
  }, [getFromValue, setToValueRef, debouncedOnChangeLogicalRef]);

  return {
    value,
    onChangeDebounced,
    onChangeImmediate,
    hasDebouncedChanges,
    fakeValue,
    clearDebouncedChanges: debouncedOnChangeLogicalRef.current?.clear!,
    edit,
  };
};
