import { QuizzyController } from "@quizzy/base/types";
import { WithHandlerOptions, withHandlerRaw } from "@/utils/react-msg";

const keys: Readonly<{[key in keyof QuizzyController]: undefined}> = Object.freeze({
  // general

  'importData': undefined,
  'exportData': undefined,

  // bookmark types

  'createBookmarkType': undefined,
  'getBookmarkType': undefined,
  'listBookmarkTypes': undefined,
  'updateBookmarkType': undefined,
  'deleteBookmarkType': undefined,

  // bookmarks

  'getBookmark': undefined,
  'updateBookmark': undefined,
  'deleteBookmark': undefined,

  'putBookmarkTIC': undefined,
  'deleteBookmarkTIC': undefined,
  'getBookmarkTIC': undefined,
  'listBookmarks': undefined,
  'clearAllBookmarks': undefined,

  // papers & questions

  'importQuestions': undefined,
  'importQuizPapers': undefined,
  'importCompleteQuizPapers': undefined,

  'getQuizPaper': undefined,
  'getQuizPaperNames': undefined,
  'getQuestion': undefined,
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
  'listQuestionByBookmark': undefined,
  'listQuizPaperByBookmark': undefined,

  // tags

  'getTag': undefined,
  'listTags': undefined,
  'updateTag': undefined,
  'deleteTag': undefined,
  'mergeTags': undefined,
  'splitToNewTag': undefined,
  
  'generateTagHint': undefined,
  'listTagsInPapersAndQuestions': undefined,

  // tag migration
  'isTagMigrationCompleted': undefined,
  'getMigrationStatus': undefined,
  'migrateTagsToIds': undefined,

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

  // version control
  'listVersionConflictRecords': undefined,
  'resolveVersionConflictRecord': undefined,
});

export const toWrapped = (
  controller: QuizzyController, 
  withHandler: typeof withHandlerRaw,
) => {
  const commonOptions: WithHandlerOptions<any, any> = Object.freeze({
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
