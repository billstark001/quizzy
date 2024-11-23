import { SetStateAction, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
type JsonPrimitive = string | number | boolean | null;
type JsonArray = JsonValue[];
type JsonObject = { [key: string]: JsonValue };
type JsonValue = JsonPrimitive | JsonObject | JsonArray;

type ParamTypeDefinition = 'string' | 'number' | 'boolean' | 'json';
type ParamParser<T, K extends keyof T = keyof T> = ((value: string) => T[K]);
type ParamSerializer<T, K extends keyof T = keyof T> = ((value: T[K]) => string);

export type ParamsDefinition<T> = {
  [K in keyof T]:
  | ParamTypeDefinition
  | ParamParser<T, K>
  | { parse: ParamParser<T, K>; serialize: ParamSerializer<T, K> };
};

export const parseSearchParams = <T extends Record<string, any> = Record<string, any>>(
  searchParams: URLSearchParams,
  typeDefinition: ParamsDefinition<T>,
  allowAccessoryParams: boolean = true,
) => {
  const result: Partial<Record<keyof T, any>> = {};

  for (const [key, value] of searchParams.entries()) {
    const type = typeDefinition[key];
    if (type == null) {
      if (allowAccessoryParams) {
        (result as any)[key] = value;
      }
      continue;
    }

    if (typeof type === 'function') {
      result[key as keyof T] = type(value);
    } else if (typeof type === 'object' && 'parse' in type) {
      result[key as keyof T] = (type.parse as any)?.(value);
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
        case 'json':
          try {
            result[key as keyof T] = JSON.parse(value);
          } catch (e) {
            console.error(`Failed to parse JSON for key ${key}:`, e);
          }
          break;
      }
    }
  }

  return result as Partial<T>;
};

export const createSearchParams = <T extends Record<string, any> = Record<string, any>>(
  params: Partial<T>,
  typeDefinition: ParamsDefinition<T>,
  allowAccessoryParams: boolean = true,
) => {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value == null) {
      continue;
    }
    const type = typeDefinition[key as keyof T];
    if (type == null && allowAccessoryParams) {
      searchParams.set(key, String(value));
    }

    let serializedValue: string;
    if (typeof type === 'object' && 'serialize' in type) {
      serializedValue = type.serialize(value);
    } else if (typeof type === 'function') {
      // the offered type is a parser, serialize with `toString`
      serializedValue = String(value);
    } else {
      switch (type) {
        case 'json':
          serializedValue = JSON.stringify(value);
          break;
        case 'boolean':
          serializedValue = value ? 'true' : 'false';
          break;
        default:
          serializedValue = String(value);
      }
    }
    searchParams.set(key, serializedValue);
  }

  return searchParams;
};

export const useParsedSearchParams = <T extends Record<string, any> = Record<string, any>>(
  typeDefinition: ParamsDefinition<T>,
  allowAccessoryParams: boolean = true,
): [Partial<T>, (value: SetStateAction<Partial<T>>) => void] => {
  const [searchParams, setter] = useSearchParams();

  const parsedParams = useMemo(() => {
    return parseSearchParams(searchParams, typeDefinition, allowAccessoryParams);
  }, [searchParams, typeDefinition]);

  const setParams = useCallback((value: SetStateAction<Partial<T>>) => {
    const parsedValue: T = typeof value === 'function'
      ? (value as any)(parsedParams as T)
      : { ...parsedParams, ...value };
    const newParams = createSearchParams(parsedValue, typeDefinition, allowAccessoryParams);
    setter(newParams);
  }, [parsedParams, typeDefinition, setter]);

  return [parsedParams, setParams];
};