import { Card, Heading, CardBody, Stack, Text, Image, Button, ButtonGroup, CardFooter, Divider, useColorMode, CardProps } from "@chakra-ui/react";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

export type PaperCardProps = Omit<CardProps, 'children'> & {
  imageSrc: string,
  imageAlt?: string,
  title?: ReactNode,
  desc?: ReactNode,
  status?: ReactNode,
  onStart?: () => void,
  onRevise?: () => void,
};

export const PaperCard = (props: PaperCardProps) => {
  const {
    imageSrc,
    imageAlt,
    title,
    desc,
    status,
    onStart,
    onRevise,
    ...cardProps
  } = props;

  const { t } = useTranslation();
  const { colorMode } = useColorMode();

  return <Card maxW='sm' {...cardProps}>
    <CardBody>
      <Image
        src={imageSrc}
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
      <ButtonGroup spacing='2' justifyContent='flex-end'>
        <Button variant='solid' colorScheme='blue' onClick={onStart}>
          {t('card.paper.start')}
        </Button>
        <Button variant='ghost' colorScheme='blue' onClick={onRevise}>
          {t('card.paper.revise')}
        </Button>
      </ButtonGroup>
    </CardFooter>
  </Card>

};