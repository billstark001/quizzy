import { UseToastOptions } from "@chakra-ui/react";
import { ReactNode } from "react";
import { isAsync } from "./func";

type N = ReactNode | UseToastOptions | null | undefined;
type _A<R> = R extends Promise<any> ? Awaited<R> : R;

export type WithHandlerOptions<
  R,
  E = any,
> = {
  setLoading?: (isLoading: boolean) => void;
  notify?: (payload: N, isSuccess: boolean) => void;
  notifySuccess?: N | ((result: R) => N);
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
  options?: WithHandlerOptions<_A<R>, E>,
) {

  const {
    setLoading,
    notify,
    notifySuccess, notifyError,
    finallySection,
  } = options ?? {};

  const isFunctionAsync = isAsync(f) as R extends Promise<any> ? true : false;
  const needsNotify1 = !!notify && !!notifySuccess;
  const needsNotify2 = !!notify && !!notifyError;
  const returnFunction = isFunctionAsync
    ? async (...args: P) => {
      setLoading?.(true);
      try {
        const ret = await f(...args);
        needsNotify1 && notify(typeof notifySuccess === 'function'
          ? notifySuccess(ret as _A<R>)
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
          ? notifySuccess(ret as _A<R>)
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
    };

  return returnFunction as (
    R extends Promise<infer RR>
    ? (...args: P) => Promise<RR | undefined>
    : (...args: P) => R | undefined
  );
};


