import { QuizzyEditCache, WrappedQuizzyEditCache } from "#/impl/edit-cache";
import { IDBController } from "#/impl/idb";
import toWrapped from "#/impl/wrapped";
import { withHandler } from "#/utils";


export const QuizzyRaw = await IDBController.connect();
export const Quizzy = toWrapped(QuizzyRaw, withHandler);

export const QuizzyCacheRaw = await QuizzyEditCache.connect();
export const QuizzyCache = await WrappedQuizzyEditCache.connect();