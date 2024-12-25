import { UseToastOptions } from "@chakra-ui/react";
import { DependencyList, ReactNode, useCallback } from "react";
import { isAsync } from "./func";

type N = ReactNode | UseToastOptions | null | undefined;

type _RET<P extends Array<any>, R, RD = undefined> = (
  R extends Promise<infer RR>
  ? (...args: P) => Promise<RR | RD>
  : (...args: P) => R | RD
);

export type WithHandlerOptions<
  R,
  RD = undefined,
  E = any,
> = {
  async?: boolean;
  cache?: boolean;
  deps?: DependencyList;
  def?: RD;
  setLoading?: (isLoading: boolean) => void;
  notify?: (payload: N, isSuccess: boolean) => void;
  notifySuccess?: N | ((result: R extends Promise<infer RR> ? RR : R) => N);
  notifyError?: N | ((error: E) => N);
  finallySection?: () => R extends Promise<any> ? Promise<void> : void;
};

export function withHandlerRaw<
  T extends (...args: any) => any,
  P extends Parameters<T> = Parameters<T>,
  R extends ReturnType<T> = ReturnType<T>,
  RD = undefined,
  E = any,
>(
  f: T,
  options?: WithHandlerOptions<R, RD, E>,
): _RET<P, R, RD> {

  const {
    async, 
    cache,
    deps,
    def,
    setLoading,
    notify,
    notifySuccess, 
    notifyError,
    finallySection,
  } = options ?? {};

  const isFunctionAsync = (async ?? isAsync(f)) as R extends Promise<any> ? true : false;
  const needsNotify1 = !!notify && !!notifySuccess;
  const needsNotify2 = !!notify && !!notifyError;
  const returnFunction = (isFunctionAsync
    ? async (...args: P) => {
      setLoading?.(true);
      try {
        const ret = await f(...args);
        needsNotify1 && notify(typeof notifySuccess === 'function'
          ? notifySuccess(ret)
          : notifySuccess, true);
        return ret;
      } catch (e) {
        needsNotify2 && notify(typeof notifyError === 'function'
          ? notifyError(e as E)
          : notifyError, false);
        return def;
      } finally {
        await finallySection?.();
        setLoading?.(false);
      }
    }
    : (...args: P) => {
      setLoading?.(true);
      try {
        const ret = f(...args);
        needsNotify1 && notify(typeof notifySuccess === 'function'
          ? notifySuccess(ret)
          : notifySuccess, true);
        return ret;
      } catch (e) {
        needsNotify2 && notify(typeof notifyError === 'function'
          ? notifyError(e as E)
          : notifyError, false);
        return def;
      } finally {
        finallySection?.();
        setLoading?.(false);
      }
    }) as _RET<P, R, RD>;

  if (cache) {
    return useCallback(
      returnFunction,
      [
        f,
        async, setLoading, 
        notify, notifySuccess, notifyError, 
        finallySection,
        ...deps ?? [],
      ]
    );
  }

  return returnFunction;
};


