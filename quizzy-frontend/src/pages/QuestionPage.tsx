import {
  Button,
  VStack
} from "@chakra-ui/react";
import { useCallback, useState } from "react";
import { QuizzyRaw } from "@/data";
import { Question } from "@quizzy/common/types";
import { SearchResult } from "@quizzy/common/types";
import { useNavigate } from "react-router-dom";
import Sheet, { Column, withSheetRow } from "@/components/Sheet";
import Pagination from "@/components/Pagination";
import { DateTime } from "luxon";
import { useTranslation } from "../../node_modules/react-i18next";
import QuestionPreviewModal from "@/modals/QuestionPreviewModal";
import { useDisclosureWithData } from "@/utils/disclosure";
import { SearchBox } from "@/components/SearchBox";


const fetchSearchResult = async (searchTerm?: string, page?: number): Promise<SearchResult<Question> | undefined> => {
  if (!searchTerm) {
    return undefined;
  }
  try {
    return await QuizzyRaw.findQuestion(searchTerm, 10, page ?? 0);
  } catch {
    return undefined;
  }
};

const EditButton = withSheetRow<Question, { preview?: (item?: Question) => void }>((props) => {
  const { item, preview } = props;
  const { t } = useTranslation();
  const navigate = useNavigate();

  const nav = () => {
    const params = new URLSearchParams({ question: item?.id ?? '' }).toString();
    navigate('/edit?' + params);
  }

  return <>
    <Button onClick={() => preview?.(item)}>
      {t('page.question.preview')}
    </Button>
    <Button onClick={nav}>
      {t('page.question.edit')}
    </Button>
  </>;
});


export const QuestionPage = () => {
  const [searchResultFrozen, setSearchResultFrozen] = useState<SearchResult<Question>>();
  const [currentPage, setCurrentPage] = useState(0);
  const { data: dPreviewQuestion, ...dPreview } = useDisclosureWithData<Question | undefined>(undefined);

  const setPage = useCallback(async (page: number) => {
    setCurrentPage(page);
    const res = await fetchSearchResult(searchResultFrozen?.query, page - 1);
    setSearchResultFrozen(res);
  }, [setCurrentPage, searchResultFrozen, setSearchResultFrozen]);

  return <>
    <VStack alignItems='stretch'>
      <SearchBox
        onFreezeResult={setSearchResultFrozen}
        onSelectItem={dPreview.onOpen}
        fetchSearchResult={fetchSearchResult}
        renderItem={(q) => <>
          {q.title}
          {q.content}
        </>}
      />
      <Sheet data={searchResultFrozen?.result ?? []}>
        <Column field='categories' />
        <Column field='tags' />
        <Column field='type' />
        <Column field='title' />
        <Column field='content' />
        <Column field='lastUpdate' render={(x: number) => DateTime.fromMillis(x || 0).toISO()} />
        <Column>
          <EditButton preview={dPreview.onOpen} />
        </Column>
      </Sheet>
      {searchResultFrozen?.totalPages ? <Pagination
        currentPage={currentPage}
        totalPages={searchResultFrozen?.totalPages ?? 0}
        setPage={setPage}
      /> : undefined}
    </VStack>

    <QuestionPreviewModal {...dPreview} question={dPreviewQuestion} />
  </>;
};
export default QuestionPage;