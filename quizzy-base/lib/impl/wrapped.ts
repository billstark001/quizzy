import { QuizzyController } from "#/types";
import { WithHandlerOptions, withHandlerRaw } from "#/utils/react-msg";

const keys: Readonly<{[key in keyof QuizzyController]: undefined}> = Object.freeze({
  'importQuestions': undefined, 
  'importQuizPapers': undefined, 
  'importCompleteQuizPapers': undefined, 
  'getQuizPaper': undefined, 
  'getQuizPaperNames': undefined, 
  'getQuestions': undefined, 
  'listQuizPaperIds': undefined, 
  'listQuestionsIds': undefined, 
  'importQuizRecords': undefined, 
  'getQuizRecord': undefined, 
  'listQuizRecords': undefined, 
  'listQuizRecordIds': undefined, 
  'startQuiz': undefined, 
  'updateQuiz': undefined, 
  'deleteQuizRecord': undefined, 
  'endQuiz': undefined, 
  'importQuizResults': undefined, 
  'getQuizResult': undefined, 
  'listQuizResultIds': undefined, 
  'listQuizResults': undefined, 
  'deleteQuizResult': undefined, 
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

  const ret: QuizzyController = Object.freeze({
    ...Object.fromEntries(
      Object.keys(keys).map(key => [
        key, 
        withHandler(controller[key as keyof QuizzyController].bind(controller), commonOptions),
      ])
    ) as unknown as QuizzyController,
  });

  Object.setPrototypeOf(ret, controller);

  return ret;
};

export default toWrapped;
