import type { Root, RootContent, Parent, Node } from 'mdast';
import type { Plugin, Processor } from 'unified';
import { CompileContext, Token } from 'mdast-util-from-markdown';


function onexitcharacterreferencevalue(this: CompileContext, token: Token) {
  const data = this.sliceSerialize(token);
  const type = this.data.characterReferenceType;
  /** @type {string} */
  let value;
  if (type) {
    const isDecimal = type === "characterReferenceMarkerNumeric";
    value = isDecimal ? `&#${data};` : `&#x${data};`;
    // value = decodeNumericCharacterReference(data, type === "characterReferenceMarkerNumeric" ? 10 : 16);
    this.data.characterReferenceType = undefined;
  } else {
    // const result = decodeNamedCharacterReference(data);
    // value = result;
    value = `&${data};`
  }
  const tail = this.stack[this.stack.length - 1];
  (tail as any).value += value;
}

function remarkHtmlEscape(this: Processor): Plugin<[], Root> {

  const plugin = {
    exit: {
      characterReferenceValue: onexitcharacterreferencevalue,
    }
  };

  const data = this.data() as any;
  const e: any[] = data.fromMarkdownExtensions || (data.fromMarkdownExtensions = [])
  e.push(plugin);


  return ((tree: Root) => {

    const visit = <
      T extends Node = RootContent,
      K extends T['type'] = T['type']
    >(
      node: Parent,
      type: K,
      visitor: (node: T, index: number, parent: Parent) => void
    ): void => {
      if (!node?.children) return;

      let index = 0;
      for (const child of node.children) {
        if (child.type === type) {
          visitor(child as T, index, node);
        }
        index++;
      }

      for (const child of node.children) {
        if ('children' in child) {
          visit(child, type, visitor);
        }
      }
    };

    // visit(tree, 'text', (node: Text) => {
    //   node.value = node.value.replace(/&/g, '&amp;');
    // });

    visit(tree, 'html', (node, _, parent: Parent) => {
      if (parent?.type === 'root') {
        node.type = 'paragraph';
        (node as any).children = [{
          type: 'html',
          value: (node as any).value,
        }]
      }
    });

  }) as any;
}

export default remarkHtmlEscape;