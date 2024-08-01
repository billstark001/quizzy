import { ChoiceQuestionPanel } from '#/components/QuestionPanel';
import { sampleQuestion1 } from './test-data';

function App() {
  return <>
    <ChoiceQuestionPanel 
      question={sampleQuestion1} 
      get={(id) => id == '2009'} 
      state='display'
      displaySolution
    />

  </>;
}

export default App
