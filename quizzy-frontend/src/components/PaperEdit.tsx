import { QuizPaper } from "@quizzy/base/types";
import { useDisclosureWithData } from "@/utils/disclosure";
import { IoAddOutline } from "react-icons/io5";
import {
  Input, InputProps
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { useEditorContext } from "@/utils/react-patch";
import { Textarea2 } from "./question-edit/QuestionEdit";
import EditForm, { EditFormItem } from "./common/EditForm";
import TagList, { TagButton } from "./common/TagList";
import TagSelectDialog, { TagSelectState } from "./TagSelectDialog";


export const PaperEdit = () => {

  const { value: paper, onChangeImmediate, edit } = useEditorContext<QuizPaper>();

  const { t } = useTranslation();

  // tags

  const { data: editTag, ...dTag } = useDisclosureWithData<TagSelectState>({});

  return <EditForm>
    
    <EditFormItem label={t('page.edit.title')}>
      <Input {...edit('name', { debounce: true })} />
    </EditFormItem>

    <EditFormItem label={t('page.edit.tags')}>
      <TagList tags={paper.tags} 
        onDoubleClick={(_, __, i) => dTag.onOpen({ tagIndex: i })}
      >
        <TagButton onClick={() => dTag.onOpen()} children={<IoAddOutline />} />
      </TagList>
    </EditFormItem>

    <EditFormItem label={t('page.edit.categories')}>
      <TagList tags={paper.categories} 
        onDoubleClick={(_, __, i) => 
          dTag.onOpen({ tagIndex: i, isCategory: true  })}
      >
        <TagButton onClick={() => 
          dTag.onOpen({ isCategory: true })} children={<IoAddOutline />} />
      </TagList>
    </EditFormItem>

    <EditFormItem label={t('page.edit.duration')}>
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
    </EditFormItem>

    <EditFormItem label={t('page.edit.desc')}>
      <Textarea2 {...edit('desc', { debounce: true })} />
    </EditFormItem>


    <TagSelectDialog
      {...dTag} {...editTag}
      object={paper} onChange={onChangeImmediate}
    />
  </EditForm>;

};