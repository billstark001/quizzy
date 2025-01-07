export type WithOptional<T extends object, K extends keyof T> = Omit<T, K> & { [k in K]?: T[k] };
