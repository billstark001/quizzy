import { ID } from "types";
import { defaultTag, Tag } from "types/tag";


const ALTERNATIVE_SET_THRESHOLD = 256;

export const normalizeTag = (tag: Tag) => {
  tag.mainName = (tag.mainName ?? '').trim();
  tag.mainNames = tag.mainNames ?? {};
  tag.alternatives = tag.alternatives ?? [];
  tag.alternatives.push(tag.mainName);
  for (const lang in tag.mainNames) {
    if (!tag.mainNames[lang]) {
      delete tag.mainNames[lang];
    } else {
      tag.mainNames[lang] = tag.mainNames[lang].trim();
      tag.alternatives.push(tag.mainNames[lang]);
    }
  }
  tag.alternatives = tag.alternatives.map(x => x.trim());
  if (tag.alternatives.length < ALTERNATIVE_SET_THRESHOLD) {
    tag.alternatives = tag.alternatives.filter((x, i) => x && tag.alternatives.indexOf(x) === i);
  } else {
    const s = new Set(tag.alternatives);
    if (s.has('')) {
      s.delete('');
    }
    tag.alternatives = [...s];
  }
  return tag;
};

export const createMergableTagsFinder = () => {
  // alt -> id / group
  const G: Record<string, ID> = {};
  // id -> group
  // 1 id should belong to only 1 group
  const G2: Record<ID, Set<ID>> = {};
  const sets: Set<ID>[] = [];

  const mergeIdToGroup = (id: ID, gid: ID) => {
    if (!G2[gid]) {
      // create a new group with header: gid
      const s = new Set<ID>();
      sets.push(s);
      s.add(gid);
      s.add(id);
      G2[gid] = s;
      G2[id] = s;
    }
    // else add to existent group
    G2[id] = G2[gid];
    G2[id].add(id);
    return G2[gid];
  };

  const onNextTag = (t: Tag) =>  {
    const { id } = t;
    for (const alt of t.alternatives) {
      // if the group of G[alt] exists, merge it
      if (G[alt]) {
        mergeIdToGroup(id, G[alt]);
      } else {
        G[alt] = id;
      }
    }
  };

  const getResult = () => sets.map((set) => [...set]);

  return {
    onNextTag, 
    mergeIdToGroup,
    getResult, 
    G,
    G2, 
    sets,
  } as const;
};

export const mergeTags = (tags: Tag[], updateTime: number): [Tag, Tag[]] => {
  if (tags.length === 0) {
    return [defaultTag(), []];
  }
  if (tags.length === 1) {
    return [tags[0], []];
  }
  const [mainTag, ...others] = tags;
  // const isMainTagCategory = mainTag.type === 'category';
  const _n = {...mainTag.mainNames};

  for (const tag of others.reverse()) {
    // if (isMainTagCategory !== (tag.type === "category")) {
    //   continue;
    // }
    // merge main names and alternatives
    Object.assign(mainTag.mainNames, tag.mainNames);
    mainTag.alternatives.push(...tag.alternatives);

    // update db records
    tag.deleted = true;
    tag.lastUpdate = updateTime;
  }
  Object.assign(mainTag.mainNames, _n);
  mainTag.lastUpdate = updateTime;
  normalizeTag(mainTag);
  return [mainTag, others];
};

/**
 * dst -> dst - src
 * @param dst 
 * @param src 
 */
export const diffTags = (dst: Tag, src: Tag, updateTime: number): [Tag, Tag] => {
  normalizeTag(src);
  const s = new Set(...src.alternatives);
  dst.alternatives = dst.alternatives.filter(alt => !s.has(alt));
  normalizeTag(dst);
  src.lastUpdate = updateTime;
  dst.lastUpdate = updateTime;
  return [dst, src];
};