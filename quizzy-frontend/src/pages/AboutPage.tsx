import { Box, Heading, Text, VStack, Link, Separator } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { FiGithub, FiBook, FiCode } from "react-icons/fi";

export const AboutPage = () => {
  const { t } = useTranslation();

  return (
    <VStack alignItems="stretch" gap={6} maxW="800px" mx="auto" p={6}>
      <Box>
        <Heading size="xl" mb={4}>{t('page.about.title')}</Heading>
        <Text fontSize="lg" color="gray.600">
          {t('page.about.subtitle')}
        </Text>
      </Box>

      <Separator />

      <Box>
        <Heading size="md" mb={3}>{t('page.about.description.title')}</Heading>
        <Text mb={2}>{t('page.about.description.content')}</Text>
      </Box>

      <Box>
        <Heading size="md" mb={3}>{t('page.about.features.title')}</Heading>
        <VStack alignItems="stretch" gap={2} pl={4}>
          <Text>• {t('page.about.features.item1')}</Text>
          <Text>• {t('page.about.features.item2')}</Text>
          <Text>• {t('page.about.features.item3')}</Text>
          <Text>• {t('page.about.features.item4')}</Text>
          <Text>• {t('page.about.features.item5')}</Text>
        </VStack>
      </Box>

      <Box>
        <Heading size="md" mb={3}>{t('page.about.links.title')}</Heading>
        <VStack alignItems="stretch" gap={3}>
          <Link 
            href="https://github.com/billstark001/quizzy" 
            target="_blank" 
            display="flex" 
            alignItems="center" 
            gap={2}
            color="purple.500"
            _hover={{ color: "purple.600" }}
          >
            <FiGithub /> {t('page.about.links.github')}
          </Link>
          <Link 
            href="https://github.com/billstark001/quizzy/blob/main/README.md" 
            target="_blank" 
            display="flex" 
            alignItems="center" 
            gap={2}
            color="purple.500"
            _hover={{ color: "purple.600" }}
          >
            <FiBook /> {t('page.about.links.documentation')}
          </Link>
          <Link 
            href="https://github.com/billstark001/quizzy/blob/main/LICENSE" 
            target="_blank" 
            display="flex" 
            alignItems="center" 
            gap={2}
            color="purple.500"
            _hover={{ color: "purple.600" }}
          >
            <FiCode /> {t('page.about.links.license')}
          </Link>
        </VStack>
      </Box>

      <Separator />

      <Box>
        <Text fontSize="sm" color="gray.500" textAlign="center">
          {t('page.about.version')} v1.0.0
        </Text>
        <Text fontSize="sm" color="gray.500" textAlign="center" mt={2}>
          {t('page.about.copyright')}
        </Text>
      </Box>
    </VStack>
  );
};

export default AboutPage;
