import {
  Box,
  Input,
  List,
  useCallbackRef
} from "@chakra-ui/react";
import { IoSearch } from "react-icons/io5";
import { ChangeEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { debounce, DebounceReturn } from "@/utils/debounce";
import { DatabaseIndexed, SearchResult } from "@quizzy/base/types";
import { useQuery } from "@tanstack/react-query";
import { useColorMode } from "./ui/color-mode";
import { InputGroup } from "./ui/input-group";

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
  const [open, setOpen] = useState(false);
  const [disableBlur, setDisableBlur] = useState(false);

  useEffect(() => {
    debouncedSetSearchTerm.current?.clear();
    debouncedSetSearchTerm.current = debounce(setSearchTerm, 1000, {
      immediate: true,
    });
  }, [setSearchTerm, debouncedSetSearchTerm]);

  const { data: searchResult } = useQuery({
    queryKey: ['search-result', searchTerm],
    queryFn: () => fetchSearchResult(searchTerm)?.then(x => x ?? null) ?? null,
  })

  const filteredItems = searchResult?.result ?? [];

  const freezeSearchResult = useCallback(() => {
    setOpen(false);
    onFreezeResult?.(searchResult ?? undefined);
  }, [searchResult, onFreezeResult]);

  const handleSearch = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setOpen(true);
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

  const isDark = useColorMode().colorMode === 'dark';

  return (
    <Box position="relative" minWidth="300px" onBlur={() => {
      !disableBlur && setOpen(false);
    }}>
      <InputGroup
        startElement={<IoSearch color="lightgray" />}
      >
        <Input
          value={searchTerm}
          onChange={handleSearch}
          onKeyDown={handleKeyPress}
          onBlur={disableBlur ? undefined : freezeSearchResult}
          placeholder="Search..."
          onFocus={() => setOpen(true)}
        />
      </InputGroup>

      {open && searchTerm && (
        <List.Root
          position="absolute"
          top="100%"
          left="0"
          right="0"
          mt="2"
          backgroundColor={isDark ? 'gray.800' : 'white'}
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
              <List.Item
                key={index}
                px="4"
                py="2"
                cursor="pointer"
                _hover={{ bg: "gray.100" }}
                onClick={() => handleSelect(item)}
              >
                {props.renderItem(item)}
              </List.Item>
            ))
          ) : (
            <List.Item px="4" py="2">
              No match
            </List.Item>
          )}
        </List.Root>
      )}
    </Box>
  );
};