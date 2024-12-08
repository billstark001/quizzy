import {
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  List,
  ListItem
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { debounce, DebounceReturn } from "#/utils/debounce";
import { useAsyncMemo } from "@/utils/react";
import { QuizzyRaw } from "@/data";
import { Question } from "#/types";
import { SearchResult } from "#/types/technical";
import { useNavigate } from "react-router-dom";

const SearchBox = () => {

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSetSearchTerm = useRef<DebounceReturn<typeof setSearchTerm>>();
  useEffect(() => {
    debouncedSetSearchTerm.current?.clear();
    debouncedSetSearchTerm.current = debounce(setSearchTerm, 1000, {
      immediate: true,
    });
  }, [setSearchTerm]);

  const { data: searchResult } = useAsyncMemo(async (): Promise<SearchResult<Question>> => {
    if (!searchTerm) {
      return { keywords: [], result: [], totalPages: 0 };
    }
    try {
      return await QuizzyRaw.findQuestion(searchTerm, 10);
    } catch {
      return { keywords: [], result: [], totalPages: 0 };
    }
  }, [searchTerm]);

  const filteredItems = searchResult?.result ?? [];

  const [isOpen, setIsOpen] = useState(false);
  const disableBlur = useRef(false);

  const navigate = useNavigate();

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
  };

  const handleSelect = (item: Question) => {
    disableBlur.current = false;
    setIsOpen(false);
    navigate(`/edit?question=${escape(item.id)}`)
  };

  return (
    <Box position="relative" width="300px" onBlur={() => {
      !disableBlur.current && setIsOpen(false);
    }}>
      <InputGroup>
        <InputLeftElement>
          <SearchIcon color="gray.300" />
        </InputLeftElement>
        <Input
          value={searchTerm}
          onChange={handleSearch}
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
          maxH="200px"
          overflowY="auto"
          zIndex={1}
          onMouseEnter={() => disableBlur.current = true}
          onMouseLeave={() => disableBlur.current = false}
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

export const QuestionPage = () => {

  return <>
    <SearchBox />
  </>;
};

export default QuestionPage;