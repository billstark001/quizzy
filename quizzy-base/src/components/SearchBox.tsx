import {
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  List,
  ListItem,
  useCallbackRef
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { ChangeEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { debounce, DebounceReturn } from "@/utils/debounce";
import { useAsyncMemo } from "@/utils/react-async";
import { DatabaseIndexed, SearchResult } from "@quizzy/common/types";

interface SearchBoxProps<T extends DatabaseIndexed> {
  onFreezeResult?: (result: SearchResult<T> | undefined) => void;
  onSelectItem?: (item: T) => void;
  fetchSearchResult: (term?: string, page?: number) => Promise<SearchResult<T> | undefined>;
  renderItem: (item: T) => React.ReactNode | undefined;
}

export const SearchBox = <T extends DatabaseIndexed>(props: SearchBoxProps<T>) => {

  // callback refs
  const onFreezeResult = useCallbackRef(props.onFreezeResult);
  const onSelectItem = useCallbackRef(props.onSelectItem);
  const fetchSearchResult = useCallbackRef(props.fetchSearchResult);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSetSearchTerm = useRef<DebounceReturn<typeof setSearchTerm>>(undefined);
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

  const handleSelect = useCallback((item: T) => {
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
                {props.renderItem(item)}
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