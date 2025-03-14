import {
  useBreakpointValue,
  VStack
} from "@chakra-ui/react";
import { useCallback, useState } from "react";
import { QuizzyRaw } from "@/data";
import { Question } from "@quizzy/base/types";
import { SearchResult } from "@quizzy/base/types";
import Pagination from "@/components/Pagination";
import { SearchBox } from "@/components/SearchBox";
import QuestionCard from "@/components/item-brief/QuestionCard";


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


export const QuestionPage = ({ preview }: { preview?: (q: Question | undefined) => undefined }) => {
  const [searchResultFrozen, setSearchResultFrozen] = useState<SearchResult<Question>>();
  const [currentPage, setCurrentPage] = useState(0);

  const setPage = useCallback(async (page: number) => {
    setCurrentPage(page);
    const res = await fetchSearchResult(searchResultFrozen?.query, page - 1);
    setSearchResultFrozen(res);
  }, [setCurrentPage, searchResultFrozen, setSearchResultFrozen]);

  const nearPages = useBreakpointValue({
    base: 3,
    md: 5,
  });

  return <>
    <VStack alignItems='stretch'>
      <SearchBox
        onFreezeResult={setSearchResultFrozen}
        onSelectItem={preview}
        fetchSearchResult={fetchSearchResult}
        renderItem={(q) => <>
          {q.title}
          {q.content}
        </>}
      />
      {searchResultFrozen?.result?.map((q) => <QuestionCard
        key={q.id}
        question={q}
        preview={preview}
      />)}
      {searchResultFrozen?.totalPages ? <Pagination
        nearPages={nearPages}
        currentPage={currentPage + 1}
        totalPages={searchResultFrozen?.totalPages ?? 0}
        setPage={setPage}
      /> : undefined}
    </VStack>

  </>;
};
export default QuestionPage;