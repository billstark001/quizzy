import SimpleColorPicker from "@/components/common/SimpleColorPicker";
import { Textarea2 } from "@/components/question-edit/QuestionEdit";
import { DialogBody, DialogCloseTrigger, DialogContent, DialogFooter, DialogHeader, DialogRoot } from "@/components/ui/dialog";
import { DialogRootNoChildrenProps, UseDialogYieldedRootProps } from "@/utils/chakra";
import { useEditor } from "@/utils/react-patch";
import { Box, Button, DataList, HStack, Input, Switch, useBreakpointValue } from "@chakra-ui/react";
import { BOOKMARK_DEFAULT_CSS_COLOR, BookmarkType, defaultBookmarkType } from "@quizzy/base/types";
import { applyPatch } from "@quizzy/base/utils";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";



export const BookmarkEditDialog = (
  props: DialogRootNoChildrenProps
    & UseDialogYieldedRootProps<BookmarkType | undefined, any>
) => {
  const { data, submit, cancelButtonRef, ...rest } = props;
  const open = rest.open;

  const [initialData, setInitialData] = useState(defaultBookmarkType);
  const [currentData, setCurrentData] = useState(defaultBookmarkType);
  useEffect(() => {
    if (!open) {
      return;
    }
    setInitialData(data ?? defaultBookmarkType());
    setCurrentData(data ?? defaultBookmarkType());
  }, [open]);

  const { t } = useTranslation();

  const bmName = initialData?.id
    ? initialData.name
    : t('common.ph.new');

  const o = useBreakpointValue({
    base: 'vertical',
    md: 'horizontal'
  }) as any;

  const { edit, ...editor } = useEditor({
    value: currentData,
    onChange: (d => {
      setCurrentData(c => applyPatch(c, d));
    }),
  });

  return <DialogRoot size='xl' closeOnInteractOutside={false} {...rest}>
    <DialogContent>
      <DialogCloseTrigger />

      <DialogHeader>
        {t('dialog.bookmarkEdit.header', { bmName })}
      </DialogHeader>

      <DialogBody>
        <DataList.Root orientation={o}>

          <DataList.Item>
            <DataList.ItemLabel>
              {t('data.bookmarkType.id')}
            </DataList.ItemLabel>
            <DataList.ItemValue>
              {initialData?.id || t('common.ph.new')}
            </DataList.ItemValue>
          </DataList.Item>

          <DataList.Item>
            <DataList.ItemLabel>
              {t('data.bookmarkType.name')}
            </DataList.ItemLabel>
            <DataList.ItemValue>
              <Input {...edit('name')} />
            </DataList.ItemValue>
          </DataList.Item>

          <DataList.Item flexDirection='column' gap={1} alignItems='flex-start'>
            <DataList.ItemLabel>
              {t('data.bookmarkType.names')}
            </DataList.ItemLabel>
            <DataList.ItemValue>
              TODO
            </DataList.ItemValue>
          </DataList.Item>

          <DataList.Item>
            <DataList.ItemLabel>
              {t('data.bookmarkType.dispCssColor')}
            </DataList.ItemLabel>
            <DataList.ItemValue>
              <SimpleColorPicker {...edit('dispCssColor')} />
            </DataList.ItemValue>
          </DataList.Item>

          <DataList.Item>
            <DataList.ItemLabel>
              {t('data.bookmarkType.dispCssColorDark')}
            </DataList.ItemLabel>
            <DataList.ItemValue as={HStack}>
              <SimpleColorPicker {...edit('dispCssColorDark')} disabled={!editor.value.dispCssColorDark} />
              <Box>{t('dialog.bookmarkEdit.body.colorDarkSameAsDefault')}</Box>
              <Switch.Root onCheckedChange={(e) => {
                if (!e.checked) {
                  editor.onChangeImmediate({ dispCssColorDark: editor.value.dispCssColor ?? BOOKMARK_DEFAULT_CSS_COLOR });
                } else {
                  editor.onChangeImmediate({ dispCssColorDark: '' });
                }
              }} checked={!editor.value.dispCssColorDark}>
                <Switch.HiddenInput />
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
              </Switch.Root>
            </DataList.ItemValue>
          </DataList.Item>

          <DataList.Item flexDirection='column' gap={1} alignItems='stretch'>
            <DataList.ItemLabel>
              {t('data.bookmarkType.desc')}
            </DataList.ItemLabel>
            <DataList.ItemValue>
              <Textarea2 w='100%' {...edit('desc')} />
            </DataList.ItemValue>
          </DataList.Item>

          <DataList.Item flexDirection='column' gap={1} alignItems='flex-start'>
            <DataList.ItemLabel>
              {t('data.bookmarkType.descs')}
            </DataList.ItemLabel>
            <DataList.ItemValue>
              TODO
            </DataList.ItemValue>
          </DataList.Item>
        </DataList.Root>
      </DialogBody>


      <DialogFooter>
        <Button colorPalette='red' ref={cancelButtonRef} onClick={submit}>
          {t('common.btn.cancel')}
        </Button>
        <Button colorPalette='purple' ref={cancelButtonRef} onClick={() => {
          submit(currentData);
        }}>
          {t('common.btn.save')}
        </Button>
      </DialogFooter>

    </DialogContent>
  </DialogRoot>
};

export default BookmarkEditDialog;