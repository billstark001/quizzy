import { HStack, StackProps } from "@chakra-ui/react";

export const PageToolbar = (props: StackProps) => {
  return <HStack
    pos='sticky' top='80px' zIndex={20}
    py='10px'
    background='bg'
    borderBottom='1px solid'
    borderColor='gray.muted'
    {...props}
  ></HStack>;
};

export default PageToolbar;