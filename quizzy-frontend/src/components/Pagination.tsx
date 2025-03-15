import React, { JSX, useState } from "react";
import {
  Box,
  Button,
  ButtonGroup,
  HStack,
  IconButton,
  NumberInputRoot,
  StackProps,
} from "@chakra-ui/react";
import {
  AiFillStepBackward, AiFillStepForward, AiOutlineCheck,
  AiFillCaretLeft, AiFillCaretRight
} from "react-icons/ai";
import { NumberInputField } from "./ui/number-input";

export type PaginationProps = StackProps & {
  currentPage: number;
  totalPages: number;
  nearPages?: number;
  setPage?: (page: number) => void;
};

export const Pagination: React.FC<PaginationProps> = (props) => {
  const {
    currentPage: currentPageRaw,
    totalPages,
    nearPages: _nearPages,
    setPage,
    ...divProps
  } = props;

  const nearPages = Math.max(_nearPages || 4, 0);
  const [gotoPage, setGotoPage] = useState('');
  let pageOutRange = 0;
  let currentPage = currentPageRaw;
  if (currentPage < 1) {
    currentPage = 1;
    pageOutRange = -1;
  }
  if (currentPage > totalPages) {
    currentPage = totalPages;
    pageOutRange = 1;
  }

  const handlePageChange = (page: number) => {
    if (page < 1) {
      page = 1;
    }
    if (page > totalPages) {
      page = totalPages;
    }
    if (page !== currentPageRaw) {
      setPage?.(page);
    }
  };

  const _btn = (i: number, selected: boolean, key?: number | string) => <Button
    key={key ?? i}
    onClick={() => handlePageChange(i)}
    colorPalette={selected ? "purple" : "gray"}
  >
    {i}
  </Button>

  const renderPageNumbers = () => {
    const startPageRaw = currentPage - nearPages;
    const endPageRaw = currentPage + nearPages;
    const startPageEllipsis = startPageRaw - 1 > 0;
    const endPageEllipsis = totalPages - endPageRaw > 0;

    const startPage = startPageEllipsis ? startPageRaw : 1;
    const endPage = endPageEllipsis ? endPageRaw : totalPages;


    const pages: JSX.Element[] = [];
    if (pageOutRange == -1) {
      pages.push(_btn(currentPageRaw, currentPageRaw == currentPageRaw, 'start_out_range'));
    }
    if (startPageEllipsis) {
      pages.push(_btn(1, currentPageRaw == 1, 'start'));
      pages.push(<Box key='start_ellipsis'>...</Box>);
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(_btn(i, currentPageRaw == i, i - currentPageRaw));
    }
    if (endPageEllipsis) {
      pages.push(<Box key='end_ellipsis'>...</Box>);
      pages.push(_btn(totalPages, currentPageRaw == totalPages, 'end'));
    }
    if (pageOutRange == 1) {
      pages.push(_btn(currentPageRaw, currentPageRaw == currentPageRaw, 'end_out_range'));
    }
    return pages;
  };

  return (
    <ButtonGroup variant='ghost' 
      as={HStack} gap={2} justifyContent='center' {...divProps}
    >
      <IconButton
        aria-label="first"
        children={<AiFillStepBackward />}
        onClick={() => handlePageChange(1)}
        disabled={currentPageRaw <= 1}
      />
      <IconButton
        aria-label="prev"
        children={<AiFillCaretLeft />}
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPageRaw <= 1}
      />
      {renderPageNumbers()}
      <IconButton
        aria-label="next"
        children={<AiFillCaretRight />}
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPageRaw >= totalPages}
      />
      <IconButton
        aria-label="last"
        children={<AiFillStepForward />}
        onClick={() => handlePageChange(totalPages)}
        disabled={currentPageRaw >= totalPages}
      />
      <Box>
        <NumberInputRoot
          minW={16}
          maxW={64}
          min={1}
          max={totalPages}
          value={gotoPage}
          onValueChange={(e) => setGotoPage(e.value)}
        >
          <NumberInputField
            border='1px solid'
            borderColor='gray.400'
            borderRadius={6} />
        </NumberInputRoot>
      </Box>
      <IconButton
        aria-label="goto"
        children={<AiOutlineCheck />}
        onClick={() => {
          const p = Number(gotoPage);
          if (!Number.isNaN(p)) {
            handlePageChange(p);
          }
        }}
      />
    </ButtonGroup>
  );
};

export default Pagination;