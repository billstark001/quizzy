import { useScreenSize } from "@/utils/responsive";
import { useDisclosure } from '@chakra-ui/react';
import { createContext, SetStateAction, useCallback, useState } from "react";

type _D = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onToggle: () => void;
};

export type LayoutContextScheme = {
  collapsed: boolean;
  setCollapsed: (c: SetStateAction<boolean>) => void;
  toggleCollapsed: () => void;
  immersive: boolean;
  setImmersive: (c: SetStateAction<boolean>) => void;
  toggleImmersive: () => void;
  sidebarDisclosure: _D;
  isMobile: boolean;
};


export const useLayoutContextScheme = (): LayoutContextScheme => {

  const [collapsed, setCollapsed] = useState(false);
  const toggleCollapsed = useCallback(() => setCollapsed(x => !x), [setCollapsed]);

  const [immersive, setImmersive] = useState(false);
  const toggleImmersive = useCallback(() => setImmersive(x => !x), [setImmersive]);

  const screenSize = useScreenSize();

  const sidebarDisclosure = useDisclosure();

  return {
    collapsed,
    setCollapsed,
    toggleCollapsed,
    immersive,
    setImmersive,
    toggleImmersive,
    sidebarDisclosure,
    isMobile: screenSize === 'mobile',
  };
};

export const LayoutContext = createContext<LayoutContextScheme>({
  collapsed: false,
  setCollapsed: () => void 0,
  toggleCollapsed: () => void 0,
  immersive: false,
  setImmersive: () => void 0,
  toggleImmersive: () => void 0,
  sidebarDisclosure: {
    isOpen: false,
    onOpen: () => void 0,
    onClose: () => void 0,
    onToggle: () => void 0,
  },
  isMobile: false,
});


export const LogoEnvironmentContext = createContext<
  'sidebar' | 'menu'
>('sidebar');