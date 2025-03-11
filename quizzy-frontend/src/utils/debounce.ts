import { useEffect, useRef } from "react";

export type DebounceProps<T extends (...args: any[]) => any> = {
  immediate?: boolean;
  merge?: (current: Parameters<T>, last?: Parameters<T>) => Parameters<T>;
};

export type DebounceReturn<T extends (...args: any[]) => any> = T & {
  cancel: () => void;
  clear: () => void;
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T, wait: number, props?: DebounceProps<T>
) => {

  const { immediate, merge } = props ?? { immediate: false };

  let timeout: number | null = null;
  let later: (() => void) | null = null;
  let lastArgs: Parameters<T> | null = null;

  const _reset = () => {
    timeout = null;
    lastArgs = null;
    later = null;
  };

  function onFunctionCall(this: any, ...args: Parameters<T>) {
    const context = this;

    if (lastArgs !== null && merge != null) {
      args = merge(args, lastArgs);
    }
    lastArgs = args;

    later = () => {
      _reset();
      if (!immediate) func.apply(context, args);
    };

    const callNow = immediate && !timeout;

    timeout && clearTimeout(timeout);
    timeout = setTimeout(later, wait) as unknown as number;

    if (callNow) func.apply(context, args);
  }

  onFunctionCall.cancel = () => {
    timeout && clearTimeout(timeout);
    _reset();
  };

  onFunctionCall.clear = () => {
    timeout && clearTimeout(timeout);
    later ? later() : _reset();
  };

  return onFunctionCall as DebounceReturn<T>;
};

export const useDebounced = <T extends (...args: any[]) => any>(
  func: T, wait: number, props?: DebounceProps<T>
) => {
  const funcRef = useRef<DebounceReturn<T>>(undefined);
  useEffect(() => {
    funcRef.current?.clear();
    funcRef.current = debounce((func), wait, props);
  }, [func]);
  if (!funcRef.current) {
    funcRef.current = debounce((func), wait, props);
  }
  return funcRef.current;
};