import { ID } from "./technical";
import { CompleteQuizPaper, CompleteQuizPaperDraft, CompleteQuestion, CompleteQuestionDraft } from "./quiz-paper";
import { Question } from "./question";
import { QuizPaper } from "./quiz-paper";
import { Tag } from "./tag";

/**
 * Export format options
 */
export type ExportFormat = 'separate' | 'complete' | 'text';

/**
 * Options for exporting papers/questions
 */
export type ExportOptions = {
  /**
   * Export format:
   * - 'separate': Export as separate arrays (paper, questions, tags)
   * - 'complete': Export as single CompleteQuizPaper/CompleteQuestion object
   * - 'text': Export as human-readable text (frontend only)
   */
  format: ExportFormat;
  
  /**
   * For 'separate' format: whether to keep entity IDs
   * Default: true
   */
  keepIds?: boolean;
  
  /**
   * For 'separate' format: whether to remove search and database indices
   * Default: false (keep indices)
   */
  removeIndices?: boolean;
  
  /**
   * For 'complete' format: whether to keep entity IDs
   * Default: false (remove for portability)
   */
  keepIdsInComplete?: boolean;
};

/**
 * Result of exporting a quiz paper in 'separate' format
 */
export type SeparateExportResult = {
  paper: QuizPaper;
  questions: Question[];
  tags: Tag[];
};

/**
 * Result of exporting a question in 'separate' format
 */
export type SeparateQuestionExportResult = {
  question: Question;
  tags: Tag[];
};

/**
 * Union type for all export results
 */
export type PaperExportResult = 
  | { format: 'separate'; data: SeparateExportResult }
  | { format: 'complete'; data: CompleteQuizPaper | CompleteQuizPaperDraft };

export type QuestionExportResult = 
  | { format: 'separate'; data: SeparateQuestionExportResult }
  | { format: 'complete'; data: CompleteQuestion | CompleteQuestionDraft };
