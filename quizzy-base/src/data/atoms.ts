import { QuizPaper } from "#/types";
import { atom } from "jotai";


export const papersAtom = atom<QuizPaper[]>([]);