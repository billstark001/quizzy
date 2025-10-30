import { QuizPaper } from "@quizzy/base/types";
import { IoAddOutline } from "react-icons/io5";
import {
  DataList,
  Input, InputProps,
  useBreakpointValue
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { useEditorContext } from "@/utils/react-patch";
import { Textarea2 } from "./question-edit/QuestionEdit";
import { TagButton } from "./common/TagList";
import TagListResolved from "./common/TagListResolved";
import TagSelectDialog, { TagSelectState } from "./TagSelectDialog";
import { useDialog } from "@/utils/chakra";


export const PaperEdit = () => {

  const { value: paper, onChangeImmediate, edit } = useEditorContext<QuizPaper>();

  const { t } = useTranslation();

  // tags
  const dTag = useDialog<TagSelectState, Partial<QuizPaper>>(TagSelectDialog);

  const open = async (tagIndex?: number, isCategory = false) => {
    const result = await dTag.open({
      object: paper,
      tagIndex, isCategory,
    });
    onChangeImmediate(result);
  };

  const o = useBreakpointValue({
    base: 'vertical',
    md: 'horizontal',
  }) as any;

  return <DataList.Root orientation={o}>

    <DataList.Item >
      <DataList.ItemLabel>{t('page.edit.title')}</DataList.ItemLabel>
      <Input {...edit('name', { debounce: true })} />
    </DataList.Item>

    <DataList.Item >
      <DataList.ItemLabel>{t('page.edit.tags')}</DataList.ItemLabel>
      <TagListResolved tagIds={paper.tagIds}
        onDoubleClick={(_, __, i) => open(i)}
      >
        <TagButton onClick={() => open()} children={<IoAddOutline />} />
      </TagListResolved>
    </DataList.Item>

    <DataList.Item >
      <DataList.ItemLabel>{t('page.edit.categories')}</DataList.ItemLabel>
      <TagListResolved tagIds={paper.categoryIds}
        onDoubleClick={(_, __, i) =>
          open(i, true)}
      >
        <TagButton onClick={() =>
          open(undefined, true)} children={<IoAddOutline />} />
      </TagListResolved>
    </DataList.Item>

    <DataList.Item >
      <DataList.ItemLabel>{t('page.edit.duration')}</DataList.ItemLabel>
      <Input {...edit<InputProps, number>('duration', {
        debounce: true,
        get: (x) => {
          return String((x / (60 * 1000)) || 0);
        },
        set: (x) => {
          const t = Number(x) * 60 * 1000;
          if (!t || t < 0) {
            return 0;
          }
          return t;
        },
      })} />
    </DataList.Item>

    <DataList.Item >
      <DataList.ItemLabel>{t('page.edit.desc')}</DataList.ItemLabel>
      <Textarea2 {...edit('desc', { debounce: true })} />
    </DataList.Item>


    <dTag.Root />
  </DataList.Root>;

};