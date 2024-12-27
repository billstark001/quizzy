// https://chakra-templates.vercel.app/navigation/sidebar

import { useScreenSize } from '@/utils/responsive';
import {
  IconButton,
  Avatar,
  Box,
  CloseButton,
  Flex,
  HStack,
  VStack,
  useColorModeValue,
  Text,
  Drawer,
  DrawerContent,
  useDisclosure,
  BoxProps,
  FlexProps,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  DrawerOverlay,
  useColorMode,
} from '@chakra-ui/react'
import { PropsWithChildren, ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import {
  FiMenu,
  FiSun,
  FiChevronDown,
} from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';

export interface LinkItemProps {
  name: ReactNode;
  icon?: ReactNode;
  onClick?: () => void;
  to?: string;
  selected?: (() => boolean) | 'auto' | boolean;
}


interface MobileProps extends FlexProps {
  logo?: ReactNode
  onOpen: () => void
  onToggleExpand: () => void
}

interface SidebarProps extends BoxProps {
  logo?: ReactNode;
  items: LinkItemProps[];
  onClose?: () => void;
  collapsed?: boolean;
  mobile?: boolean;
}

const SIDEBAR_SIZE_FOLDED_PX = 100;
const SIDEBAR_SIZE_EXPANDED_PX = 240;
const SIDEBAR_SIZE_MOBILE_PX = 300;


const SidebarContent = ({ 
  logo, items, onClose, collapsed, mobile, ...rest 
}: SidebarProps) => {
  collapsed = !!collapsed;
  const isMobile = useScreenSize() === 'mobile';
  return (
    <Box
      overflow='hidden'
      transition="all 0.3s ease"
      bg={useColorModeValue('white', 'gray.900')}
      borderRight="1px"
      borderRightColor={useColorModeValue('gray.200', 'gray.700')}
      boxShadow={collapsed ? '0 0 15px #00000020' : undefined}
      w={`${mobile
          ? SIDEBAR_SIZE_MOBILE_PX
          : collapsed
            ? SIDEBAR_SIZE_FOLDED_PX
            : SIDEBAR_SIZE_EXPANDED_PX
        }px`}
      pos="fixed"
      h="full"
      onClick={(e) => e.stopPropagation()}
      {...rest}>
      {isMobile ? <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
        {logo}
        <CloseButton display={{ base: 'flex', md: 'none' }} onClick={onClose} />
      </Flex> : <VStack minH="20" my="4">{logo}</VStack>}
      {items.map((link, i) => <NavItem key={i} link={link} collapsed={collapsed} >
        {link.name}
      </NavItem>)}
    </Box>
  )
}

interface NavItemProps extends FlexProps {
  link: LinkItemProps
  collapsed?: boolean
  children: ReactNode
}

const detectIsSelected = (currentPath: string, prefix: string) => {
  if (currentPath === prefix) {
    return true;
  }
  if (!prefix || prefix === '/') {
    return false;
  }
  if (currentPath.endsWith('/')) {
    return currentPath.startsWith(prefix);
  }
  return ((currentPath ?? '') + '/').startsWith(prefix);
};

const NavItem = ({ link, children, collapsed, ...rest }: NavItemProps) => {
  const { name, icon, to, onClick, selected } = link;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isSelected = (selected === 'auto' || !selected)
    ? detectIsSelected(pathname, to ?? '/')
    : typeof selected === 'function'
      ? selected()
      : selected;
  return (
    <Box
      onClick={onClick ?? (to ? () => navigate(to) : undefined)}
      style={{ textDecoration: 'none' }}
      _focus={{ boxShadow: 'none' }}>
      <Flex
        transition='all 0.1s ease'
        align="center"
        justifyContent={collapsed ? 'center' : undefined}
        p={3} mx={4} my={1}
        borderLeft={!collapsed && isSelected
          ? '10px solid'
          : undefined
        }
        borderBottom={collapsed && isSelected
          ? '5px solid'
          : undefined
        }
        boxShadow={collapsed && isSelected
          ? '0 0 20px #00000020'
          : undefined
        }
        borderRadius="lg"
        // borderLeftRadius={isSelected
        //   ? '0'
        //   : undefined
        // }
        h='60px'
        role="group"
        cursor="pointer"
        _hover={{
          bg: 'cyan.400',
          borderColor: 'cyan.600',
          color: 'white',
        }}
        {...rest}>
        <Box 
          transition='all 0.1s ease'
          {...(collapsed ? {
            fontSize: '2xl',
          } : {
            fontSize: 'lg',
            pr: 4,
          })}
        >{icon}</Box>
        {collapsed ? undefined : name}
      </Flex>
    </Box>
  )
}

const HeaderNavBar = ({ logo, onOpen, onToggleExpand, ...rest }: MobileProps) => {
  const screenSize = useScreenSize();
  const { toggleColorMode } = useColorMode();
  
  return (
    <Flex
      px={{ base: 4, md: 4 }}
      transition='all 0.3s ease'
      height="20"
      alignItems="center"
      bg={useColorModeValue('white', 'gray.900')}
      borderBottomWidth="1px"
      borderBottomColor={useColorModeValue('gray.200', 'gray.700')}
      justifyContent='space-between'
      {...rest}>
      <IconButton
        display='flex'
        // justifySelf='flex-start'
        onClick={screenSize === 'mobile' ? onOpen : onToggleExpand}
        variant="ghost"
        size='lg'
        aria-label="open menu"
        icon={<FiMenu />}
      />

      <Box
        display={{ base: 'flex', md: 'none' }}
      >
        {logo}
      </Box>

      <HStack spacing={{ base: '0', md: '6' }}>
        <IconButton 
          size="lg" variant="ghost" aria-label="open menu" 
          onClick={toggleColorMode} icon={<FiSun />} 
        />
        <Flex alignItems={'center'}>
          <Menu>
            <MenuButton py={2} transition="all 0.3s" _focus={{ boxShadow: 'none' }}>
              <HStack>
                <Avatar
                  size={'sm'}
                  src={
                    'https://images.unsplash.com/photo-1619946794135-5bc917a27793?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&s=b616b2c5b373a80ffc9636ba24f7a4a9'
                  }
                />
                <VStack
                  display={{ base: 'none', md: 'flex' }}
                  alignItems="flex-start"
                  spacing="1px"
                  ml="2">
                  <Text fontSize="sm">Justina Clark</Text>
                  <Text fontSize="xs" color="gray.600">
                    Admin
                  </Text>
                </VStack>
                <Box display={{ base: 'none', md: 'flex' }}>
                  <FiChevronDown />
                </Box>
              </HStack>
            </MenuButton>
            <MenuList
              bg={useColorModeValue('white', 'gray.900')}
              borderColor={useColorModeValue('gray.200', 'gray.700')}>
              <MenuItem>Profile</MenuItem>
              <MenuItem>Settings</MenuItem>
              <MenuItem>Billing</MenuItem>
              <MenuDivider />
              <MenuItem>Sign out</MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </HStack>
    </Flex>
  )
}

export type SidebarWithHeaderProps = PropsWithChildren<{
  logo?: ReactNode;
  items: LinkItemProps[];
}>;

export const SidebarWithHeader = (props: SidebarWithHeaderProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { logo, items, children } = props;

  const [collapsed, setCollapsed] = useState(false);
  const onToggleExpand = useCallback(() => setCollapsed(x => !x), [setCollapsed]);

  const finalFocusRef = useRef<any>(null);

  const screenSize = useScreenSize();
  useEffect(() => {
    if (screenSize === 'mobile') {

      return;
    }
    onClose();
  }, [screenSize]);

  return (
    <Box minH="100vh">
      <SidebarContent logo={logo} items={items} collapsed={collapsed} display={{ base: 'none', md: 'block' }} />

      <Drawer
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        onOverlayClick={onClose}
        size='xs'
        finalFocusRef={finalFocusRef}
      >
        <DrawerOverlay />
        <DrawerContent background='transparent' boxShadow='none' onClick={onClose}>
          <SidebarContent logo={logo} items={items} onClose={onClose} mobile />
        </DrawerContent>
      </Drawer>

      <HeaderNavBar 
        logo={logo}
        onOpen={onOpen} onToggleExpand={onToggleExpand} 
        pl={{ 
          base: '16px', 
          md: `${16 + (collapsed ? SIDEBAR_SIZE_FOLDED_PX : SIDEBAR_SIZE_EXPANDED_PX)}px`,
        }}
      />
      <Box
        w='100vw'
        h='calc(100vh - 80px)'
        transition='all 0.3s ease'
        overflow='scroll'
        pl={{ 
          base: '16px', 
          md: `${16 + (collapsed ? SIDEBAR_SIZE_FOLDED_PX : SIDEBAR_SIZE_EXPANDED_PX)}px`,
        }}
        p={4}
      >
        {children}
      </Box>
    </Box>
  )
};

export default SidebarWithHeader;