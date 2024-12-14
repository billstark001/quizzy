import { PaperCard } from "#/components/PaperCard";
import { defaultQuizPaper, QuizPaper } from "#/types";
import { withHandler } from "#/utils";
import { uploadFile } from "#/utils/html";
import { uuidV4B64 } from "#/utils/string";
import { Quizzy } from "@/data";
import { papersAtom } from "@/data/atoms";
import { useAsyncEffect } from "@/utils/react";
import { Button, HStack, VStack, Wrap } from "@chakra-ui/react";
import { useAtom } from "jotai";
import { useNavigate } from "react-router-dom";

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
  const onStart = async (paperId: string) => {
    const record = await Quizzy.startQuiz({
      type: 'paper',
      paperId,
    });
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
  

  return <VStack alignItems='stretch' minH='700px'>
    <HStack>
    <Button onClick={create}>create</Button>
    <Button onClick={upload}>upload</Button>
    <Button>random [TODO]</Button>
    </HStack>
    <Wrap>
      {papers.map(p => <PaperCard
        key={p.id}
        title={p.name}
        desc={p.desc}
        onStart={() => onStart(p.id)}
        onEdit={() => onEdit(p.id)}
      />)}
    </Wrap>
  </VStack>;
};

export default PaperSelectionPage;