import React, { isValidElement, ReactNode, RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Button, ButtonProps, DialogRootProps, HStack, useCallbackRef
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { uuidV4B64 } from "@quizzy/base/utils";
import { promiseWithResolvers } from "./func";
import { DialogBody, DialogCloseTrigger, DialogContent, DialogFooter, DialogHeader, DialogRoot } from "@/components/ui/dialog";

type _O<T> = Readonly<T | [T, ReactNode] | [T, ReactNode, ButtonProps]>;
export type DialogDefinition<T = boolean> = {
  id?: string;
  title?: ReactNode;
  desc?: ReactNode;
  type?: DialogType;
  options?: _O<T>[];
  closeOption?: T;
};


export type DialogType = 'normal' | 'alert' |
  'alert-confirm' | 'ok-cancel' | 'load-discard' | 'save-discard';
export type DialogOpener = {
  (desc: ReactNode, type?: DialogType, id?: string): Promise<boolean>;
  <T = boolean>(option: Readonly<DialogDefinition<T>>): Promise<T>;
};

type DialogState = {
  id: string;
  open: boolean;
  definition: Readonly<DialogDefinition>;
};

type DialogStateRecord = Record<string, Readonly<DialogState>>;

const getOptionsDefinition = (
  t: ReturnType<typeof useTranslation>['t'], type: DialogType
): _O<boolean>[] =>
  type === 'load-discard' ? [
    [false, t('common.btn.discard'), { colorPalette: 'red' }],
    [true, t('common.btn.load'), { colorPalette: 'green' }]
  ] : type === 'save-discard' ? [
    [false, t('common.btn.discard'), { colorPalette: 'red' }],
    [true, t('common.btn.save'), { colorPalette: 'green' }]
  ] : type === 'alert-confirm' ? [
    [false, t('common.btn.cancel')],
    [true, t('common.btn.confirm'), { colorPalette: 'red' }]
  ] : type === 'ok-cancel' ? [
    [false, t('common.btn.cancel', { colorPalette: 'red' })],
    [true, t('common.btn.ok'), { colorPalette: 'purple' }]
  ] : type === 'alert' ? [
    [true, t('common.btn.dismiss'), { colorPalette: 'red' }]
  ] : [
    [true, t('common.btn.dismiss')],
  ];

function getOptionDefinition<T = boolean>(o: _O<T>): {
  key: T;
  desc: React.ReactNode;
  props?: ButtonProps;
} {
  return Array.isArray(o) && o.length > 0 && o.length < 4
    ? { key: o[0], desc: o[1], props: o[2] }
    : { key: o as T, desc: String(o) };
}

export const AsyncDialog = (props: Partial<DialogRootProps> & {
  onOpenDialogChanged: (func: DialogOpener) => void;
}) => {

  const { onOpenDialogChanged: onOpenDialogChangedProp, ...dialogProps } = props;
  const onOpenDialogChanged = useCallbackRef(onOpenDialogChangedProp);

  const { t } = useTranslation();

  const [dialogRecord, setDialogRecord] = useState<DialogStateRecord>({});

  const open = useCallback((def: Readonly<DialogDefinition>) => {
    // generate id
    let id = def.id || uuidV4B64(8);
    let tryTime = def.id ? 0 : 3;
    while (dialogRecord[id] && tryTime > 0) {
      id = uuidV4B64(8);
      --tryTime;
    }
    if (dialogRecord[id]) {
      if (def.id) { // use the existent item
        return id;
      }
      throw new Error('ID Conflict: ' + id);
    }
    const state: DialogState = {
      id, open: true, definition: def,
    };
    setDialogRecord(d => ({ ...d, [id]: state }));
    return id;
  }, [dialogRecord, setDialogRecord]);
  const openRef = useCallbackRef(open);

  const close = useCallback((id: string, complete?: boolean) => {
    if (complete) {
      setDialogRecord(d => {
        const dd = { ...d };
        delete dd[id];
        return dd;
      });
      return;
    }
    if (!dialogRecord[id]) {
      return;
    }
    const state = dialogRecord[id];
    setDialogRecord(d => ({ ...d, [id]: { ...state, open: false } }));
  }, [dialogRecord, setDialogRecord]);
  const closeRef = useCallbackRef(close);

  const cancelRefs = useRef({}) as RefObject<Record<string, any>>;


  const { openDialog, closeDialog } = useMemo(() => {

    const promiseMap: Record<string, ReturnType<typeof promiseWithResolvers>> = {};

    const openDialog = (async (desc, type, idIn) => {
      const isDef = !!desc && !isValidElement(desc) && typeof desc === 'object';
      const def: DialogDefinition = isDef
        ? desc as DialogDefinition
        : {
          id: idIn,
          title: t(`common.dialog.title.${type || 'normal'}`),
          desc: desc ?? t(`common.dialog.title.${type || 'normal'}`),
          options: getOptionsDefinition(t, type || 'normal'),
          closeOption: false,
        };
      const id = openRef(def) ?? '';
      if (promiseMap[id]) {
        return promiseMap[id].promise;
      }
      const p = promiseWithResolvers();
      promiseMap[id] = p;
      return await p.promise;
    }) as DialogOpener;

    return {
      openDialog,
      closeDialog: (id: string, accept: any) => {
        const { resolve } = promiseMap[id] ?? {};
        resolve?.(accept);
        delete promiseMap[id];
        closeRef(id, false);
      }
    }
  }, [openRef, closeRef]);

  useEffect(() => void onOpenDialogChanged(openDialog), [openDialog, onOpenDialogChanged]);

  const renderSingleDialog = (state: Readonly<DialogState>) => {
    const { id, open, definition: data } = state;
    const { title, desc, type } = data;
    const options = data.options?.length
      ? data.options
      : type ? getOptionsDefinition(t, type)
        : [[false, t('common.btn.dismiss')] as _O<boolean>];
    const closeOption = data.closeOption
      ?? getOptionDefinition(options[0]).key;

    return <DialogRoot
      role="alertdialog"
      key={id}
      onExitComplete={() => closeRef(id, true)}
      initialFocusEl={((r: any) => cancelRefs.current![id] = r) as any}
      open={open} 
      onOpenChange={({ open }) => {
        if (!open) {
          closeDialog(id, closeOption);
        }
      }}
      {...dialogProps}
    >
      <DialogContent>
        <DialogCloseTrigger onClick={() => closeDialog(id, closeOption)} />
        <DialogHeader fontSize='lg' fontWeight='bold'>
          {title ?? t(`common.dialog.title.${type || 'normal'}`)}
        </DialogHeader>

        <DialogBody>
          {desc}
        </DialogBody>

        <DialogFooter
          as={options.length > 1 ? HStack : undefined}
          justifyContent={options.length > 1 ? 'space-between' : undefined}
        >
          {options.map((option, index) => {
            const { key, desc, props } = getOptionDefinition(option);
            return <Button key={index} onClick={() => closeDialog(id, key)} {...props}>
              {desc}
            </Button>;
          })}
        </DialogFooter>
      </DialogContent>
    </DialogRoot>;
  };

  return <>
    {Object.values(dialogRecord).map(renderSingleDialog)}
  </>;
};

export default AsyncDialog;