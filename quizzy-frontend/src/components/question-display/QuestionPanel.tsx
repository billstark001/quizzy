import { Question } from "@quizzy/base/types";

import { BlankQuestionPanelProps, TextQuestionPanelProps, BlankQuestionPanel } from "./BlankQuestionPanel";
import ChoiceQuestionPanel, { ChoiceQuestionPanelProps } from "./ChoiceQuestionPanel";


export type QuestionPanelProps = BlankQuestionPanelProps | ChoiceQuestionPanelProps | TextQuestionPanelProps;

export const QuestionPanel = (props: QuestionPanelProps) => {
  const question = props.question as Question;
  if (question.type === 'choice') {
    return <ChoiceQuestionPanel {...props as ChoiceQuestionPanelProps} />;
  }
  if (question.type === 'blank') {
    return <BlankQuestionPanel {...props as BlankQuestionPanelProps} />;
  }
  return <>Unsupported</>;
};