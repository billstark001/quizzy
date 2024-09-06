import { useState, useCallback, useMemo } from 'react';
import { useCallbackRef, useDisclosure, UseDisclosureProps, UseDisclosureReturn } from '@chakra-ui/react';
import { atom, PrimitiveAtom, useAtom } from 'jotai';

/**
 * A function that returns data of type T.
 */
type DataFunction<T> = () => T;

/**
 * Extended UseDisclosureReturn type with additional data-related properties.
 */
export type UseDisclosureWithDataReturn<T> = Omit<UseDisclosureReturn, 'onOpen'> & {
  data: T;
  isDataControlled: boolean;
  onOpen: (data?: T) => void;
};

/**
 * Extended UseDisclosureProps type with additional data-related properties.
 */
export type UseDisclosureWithDataProps<T> = Omit<UseDisclosureProps, 'onOpen'> & {
  data?: T;
  onOpen?(data?: T): void;
};

/**
 * A custom hook that extends useDisclosure with data management.
 * 
 * @param defaultData - The default data or a function to generate default data.
 * @param props - Additional props for customizing the disclosure behavior.
 * @returns An object containing disclosure state and methods, along with data management.
 */
export function useDisclosureWithData<T>(
  defaultData: T | DataFunction<T>, 
  props: UseDisclosureWithDataProps<T> = {}
): UseDisclosureWithDataReturn<T> {
  const { 
    data: dataProp,
    onOpen: onOpenProp,
  } = props;

  const isDataControlled = dataProp !== undefined;
  const handleOnOpen = useCallbackRef(onOpenProp);

  const d = useDisclosure({ ...props, onOpen: undefined });
  const { onOpen: originalOnOpen } = d;

  const _data = useMemo(() => typeof defaultData === 'function' 
    ? (defaultData as DataFunction<T>)() 
    : defaultData, [defaultData]);

  const [data, setData] = useState<T>(_data);

  const onOpen = useCallback((newData?: T) => {
    if (!isDataControlled) {
      setData(newData !== undefined ? newData : _data);
    }
    originalOnOpen();
    handleOnOpen?.(newData);
  }, [isDataControlled, _data, originalOnOpen, handleOnOpen]);

  return {
    ...d,
    data: isDataControlled ? dataProp as T : data,
    isDataControlled,
    onOpen,
  };
}

/**
 * Props for the Disclosure component.
 */
export interface DisclosureProps {
  'aria-expanded': boolean;
  'aria-hidden'?: boolean;
  'aria-controls'?: string;
  onClick?: () => void;
}

/**
 * Type representing the state of a disclosure with associated data.
 */
export type DisclosureWithData<T> = {
  isOpen: boolean;
  data: T;
};

/**
 * Extended PrimitiveAtom type for disclosure state.
 */
export type DisclosureAtom = PrimitiveAtom<boolean> & {
  use: () => UseDisclosureReturn;
};

/**
 * Extended PrimitiveAtom type for disclosure state with associated data.
 */
export type DisclosureWithDataAtom<T> = PrimitiveAtom<DisclosureWithData<T>> & {
  use: () => UseDisclosureWithDataReturn<T>;
};

/**
 * Custom hook for managing disclosure state using Jotai atoms.
 * 
 * @param disclosureAtom - The Jotai atom representing the disclosure state.
 * @returns An object containing disclosure state and methods.
 */
export const useDisclosureAtomHooks = (
  disclosureAtom: PrimitiveAtom<boolean>, 
): UseDisclosureReturn => {
  const [isOpen, setIsOpen] = useAtom(disclosureAtom);

  const onOpen = useCallback(() => {
    setIsOpen(() => true);
  }, [setIsOpen]);

  const onClose = useCallback(() => {
    setIsOpen(() => false);
  }, [setIsOpen]);

  return useDisclosure({
    onOpen,
    onClose,
    isOpen,
  });
};

/**
 * Custom hook for managing disclosure state with associated data using Jotai atoms.
 * 
 * @param a - The Jotai atom representing the disclosure state with data.
 * @param defaultData - The default data or a function to generate default data.
 * @returns An object containing disclosure state, methods, and associated data.
 */
export const useDisclosureWithDataAtomHooks = <T>(
  a: PrimitiveAtom<DisclosureWithData<T>>, 
  defaultData: T | (() => T),
) => {
  const [d, setD] = useAtom(a);
  const { isOpen, data } = d;
  
  const onOpen = useCallback((data?: T) => {
    setD(() => ({ isOpen: true, data: data as T }));
  }, [setD]);

  const onClose = useCallback(() => {
    setD((d) => ({ ...d, isOpen: false }));
  }, [setD]);

  return useDisclosureWithData(defaultData, {
    onOpen,
    onClose,
    isOpen,
    data,
  });
};

/**
 * Creates a Jotai atom for managing disclosure state.
 * 
 * @param props - Props for customizing the initial disclosure state.
 * @returns A DisclosureAtom for managing disclosure state.
 */
export const disclosureAtom = (props: UseDisclosureProps = {}): DisclosureAtom => {
  const { defaultIsOpen } = props;
  const a = atom(!!defaultIsOpen);
  Object.defineProperty(a, 'use', {
    value: () => useDisclosureAtomHooks(a),
    writable: false,
  });
  return a as unknown as DisclosureAtom;
};

/**
 * Creates a Jotai atom for managing disclosure state with associated data.
 * 
 * @param defaultData - The default data or a function to generate default data.
 * @param props - Props for customizing the initial disclosure state.
 * @returns A DisclosureWithDataAtom for managing disclosure state with associated data.
 */
export const disclosureWithDataAtom = <T>(
  defaultData: T | (() => T),
  props: UseDisclosureWithDataProps<T> = {},
): DisclosureWithDataAtom<T> => {
  const { defaultIsOpen } = props;
  const a = atom<DisclosureWithData<T>>({
    isOpen: !!defaultIsOpen,
    data: typeof defaultData === 'function' 
      ? (defaultData as (() => T))() 
      : defaultData,
  });
  Object.defineProperty(a, 'use', {
    value: () => useDisclosureWithDataAtomHooks(a, defaultData),
    writable: false,
  });
  return a as unknown as DisclosureWithDataAtom<T>;
};