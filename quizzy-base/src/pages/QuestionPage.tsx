import {
  Box,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  List,
  ListItem,
  VStack
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { ChangeEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { debounce, DebounceReturn } from "#/utils/debounce";
import { useAsyncMemo } from "@/utils/react";
import { QuizzyRaw } from "@/data";
import { Question } from "#/types";
import { SearchResult } from "#/types/technical";
import { useNavigate } from "react-router-dom";
import Sheet, { Column, withSheetRow } from "#/components/Sheet";
import Pagination from "#/components/Pagination";
import { DateTime } from "luxon";
import { useTranslation } from "react-i18next";
import QuestionPreviewModal from "@/modals/QuestionPreviewModal";
import { useDisclosureWithData } from "#/utils/disclosure";
interface SearchBoxProps {
  onFreezeResult?: (result: SearchResult<Question> | undefined) => void;
  onSelectItem?: (item: Question) => void;
}

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

export const SearchBox = ({ onFreezeResult, onSelectItem }: SearchBoxProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSetSearchTerm = useRef<DebounceReturn<typeof setSearchTerm>>();
  const [isOpen, setIsOpen] = useState(false);
  const [disableBlur, setDisableBlur] = useState(false);

  useEffect(() => {
    debouncedSetSearchTerm.current?.clear();
    debouncedSetSearchTerm.current = debounce(setSearchTerm, 1000, {
      immediate: true,
    });
  }, [setSearchTerm, debouncedSetSearchTerm]);

  const { data: searchResult } = useAsyncMemo(() => fetchSearchResult(searchTerm), [searchTerm]);
  const filteredItems = searchResult?.result ?? [];

  const freezeSearchResult = useCallback(() => {
    setIsOpen(false);
    onFreezeResult?.(searchResult ?? undefined);
  }, [searchResult, onFreezeResult]);

  const handleSearch = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
  }, [setSearchTerm]);

  const handleSelect = useCallback((item: Question) => {
    setDisableBlur(false);
    onSelectItem?.(item);
  }, [onSelectItem, setDisableBlur]);

  const handleKeyPress = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      freezeSearchResult();
    }
  }, [freezeSearchResult]);

  return (
    <Box position="relative" minWidth="300px" onBlur={() => {
      !disableBlur && setIsOpen(false);
    }}>
      <InputGroup>
        <InputLeftElement>
          <SearchIcon color="gray.300" />
        </InputLeftElement>
        <Input
          value={searchTerm}
          onChange={handleSearch}
          onKeyDown={handleKeyPress}
          onBlur={disableBlur ? undefined : freezeSearchResult}
          placeholder="Search..."
          onFocus={() => setIsOpen(true)}
        />
      </InputGroup>

      {isOpen && searchTerm && (
        <List
          position="absolute"
          top="100%"
          left="0"
          right="0"
          mt="2"
          bg="white"
          boxShadow="md"
          borderRadius="md"
          minH='100px'
          maxH="400px"
          overflowY="auto"
          zIndex={1}
          onMouseEnter={() => setDisableBlur(true)}
          onMouseLeave={() => setDisableBlur(false)}
        >
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => (
              <ListItem
                key={index}
                px="4"
                py="2"
                cursor="pointer"
                _hover={{ bg: "gray.100" }}
                onClick={() => handleSelect(item)}
              >
                {item.title}
                {item.content}
              </ListItem>
            ))
          ) : (
            <ListItem px="4" py="2">
              No match
            </ListItem>
          )}
        </List>
      )}
    </Box>
  );
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