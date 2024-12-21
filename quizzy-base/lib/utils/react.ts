/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactElement, ElementType, isValidElement, useCallback, useState } from 'react';

export const getTagStyle = <T extends object = object>(
  el: ReactElement<T> | Record<string, any> | undefined,
  withAs?: boolean,
  withAsExclude?: any,
) => {
  if (!el || typeof el !== 'object') {
    return {} as T;
  }
  // it is some random element
  if (!isValidElement(el)) {
    return { ...el } as T;
  }
  // else, it is a react element
  el = el as ReactElement<T>;
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    children, key, ref,
    ...style
  } = { ...el.props } as any;
  if (withAs) {
    style.as = style.as ?? el.type;
  }
  if (withAsExclude && style.as === withAsExclude) {
    delete style.as;
  }
  return style as T;
};


export const acceptsRef = (Component: ElementType) => {
  // intrinsic component
  if (typeof Component === 'string') {
    return true;
  }
  // class component
  if (typeof Component === 'function') {
    return !!Component.prototype?.isReactComponent;
  }
  // ref-forwarded function component
  if (typeof Component === 'object' && Component !== null) {
    return (Component as any).$$typeof === Symbol.for('react.forward_ref');
  }
  return false;
};

export const removeUndefinedValues = <T extends object = object>(obj: T) => {
  if (!obj) {
    return obj;
  }
  for (const key of Object.keys(obj)) {
    if (obj[key as keyof T] === undefined) {
      delete obj[key as keyof T];
    }
  }
  return obj;
};


export const useSelection = () => {
  const [selectedRecord, setSelectedRecord] = useState<Record<string, boolean>>({});
  const setSelected = useCallback((id: string, selected = true) => {
    setSelectedRecord((s) => ({ ...s, [id]: selected }));
  }, [setSelectedRecord]);
  const toggleSelected = useCallback((id: string) => {
    setSelectedRecord((s) => ({ ...s, [id]: !s[id] }));
  }, [setSelectedRecord]);
  const isSelected = useCallback((id: string) => !!selectedRecord[id], [selectedRecord]);
  const getAllSelected = useCallback(
    () => Object.entries(selectedRecord)
      .filter(([, v]) => !!v)
      .map(([k]) => k),
    [selectedRecord]
  );

  const isAnySelected = getAllSelected().length !== 0;

  return {
    selectedRecord,
    setSelectedRecord,
    setSelected,
    toggleSelected,
    isSelected,
    getAllSelected,
    isAnySelected,
  };
};

