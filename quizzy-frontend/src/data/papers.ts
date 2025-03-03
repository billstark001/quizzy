import { defaultQuizPaper } from "@quizzy/base/types";
import { withHandler } from "@/components/handler";
import { uploadFile } from "@/utils/html";
import { uuidV4B64 } from "@quizzy/base/utils";
import { useNavigate } from "react-router-dom";
import { Quizzy } from ".";
import { useQuery, useQueryClient } from "@tanstack/react-query";


export const usePapers = () => {

  const { data: value } = useQuery({
    queryKey: ['papers'],
    queryFn: () => Quizzy.listQuizPapers(),
    initialData: [],
  });

  const c = useQueryClient();
  const navigate = useNavigate();

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
    await c.invalidateQueries({ queryKey: ['papers'] });
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
};

export default usePapers;