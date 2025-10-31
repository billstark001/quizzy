import { StatPanel } from "@/components/StatPanel";
import { QuizzyWrapped } from "@/data";
import { VStack, Heading, Text, Spinner, Center, Icon, Box, Card, Grid, HStack } from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { FiAlertCircle, FiClock, FiList, FiBarChart2 } from "react-icons/fi";
import { DateTime } from "luxon";


export const StatPage = () => {
  const { sid } = useParams();
  const { data: stat, isLoading } = useQuery({
    queryKey: ['stat', sid],
    queryFn: () => QuizzyWrapped.getStat(sid ?? ''),
  });

  const { t } = useTranslation();

  // Loading state
  if (isLoading) {
    return (
      <VStack h="400px" justifyContent="center" alignItems="center">
        <Spinner size="xl" color="purple.500" />
        <Text color="gray.500">{t('page.stat.loading')}</Text>
      </VStack>
    );
  }

  // Not found state
  if (!stat) {
    return (
      <Center py={16}>
        <VStack gap={4}>
          <Icon as={FiAlertCircle} fontSize="6xl" color="gray.300" />
          <Heading size="md" color="gray.600">{t('page.stat.notFound')}</Heading>
        </VStack>
      </Center>
    );
  }

  const resultCount = stat.results?.length ?? 0;
  const totalQuestions = Object.values(stat.countByTag || {}).reduce((sum, unit) => 
    sum + (unit.correct ?? 0) + (unit.wrong ?? 0) + (unit.noAnswer ?? 0), 0
  );

  return <VStack alignItems='stretch' gap={6}>
    {/* Page Header */}
    <Box>
      <Heading size="lg" mb={2}>{t('page.stat.title')}</Heading>
      <Text color="gray.600">{t('page.stat.subtitle')}</Text>
    </Box>

    {/* Overview Cards */}
    <Box>
      <Heading size="md" mb={4}>{t('page.stat.overview.title')}</Heading>
      <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
        <Card.Root>
          <Card.Body>
            <VStack alignItems="flex-start" gap={2}>
              <HStack>
                <Icon as={FiClock} color="blue.500" />
                <Text fontSize="sm" color="gray.600">{t('page.stat.overview.time')}</Text>
              </HStack>
              <Text fontSize="lg" fontWeight="bold">
                {stat.time ? DateTime.fromMillis(stat.time).toLocaleString(DateTime.DATETIME_MED) : '-'}
              </Text>
            </VStack>
          </Card.Body>
        </Card.Root>

        <Card.Root>
          <Card.Body>
            <VStack alignItems="flex-start" gap={2}>
              <HStack>
                <Icon as={FiBarChart2} color="green.500" />
                <Text fontSize="sm" color="gray.600">{t('page.stat.overview.results')}</Text>
              </HStack>
              <Text fontSize="2xl" fontWeight="bold" color="purple.600">{resultCount}</Text>
            </VStack>
          </Card.Body>
        </Card.Root>

        <Card.Root>
          <Card.Body>
            <VStack alignItems="flex-start" gap={2}>
              <HStack>
                <Icon as={FiList} color="orange.500" />
                <Text fontSize="sm" color="gray.600">{t('page.stat.overview.questions')}</Text>
              </HStack>
              <Text fontSize="2xl" fontWeight="bold" color="purple.600">{totalQuestions}</Text>
            </VStack>
          </Card.Body>
        </Card.Root>
      </Grid>
    </Box>

    {/* Statistics Charts */}
    <StatPanel stat={stat} />
  </VStack>
};

export default StatPage;