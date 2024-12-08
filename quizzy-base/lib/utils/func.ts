
export type FunctionType<P extends any[], R> = (...args: P) => R;

type IsPromise<T> = T extends Promise<any> ? true : false;

export function isAsync<
  P extends any[] = any[],
  R = any,
>(fn: FunctionType<P, R>): IsPromise<R> {
  return ((fn as any)[Symbol.toStringTag] === "AsyncFunction") as IsPromise<R>;
}

export function promiseWithResolvers<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: any) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}