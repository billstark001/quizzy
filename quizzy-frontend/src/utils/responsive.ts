import { useBreakpointValue } from '@chakra-ui/react';

export type ScreenSize = 'mobile' | 'default';
export const useScreenSize = (): ScreenSize => useBreakpointValue<ScreenSize>({
  base: 'mobile',
  md: 'default'
}) || 'default';