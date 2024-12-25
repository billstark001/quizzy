import { createStandaloneHandler } from "./react-msg-wrap";

export type WithOptional<T extends object, K extends keyof T> = Omit<T, K> & { [k in K]?: T[k] };


// TODO move to another position
export const [withHandler, standaloneToast, openDialog] = createStandaloneHandler();