import { QuizzyController } from "@quizzy/common/types";
import { WithHandlerOptions, withHandlerRaw } from "@/utils/react-msg";

const keys: Readonly<{[key in keyof QuizzyController]: undefined}> = Object.freeze({
  // general

  'importData': undefined,
  'exportData': undefined,

  // papers & questions

  'importQuestions': undefined,
  'importQuizPapers': undefined,
  'importCompleteQuizPapers': undefined,

  'getQuizPaper': undefined,
  'getQuizPaperNames': undefined,
  'getQuestions': undefined,

  'listQuizPapers': undefined,
  'listQuestions': undefined,

  'updateQuestion': undefined,
  'updateQuizPaper': undefined,
  'deleteQuestion': undefined,
  'deleteQuizPaper': undefined,

  'findQuestion': undefined,
  'findQuizPaper': undefined,
  'findQuestionByTags': undefined,
  'findQuizPaperByTags': undefined,

  // tags
  
  'findTags': undefined,
  'listTags': undefined,

  // records

  'importQuizRecords': undefined,
  'getQuizRecord': undefined,

  'listQuizRecords': undefined,

  'startQuiz': undefined,
  'updateQuiz': undefined,
  'deleteQuizRecord': undefined,

  // results

  'importQuizResults': undefined,
  'getQuizResult': undefined,
  'listQuizResults': undefined,
  'deleteQuizResult': undefined,

  // stats

  'generateStats': undefined,
  'listStats': undefined,
  'getStat': undefined,
  'deleteStat': undefined,
});

export const toWrapped = (
  controller: QuizzyController, 
  withHandler: typeof withHandlerRaw,
) => {
  const commonOptions: WithHandlerOptions<any> = Object.freeze({
    async: true,
    cache: false,
    notifySuccess: undefined,
  });

  const ret: QuizzyController = {
    ...Object.fromEntries(
      Object.keys(keys).map(key => [
        key, 
        withHandler(controller[key as keyof QuizzyController].bind(controller), commonOptions),
      ])
    ) as unknown as QuizzyController,
  };

  Object.setPrototypeOf(ret, controller);

  return Object.freeze(ret);
};

export default toWrapped;
