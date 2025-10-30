import { defaultQuizPaper, ExportFormat, QuestionConflict, ConflictResolutionDecision } from "@quizzy/base/types";
import { withHandler } from "@/components/handler";
import { uploadFile, downloadFile } from "@/utils/html";
import { uuidV4B64 } from "@quizzy/base/utils";
import { useNavigate } from "react-router-dom";
import { Quizzy, QuizzyRaw } from ".";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";


export const usePapers = () => {
  
  const { data: value } = useQuery({
    queryKey: ['papers'],
    queryFn: () => Quizzy.listQuizPapers(),
    initialData: [],
  });

  const c = useQueryClient();
  const navigate = useNavigate();
  
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [pendingConflicts, setPendingConflicts] = useState<QuestionConflict[]>([]);
  const [conflictResolver, setConflictResolver] = useState<((decisions: ConflictResolutionDecision[]) => void) | null>(null);

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

  // upload with conflict resolution
  const upload = withHandler(async () => {
    const f = await uploadFile();
    const text = await f.text();
    const json = JSON.parse(text);
    
    await QuizzyRaw.importCompleteQuizPapers([json], {
      onConflict: async (conflicts) => {
        return new Promise<ConflictResolutionDecision[]>((resolve) => {
          setPendingConflicts(conflicts);
          setConflictResolver(() => resolve);
          setShowConflictDialog(true);
        });
      }
    });
    
    await c.invalidateQueries({ queryKey: ['papers'] });
  });
  
  const handleConflictResolution = (decisions: ConflictResolutionDecision[]) => {
    if (conflictResolver) {
      conflictResolver(decisions);
      setConflictResolver(null);
    }
    setShowConflictDialog(false);
    setPendingConflicts([]);
  };
  
  const handleConflictCancel = () => {
    if (conflictResolver) {
      // Return keep-both for all conflicts if user cancels
      const decisions = pendingConflicts.map(c => ({
        questionId: c.imported.id!,
        action: 'keep-both' as const
      }));
      conflictResolver(decisions);
      setConflictResolver(null);
    }
    setShowConflictDialog(false);
    setPendingConflicts([]);
  };
  
  // Export paper
  const exportPaper = async (
    paperId: string,
    format: ExportFormat,
    options: any
  ) => {
    const result = await QuizzyRaw.exportQuizPaper(paperId, {
      format,
      ...options
    });
    
    let blob: Blob;
    let filename: string;
    
    if (format === 'text') {
      blob = new Blob([result.data as string], { type: 'text/markdown' });
      filename = `paper-${paperId}.md`;
    } else {
      blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
      filename = `paper-${paperId}-${format}.json`;
    }
    
    await downloadFile(blob, filename);
  };
  
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
    exportPaper,
    // Conflict resolution dialog state
    showConflictDialog,
    pendingConflicts,
    handleConflictResolution,
    handleConflictCancel,
  };
};

export default usePapers;