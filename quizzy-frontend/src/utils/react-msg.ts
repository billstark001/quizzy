import { DependencyList, ReactNode, useCallback } from "react";

// type NotificationPayload = ReactNode | null | undefined;
export type NonCallable = {} & Record<PropertyKey, never>
  | null | undefined | ReactNode
  | string | number | bigint | boolean | Symbol;

type AsyncFunctionReturnType<ParamTypes extends Array<any>, ResultType, DefaultResultType = undefined> =
  (...args: ParamTypes) => Promise<ResultType | DefaultResultType>;

export type WithHandlerOptions<
  NotificationPayload,
  ResultType,
  DefaultResultType = undefined,
  ErrorType = any,
> = {
  /**
   * @deprecated
   */
  async?: boolean;
  cache?: boolean;
  deps?: DependencyList;
  def?: DefaultResultType;
  setLoading?: (isLoading: boolean) => void;
  notify?: (payload: NotificationPayload, isSuccess: boolean) => void;
  notifySuccess?: NotificationPayload | ((result: ResultType) => NotificationPayload);
  notifyError?: NotificationPayload | ((error: ErrorType) => NotificationPayload);
  finallySection?: () => Promise<void>;
};

export function withHandlerRaw<
  FunctionType extends (...args: any) => any,
  NotificationPayload extends NonCallable = NonCallable,
  ParamTypes extends Parameters<FunctionType> = Parameters<FunctionType>,
  ResultType = Awaited<ReturnType<FunctionType>>,
  DefaultResultType = undefined,
  ErrorType = any,
>(
  fn: FunctionType,
  options?: WithHandlerOptions<NotificationPayload, ResultType, DefaultResultType, ErrorType>,
): AsyncFunctionReturnType<ParamTypes, ResultType, DefaultResultType> {

  const {
    cache,
    deps,
    def,
    setLoading,
    notify,
    notifySuccess,
    notifyError,
    finallySection,
  } = options ?? {};

  const hasSuccessNotification = !!notify && !!notifySuccess;
  const hasErrorNotification = !!notify && !!notifyError;

  const wrappedAsyncFunction = async (...args: ParamTypes) => {
    setLoading?.(true);
    try {
      const result = await Promise.resolve(fn(...args));
      if (hasSuccessNotification) {
        notify(typeof notifySuccess === 'function'
          ? notifySuccess(result as ResultType)
          : notifySuccess, true);
      }
      return result as ResultType;
    } catch (error) {
      if (hasErrorNotification) {
        notify(typeof notifyError === 'function'
          ? notifyError(error as ErrorType)
          : notifyError, false);
      }
      return def as DefaultResultType;
    } finally {
      await finallySection?.();
      setLoading?.(false);
    }
  };

  if (cache) {
    return useCallback(
      wrappedAsyncFunction,
      [
        fn,
        setLoading,
        notify, notifySuccess, notifyError,
        finallySection,
        ...(deps ?? []),
      ]
    );
  }

  return wrappedAsyncFunction;
};