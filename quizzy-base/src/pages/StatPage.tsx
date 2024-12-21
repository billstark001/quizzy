import { StatPanel } from "#/components/StatPanel";
import { useAsyncMemo } from "#/utils/react-async";
import { Quizzy } from "@/data";
import { VStack } from "@chakra-ui/react";
import { useParams } from "react-router-dom";


export const StatPage = () => {
  const { sid } = useParams();
  const { data: stat } = useAsyncMemo(async () => {
    const ret = await Quizzy.getStat(sid ?? '');
    return ret || null;
  });

  if (!stat) {
    return <>NO STAT</>;
  }
  return <VStack alignItems='stretch'>
    <StatPanel stat={stat} />
  </VStack>
};

export default StatPage;