import BookmarkIcon from "../bookmark/BookmarkIcon";
import { QuestionPanelProps, QuestionPanel } from "./QuestionPanel";

export const QuestionPanelWithBookmark = (
  props: QuestionPanelProps,
) => {
  const { question } = props;
  return <QuestionPanel
    {...props}
    bookmark={<BookmarkIcon 
      position='absolute'
      top='8px'
      right='8px'
      borderTopRightRadius='1.2em'
      opacity={0.5}
      _hover={{
        opacity: 0.8,
      }}
      itemId={question.id} isQuestion />}
  />;
};


export default QuestionPanelWithBookmark;