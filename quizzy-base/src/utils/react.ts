import { DependencyList, useEffect, useState, useCallback, useRef } from 'react';

/**
 * Interface for the state of the async operation
 * @template T The type of data that will be fetched
 */
interface AsyncState<T> {
  loading: boolean;
  error: Error | null;
  data: T | null;
  refresh: () => Promise<void>;
}

/**
 * Custom hook for memoizing async operations
 * @template T The type of data that will be returned by the async function
 * @param {() => Promise<T>} asyncFunction - The async function to be executed
 * @param {any[]} deps - Dependencies array that will trigger re-execution when changed
 * @returns {AsyncState<T>} Object containing loading state, error state, and data
 * 
 * @example
 * ```tsx
 * const { data, loading, error } = useAsyncMemo(
 *   async () => {
 *     const response = await fetch('https://api.example.com/data');
 *     return response.json();
 *   },
 *   []
 * );
 * ```
 */
export const useAsyncMemo = <T>(
  asyncFunction: () => Promise<T>,
  deps: DependencyList = []
): AsyncState<T> => {
  // Initial state
  const [state, setState] = useState<AsyncState<T>>({
    loading: true,
    error: null,
    data: null,
    refresh: async () => void await memoizedFnRef.current?.(),
  });
  
  // Ref to track component mount state
  const mountedRef = useRef<boolean>(true);
  const memoizedFnRef = useRef<() => Promise<void>>();

  // Memoize the async function with dependencies
  const memoizedFn = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const result = await asyncFunction();
      // Only update state if component is still mounted
      if (mountedRef.current) {
        setState(({ refresh }) => ({
          loading: false,
          error: null,
          data: result,
          refresh,
        }));
      }
    } catch (error) {
      // Only update state if component is still mounted
      if (mountedRef.current) {
        setState(({ refresh }) => ({
          loading: false,
          error: error instanceof Error ? error : new Error('Unknown error'),
          data: null,
          refresh,
        }));
      }
    }
  }, deps);

  // Effect to run the async function

  useEffect(() => {
    mountedRef.current = true;
    // Cleanup function to prevent memory leaks
    return () => {
      mountedRef.current = false;
    };
  })

  useEffect(() => {
    memoizedFnRef.current = memoizedFn;
    memoizedFn();
  }, [memoizedFn]);

  return state;
};

export const useAsyncEffect = (f: () => Promise<any> | void, d: DependencyList) => {
  return useEffect(() => void f()?.catch?.(console.error), d);
};