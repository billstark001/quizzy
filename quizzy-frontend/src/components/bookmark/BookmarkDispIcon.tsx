import { Box, useToken } from "@chakra-ui/react";
import { IoBookmark, IoBookmarkOutline } from "react-icons/io5";

export type BookmarkDispIconProps = {
  colors?: string[];
};

const generateDataUrl = (svgContent: string) => {
  const base64Data = btoa(unescape(encodeURIComponent(svgContent))); // Base64 编码
  const dataUrl = `data:image/svg+xml;base64,${base64Data}`;
  return dataUrl;
};

const IoBookmarkData = `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M400 480a16 16 0 0 1-10.63-4L256 357.41 122.63 476A16 16 0 0 1 96 464V96a64.07 64.07 0 0 1 64-64h192a64.07 64.07 0 0 1 64 64v368a16 16 0 0 1-16 16z"></path></svg>`
const IoBookmarkDataUrl = generateDataUrl(IoBookmarkData);

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
      mask={`url(${IoBookmarkDataUrl})`}
      WebkitMask={`url(${IoBookmarkDataUrl})`}
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