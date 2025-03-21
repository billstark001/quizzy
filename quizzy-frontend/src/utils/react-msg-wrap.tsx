import {
  Button,
  Box,
  Center,
  Spinner,
  createToaster,
  CreateToasterReturn,
} from "@chakra-ui/react";
import { isValidElement, ReactNode, StrictMode, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { NonCallable, WithHandlerOptions, withHandlerRaw } from "./react-msg";
import ReactDOM from "react-dom/client";
import AsyncDialog, { DialogOpener } from "./react-dialog";
import {
  DialogFooter,
  DialogRoot,
  DialogCloseTrigger,
  DialogContent,
  DialogHeader,
  DialogBody,
} from "@/components/ui/dialog";
import { Provider } from "@/components/ui/provider";
import { Toaster } from "@/components/ui/toaster";

export type UseToastOptions = Parameters<CreateToasterReturn['create']>[0];

const LoadingScreen = ({ isLoading }: { isLoading?: boolean }) => {


  if (!isLoading) {
    return;
  }

  return <Box
    data-state={isLoading ? 'open' : 'closed'}
    _open={{
      animationName: "fade-in",
      animationDuration: "500ms",
    }}
    _closed={{
      animationName: "fade-out, scale-out",
      animationDuration: "500ms",
    }}
  >
    <Box
      position="absolute"
      top="0"
      left="0"
      right="0"
      bottom="0"
      height='100vh'
      width='100vw'
      bg="rgba(124, 124, 124, 0.5)"
      backdropBlur='10px'
      zIndex={10000}
    >
      <Center h="100vh">
        <Spinner
          borderWidth="4px"
          animationDuration="0.65s"
          // emptyColor="gray.200"
          color="purple.500"
          size="xl"
        />
      </Center>
    </Box>
  </Box>;
};

type _M = {
  message?: ReactNode,
  success?: boolean,
};

type _H = typeof withHandlerRaw;

export type WrappedHandlerRootProps = {
  async?: boolean;
  cache?: boolean;
  /**
   * @deprecated
   */
  useToastOptions?: UseToastOptions,
  withHandlerOptions?: WithHandlerOptions<NonCallable | UseToastOptions, any>,
  toaster: CreateToasterReturn,
  onHandlerUpdated: (handler: _H, dialog: DialogOpener) => void,
};

export const WrappedHandlerRoot = (props: WrappedHandlerRootProps) => {

  const {
    async,
    cache,
    toaster,
    withHandlerOptions,
    onHandlerUpdated,
  } = props;

  const { t } = useTranslation();
  const _h = (success: boolean) => success
    ? t('common.notify.success.header')
    : t('common.notify.error.header');

  const [data, setData] = useState<_M>({});
  const [open, setOpen] = useState(false);
  const { message, success } = data;

  const cancelRef = useRef<HTMLButtonElement>(null);

  const [isLoading, setIsLoading] = useState(false);

  const [openDialog, setOpenDialog] = useState({ f: (() => void 0) as unknown as DialogOpener });

  useEffect(() => {
    const options: WithHandlerOptions<NonCallable | UseToastOptions, any> = Object.freeze({
      async: async,
      cache: cache ?? true,
      def: undefined,
      setLoading: setIsLoading,
      notify(payload, success) {
        if (payload == null) {
          return;
        }
        const shouldShowDialog = isValidElement(payload) || (
          !success && typeof payload === 'string'
        );
        if (shouldShowDialog) {
          setData({ message: payload, success });
          setOpen(true);
        } else {
          toaster.create(typeof payload === 'string' ? {
            title: _h(success),
            description: payload,
            type: success ? 'success' : 'error',
          } as UseToastOptions : payload as UseToastOptions);
        }
      },
      notifySuccess() {
        return {
          title: _h(true),
          description: t('common.notify.success.desc'),
          type: 'success',
        } as UseToastOptions;
      },
      notifyError(error) {
        console.error(error);
        return String(error);
      },
      ...withHandlerOptions,
    });

    const handler: _H = (f, o) => withHandlerRaw<typeof f, any>(f, o == null ? options : Object.assign({}, options, o)) as any;

    onHandlerUpdated(handler, openDialog.f);

  }, [
    async, cache, openDialog.f,
    t, toaster, setData, setOpen, setIsLoading, withHandlerOptions,
    onHandlerUpdated,
  ]);

  return <>
    <Toaster toaster={toaster} />
    <LoadingScreen isLoading={isLoading} />
    <AsyncDialog onOpenDialogChanged={(f) => setOpenDialog({ f })} />
    <DialogRoot
      initialFocusEl={() => cancelRef.current}
      closeOnInteractOutside={false}
      open={open}
      onOpenChange={(e) => setOpen(e.open)}
    >
      <DialogContent>
        <DialogCloseTrigger />
        <DialogHeader fontSize='lg' fontWeight='bold'>
          {_h(!!success)}
        </DialogHeader>

        <DialogBody>
          {message}
        </DialogBody>

        <DialogFooter>
          <Button colorPalette='red' onClick={() => setOpen(false)} ml={3}
            ref={cancelRef}
          >
            {t('common.btn.dismiss')}
          </Button>
        </DialogFooter>

      </DialogContent>
    </DialogRoot>
  </>;

};

export const createStandaloneHandler = (props?: Omit<WrappedHandlerRootProps, 'onHandlerUpdated'>) => {

  let _h: _H | undefined = undefined;
  let _d: DialogOpener | undefined = undefined;
  const wrappedHandler: _H = (f, o) => _h!(f, o);
  const wrappedDialog: DialogOpener = ((...args: any[]) => {
    return (_d as any)!(...args);
  }) as DialogOpener;
  const onHandlerUpdated = (handler: _H, dialog: DialogOpener) => {
    _h = handler;
    _d = dialog;
  }

  const toaster = createToaster({
    placement: 'top',
    pauseOnPageIdle: true,
  });

  const root = <WrappedHandlerRoot {...props}
    toaster={toaster}
    onHandlerUpdated={onHandlerUpdated}
  />;
  const rootNode = ReactDOM.createRoot(document.getElementById('toast')!);
  rootNode.render(<StrictMode>
    <Provider>
      {root}
    </Provider>
  </StrictMode>);

  return [wrappedHandler, toaster, wrappedDialog] as [_H, CreateToasterReturn, DialogOpener];
}