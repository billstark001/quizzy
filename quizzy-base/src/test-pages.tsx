import { useState } from "react"
import { QuestionDisplay } from "../lib/components/QuestionDisplay"
import { sampleQuestion1, sampleQuestion2 } from "./test-data"
import { Answers } from "#/types";


export const TestPageTestChoice = () => {
  const [answers, setAnswers] = useState<Answers>({
    type: 'choice',
    answer: {}
  });
  return <QuestionDisplay question={sampleQuestion1} 
  totalQuestions={80} currentQuestion={20}
  currentTime={114514} totalTime={1919810}
  answers={answers} setAnswers={setAnswers}
  isResult
  />
}
export const TestPageTestBlank = () => {
  const [answers, setAnswers] = useState<Answers>({
    type: 'blank',
    answer: {}
  });
  return <QuestionDisplay question={sampleQuestion2} 
  totalQuestions={80} currentQuestion={20}
  currentTime={114514} totalTime={1919810}
  answers={answers} setAnswers={setAnswers}
  />
}