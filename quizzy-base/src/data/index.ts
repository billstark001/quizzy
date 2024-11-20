import { IDBController } from "#/impl/idb";
import toWrapped from "#/impl/wrapped";
import { withHandler } from "#/utils";


export const QuizzyRaw = await IDBController.connect();
export const Quizzy = toWrapped(QuizzyRaw, withHandler);