import { useBreakpointValue } from '@chakra-ui/react';

type _S = 'mobile' | 'default';
export const useScreenSize = (): _S => useBreakpointValue<_S>({
  base: 'mobile',
  md: 'default'
}) || 'default';