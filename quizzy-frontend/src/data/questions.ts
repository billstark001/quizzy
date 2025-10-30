import { ExportFormat } from "@quizzy/base/types";
import { withHandler } from "@/components/handler";
import { uploadFile, downloadFile } from "@/utils/html";
import { Quizzy } from ".";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const useQuestions = () => {
  
  const { data: value } = useQuery({
    queryKey: ['questions'],
    queryFn: () => Quizzy.listQuestions(),
    initialData: [],
  });

  const c = useQueryClient();

  // Import question from JSON
  const importQuestion = withHandler(async () => {
    const f = await uploadFile();
    const text = await f.text();
    const json = JSON.parse(text);
    await Quizzy.importQuestions(json);
    await c.invalidateQueries({ queryKey: ['questions'] });
  });

  // Export question
  const exportQuestion = async (
    questionId: string,
    format: ExportFormat,
    options: any
  ) => {
    const result = await Quizzy.exportQuestion(questionId, {
      format,
      ...options
    });
    
    let blob: Blob;
    let filename: string;
    
    if (format === 'text') {
      blob = new Blob([result.data as string], { type: 'text/markdown' });
      filename = `question-${questionId}.md`;
    } else {
      blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
      filename = `question-${questionId}-${format}.json`;
    }
    
    await downloadFile(blob, filename);
  };

  return {
    value,
    importQuestion,
    exportQuestion,
  };
};

export default useQuestions;
