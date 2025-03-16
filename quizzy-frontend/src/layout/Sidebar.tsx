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
  Text,
  BoxProps,
  FlexProps,
} from '@chakra-ui/react'
import {
  MenuContent,
  MenuItem,
  MenuRoot,
  MenuTrigger,
  MenuSeparator
} from "@/components/ui/menu"
import { PropsWithChildren, ReactNode, useCallback, useContext, useEffect, useRef } from 'react'
import {
  FiMenu,
  FiSun,
  FiChevronDown,
} from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutContext, LogoEnvironmentContext } from './layout-context';
import { useColorModeValue, useColorMode } from '@/components/ui/color-mode';
import {
  DrawerBackdrop,
  DrawerContent, DrawerRoot
} from '@/components/ui/drawer';
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
}

interface SidebarProps extends BoxProps {
  logo?: ReactNode;
  items: LinkItemProps[];
  onClose?: () => void;
  collapsed?: boolean;
  mobile?: boolean;
}

const SIDEBAR_SIZE_FOLDED_PX = 80;
const SIDEBAR_SIZE_EXPANDED_PX = 240;
const SIDEBAR_SIZE_MOBILE_PX = 300;


const SidebarContent = ({
  logo, items, onClose, collapsed, mobile, ...rest
}: SidebarProps) => {
  collapsed = !!collapsed;
  const isMobile = useScreenSize() === 'mobile';
  return (
    <Box
      zIndex={110}
      overflow='hidden'
      transition="all 0.3s ease"
      bg={useColorModeValue('white', 'gray.900')}
      borderRightWidth="1px"
      borderRightColor='gray.muted'
      boxShadow={collapsed ? '0 0 15px #00000020' : undefined}
      w={`${mobile
        ? SIDEBAR_SIZE_MOBILE_PX
        : collapsed
          ? SIDEBAR_SIZE_FOLDED_PX
          : SIDEBAR_SIZE_EXPANDED_PX
        }px`}
      pos="fixed"
      left={0}
      top={0}
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
  const { sidebarDisclosure, isMobile } = useContext(LayoutContext);
  const isSelected = (selected === 'auto' || !selected)
    ? detectIsSelected(pathname, to ?? '/')
    : typeof selected === 'function'
      ? selected()
      : selected;
  return (
    <Box
      onClick={onClick ?? (to ? () => {
        navigate(to);
        if (isMobile) {
          sidebarDisclosure.setOpen(false);
        }
      } : undefined)}
      style={{ textDecoration: 'none' }}
      _focus={{ boxShadow: 'none' }}>
      <Flex
        transition='all 0.1s ease'
        align="center"
        justifyContent={collapsed ? 'center' : undefined}
        p={3} mx={collapsed ? '10px' : '16px'} my={'4px'}
        borderLeft={!collapsed && isSelected
          ? '10px solid'
          : undefined
        }
        borderBottom={collapsed && isSelected
          ? '5px solid'
          : undefined
        }
        boxShadow={collapsed && isSelected
          ? '0 0 20px #6664'
          : undefined
        }
        borderRadius="lg"
        h='60px'
        role="group"
        cursor="pointer"
        _hover={{
          bg: 'purple.400',
          borderColor: 'purple.600',
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

const HeaderNavBar = ({ logo, onOpen, ...rest }: MobileProps) => {
  const screenSize = useScreenSize();
  const { toggleColorMode } = useColorMode();
  const { toggleCollapsed } = useContext(LayoutContext);

  return (
    <Flex
      px={4}
      transition='margin 0.3s ease'
      height={{ base: 16, md: 20 }}
      alignItems="center"
      bg={useColorModeValue('white', 'gray.900')}
      borderBottomWidth="1px"
      borderBottomColor='gray.muted'
      justifyContent='space-between'
      zIndex={100}
      
      pos='sticky'
      top={0}

      {...rest}>
      <IconButton
        display='flex'
        // justifySelf='flex-start'
        onClick={screenSize === 'mobile' ? onOpen : toggleCollapsed}
        variant="ghost"
        size='lg'
        aria-label="open menu"
        children={<FiMenu />}
      />

      <Box
        display={{ base: 'flex', md: 'none' }}
      >
        {logo}
      </Box>

      <HStack gap={{ base: '0', md: '6' }}>
        <IconButton
          size="lg" variant="ghost" aria-label="open menu"
          onClick={toggleColorMode} children={<FiSun />}
        />
        <Flex alignItems={'center'}>
          <MenuRoot>
            <MenuTrigger asChild>
              <Box
                as="button"
                py={2}
                transition="all 0.3s"
                _focus={{ boxShadow: 'none' }}
              >
                <HStack>
                  <Avatar.Root size='sm'>
                    <Avatar.Image src={
                      'https://images.unsplash.com/photo-1619946794135-5bc917a27793?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&s=b616b2c5b373a80ffc9636ba24f7a4a9'
                    } />
                  </Avatar.Root>
                  <VStack
                    display={{ base: 'none', md: 'flex' }}
                    alignItems="flex-start"
                    gap="1px"
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
              </Box>
            </MenuTrigger>
            <MenuContent
              bg={useColorModeValue('white', 'gray.900')}
              borderColor={useColorModeValue('gray.200', 'gray.700')}
            >
              <MenuItem value="profile">Profile</MenuItem>
              <MenuItem value="settings">Settings</MenuItem>
              <MenuItem value="billing">Billing</MenuItem>
              <MenuSeparator />
              <MenuItem value="signout">Sign out</MenuItem>
            </MenuContent>
          </MenuRoot>
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
  const { logo, items, children } = props;

  const finalFocusRef = useRef<any>(null);

  const { collapsed, isMobile, sidebarDisclosure } = useContext(LayoutContext);
  const { open, setOpen } = sidebarDisclosure;

  useEffect(() => {
    if (isMobile) {

      return;
    }
    setOpen(false);
  }, [isMobile]);

  const coreContent = <Box
    transition='padding-left 0.3s ease'
    pl={{
      base: 0,
      md: `${collapsed ? SIDEBAR_SIZE_FOLDED_PX : SIDEBAR_SIZE_EXPANDED_PX}px`,
    }}
  >
    <Box
      maxW='1280px'
      p={4}
      mx='auto'
    >
      {children}
    </Box>
  </Box>;

  const onClose = useCallback(() => setOpen(false), [setOpen]);

  return (
    <>
      
      <HeaderNavBar
        logo={logo}
        onOpen={() => setOpen(true)}
        ml={{
          base: 0,
          md: `${collapsed ? SIDEBAR_SIZE_FOLDED_PX : SIDEBAR_SIZE_EXPANDED_PX}px`,
        }}
      />

      <LogoEnvironmentContext.Provider value='sidebar'>
        <SidebarContent logo={logo} items={items} collapsed={collapsed} display={{ base: 'none', md: 'block' }} />
      </LogoEnvironmentContext.Provider>

      <LogoEnvironmentContext.Provider value='menu'>
        <DrawerRoot
          placement="start"
          size="xs"
          initialFocusEl={() => finalFocusRef.current}
          open={open}
          onOpenChange={(e) => setOpen(e.open)}
        >
          <DrawerBackdrop onClick={onClose} />
          <DrawerContent background="transparent" boxShadow="none" onClick={onClose}>
            <SidebarContent logo={logo} items={items} onClose={onClose} mobile />
          </DrawerContent>
        </DrawerRoot>
      </LogoEnvironmentContext.Provider>


      {coreContent}

    </>
  );
};

export default SidebarWithHeader;