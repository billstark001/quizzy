import { useMemo } from "react";
import { SetURLSearchParams, useSearchParams } from "react-router-dom";

type ParamTypeDefinition = 'string' | 'number' | 'boolean';
type ParamParser<T, K extends keyof T = keyof T> = ((value: string) => T[K]);

export type ParamsDefinition<T> = {
  [K in keyof T]: ParamTypeDefinition | ParamParser<T, K>;
};

export const parseSearchParams = <T = Record<string, any>>(
  searchParams: URLSearchParams,
  typeDefinition: ParamsDefinition<T>,
) => {
  const result: Partial<Record<keyof T, any>> = {};

  for (const [key, type] of Object.entries(typeDefinition)) {
    const value = searchParams.get(key);

    if (value != null) {
      if (typeof type === 'function') {
        result[key as keyof T] = type(value);
      } else {
        switch (type) {
          case 'string':
            result[key as keyof T] = value;
            break;
          case 'number':
            result[key as keyof T] = Number(value);
            break;
          case 'boolean':
            const v = value.toLowerCase();
            result[key as keyof T] = v !== 'false' && v !== '0' && !!v;
            break;
        }
      }
    }
  }

  return result as Partial<T>;
};

export const useParsedSearchParams = <T = Record<string, any>>(
  typeDefinition: ParamsDefinition<T>
): [Partial<T>, SetURLSearchParams] => {
  const [searchParams, setter] = useSearchParams();

  const parsedParams = useMemo(() => {
    return parseSearchParams(searchParams, typeDefinition);
  }, [searchParams, typeDefinition]);

  return [parsedParams, setter];
}