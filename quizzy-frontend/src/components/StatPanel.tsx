import { StatBase, StatUnit, toPercentage } from "@quizzy/common/types"
import { HStack, StackProps, VStack } from "@chakra-ui/react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';


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

const Chart = (props: { units: Record<string, StatUnit> }) => {
  const { units } = props;
  const parsedUnits = parseStatUnit(units ?? []);
  return (
    <RadarChart width={400} height={400} data={parsedUnits}>
      <PolarGrid />
      <PolarAngleAxis dataKey="subject" />
      <PolarRadiusAxis angle={90} domain={[0, 100]} ticks={[0, 60, 100] as any} />
      <Radar name="has answer" dataKey="correctAndHasAnswer" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.4} />
      <Radar name="correct" dataKey="correct" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
      <Legend />
    </RadarChart>
  );
}

export type StatPanelProps = StackProps & {
  stat: StatBase;
};

export const StatPanel = (props: StatPanelProps) => {
  const { stat, ...rest } = props;

  return <VStack alignItems='stretch' {...rest}>
    <HStack justifyContent='center'>
      <Chart units={stat.countByTag} />
      <Chart units={stat.scoreByTag} />
    </HStack>
    <HStack justifyContent='center'>
      <Chart units={stat.countByCategory} />
      <Chart units={stat.scoreByCategory} />
    </HStack>
  </VStack>
};