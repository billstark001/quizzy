import { PaperCard } from "#/components/PaperCard";
import { QuizPaper } from "#/types";
import { Quizzy } from "@/data";
import { papersAtom } from "@/data/atoms";
import { AddIcon } from "@chakra-ui/icons";
import { Box, Card, CardBody, Flex, HStack, VStack, Wrap } from "@chakra-ui/react";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";



export const PaperSelectionPage = () => {

  const [papers, setPapers] = useAtom(papersAtom);
  const navigate = useNavigate();

  useEffect(() => void (async () => {
    const ids = await Quizzy.listQuizPaperIds();
    const paperList: QuizPaper[] = [];
    for (const id of ids) {
      const p = await Quizzy.getQuizPaper(id);
      if (p) {
        paperList.push(p);
      }
    }
    setPapers(paperList);
  })().catch(console.error), []);

  // start a new quiz
  const onStart = async (pid: string) => {
    const record = await Quizzy.startQuiz(pid);
    const p = new URLSearchParams({
      record: record.id,
      q: '1',
    });
    navigate('/quiz?' + p.toString());
  };


  return <VStack alignItems='stretch' minH='700px'>
    <HStack>
      <Box>Title</Box>
    </HStack>
    <Wrap>
      {papers.map(p => <PaperCard 
        key={p.id}
        title={p.name}
        desc={p.desc}
        onStart={(() => onStart(p.id))}
      />)}
      <Card w='sm' cursor='pointer'>
        <CardBody as={Flex} justifyContent='center' alignItems='center'
          transition="background-color, opacity 0.3s ease"
          _hover={{ opacity: '50%' }}
          _active={{ opacity: '80%' }}
        >
        <AddIcon fontSize='6xl' color='gray.500' p={4} 
        />
        </CardBody>
      </Card>
    </Wrap>
  </VStack>;
};

export default PaperSelectionPage;