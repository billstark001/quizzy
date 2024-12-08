import React, { isValidElement, ReactNode, useEffect, useMemo, useRef } from "react";
import { useDisclosureWithData } from "./disclosure";
import { AlertDialog, AlertDialogBody, AlertDialogCloseButton, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, AlertDialogProps, Button, ButtonProps, HStack, useCallbackRef } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

type _O<T> = Readonly<T | [T, ReactNode] | [T, ReactNode, ButtonProps]>;
export type DialogDefinition<T = boolean> = {
  title?: ReactNode;
  desc?: ReactNode;
  options?: _O<T>[];
  closeOption?: T;
};


export type DialogType = 'normal' | 'alert' | 'confirm' | 'load-discard';
export type DialogOpener = {
  (desc: ReactNode, type?: DialogType): Promise<boolean>;
  <T = boolean>(option: DialogDefinition<T>): Promise<T>;
};


const getOptionsDefinition = (
  t: ReturnType<typeof useTranslation>['t'], type: DialogType
): _O<boolean>[] =>
  type === 'load-discard' ? [
    [false, t('dialog.option.discard'), { colorScheme: 'red' }],
    [true, t('dialog.option.load'), { colorScheme: 'green' }]
  ] : type === 'confirm' ? [
    [false, t('dialog.option.cancel')],
    [true, t('dialog.option.confirm'), { colorScheme: 'red' }]
  ] : type === 'alert' ? [
    [true, t('dialog.option.dismiss'), { colorScheme: 'red' }]
  ] : [
    [true, t('dialog.option.dismiss')],
  ];

const getOptionDefinition = <T=boolean>(o: _O<T>): {
  key: T;
  desc: React.ReactNode;
  props?: ButtonProps;
} => Array.isArray(o) && o.length > 0 && o.length < 4
    ? { key: o[0], desc: o[1], props: o[2] }
    : { key: o as T, desc: String(o) };

export const AsyncDialog = (props: Partial<AlertDialogProps> & {
  onOpenDialogChanged: (func: DialogOpener) => void;
}) => {

  const { onOpenDialogChanged: onOpenDialogChangedProp, ...dialogProps } = props;
  const onOpenDialogChanged = useCallbackRef(onOpenDialogChangedProp);

  const { t } = useTranslation();
  const { data, ...dAlert } = useDisclosureWithData<DialogDefinition>({});
  const cancelRef = useRef<any>();

  const { openDialog, closeDialog } = useMemo(() => {
    let promise: Promise<boolean> | undefined = undefined;
    let resolve: ((value: boolean) => void) | undefined = undefined;
    
    const openDialog = (async (desc, type) => {
      if (promise) {
        throw new Error('Multiple alert calling is disallowed');
      }
      const isDef = !!desc && !isValidElement(desc) && typeof desc === 'object';
      const def: DialogDefinition = isDef
        ? desc as DialogDefinition
        : {
          title: t(`dialog.title.${type || 'normal'}`),
          desc: desc ?? t(`dialog.title.${type || 'normal'}`),
          options: getOptionsDefinition(t, type || 'normal'),
          closeOption: false,
        };
      promise = new Promise((res) => {
        resolve = res;
        dAlert.onOpen(def);
      });
      return promise;
    }) as DialogOpener;

    return {
      openDialog,
      closeDialog: (accept: any) => {
        resolve?.(accept);
        promise = undefined;
        resolve = undefined;
        dAlert.onClose();
      }
    }
  }, [dAlert.onOpen, dAlert.onClose]);

  const { title, desc } = data;
  const options = data.options?.length
    ? data.options
    : [[false, t('dialog.option.dismiss')] as _O<boolean>];
  const closeOption = data.closeOption
    ?? getOptionDefinition(options[0]).key;

  useEffect(() => onOpenDialogChanged(openDialog), [openDialog, onOpenDialogChanged]);

  return <AlertDialog
    {...dAlert}
    leastDestructiveRef={cancelRef}
    onClose={() => closeDialog(closeOption)}
    {...dialogProps}
  >
    <AlertDialogOverlay>
      <AlertDialogContent>
        <AlertDialogCloseButton onClick={() => closeDialog(closeOption)} />
        <AlertDialogHeader fontSize='lg' fontWeight='bold'>
          {title}
        </AlertDialogHeader>

        <AlertDialogBody>
          {desc}
        </AlertDialogBody>

        <AlertDialogFooter 
          as={options.length > 1 ? HStack : undefined}
          justifyContent={options.length > 1 ? 'space-between' : undefined}
        >
          {options.map((option, index) => {
            const { key, desc, props } = getOptionDefinition(option);
            return <Button key={index} onClick={() => closeDialog(key)} {...props}>
              {desc}
            </Button>;
          })}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialogOverlay>
  </AlertDialog>;
};

export default AsyncDialog;