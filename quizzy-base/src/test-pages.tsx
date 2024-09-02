import { QuestionPage } from "./pages/QuestionPage"
import { sampleQuestion1, sampleQuestion2 } from "./test-data"


export const TestPageTestChoice = () => {
  return <QuestionPage question={sampleQuestion1} 
  totalQuestions={80} currentQuestion={20}
  currentTime={114514} totalTime={1919810}
  />
}
export const TestPageTestBlank = () => {
  return <QuestionPage question={sampleQuestion2} 
  totalQuestions={80} currentQuestion={20}
  currentTime={114514} totalTime={1919810}
  />
}