import { QuizPaper } from "@quizzy/common/types";
import { useDisclosureWithData } from "@/utils/disclosure";
import { IoAddOutline } from "react-icons/io5";
import {
  Box, Grid, HStack, IconButton,
  Input, InputProps, Tag, Wrap
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { useEditorContext } from "@/utils/react-patch";
import { Textarea2 } from "./QuestionEdit";
import TagSelectModal, { TagSelectState } from "./TagSelectModal";


export const PaperEdit = () => {

  const { value: paper, onChangeImmediate, edit } = useEditorContext<QuizPaper>();

  const { t } = useTranslation();

  // tags

  const { data: editTag, ...dTag } = useDisclosureWithData<TagSelectState>({});

  return <>
    <Grid templateColumns='160px 1fr' gap={2}>

      {/* title */}
      <Box>{t('page.edit.title')}</Box>
      <Input {...edit('name', { debounce: true })} />
      {/* <EditButton value={editingTitle} setValue={setEditingTitle} /> */}

      {/* tags */}
      <Box>{t('page.edit.tags')}</Box>
      <Wrap>
        {(paper.tags ?? []).map((t, i) => <Tag key={t}
          onDoubleClick={() => dTag.onOpen({ tagIndex: i })}
        ><Box>{t}</Box></Tag>)}

        <IconButton
          onClick={() => dTag.onOpen()}
          aria-label={t('page.edit.addButton')}
          size='xs'
          icon={<IoAddOutline />}
        />
      </Wrap>

      {/* categories */}
      <Box>{t('page.edit.categories')}</Box>
      <Wrap>
        {(paper.categories ?? []).map((t, i) => <Tag key={t}
          onDoubleClick={() => dTag.onOpen({ tagIndex: i, isCategory: true })}
        ><Box>{t}</Box></Tag>)}

        <IconButton
          onClick={() => dTag.onOpen({ isCategory: true })}
          aria-label={t('page.edit.addButton')}
          size='xs'
          icon={<IoAddOutline />}
        />
      </Wrap>

      {/* duration */}
      <Box>{t('page.edit.duration')}</Box>
      <Input {...edit<InputProps, number>('duration', {
        debounce: true,
        get: (x) => String(x / (60 * 1000)),
        set: (x) => Number(x) * 60 * 1000,
      })} />

      {/* content */}
      <Box>{t('page.edit.desc')}</Box>
      <HStack alignItems='flex-end' alignSelf='flex-end'>
        <Textarea2 {...edit('desc', { debounce: true })} />
      </HStack>

    </Grid>

    <TagSelectModal
      {...dTag} {...editTag}
      object={paper} onChange={onChangeImmediate}
    />
  </>;
};