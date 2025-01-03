import {
  AlertDialog, AlertDialogBody,
  AlertDialogContent, AlertDialogFooter,
  AlertDialogHeader, AlertDialogOverlay,
  Button, useToast,
  UseToastOptions,
  Box,
  Center,
  Spinner,
  ChakraProvider,
  AlertDialogCloseButton,
  Fade,
  ToastId,
} from "@chakra-ui/react";
import { useDisclosureWithData, UseDisclosureWithDataProps } from "./disclosure";
import { isValidElement, ReactNode, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { WithHandlerOptions, withHandlerRaw } from "./react-msg";
import ReactDOM from "react-dom/client";
import AsyncDialog, { DialogOpener } from "./react-dialog";

const LoadingScreen = ({ isLoading }: { isLoading?: boolean }) => {
  return <Fade
    in={!!isLoading}
    unmountOnExit
    transition={{
      enter: { duration: 0.5 },
      exit: { duration: 0.01 }
    }}
  >
    <Box
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      bg="rgba(0, 0, 0, 0.7)"
      zIndex="9999"
    >
      <Center h="100vh">
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
          color="purple.500"
          size="xl"
        />
      </Center>
    </Box>
  </Fade>;
};

type _M = {
  message?: ReactNode,
  success?: boolean,
};

type _H = typeof withHandlerRaw;
type _T = (options?: UseToastOptions) => ToastId;

export type WrappedHandlerRootProps = {
  async?: boolean;
  cache?: boolean;
  useToastOptions?: UseToastOptions,
  withHandlerOptions?: WithHandlerOptions<any>,
  useDisclosureWithDataProps?: UseDisclosureWithDataProps<_M>,
  onHandlerUpdated: (handler: _H, toast: _T, dialog: DialogOpener) => void,
};

export const WrappedHandlerRoot = (props: WrappedHandlerRootProps) => {

  const {
    async,
    cache,
    useToastOptions,
    withHandlerOptions,
    useDisclosureWithDataProps,
    onHandlerUpdated,
  } = props;

  const { t } = useTranslation();
  const _h = (success: boolean) => success
    ? t('common.notify.success.header')
    : t('common.notify.error.header');

  const toast = useToast({
    isClosable: true,
    position: 'top',
    ...useToastOptions,
  });

  const { data, ...disclosure } = useDisclosureWithData<_M>({}, useDisclosureWithDataProps);

  const { message, success } = data;

  const cancelRef = useRef<any>(null);

  const [isLoading, setIsLoading] = useState(false);

  const [openDialog, setOpenDialog] = useState({ f: (() => void 0) as unknown as DialogOpener });

  useEffect(() => {
    const options: WithHandlerOptions<any> = Object.freeze({
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
          disclosure.onOpen({ message: payload, success });
        } else {
          toast(typeof payload === 'string' ? {
            title: _h(success),
            description: payload,
            status: success ? 'success' : 'error',
          } as UseToastOptions : payload as UseToastOptions);
        }
      },
      notifySuccess() {
        return {
          title: _h(true),
          description: t('common.notify.success.desc'),
          status: 'success',
        } as UseToastOptions;
      },
      notifyError(error) {
        console.error(error);
        return String(error);
      },
      ...withHandlerOptions,
    });

    const handler: _H = (f, o) => withHandlerRaw(f, o == null ? options : Object.assign({}, options, o)) as any;

    onHandlerUpdated(handler, toast, openDialog.f);

  }, [
    async, cache, openDialog.f,
    t, toast, disclosure.onOpen, setIsLoading, withHandlerOptions,
    onHandlerUpdated,
  ]);



  return <ChakraProvider>
    <LoadingScreen isLoading={isLoading} />
    <AsyncDialog onOpenDialogChanged={(f) => setOpenDialog({ f })}/>
    <AlertDialog
      leastDestructiveRef={cancelRef as any}
      closeOnOverlayClick={false}
      {...disclosure}
    >
      <AlertDialogOverlay />
      <AlertDialogContent>
        <AlertDialogCloseButton />
        <AlertDialogHeader fontSize='lg' fontWeight='bold'>
          {_h(!!success)}
        </AlertDialogHeader>

        <AlertDialogBody>
          {message}
        </AlertDialogBody>

        <AlertDialogFooter>
          <Button colorScheme='red' onClick={disclosure.onClose} ml={3}>
            {t('common.btn.dismiss')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </ChakraProvider>;

};

export const createStandaloneHandler = (props?: Omit<WrappedHandlerRootProps, 'onHandlerUpdated'>) => {

  let _h: _H | undefined = undefined;
  let _t: _T | undefined = undefined;
  let _d: DialogOpener | undefined = undefined;
  const wrappedHandler: _H = (f, o) => _h!(f, o);
  const wrappedToast: _T = (t) => _t!(t);
  const wrappedDialog: DialogOpener = ((a, b) => _d!(a, b)) as DialogOpener; 
  const onHandlerUpdated = (handler: _H, toast: _T, dialog: DialogOpener) => {
    _h = handler;
    _t = toast;
    _d = dialog;
  }

  const root = <WrappedHandlerRoot {...props} onHandlerUpdated={onHandlerUpdated} />;
  const rootNode = ReactDOM.createRoot(document.getElementById('toast')!);
  rootNode.render(root);

  return [wrappedHandler, wrappedToast, wrappedDialog] as [_H, _T, DialogOpener];
}