import { PaperCard } from "#/components/PaperCard";
import { defaultQuizPaper, QuizPaper } from "#/types";
import { openDialog, withHandler } from "#/utils";
import { promiseWithResolvers } from "#/utils/func";
import { uuidV4B64 } from "#/utils/string";
import { Quizzy } from "@/data";
import { papersAtom } from "@/data/atoms";
import { useAsyncEffect } from "@/utils/react";
import { AddIcon } from "@chakra-ui/icons";
import { Box, Card, CardBody, Flex, HStack, VStack, Wrap } from "@chakra-ui/react";
import { useAtom } from "jotai";
import { useNavigate } from "react-router-dom";

const uploadFile = async () => {
  const { promise, resolve, reject } = promiseWithResolvers<File>();
  const input = document.createElement("input");
  input.type = "file";
  input.oninput = async (e) => {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) {
      reject(new Error("No file selected"));
      return;
    }
    resolve(f);
  };
  input.oncancel = () => reject(new Error('No file selected'));
  window.addEventListener('focus', () => {
    setTimeout(() => {
      if (!input.files?.length) {
        reject(new Error("No file selected"));
      }
    }, 300);
  }, { once: true });
  input.click();
  return await promise;
};

export const PaperSelectionPage = () => {

  const [papers, setPapers] = useAtom(papersAtom);
  const navigate = useNavigate();

  const refresh = async () => {
    const ids = await Quizzy.listQuizPaperIds();
    const paperList: QuizPaper[] = [];
    for (const id of ids) {
      const p = await Quizzy.getQuizPaper(id);
      if (p) {
        paperList.push(p);
      }
    }
    setPapers(paperList);
  };

  useAsyncEffect(refresh, []);

  // start a new quiz
  const onStart = async (pid: string) => {
    const record = await Quizzy.startQuiz(pid);
    const p = new URLSearchParams({
      record: record.id,
      q: '1',
    });
    navigate('/quiz?' + p.toString());
  };
  const onEdit = async (pid: string) => {
    const p = new URLSearchParams({
      paper: pid,
    });
    navigate('/edit?' + p.toString());
  };

  // upload
  const upload = withHandler(async () => {
    const f = await uploadFile();
    const text = await f.text();
    const json = JSON.parse(text);
    await Quizzy.importCompleteQuizPapers(json);
    await refresh();
  });
  const create = withHandler(async () => {
    const p = defaultQuizPaper({ id: uuidV4B64() });
    const [id] = await Quizzy.importQuizPapers(p) ?? [];
    if (!id) {
      throw new Error("No ID");
    }
    const p2 = new URLSearchParams({
      paper: id,
    });
    navigate('/edit?' + p2.toString());
  });
  const onInputChange = () => openDialog({
    options: [
      [false, 'create new'],
      [true, 'upload']
    ]
  }).then(res => res ? upload() : create());

  return <VStack alignItems='stretch' minH='700px'>
    <HStack>
      <Box>Title</Box>
    </HStack>
    <Wrap>
      {papers.map(p => <PaperCard
        key={p.id}
        title={p.name}
        desc={p.desc}
        onStart={() => onStart(p.id)}
        onEdit={() => onEdit(p.id)}
      />)}
      <Card w='sm' cursor='pointer'>
        <CardBody as={Flex} justifyContent='center' alignItems='center'
          transition="background-color, opacity 0.3s ease"
          _hover={{ opacity: '50%' }}
          _active={{ opacity: '80%' }}
        >
          <AddIcon fontSize='6xl' color='gray.500' p={4}
            onClick={onInputChange}
          />
        </CardBody>
      </Card>
    </Wrap>
  </VStack>;
};

export default PaperSelectionPage;