import { LanguageResource, compileLanguageResource } from './lang-model';

export const langOrder = Object.freeze(['en', 'ja', 'zh']);
export const langRes: LanguageResource = {
  meta: {
    question: {
      type: {
        choice: ['Choice', '選択', '选择'],
        blank: ['Blank', '空欄', '填空'],
        text: ['Text', 'テキスト', '文本'],
      },
    },
    lang: {
      en: 'English',
      ja: '日本語',
      zh: '简体中文',
    },
  },

  common: {
    select: {
      default: ['<Select>', '選択してください', '请选择'],
    },
    btn: {
      add: ['Add', '追加', '添加'],
      edit: ['Edit', '編集', '编辑'],
      delete: ['Delete', '削除', '删除'],
      view: ['View', '表示', '查看'],
      preview: ['Preview', 'プレビュー', '预览'],
      close: ['Close', '閉じる', '关闭'],
      ok: ['OK', 'OK', '确定'],
      continue: ['Continue', '続ける', '继续'],
      confirm: ['Confirm', '確認', '确认'],
      select: ['Select', '選択', '选择'],
      cancel: ['Cancel', 'キャンセル', '取消'],
      start: ['Start', '開始', '开始'],
      stop: ['Stop', '停止', '停止'],
      save: ['Save', '保存', '保存'],
      load: ['Load', '読み込む', '加载'],
      discard: ['Discard', '破棄', '放弃'],
      dismiss: ['Dismiss', '閉じる', '关闭'],
    },
    dialog: {
      title: {
        normal: ['Dialog', 'ダイアログ', '对话框'],
        alert: ['Alert', '警告', '警告'],
        'alert-confirm': ['Alert', '警告', '警告'],
        'ok-cancel': ['Confirmation', '確認', '确认'],
        'load-discard': ['Confirmation', '確認', '确认'],
        'save-discard': ['Confirmation', '確認', '确认'],
      }
    },
    notify: {
      success: {
        header: ['Success', '成功', '成功'],
        desc: ['Operation Successful.', '操作が成功しました。', '操作成功。'],
      },
      error: {
        header: ['Error', 'エラー', '错误'],
        desc: ['An error occurred during operation.', '操作中にエラーが発生しました。', '操作过程中发生错误。'],
      },
    }
  },

  modal: {
    startQuiz: {
      header: ['Starting New Quiz', '新規クイズを開始', '开始新测验'],
      btn: {
        startRandom: ['Start a random quiz', 'ランダムクイズを開始', '开始随机测验'],
      },
      tab: {
        paper: ['Papers', '試験用紙', '试卷'],
        tag: ['Tags', 'タグ', '标签'],
        category: ['Categories', 'カテゴリー', '分类'],
      }
    },
    questionPreview: {
      header: ['Question Preview', '問題プレビュー', '问题预览'],
    },
    questionSelect: {
      header: ['Question Select', '問題選択', '选择问题'],
      btn: {
        addFirst: ['Add First', '最初に追加', '添加到开头']
      }
    },
    tagSelect: {
      header: ['Select Tag', 'タグを選択', '选择标签'],
    }
  },

  page: {
    edit: {
      toast: {
        dataLoaded: {
          title: ['Loaded', '読み込み完了', '已加载'],
          desc: [
            'Data loaded from local cache.',
            'ローカルキャッシュからデータを読み込みました。',
            '已从本地缓存加载数据。'
          ],
        },
      },

      title: ['Title', 'タイトル', '标题'],
      type: ['Type', '種類', '类型'],
      tags: ['Tags', 'タグ', '标签'],
      content: ['Content', '内容', '内容'],
      solution: ['Solution', '解答', '解答'],
      categories: ['Categories', 'カテゴリー', '分类'],
      duration: ['Duration', '所要時間', '时长'],
      desc: ['Description', '説明', '说明'],

      nowEditing: [
        'Now Editing: Question #{{questionIndex}}',
        '編集中：問題 #{{questionIndex}}',
        '正在编辑：问题 #{{questionIndex}}'
      ],
      selectQuestions: ['Select Questions', '問題を選択', '选择问题'],

      choice: {
        _: ['Choice', '選択肢', '选项'],
        addTop: ['Add at Top', '先頭に追加', '添加到顶部'],
        multiple: ['Multiple Choices', '複数選択', '多选题'],
      }
    },
    settings: {
      btn: {
        refreshIndices: ['Refresh Search Indices', '検索インデックスを更新', '刷新搜索索引'],
        deleteUnlinked: ['Delete Unlinked Questions', 'リンクされていない問題を削除', '删除未链接的问题'],
        importData: ['Import Exported Data', 'エクスポートしたデータをインポート', '导入已导出的数据'],
        exportData: ['Export Data to JSON File', 'JSONファイルにエクスポート', '导出数据到JSON文件'],
      },
      switch: {
        forceRefresh: ['Force Refresh', '全てを更新', '强制更新所有索引'],
      },
      toast: {
        recordsUpdated: [
          '{{count}} records updated.',
          '{{count}} 件の更新をしました。', 
          '已更新 {{count}} 个记录。'
        ],
        recordsDeleted: [
          '{{count}} records deleted.',
          '{{count}} 件の削除をしました。', 
          '已删除 {{count}} 个记录。'
        ],
      },
      selectLanguage: ['Display Language: ', '表示言語：', '显示语言：'],
      autoDetect: ['Auto Detect', '自動検出', '自动检测']
    },
    result: {
      modal: {
        question: {
          header: ['Question Detail', '問題詳細', '问题详情']
        }
      },
      paperName: ['Quiz Paper: {{paperName}}', 'テスト：{{paperName}}', '测验卷：{{paperName}}'],
      times: [
        'Started at {{startTime}}; Total time: {{timeUsed}}',
        '開始時刻：{{startTime}}、所要時間：{{timeUsed}}',
        '开始时间：{{startTime}}、用时：{{timeUsed}}'
      ],
      score: [
        'Score: {{score}} of {{total}} ({{percentage}}%)',
        '得点：{{total}}点中{{score}}点 ({{percentage}}%)',
        '得分：{{total}}分中的{{score}}分 ({{percentage}}%)'
      ],
    }
  },
};

export default compileLanguageResource(langRes, langOrder);