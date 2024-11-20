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
} from "@chakra-ui/react";
import { useDisclosureWithData, UseDisclosureWithDataProps } from "./disclosure";
import { isValidElement, ReactNode, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { WithHandlerOptions, withHandlerRaw } from "./react-msg";
import ReactDOM from "react-dom/client";

const LoadingScreen = () => {
  return (
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
          color="blue.500"
          size="xl"
        />
      </Center>
    </Box>
  )
};

type _M = {
  message?: ReactNode,
  success?: boolean,
};

type _H = typeof withHandlerRaw;

export type WrappedHandlerRootProps = {
  async?: boolean;
  cache?: boolean;
  useToastOptions?: UseToastOptions,
  withHandlerOptions?: WithHandlerOptions<any>,
  useDisclosureWithDataProps?: UseDisclosureWithDataProps<_M>,
  onHandlerUpdated: (handler: _H) => void,
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
    ? t('notify.success.header')
    : t('notify.error.header');

  const toast = useToast({
    isClosable: true,
    position: 'top',
    ...useToastOptions,
  });

  const { data, ...disclosure } = useDisclosureWithData<_M>({}, useDisclosureWithDataProps);

  const { message, success } = data;

  const cancelRef = useRef<any>(null);

  const [isLoading, setIsLoading] = useState(false);

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
          description: t('notify.success.desc.default'),
          status: 'success',
        } as UseToastOptions;
      },
      notifyError(error) {
        return String(error);
      },
      ...withHandlerOptions,
    });

    const handler: _H = (f, o) => withHandlerRaw(f, o == null ? options : Object.assign({}, options, o)) as any;

    onHandlerUpdated(handler);

  }, [
    async, cache,
    t, toast, disclosure.onOpen, setIsLoading, withHandlerOptions,
    onHandlerUpdated,
  ]);



  return <ChakraProvider>
    {isLoading && <LoadingScreen />}
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
            {t('notify.error.dismiss')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </ChakraProvider>;

};

export const createStandaloneHandler = (props?: Omit<WrappedHandlerRootProps, 'onHandlerUpdated'>) => {

  let _h: _H | undefined = undefined;
  const wrappedHandler: _H = (f, o) => _h!(f, o);
  const onHandlerUpdated = (handler: _H) => {
    _h = handler;
  }

  const root = <WrappedHandlerRoot {...props} onHandlerUpdated={onHandlerUpdated} />;
  const rootNode = ReactDOM.createRoot(document.getElementById('toast')!);
  rootNode.render(root);

  return wrappedHandler;
}