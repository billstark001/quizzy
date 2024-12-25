import { PaperCard } from "@/components/PaperCard";
import { usePapers } from "@/data/atoms";
import { Button, HStack, VStack, Wrap } from "@chakra-ui/react";

export const PaperSelectionPage = () => {

  const papers = usePapers();

  return <VStack alignItems='stretch' minH='700px'>
    <HStack>
    <Button onClick={papers.create}>create</Button>
    <Button onClick={papers.upload}>upload</Button>
    <Button>random [TODO]</Button>
    </HStack>
    <Wrap>
      {papers.value.map(p => <PaperCard
        key={p.id}
        paper={p}
        onStart={() => papers.start(p.id)}
        onEdit={() => papers.edit(p.id)}
      />)}
    </Wrap>
  </VStack>;
};

export default PaperSelectionPage;