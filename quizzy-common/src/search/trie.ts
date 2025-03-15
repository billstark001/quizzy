import TrieSearch from "trie-search";

type _K = { key: string, value: string };
const _k = (value: string) => ({ key: value.toLowerCase().trim(), value } satisfies _K);

export type CachedTrieTree = {
  // tree: TrieSearch<_K>;
  root: any;
  size: number;
};

export const buildTrieTree = (keywords: string[]) => {
  const tree = new TrieSearch<_K>('key');
  tree.addAll(keywords.map(_k));
  const root = tree.root;
  return { 
    // tree, 
    root, 
    size: (tree as any).size as number 
  } satisfies CachedTrieTree;
};

type _S = string | string[] | null | undefined;
export const buildTrieTreeIterative = async (next: () => _S | Promise<_S>) => {
  const tree = new TrieSearch<_K>('key');
  let current = await next();
  while (current != null) {
    if (typeof current === 'string' && current) {
      tree.add(_k(current));
    } else if (Array.isArray(current)) {
      tree.addAll(current.map(_k));
    }
    current = await next();
  }
  const root = tree.root;
  return { 
    // tree, 
    root, 
    size: (tree as any).size as number 
  } satisfies CachedTrieTree;
};

export type LoadedTrieTree = {
  tree: TrieSearch<_K>;
  searchFunc: (word: string) => string[];
};

export const loadTrieTree = ({ root, size }: CachedTrieTree) => {
  const tree = new TrieSearch<_K>('key');
  tree.root = root;
  (tree as any).size = size;
  tree.clearCache();
  const searchFunc = (word: string, limit?: number) => {
    const ret = tree.search(word.toLowerCase().trim(), undefined, limit).map(({ value }) => value);
    return ret;
  }
  return { tree, searchFunc } satisfies Readonly<LoadedTrieTree>;
};

export const expandQuery = (trie: LoadedTrieTree, query: string[]) => {
  let expandedQuery = new Set<string>();
  for (const qi of query) {
    expandedQuery.add(qi);
    for (const qj of trie.searchFunc(qi)) {
      expandedQuery.add(qj);
    }
  }
  return expandedQuery;
};