import { QuizzyEditCache } from "@quizzy/base/db/edit-cache";
import { IDBController } from "@quizzy/base/db/idb";
import toWrapped from "./wrapped-controller";
import { withHandler } from "@/components/handler";
import { WrappedQuizzyEditCache } from "./wrapped-cache";


export const QuizzyRaw = await IDBController.connect();
export const Quizzy = toWrapped(QuizzyRaw, withHandler);

export const QuizzyCacheRaw = await QuizzyEditCache.connect();
export const QuizzyCache = await WrappedQuizzyEditCache.connect();