import { DependencyList, useEffect } from "react";


export const useAsyncEffect = (f: () => Promise<any> | void, d: DependencyList) => {
  return useEffect(() => void f()?.catch?.(console.error), d);
};