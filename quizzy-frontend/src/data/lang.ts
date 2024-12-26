import { LanguageResource, compileLanguageResource } from './lang-model';

export const langOrder = Object.freeze(['en', 'ja', 'zh']);

export const langRes: LanguageResource = {

  meta: {
    question: {
      type: {
        choice: ['Choice', '', ''],
        blank: ['Blank', '', ''],
        text: ['Text', '', ''],
      },
    },
  },

  common: {
    select: {
      default: ['<Select>'],
    },
    btn: {
      add: ['Add', '', ''],
      edit: ['Edit', '編集', '编辑'],
      delete: ['Delete', '', ''],
      view: ['View', '', ''],
      preview: ['Preview', '', ''],
      close: ['Close', '', ''],
      ok: ['OK', '', ''],
      continue: ['Continue', '', ''],
      confirm: ['Confirm', '', ''],
      select: ['Select', '', ''],
      cancel: ['Cancel', '', ''],
      start: ['Start', '', ''],
      stop: ['Stop', '', ''],
      save: ['Save', '', ''],
      load: ['Load', '', ''],
      discard: ['Discard', '', ''],
      dismiss: ['Dismiss', '', ''],
    },
    dialog: {
      title: {
        normal: ['Dialog', '', ''],
        alert: ['Alert', '', ''],
        'alert-confirm': ['Alert', '', ''],
        'ok-cancel': ['Confirmation', '', ''],
        'load-discard': ['Confirmation', '', ''],
        'save-discard': ['Confirmation', '', ''],
      }
    },
    notify: {
      success: {
        header: ['Success', '', ''],
        desc: ['Operation Successful.', '', ''],
      },
      error: {
        header: ['Error', '', ''],
        desc: ['An error occurred during operation.', '', ''],
      },
    }
  },

  component: {
    header: {
      btn: {

      },

    },
    questionDisplay: {

    },
  },

  modal: {
    startQuiz: {
      header: ['Starting New Quiz', '', ''],
      btn: {
        startRandom: ['Start a random quiz', '', ''],
      },
      tab: {
        paper: ['Papers', '', ''],
        tag: ['Tags', '', ''],
        category: ['Categories', '', ''],
      }
    },
    questionPreview: {
      header: ['Question Preview', '', ''],
    },
    questionSelect: {
      header: ['Question Select', '', ''],
      btn: {
        addFirst: ['Add First', '', '']
      }
    },
    tagSelect: {
      header: ['Select Tag', '', ''],
    }
  },

  page: {
    edit: {
      toast: {
        dataLoaded: {
          title: ['Loaded', '', ''],
          desc: [
            'Data loaded from local cache.',
            '',
            '',
          ],
        },
      },

      title: ['Title', '标题', 'タイトル'],
      type: ['Type', '', ''],
      tags: ['Tags', '', ''],
      content: ['Content', '', ''],
      solution: ['Solution', '', ''],
      categories: ['Categories', '', ''],
      duration: ['Duration', '', ''],
      desc: ['Description', '', ''],

      nowEditing: [
        'Now Editing: Question #{{questionIndex}}', 
        '', 
        ''
      ],
      selectQuestions: ['Select Questions', '', ''],

      // question for different types
      choice: {
        _: ['Choice', '', ''],
        addTop: ['Add at Top', '', ''],
        multiple: ['Multiple Choices', '', ''],
      }
    },
    settings: {
      btn: {
        refreshIndices: ['Refresh Search Indices', '', ''],
        deleteUnlinked: ['Delete Unlinked Questions', '', ''],
        importData: ['Import Exported Data', '', ''],
        exportData: ['Export Data to JSON File', '', ''],
      },
      lang: {
        select: {
          en: 'English',
          ja: '日本語',
          zh: '简体中文',
        },
        selectKey: ['Display Language: ', '', ''],
      },
    },
    result: {
      modal: {
        question: {
          header: ['Question Detail', '', '']
        }
      },
      paperName: ['Quiz Paper: {{paperName}}', '', ''],
      times: [
        'Started at {{startTime}}; Total time: {{timeUsed}}', 
        '', 
        '',
      ],
      score: [
        'Score: {{score}} of {{total}} ({{percentage}}%)',
        '',
        '',
      ],
    }
  },

};

export default compileLanguageResource(langRes, langOrder);