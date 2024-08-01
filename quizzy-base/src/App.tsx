import { BlankQuestionPanel, ChoiceQuestionPanel } from '#/components/QuestionPanel';
import { useState } from 'react';
import { sampleQuestion2 } from './test-data';

function App() {

  const [v, sV] = useState('');

  return <>
    <BlankQuestionPanel
      question={sampleQuestion2} 
      state='display'
      displaySolution
      get={() => v}
      set={(_, s) => sV(s)}
    />

  </>;
}

export default App
