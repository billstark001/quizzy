import { useCallbackRef } from "@chakra-ui/react";
import { createContext, HTMLAttributes, KeyboardEvent, RefObject, useCallback, useContext, useEffect, useRef, useState } from "react";
import { debounce, DebounceProps, DebounceReturn } from "./debounce";
import QuickLRU from "quick-lru";
import { parseObjectPath } from "./patch";

export type UsePatchProps<T, P = Partial<T>> = {
  value: T;
  setValue?: (patch: T) => void;
  shouldReplace?: (current: T, patch: P, lastPatch: P | undefined) => boolean;
  applyPatch?: (base: T, patch: P) => T;
  mergePatch?: (base: P, patch: P) => P;
  maxLength?: number;
};

type HistoryItem<T, P = Partial<T>> = {
  state: T;
  patch?: P;
};

export type UsePatchReturn<T, P = Partial<T>, Tag = HTMLDivElement> = {
  onEdit: (patch: P) => void;
  onUndo: () => boolean;
  onRedo: () => boolean;
  onClear: (initial: T) => void;
  onKeyInput: (event: KeyboardEvent<Tag>) => boolean;
  totalStep: number;
};

const defaultMergeAndApplyPatch = <T>(base: T, patch: Partial<T>): T => ({
  ...base,
  ...patch,
});

const isMac = typeof navigator !== 'undefined' && (
  navigator.platform.indexOf("Mac") >= 0 ||
  navigator.platform === "iPhone"
);
const modifierKey = isMac ? 'metaKey' : 'ctrlKey';

export const usePatch = <T extends object, P = Partial<T>, Tag = HTMLDivElement>(
  props: UsePatchProps<T, P>
): UsePatchReturn<T, P, Tag> => {
  const {
    value,
    setValue: _setValue,
    maxLength: l,
    shouldReplace: _shouldReplace,
    mergePatch: _mergePatch,
    applyPatch: _applyPatch,
  } = props;

  const maxLength = (!l || Number.isNaN(l) || l < 1) ? 1 : Math.floor(l);
  const setValue = useCallbackRef(_setValue);
  const shouldReplace = useCallbackRef(_shouldReplace);
  const mergePatch = useCallbackRef(_mergePatch ?? defaultMergeAndApplyPatch as unknown as typeof _mergePatch);
  const applyPatch = useCallbackRef(_applyPatch ?? defaultMergeAndApplyPatch as unknown as typeof _applyPatch);

  const historyRef = useRef<HistoryItem<T, P>[]>([]) as RefObject<HistoryItem<T, P>[]>;
  const lastPatchRef = useRef<P | undefined>(undefined);
  const pointerRef = useRef(0);
  const totalStepRef = useRef(0);
  const history = historyRef.current!;

  // init history
  useEffect(() => {
    if (history.length === 0) {
      history.push({ state: value });
    }
  }, []);

  const onEdit = useCallback((patch: P) => {
    if (pointerRef.current !== 0) {
      history.splice(history.length - pointerRef.current, pointerRef.current);
      pointerRef.current = 0;
    }

    const newValue = applyPatch(value, patch as any);
    setValue?.(newValue);

    if (shouldReplace?.(value, patch, lastPatchRef.current)) {
      // merge to last step
      const lastItem = history[history.length - 1];
      lastItem.patch = lastItem.patch
        ? mergePatch(lastItem.patch, patch as any)
        : patch;
      lastItem.state = newValue;
      lastPatchRef.current = lastItem.patch as any;
    } else {
      // new record
      history.push({
        state: newValue,
        patch,
      });
      lastPatchRef.current = patch;
      totalStepRef.current += 1;

      if (history.length > maxLength) {
        history.splice(0, history.length - maxLength);
      }
    }
  }, [value, setValue, applyPatch, mergePatch, shouldReplace, history]);

  const onUndo = useCallback(() => {
    if (pointerRef.current >= history.length - 1) {
      return false;
    }
    setValue?.(history[history.length - pointerRef.current - 2].state);
    pointerRef.current += 1;
    totalStepRef.current -= 1;
    return true;
  }, [setValue, history]);

  const onRedo = useCallback(() => {
    if (pointerRef.current <= 0) {
      return false;
    }
    setValue?.(history[history.length - pointerRef.current].state);
    pointerRef.current -= 1;
    totalStepRef.current += 1;
    return true;
  }, [setValue, history]);

  const onClear = useCallback((initial: T) => {
    history.splice(0, history.length, { state: initial });
    pointerRef.current = 0;
    totalStepRef.current = 0;
    lastPatchRef.current = undefined;
  }, [history]);

  const onKeyInput = useCallback((event: KeyboardEvent<Tag>) => {
    if (event[modifierKey]) {
      if (event.shiftKey && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        onRedo();
        return true;
      }
      else if (!event.shiftKey && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        onUndo();
        return true;
      }
      else if (event.key.toLowerCase() === 'y') {
        event.preventDefault();
        onRedo();
        return true;
      }
    }
    return false;
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
