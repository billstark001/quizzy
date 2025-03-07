import { DialogRootProps, UseDisclosureReturn } from "@chakra-ui/react";

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