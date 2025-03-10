import { Box, useToken } from "@chakra-ui/react";
import { IoBookmark, IoBookmarkOutline } from "react-icons/io5";

export type BookmarkDispIconProps = {
  colors?: string[];
};

const createBgColorStyle = (colors: string[], start = 0, end = 100) => {
  if (colors.length === 0) {
    return undefined;
  }
  const oneUnit = (end - start) / colors.length;
  const segments: string[] = [];
  for (let i = 0; i < colors.length; ++i) {
    const startPoint = (start + oneUnit * i).toFixed(2);
    const endPoint = (start + oneUnit * (i + 1)).toFixed(2);
    segments.push(
      `${colors[i]} ${startPoint}%, ${colors[i]} ${endPoint}%`
    );
  }
  return `
linear-gradient(
  to right,
  ${segments.join(',\n')}
);`
}

export const BookmarkDispIcon = (props: BookmarkDispIconProps) => {

  const { colors } = props;

  const colorTokens = useToken('colors', colors ?? []);
  const bg = createBgColorStyle(colorTokens, 25, 75);

  if (!colors?.length) {
    return <Box color='gray.fg'>
      <IoBookmarkOutline />
    </Box>;
  }

  return (
    <Box
      background={bg}
      mask='url(#my-svg)'
      WebkitMask='url(#my-svg)'
      maskRepeat='no-repeat'
      WebkitMaskRepeat='no-repeat'
      maskSize='contain'
      WebkitMaskSize='contain'
      maskPosition='center'
      WebkitMaskPosition='center'
      color='white'
    >
      <svg width="1em" height="1em">
        <defs>
          <mask id="my-svg">
            <IoBookmark />
          </mask>
        </defs>
      </svg>

    </Box>
  );
};


export default BookmarkDispIcon;