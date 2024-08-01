import { ChoiceQuestion } from "#/types";

export const sampleQuestion1: ChoiceQuestion = {
  id: "c13/u5/17",
  seq: 421,
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
      seq: 1,
      shouldChoose: false,
      content: "Web Workers",
    },
    {
      id: '2009',
      seq: 2,
      shouldChoose: false,
      content: "Server-Sent Events",
    },
    {
      id: '2010',
      seq: 3,
      shouldChoose: true,
      content: "WebRTC",
    },
    {
      id: '2011',
      seq: 4,
      shouldChoose: false,
      content: "WebSocket API",
    },
    {
      id: '2012',
      seq: 5,
      shouldChoose: false,
      content: "Web Storage",
    },
  ],
};
