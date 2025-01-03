import { useScreenSize } from "@/utils/responsive";
import { createContext, SetStateAction, useCallback, useState } from "react";


export type LayoutContextScheme = {
  collapsed: boolean;
  setCollapsed: (c: SetStateAction<boolean>) => void;
  toggleCollapsed: () => void;
  immersive: boolean;
  setImmersive: (c: SetStateAction<boolean>) => void;
  toggleImmersive: () => void;
  isMobile: boolean;
};


export const useLayoutContextScheme = (): LayoutContextScheme => {

  const [collapsed, setCollapsed] = useState(false);
  const toggleCollapsed = useCallback(() => setCollapsed(x => !x), [setCollapsed]);

  const [immersive, setImmersive] = useState(false);
  const toggleImmersive = useCallback(() => setImmersive(x => !x), [setImmersive]);

  const screenSize = useScreenSize();

  return {
    collapsed,
    setCollapsed,
    toggleCollapsed,
    immersive,
    setImmersive,
    toggleImmersive,
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
  isMobile: false,
});


export const LogoEnvironmentContext = createContext<
  'sidebar' | 'menu'
>('sidebar');