import { Card, Heading, CardBody, Stack, Text, Image, Button, ButtonGroup, CardFooter, Divider, useColorMode, CardProps, Box, Wrap } from "@chakra-ui/react";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

export type PaperCardProps = Omit<CardProps, 'children'> & {
  imageSrc?: string,
  imageAlt?: string,
  title?: ReactNode,
  desc?: ReactNode,
  status?: ReactNode,
  onStart?: () => void,
  onRevise?: () => void,
  onEdit?: () => void,
};

const DEFAULT_IMG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAACWCAYAAADwkd5lAAAALElEQVR4nO3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAAAAAAAAAAAAAAAAAPwZV4AAAcb7wVwAAAAASUVORK5CYII=';

export const PaperCard = (props: PaperCardProps) => {
  const {
    imageSrc,
    imageAlt,
    title,
    desc,
    status,
    onStart,
    onRevise,
    onEdit,
    ...cardProps
  } = props;

  const { t } = useTranslation();
  const { colorMode } = useColorMode();

  return <Card w='sm' {...cardProps}>
    <CardBody>
      <Image
        src={imageSrc ?? DEFAULT_IMG}
        alt={imageAlt}
        aspectRatio={16 / 9}
        backgroundColor={colorMode === "dark" ? "gray.600" : 'gray.200'}
        borderRadius='lg'
      />
      <Stack mt='6' spacing='3'>
        <Heading size='md'>
          {title}
        </Heading>
        <Text>
          {desc}
        </Text>
        <Text color='blue.600' fontSize='md'>
          {status}
        </Text>
      </Stack>
    </CardBody>
    <Divider />
    <CardFooter>
      <ButtonGroup as={Wrap} spacing='2' justifyContent='flex-end'>
        <Button variant='solid' colorScheme='blue' onClick={onStart}>
          {t('card.paper.start')}
        </Button>
        <Button variant='ghost' colorScheme='blue' onClick={onRevise}>
          {t('card.paper.revise')}
        </Button>
        <Button variant='ghost' colorScheme='blue' onClick={onEdit}>
          {t('card.paper.edit')}
        </Button>
      </ButtonGroup>
    </CardFooter>
  </Card>

};