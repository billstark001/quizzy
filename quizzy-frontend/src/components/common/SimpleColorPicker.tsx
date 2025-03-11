import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Input,
  HStack,
  Box,
  Wrap,
  WrapItem,
  useToken,
  useCallbackRef,
  parseColor,
  Color,
} from '@chakra-ui/react';
import { Tooltip } from '../ui/tooltip';
import {
  ColorPickerArea,
  ColorPickerContent,
  ColorPickerControl,
  ColorPickerEyeDropper,
  ColorPickerRoot,
  ColorPickerSliders,
  ColorPickerTrigger,
} from "@/components/ui/color-picker";
import { useDebounced } from '@/utils/debounce';



export interface SimpleColorPickerProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
}

function safeParseColor(color: string) {
  let ret: Color | undefined;
  try {
    ret = parseColor(color);
  } catch {
    ret = undefined;
  }
  return ret;
};

function isValidCSSColor(colorString: string) {
  if (!colorString) return false;

  const tempElement = document.createElement('div');
  tempElement.style.color = '';
  tempElement.style.color = colorString;

  return tempElement.style.color !== '';
}

const SimpleColorPicker: React.FC<SimpleColorPickerProps> = ({
  value,
  onChange: onChangeProp,
  onBlur,
  placeholder = 'Enter color or token...',
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState<string>(value);
  const [displayColor, setDisplayColor] = useState<string>(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const onChange = useCallbackRef((value: string) => {
    try {
      onChangeProp({ target: { value } } as any);
    } catch (e) {
      console.error(e);
    }
  });

  const solidColorTokens = [
    'gray.solid',
    'red.solid',
    'pink.solid',
    'purple.solid',
    'cyan.solid',
    'blue.solid',
    'teal.solid',
    'green.solid',
    'yellow.solid',
    'orange.solid'
  ];

  useEffect(() => {
    setInputValue(value);
    setDisplayColor(value);
  }, [value]);

  // token
  const displayColorIsValid = useMemo(() => isValidCSSColor(displayColor), [displayColor]);
  const [tokenizedDisplayColor] = useToken('colors', [displayColor]);
  const isValidToken = tokenizedDisplayColor !== displayColor || displayColorIsValid;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    commitChange();
    if (onBlur) {
      onBlur(e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitChange();
    }
  };

  const commitChange = () => {
    onChange(inputValue);
    setDisplayColor(inputValue);
  };

  const handleColorSelect = useCallbackRef((colorToken: string) => {
    setInputValue(colorToken);
    onChange(colorToken);
    setDisplayColor(colorToken);
  });

  const handleColorSelectDebounced = useDebounced(
    handleColorSelect, 50, { immediate: true, }
  );

  return (
    <Box>
      <HStack gap={2} mb={3}>
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          flex="1"
        />

        <ColorPickerRoot
          disabled={disabled}
          lazyMount
          unmountOnExit
          defaultValue={safeParseColor(displayColor)}
          onValueChange={({ value }) => handleColorSelectDebounced(value.toString('hex'))}
        >
          <ColorPickerControl>
            <Box
              w="40px"
              h="40px"
              bgColor={tokenizedDisplayColor}
              borderRadius="md"
              border="1px solid"
              borderColor={isValidToken ? "gray.200" : "red.500"}
              opacity={disabled ? 0.5 : 1}
              cursor={disabled ? 'not-allowed' : 'pointer'}
            >
              <ColorPickerTrigger
                opacity='0%'
                cursor={disabled ? 'not-allowed' : 'pointer'}
              />
            </Box>

          </ColorPickerControl>
          <ColorPickerContent zIndex={1600}>
            <ColorPickerArea />
            <HStack>
              <ColorPickerEyeDropper />
              <ColorPickerSliders />
            </HStack>
          </ColorPickerContent>
        </ColorPickerRoot>

      </HStack>

      <Wrap gap={2}>
        {solidColorTokens.map((token) => {
          // Get the color value from the theme
          const tokenPath = token.split('.');
          let tokenValue = undefined;

          for (const part of tokenPath) {
            if (tokenValue && tokenValue[part]) {
              tokenValue = tokenValue[part];
            } else {
              break;
            }
          }

          return (
            <WrapItem key={token}>
              <Tooltip content={token}>
                <Box
                  w="30px"
                  h="30px"
                  bg={typeof tokenValue === 'string' ? tokenValue : token}
                  borderRadius="md"
                  border="1px solid"
                  borderColor="gray.200"
                  cursor={disabled ? 'not-allowed' : 'pointer'}
                  opacity={disabled ? 0.5 : 1}
                  onClick={disabled ? undefined : () => handleColorSelect(token)}
                  _hover={{ transform: 'scale(1.1)' }}
                  transition="transform 0.2s"
                />
              </Tooltip>
            </WrapItem>
          );
        })}
      </Wrap>
    </Box>
  );
};

export default SimpleColorPicker;