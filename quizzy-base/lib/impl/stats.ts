import { AnswerStatus, Question, QuizResult, StatBase, defaultStatBase, defaultStatUnit, toPercentage } from "#/types";
import { ID } from "#/types/technical";


export const patchStat = (
  stat: StatBase,
  type: 'question' | 'tag' | 'category',
  id: string,
  status: AnswerStatus,
  weight: number,
  addGross?: boolean,
) => {
  const count = type === 'tag'
    ? stat.countByTag : type === 'category'
      ? stat.countByCategory
      : stat.countByQuestion;

  const score = type === 'tag'
    ? stat.scoreByTag : type === 'category'
      ? stat.scoreByCategory
      : stat.scoreByQuestion;

  if (!count[id]) {
    count[id] = defaultStatUnit();
  }
  if (!score[id]) {
    score[id] = defaultStatUnit();
  }

  const statusKey = status === 'no-answer' ? 'noAnswer' : status;
  count[id][statusKey] += 1;
  score[id][statusKey] += weight;

  // gross
  if (addGross ?? type === 'question') {
    stat.grossCount[statusKey] += 1;
    stat.grossScore[statusKey] += weight;
  }

  return stat;
};

export const createStatFromQuizResults = async (
  results: QuizResult[],
  getQuestion: (id: ID) => Promise<Question | undefined>,
) => {

  const stat = defaultStatBase();
  const allTags = new Set<string>();
  const allCategories = new Set<string>();

  for (const result of results) {
    for (const row of result.records) {
      const { id, status, totalScore: weight } = row;
      const question = await getQuestion(id);
      patchStat(stat, 'question', id, status, weight, true);
      for (const tag of question?.tags ?? []) {
        allTags.add(tag);
        patchStat(stat, 'tag', tag, status, weight, false);
      }
      for (const category of question?.categories ?? []) {
        allCategories.add(category);
        patchStat(stat, 'category', category, status, weight, false);
      }
      if (question) {
        stat.countedQuestions.push(id);
      } else {
        stat.ignoredQuestions.push(id);
      }
    }
  }

  stat.allTags.push(...allTags);
  stat.allCategories.push(...allCategories);
  stat.grossPercentage = toPercentage(stat.grossScore);

  return stat;
};