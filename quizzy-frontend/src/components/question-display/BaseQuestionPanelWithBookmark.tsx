import BaseQuestionPanel, { BaseQuestionPanelProps } from "./BaseQuestionPanel";
import BookmarkIcon from "../bookmark/BookmarkIcon";

export const BaseQuestionPanelWithBookmark = (
  props: BaseQuestionPanelProps,
) => {
  const { question } = props;
  return <BaseQuestionPanel
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


export default BaseQuestionPanelWithBookmark;