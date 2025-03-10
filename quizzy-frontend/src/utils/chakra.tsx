import { DialogRootProps, useDisclosure, UseDisclosureReturn } from "@chakra-ui/react";
import { DialogCloseTrigger, DialogContent, DialogRoot } from "@/components/ui/dialog";
import { ComponentType, RefObject, useCallback, useRef } from "react";
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

export type UseDialogYieldedRootProps<TResult = unknown> = {
  submit: (result: TResult) => void;
  cancelButtonRef: RefObject<HTMLButtonElement | null>;
};

export interface UseDialogProps<P = MinimumDialogRootProps> {
  component?: ComponentType<P>;
}

export interface UseDialogReturn<TResult = unknown, P extends MinimumDialogRootProps = MinimumDialogRootProps> {
  state: UseDisclosureReturn;
  Root: ComponentType<
    P extends UseDialogYieldedRootProps<infer _T>
    ? WithOptional<P, 'initialFocusEl' | 'open' | 'onOpenChange' | 'submit' | 'cancelButtonRef'>
    : WithOptional<P, 'initialFocusEl' | 'open' | 'onOpenChange'>
  >;
  submit: (result: TResult) => void;
  open: <R = TResult>() => Promise<R>;
  cancelButtonRef: RefObject<HTMLButtonElement | null>;
}


type InferType<T> = T extends infer U ? U : never;

export type UseDialog = typeof useDialog;


type _P<T> = T extends ComponentType<infer R>
? R extends MinimumDialogRootProps
? R
: DialogRootProps
: DialogRootProps;

export function useDialog<
  TResult = void,
>(
  component?: ComponentType<DialogRootProps>
): UseDialogReturn<TResult, DialogRootProps>;

export function useDialog<
  TResult = void,
  T extends ComponentType<any> = InferType<Parameters<typeof useDialog>[0]>,
  P extends MinimumDialogRootProps = _P<T>
>(
  component: T
): UseDialogReturn<TResult, P>;

export function useDialog<
  TResult = void,
  T extends ComponentType<any> | undefined = InferType<Parameters<typeof useDialog>[0]>,
  P extends MinimumDialogRootProps = _P<T>
>(
  component?: T
): UseDialogReturn<TResult, P> {

  const Component = (component ?? DialogRoot) as ComponentType<DialogRootProps>;

  const dialogState = useDisclosure();

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
    dialogState.onClose();
  }, [dialogState.onClose]);

  const onOpen = useCallback(async (): Promise<TResult> => {
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
    dialogState.onOpen();

    return promise;
  }, [dialogState.onOpen]);


  const Root = useCallback((props: P) => {
    const {
      children = <DialogContent>
        <DialogCloseTrigger />
      </DialogContent>,
      ...rest
    } = props;
    // pass the props to the component
    (rest as any).submit = onClose;
    (rest as any).cancelButtonRef = cancelButtonRef;
    return <Component
      initialFocusEl={() => cancelButtonRef.current}
      open={dialogState.open}
      onOpenChange={(e) => {
        dialogState.setOpen(e.open);
      }}
      {...rest}
    >
      {children}
    </Component>;
  }, [dialogState.open, dialogState.setOpen, onClose, cancelButtonRef]);

  return {
    state: dialogState,
    Root: Root as any,
    submit: onClose,
    open: onOpen as any,
    cancelButtonRef,
  };
}