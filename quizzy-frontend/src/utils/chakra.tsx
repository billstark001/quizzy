import { DialogRootProps, UseDisclosureReturn } from "@chakra-ui/react";
import { DialogCloseTrigger, DialogContent, DialogRoot } from "@/components/ui/dialog";
import { ComponentType, RefObject, useCallback, useRef, useState } from "react";
import { WithOptional } from ".";

/**
 * @deprecated in favor of `useDialog`
 * @param o 
 * @returns 
 */
export const getDialogController = (
  o: Pick<UseDisclosureReturn, 'open' | 'onClose'>
) => {
  return {
    open: o.open,
    onOpenChange: (e) => {
      if (!e.open) o.onClose();
    }
  } satisfies Partial<DialogRootProps>;
};

export type DialogRootNoChildrenProps = Omit<DialogRootProps, 'children'> & Partial<Pick<DialogRootProps, 'children'>>;

export type MinimumDialogRootProps =
  Pick<DialogRootProps, 'initialFocusEl' | 'open' | 'onOpenChange'> &
  Partial<Pick<DialogRootProps, 'children'>> & {
    [key: string]: any;
  };

export type UseDialogComponentType = ComponentType<MinimumDialogRootProps>;

export type UseDialogYieldedRootProps<TData, TResult> = {
  submit: (result: TResult) => void;
  cancelButtonRef: RefObject<HTMLButtonElement | null>;
} & ({
  open: false;
  data: undefined;
} | {
  open: true;
  data: TData;
});

export interface UseDialogProps<P = MinimumDialogRootProps> {
  component?: ComponentType<P>;
}

export interface UseDialogReturn<TData, TResult, P extends MinimumDialogRootProps> {
  state: {
    open: boolean;
    data: TData | undefined;
  };
  Root: ComponentType<
    P extends UseDialogYieldedRootProps<infer _T, infer __T>
    ? WithOptional<P, 'initialFocusEl' | 'open' | 'onOpenChange' 
    | 'data' | 'submit' | 'cancelButtonRef'>
    : WithOptional<P, 'initialFocusEl' | 'open' | 'onOpenChange'>
  >;
  submit: (result: TResult) => void;
  open: (data: TData) => Promise<TResult>;
  cancelButtonRef: RefObject<HTMLButtonElement | null>;
}


type InferType<T> = T extends infer U ? U : never;

export type UseDialog = typeof useDialog;



type _P<T> = T extends ComponentType<infer R>
? R extends MinimumDialogRootProps
? R
: DialogRootProps
: DialogRootProps;

export function useDialog(
  component?: ComponentType<DialogRootProps> | ComponentType<DialogRootNoChildrenProps>
): UseDialogReturn<void, void, DialogRootNoChildrenProps>;

export function useDialog<
  TData,
  TResult,
>(
  component: ComponentType<DialogRootProps & UseDialogYieldedRootProps<TData, TResult>>
   | ComponentType<DialogRootNoChildrenProps & UseDialogYieldedRootProps<TData, TResult>>
): UseDialogReturn<TData, TResult, DialogRootNoChildrenProps>;

export function useDialog<
  TData,
  TResult,
  T extends ComponentType<any> = InferType<Parameters<typeof useDialog>[0]>,
  P extends MinimumDialogRootProps = _P<T>
>(
  component: T
): UseDialogReturn<TData, TResult, P>;

export function useDialog<
  TData = void,
  TResult = void,
  T extends ComponentType<any> | undefined = InferType<Parameters<typeof useDialog>[0]>,
  P extends MinimumDialogRootProps = _P<T>
>(
  component?: T
): UseDialogReturn<TData, TResult, P> {

  const Component = (component ?? DialogRoot) as ComponentType<DialogRootProps>;

  const [open, setOpen] = useState(false);
  const [data, setData] = useState<TData | undefined>(undefined);

  const resultPromiseRef = useRef<{
    promise: Promise<TResult>;
    resolve: (value: TResult) => void;
  } | undefined>(undefined);

  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  const onClose = useCallback((result: TResult) => {
    if (resultPromiseRef.current) {
      resultPromiseRef.current.resolve(result);
      resultPromiseRef.current = undefined;
    }
    setOpen(false);
  }, [setOpen]);

  const onOpen = useCallback(async (data: TData): Promise<TResult> => {
    // if opened, return the opened one
    if (resultPromiseRef.current) {
      return resultPromiseRef.current.promise;
    }

    let resolvePromise!: (value: TResult) => void;
    const promise = new Promise<TResult>((resolve) => {
      resolvePromise = resolve;
    });

    // cache the current promise function
    resultPromiseRef.current = {
      promise,
      resolve: resolvePromise,
    };

    // set open
    setData(data);
    setOpen(true);

    return promise;
  }, [setData, setOpen]);


  const Root = useCallback((props: P) => {
    const {
      children = <DialogContent>
        <DialogCloseTrigger />
      </DialogContent>,
      ...rest
    } = props;
    // pass the props to the component
    (rest as any).data = data;
    (rest as any).submit = onClose;
    (rest as any).cancelButtonRef = cancelButtonRef;
    return <Component
      initialFocusEl={() => cancelButtonRef.current}
      open={open}
      onOpenChange={(e) => {
        setOpen(e.open);
      }}
      {...rest}
    >
      {children}
    </Component>;
  }, [open, setOpen, onClose, cancelButtonRef]);

  return {
    state: { open, data },
    Root: Root as any,
    submit: onClose,
    open: onOpen,
    cancelButtonRef,
  };
}