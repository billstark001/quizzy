import { defaultQuizPaper, QuizPaper } from "@quizzy/common/types";
import { withHandler } from "@/components/handler";
import { uploadFile } from "@/utils/html";
import { useAsyncEffect } from "@/utils/react-async";
import { uuidV4B64 } from "@quizzy/common/utils";
import { atom, useAtom } from "jotai";
import { useNavigate } from "react-router-dom";
import { Quizzy } from ".";


export const papersAtom = atom<QuizPaper[]>([]);

export const usePapers = () => {

  const [value, setPapers] = useAtom(papersAtom);
  const navigate = useNavigate();

  const refresh = async () => {
    const paperList = await Quizzy.listQuizPapers();
    setPapers(paperList);
  };

  useAsyncEffect(refresh, []);

  // start a new quiz
  const start = async (paperId: string) => {
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

  const startRandom = async (ids: string[]) => {
    const record = await Quizzy.startQuiz({
      type: 'random-paper',
      papers: Object.fromEntries(ids.map(id => [id, 1])),
    });
    const p = new URLSearchParams({
      record: record.id,
      q: '1',
    });
    navigate('/quiz?' + p.toString());
  };
  
  const edit = async (pid: string) => {
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

  return {
    value,
    navigate,
    start,
    startRandom,
    edit,
    create,
    upload,
  };
}