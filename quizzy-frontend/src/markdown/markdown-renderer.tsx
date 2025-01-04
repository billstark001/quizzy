import ReactMarkdown, { Options } from "react-markdown";
import remarkGfm from 'remark-gfm';
import ChakraUIRenderer from "./chakra-ui-markdown-renderer";
import { useMemo } from "react";
import remarkHtmlEscape from "./remark-html-escape";

const r = ChakraUIRenderer();

export const Markdown = (props: Readonly<Options>) => {
  const { remarkPlugins, components, ...rest } = props;
  const cachedComponents = useMemo(() => {
    return components ? {
      ...r,
      ...components,
    } : r;
  }, [components]);
  return <ReactMarkdown
    skipHtml={false}
    remarkPlugins={[
      remarkHtmlEscape, 
      remarkGfm, 
      ...(remarkPlugins ?? [])
    ]}
    components={cachedComponents}
    {...rest}
  />;
};


export default Markdown;