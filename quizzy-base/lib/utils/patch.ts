export type Patch<T extends object> = {
  [K in keyof T]?: T[K] extends object
  ? T[K] extends any[]  // Check if array
  ? T[K]
  : Patch<T[K]>
  : T[K]
};

export const applyPatch = <T extends object>(
  original: T,
  patch: Patch<T>,
  treatUndefinedAsExplicit: boolean = false
): T => {
  const result = { ...original };

  for (const key in patch) {
    const patchValue = patch[key];

    // Skip undefined values when treatUndefinedAsExplicit is false
    if (!treatUndefinedAsExplicit && patchValue === undefined) {
      continue;
    }

    if (patchValue === null || patchValue === undefined) {
      // Explicitly set null/undefined
      result[key] = patchValue as T[typeof key];
    } else if (
      typeof patchValue === 'object' &&
      !Array.isArray(patchValue) &&
      typeof original[key] === 'object' &&
      !Array.isArray(original[key]) &&
      original[key] !== null
    ) {
      // Recursively patch nested objects
      result[key] = applyPatch(
        original[key] as object,
        patchValue,
        treatUndefinedAsExplicit
      ) as T[typeof key];
    } else {
      // Direct assignment for primitives and arrays
      result[key] = patchValue as T[typeof key];
    }
  }

  return result;
};

export const getPatch = <T extends object>(
  original: T,
  modified: T,
  ignoreEqual: boolean = true
): Patch<T> => {
  const patch: Patch<T> = {};

  for (const key in modified) {
    const originalValue = original[key];
    const modifiedValue = modified[key];

    if (ignoreEqual && originalValue === modifiedValue) {
      continue;
    }

    if (
      modifiedValue === null ||
      modifiedValue === undefined ||
      typeof modifiedValue !== 'object' ||
      Array.isArray(modifiedValue) ||
      originalValue === null ||
      originalValue === undefined ||
      typeof originalValue !== 'object' ||
      Array.isArray(originalValue)
    ) {
      // Direct assignment for primitives, arrays, null, and undefined
      patch[key] = modifiedValue as Patch<T>[typeof key];
    } else {
      // Recursively get patch for nested objects
      const nestedPatch = getPatch(
        originalValue,
        modifiedValue,
        ignoreEqual
      );
      
      // Only include nested patch if it has any changes
      if (Object.keys(nestedPatch).length > 0) {
        patch[key] = nestedPatch as Patch<T>[typeof key];
      }
    }
  }
  return patch;
};

export const parseObjectPath = (path: string) => {
  path = path.trim();
  path = path.replace(/\[(\w+)\]/g, '.$1');
  path = path.replace(/^\./, ''); // leading points
  const ret = path.split('.').filter(Boolean);
  return ret;
};