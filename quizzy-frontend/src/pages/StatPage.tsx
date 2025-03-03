import { StatPanel } from "@/components/StatPanel";
import { Quizzy } from "@/data";
import { VStack } from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";


export const StatPage = () => {
  const { sid } = useParams();
  const { data: stat } = useQuery({
    queryKey: ['stat', sid],
    queryFn: () => Quizzy.getStat(sid ?? ''),
  });

  if (!stat) {
    return <>NO STAT</>;
  }
  return <VStack alignItems='stretch'>
    <StatPanel stat={stat} />
  </VStack>
};

export default StatPage;