import { BlankQuestion, ChoiceQuestion } from "#/types";



export const sampleQuestion1: ChoiceQuestion = {
  id: "c13/u5/17",
  type: 'choice',
  content:
    `次のうちブラウザでビデオ会議やボイスチャットを実現するために必要な主要な仕組みはどれでしょう。

\`code sample\`

\`\`\`javascript
code.block('sample');
\`\`\`

`,
  solution:
    "WebRTC(Web Real-Time Communication)は、ブラウザでリアルタイムコミュニケーションを実現できる仕組みです。\nブラウザ間でビデオチャットやボイスチャットで主に利用される他、P2Pでのファイル転送などにも利用できます。サーバとクライアント間ではなく、ブラウザ間での通信となる点がポイントです。\n\nその他の選択肢については以下のとおりです。\n\nA. JavaScriptをバックグラウンドのスレッドで実行するための仕組みです。\nB. Webサーバからクライアントへの単方向リアルタイムプッシュ通信を行う仕組みです。\nD. Webサーバとクライアント間の双方向通信を実現するAPIです。\nE. ブラウザにデータを保存・利用するAPIです。Web Storageにはセッションストレージとローカルストレージがあります。",
  // category: {
  //   id: 38,
  //   name: "APIの基礎知識",
  // },
  // impl: {
  //   id: 549630,
  //   seq: 1,
  //   answers: [],
  //   correct: null,
  // },
  options: [
    {
      id: '2008',
      shouldChoose: false,
      content: "Web Workers",
    },
    {
      id: '2009',
      shouldChoose: false,
      content: "Server-Sent Events",
    },
    {
      id: '2010',
      shouldChoose: true,
      content: "WebRTC",
    },
    {
      id: '2011',
      shouldChoose: false,
      content: "WebSocket API",
    },
    {
      id: '2012',
      shouldChoose: false,
      content: "Web Storage",
    },
  ],
};

export const sampleQuestion2: BlankQuestion = {
  id: '11111111',
  type: "blank",
  title: "例題1.29「1.1.2 HTMLの書式」",
  content: "レベル1の出題範囲「1.1.2 HTMLの書式」からの出題です。\nHTML文書の内容が日本語で書かれている場合に、`[    ]` に入れるhtml要素のlang属性に指定すべき値を記述しなさい。\n\n`@blank:1`\n\n```\n<!DOCTYPE html>\n<html lang=\"[    ]\">\n```",
  blanks: [
    { id: "1", key: "1", answer: "ja" }
  ],
  solution: "lang属性に指定できるのは、IETF（The Internet Engineering Task Force）の「BCP 47」によって定義されている言語タグで、日本語なら「ja」、アメリカ英語なら「en-US」などと決められています。lang属性の値は空にしておくこともできますが、その場合は言語が不明であることを示していることになります。\n\n言語タグは大文字で書いても小文字で書いてもかまわないものとして定義されています。したがって、「ja」はもちろん「JA」や「Ja」「jA」でも正解となります。"
};
