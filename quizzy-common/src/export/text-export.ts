import { Question, QuizPaper, Tag, ID } from "../types";

/**
 * Convert a question to markdown text format
 */
export async function questionToText(
  question: Question,
  getTagById: (id: ID) => Promise<Tag | undefined>,
  index: number = 1
): Promise<string> {
  let text = `## Question ${index}\n\n`;
  
  if (question.name) {
    text += `**ID:** ${question.name}\n`;
  }
  
  // Get tag names
  const tags: string[] = [];
  const categories: string[] = [];
  
  if (question.tagIds) {
    for (const tid of question.tagIds) {
      const tag = await getTagById(tid);
      if (tag) {
        tags.push(tag.mainName);
      }
    }
  }
  
  if (question.categoryIds) {
    for (const tid of question.categoryIds) {
      const tag = await getTagById(tid);
      if (tag) {
        categories.push(tag.mainName);
      }
    }
  }
  
  if (tags.length > 0) {
    text += `**Tags:** ${tags.join(', ')}\n`;
  }
  
  if (categories.length > 0) {
    text += `**Categories:** ${categories.join(', ')}\n`;
  }
  
  text += `\n`;
  
  if (question.title) {
    text += `### ${question.title}\n\n`;
  }
  
  text += `${question.content}\n\n`;
  
  // Add type-specific content
  if (question.type === 'choice') {
    const choiceQ = question as any;
    text += `**Type:** ${choiceQ.multiple ? 'Multiple Choice' : 'Single Choice'}\n\n`;
    text += `**Options:**\n`;
    choiceQ.options?.forEach((opt: any, idx: number) => {
      const marker = opt.shouldChoose ? '✓' : ' ';
      text += `${idx + 1}. [${marker}] ${opt.content}\n`;
    });
    text += `\n`;
  } else if (question.type === 'blank') {
    const blankQ = question as any;
    text += `**Type:** Fill in the Blank\n\n`;
    text += `**Blanks:**\n`;
    blankQ.blanks?.forEach((blank: any) => {
      text += `- ${blank.key}: ${blank.answer || '(no answer provided)'}`;
      if (blank.answerIsRegExp) {
        text += ` (regex pattern)`;
      }
      text += `\n`;
    });
    text += `\n`;
  } else if (question.type === 'text') {
    const textQ = question as any;
    text += `**Type:** Free Text\n\n`;
    if (textQ.answer) {
      text += `**Expected Answer:**\n${textQ.answer}\n\n`;
    }
  }
  
  if (question.solution) {
    text += `**Solution:**\n${question.solution}\n\n`;
  }
  
  return text;
}

/**
 * Convert a quiz paper to markdown text format
 */
export async function paperToText(
  paper: QuizPaper,
  questions: Question[],
  getTagById: (id: ID) => Promise<Tag | undefined>
): Promise<string> {
  // Get tag names for display
  const paperTags: string[] = [];
  const paperCategories: string[] = [];
  
  if (paper.tagIds) {
    for (const tid of paper.tagIds) {
      const tag = await getTagById(tid);
      if (tag) {
        paperTags.push(tag.mainName);
      }
    }
  }
  
  if (paper.categoryIds) {
    for (const tid of paper.categoryIds) {
      const tag = await getTagById(tid);
      if (tag) {
        paperCategories.push(tag.mainName);
      }
    }
  }
  
  let text = `# ${paper.name}\n\n`;
  
  if (paper.desc) {
    text += `${paper.desc}\n\n`;
  }
  
  if (paperTags.length > 0) {
    text += `**Tags:** ${paperTags.join(', ')}\n`;
  }
  
  if (paperCategories.length > 0) {
    text += `**Categories:** ${paperCategories.join(', ')}\n`;
  }
  
  if (paper.duration) {
    const minutes = Math.floor(paper.duration / 60000);
    text += `**Duration:** ${minutes} minutes\n`;
  }
  
  text += `\n---\n\n`;
  
  // Add each question
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    text += await questionToText(q, getTagById, i + 1);
    text += `\n---\n\n`;
  }
  
  return text;
}
