import { StatBase, StatUnit, toPercentage } from "@quizzy/base/types"
import { StackProps, VStack, Heading, Box, Grid } from "@chakra-ui/react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer } from 'recharts';
import { useTranslation } from "react-i18next";


type ParsedStatUnit = {
  subject: string;
  correct: number;
  correctAndHasAnswer: number;
};

const _parseStatUnit = (subject: string, unit: StatUnit): ParsedStatUnit => {
  const unitPercentage = toPercentage(unit, true);
  return {
    subject: subject || '<empty>',
    correct: unitPercentage.correct,
    correctAndHasAnswer: unitPercentage.correct + unitPercentage.wrong,
  };
}

const parseStatUnit = (units: Record<string, StatUnit>) => {
  const unitsPercentage = Object.entries(units).map(([k, v]) => _parseStatUnit(k, v));
  return unitsPercentage;
};

const Chart = (props: { units: Record<string, StatUnit>, title?: string }) => {
  const { units, title } = props;
  const parsedUnits = parseStatUnit(units ?? []);
  return (
    <Box>
      {title && <Heading size="sm" mb={3} textAlign="center">{title}</Heading>}
      <ResponsiveContainer width="100%" height={350}>
        <RadarChart data={parsedUnits}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" />
          <PolarRadiusAxis angle={90} domain={[0, 100]} ticks={[0, 60, 100] as any} />
          <Radar name="has answer" dataKey="correctAndHasAnswer" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.4} />
          <Radar name="correct" dataKey="correct" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </Box>
  );
}

export type StatPanelProps = StackProps & {
  stat: StatBase;
};

export const StatPanel = (props: StatPanelProps) => {
  const { stat, ...rest } = props;
  const { t } = useTranslation();

  return <VStack alignItems='stretch' gap={8} {...rest}>
    {/* Tag Statistics */}
    <Box>
      <Heading size="md" mb={4}>{t('page.stat.charts.byTag')}</Heading>
      <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
        <Chart units={stat.countByTag} title={t('page.stat.charts.countByTag')} />
        <Chart units={stat.scoreByTag} title={t('page.stat.charts.scoreByTag')} />
      </Grid>
    </Box>

    {/* Category Statistics */}
    <Box>
      <Heading size="md" mb={4}>{t('page.stat.charts.byCategory')}</Heading>
      <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
        <Chart units={stat.countByCategory} title={t('page.stat.charts.countByCategory')} />
        <Chart units={stat.scoreByCategory} title={t('page.stat.charts.scoreByCategory')} />
      </Grid>
    </Box>
  </VStack>
};