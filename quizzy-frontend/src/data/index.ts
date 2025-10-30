import { QuizzyEditCache } from "@quizzy/base/db/edit-cache";
import { IDBController } from "@quizzy/base/db/idb";
import toWrapped from "./wrapped-controller";
import { withHandler } from "@/components/handler";
import { WrappedQuizzyEditCache } from "./wrapped-cache";


export const Quizzy = await IDBController.connect('Quizzy');
export const QuizzyWrapped = toWrapped(Quizzy, withHandler);

export const QuizzyCacheRaw = await QuizzyEditCache.connect();
export const QuizzyCacheWrapped = await WrappedQuizzyEditCache.connect();