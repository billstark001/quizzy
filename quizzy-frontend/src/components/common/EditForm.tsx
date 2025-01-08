import { useScreenSize } from "@/utils/responsive";
import {
  Box, BoxProps
  } from "@chakra-ui/react";
import { ReactNode, useRef } from "react";


export const EditFormItem = (props: BoxProps & {
  label?: ReactNode
  labelProps?: BoxProps
}) => {
  const { label, labelProps, className, ...rest } = props;

  const refLabel = useRef<HTMLDivElement>(null);
  const refBox = useRef<HTMLDivElement>(null);

  return <>
    <Box ref={refLabel} {...labelProps} className={
      'ef-label ' + (labelProps?.className || '')
    }>{label}</Box>
    <Box ref={refBox} 
      className={'ef-box ' + (className || '')} 
      {...rest}
    />
  </>;
}

export const EditForm = (props: BoxProps) => {

  const isMobile = useScreenSize() === 'mobile';

  const ref = useRef<HTMLDivElement>(null);

  const { children, sx, ...rest } = props;

  return <Box 
    ref={ref}
    className={isMobile ? 'mobile' : 'default'}
    display={isMobile ? 'flex' : 'grid'}
    gridTemplateColumns='160px 1fr'
    gap={2}
    flexDirection='column'
    alignItems='stretch'
    sx={{
      '& > .ef-label': {

      },
      '&.mobile > .ef-label': {
        fontSize: 'sm',
      },
      '&.mobile > .ef-box': {
        mb: '16px',
      },
      ...sx,
    }}
    {...rest}
  >
    { children }
  </Box>;
};

export default EditForm;