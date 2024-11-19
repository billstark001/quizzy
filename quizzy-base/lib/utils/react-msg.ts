import { UseToastOptions } from "@chakra-ui/react";
import { ReactNode, useCallback } from "react";
import { isAsync } from "./func";

type N = ReactNode | UseToastOptions | null | undefined;

type _RET<P extends Array<any>, R> = (
  R extends Promise<infer RR>
  ? (...args: P) => Promise<RR | undefined>
  : (...args: P) => R | undefined
);

export type WithHandlerOptions<
  R,
  E = any,
> = {
  async?: boolean;
  cache?: boolean;
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
  E = any,
>(
  f: T,
  options?: WithHandlerOptions<R, E>,
): _RET<P, R> {

  const {
    async, 
    cache,
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
      } finally {
        finallySection?.();
        setLoading?.(false);
      }
    }) as _RET<P, R>;

  if (cache) {
    return useCallback(
      returnFunction,
      [
        f,
        async, setLoading, 
        notify, notifySuccess, notifyError, 
        finallySection,
      ]
    );
  }

  return returnFunction;
};


