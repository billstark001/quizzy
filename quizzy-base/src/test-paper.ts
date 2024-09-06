import { CompleteQuizPaperDraft } from "#/types";



export const p: CompleteQuizPaperDraft = {
  name: "HTML5プロフェッショナル認定試験 レベル1 サンプル問題",
  desc: "HTML5プロフェッショナル認定試験 レベル1のサンプル問題集です。",
  tags: ["HTML5", "レベル1"],
  questions: [
    {
      type: "choice",
      title: "例題1.34「1.1.2 HTMLの書式」",
      content: "レベル1の出題範囲「1.1.2 HTMLの書式」からの出題です。\n文字エンコーディング宣言の記述方法のうち、文法的に正しいものをすべて選びなさい。",
      options: [
        { content: "<meta charset=\"utf-8\">", shouldChoose: true },
        { content: "<meta charset=\"UTF-8\">", shouldChoose: true },
        { content: "<meta charset=\"utf-16\">" },
        { content: "<meta http-equiv=\"content-type\" content=\"text/html; charset=utf-8\">", shouldChoose: true },
        { content: "<meta http-equiv=\"content-type\" content=\"text/html; charset=utf-8\"><meta charset=\"utf-8\">" }
      ],
      solution: "charset属性に指定する値は大文字でも小文字でもかまいませんが、「utf-8」以外は指定できないことになっています。したがって、AとBは正しく、Cは文法エラーとなります。\n\nDの文字エンコーディング宣言は旧式ではあるものの、現在でも文法的に問題のない指定方法です。しかし、Eのように旧式の指定方法とcharset属性を使った新しい指定方法の両方を1つの文書内に含めると文法エラーになります。"
    },
    {
      type: "choice",
      title: "例題1.33「1.1.3 Web関連技術の概要」",
      content: "レベル1の出題範囲「1.1.3 Web関連技術の概要」からの出題です。\nマイクロデータに関する説明のうち、正しいものをすべて選びなさい。",
      options: [
        { content: "マイクロデータ関連の属性は全部で4種類ある" },
        { content: "マイクロデータ関連の属性名はすべて「md」で開始される" },
        { content: "マイクロデータ関連の属性はすべてグローバル属性である", shouldChoose: true },
        { content: "マイクロデータの名前と値のペアのグループは「アイテム」と呼ばれる", shouldChoose: true },
        { content: "マイクロデータの仕様は HTML Living standard 内では定義されていない" }
      ],
      solution: "マイクロデータ関連の属性はすべて、HTML Living standard でグローバル属性として定義されています。その仕様は HTML Living standard 内の「第5章 マイクロデータ」にあります。よって C は正しい説明、E は間違った説明ということになります。\nマイクロデータ関連の属性として定義されているのは、次の5種類です。\n- itemscope\n- itemtype\n- itemprop\n- itemid\n- itemref\nよって A と B は間違いとなります。\nマイクロデータの名前と値のペアのグループは「アイテム（item）」と呼ばれています。マイクロデータ関連の属性名がすべて「item」で開始されているのはそのためです。よって D は正しい説明となります。"
    },
    {
      type: "choice",
      title: "例題1.32「1.1.2 HTMLの書式」",
      content: "レベル1の出題範囲「1.1.2 HTMLの書式」からの出題です。\nHTMLのlink要素に関する記述のうち正しいものをすべて選びなさい。",
      options: [
        { content: "link要素はbody要素内には配置できない" },
        { content: "link要素はrel属性の値によってはbody要素内に配置できる", shouldChoose: true },
        { content: "rel属性の値が「preload」の場合はbody要素内に配置できる", shouldChoose: true },
        { content: "rel属性の値が「prefetch」の場合はbody要素内に配置できる", shouldChoose: true },
        { content: "rel属性の値が「stylesheet」の場合はbody要素内に配置できる", shouldChoose: true }
      ],
      solution: "link要素は、rel属性に指定するキーワードによっては、フレージングコンテンツとしてbody要素内に配置できます。よって A は間違いです。\nbody要素内に配置可能となるキーワードは次の7種類です。\n- dns-prefetch\n- modulepreload\n- pingback\n- preconnect\n- prefetch\n- preload\n- stylesheet\nしたがって B、C、D、E が正解となります。"
    },
    {
      type: "choice",
      title: "例題1.31「1.1.2 HTMLの書式」",
      content: "レベル1の出題範囲「1.1.2 HTMLの書式」からの出題です。\nHTML Living Standard に準拠したHTML文書の先頭に配置可能なDOCTYPEをすべて選びなさい。",
      options: [
        { content: "<!DOCTYPE>" },
        { content: "<!DOCTYPE html>", shouldChoose: true },
        { content: "<!DOCTYPE html SYSTEM \"about:legacy-compat\">", shouldChoose: true },
        { content: "<!DOCTYPE html PUBLIC \"-//W3C//DTD HTML 4.01//EN\">" },
        { content: "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Strict//EN\">" }
      ],
      solution: "HTML Living Standard のDOCTYPEには、「DOCTYPE」と「html」は必ず含める必要があります。したがって、A. は文法的に間違いとなります。なお、「DOCTYPE」と「html」は大文字で書いても小文字で書いてもかまいません。\n\nB. はHTML5以降広く使用されている一般的なDOCTYPEの書式です。これが1つ目の正解となります。\n\nHTML5より前のDOCTYPE宣言は、現在のものよりも長い書式が採用されていました。そのため、古いシステムやツールの中には  のような短い書式を出力できないものがあります。そのような環境において利用可能な書式として用意されているのが C. です。よって、これが2つ目の正解となります。\n\nHTML 5.1 までは、HTML5への移行を促進する目的で HTML 4.01 や XHTML 1.0 のDOCTYPEも配置可能となっていました。しかし、HTML 5.2 以降ではそれらは配置できない仕様となっています。"
    },
    {
      type: "choice",
      title: "例題1.30「1.1.3 Web関連技術の概要」",
      content: "レベル1の出題範囲「1.1.3 Web関連技術の概要」からの出題です。\nカスタムデータ属性の名前をつけるときの制限に関する説明のうち、正しいものをすべて選びなさい。",
      options: [
        { content: "custom- で始めなければならない" },
        { content: "data- で始めなければならない", shouldChoose: true },
        { content: "- のあとに1文字以上の文字が必要", shouldChoose: true },
        { content: "ASCIIのアルファベットの大文字は使用できない", shouldChoose: true },
        { content: "ASCIIのアルファベットの大文字も小文字も使用できる" }
      ],
      solution: "カスタムデータ属性の属性名は、必ず「data-」で始める必要があります。よって B が正しく、A は間違いとなります。\n「data-」の後には、少なくとも1文字以上が必要となります。したがって C の説明は正しいことになります。\nカスタムデータ属性の属性名にはASCIIの大文字アルファベットを含めることはできません。よって D は正しく、E は間違いとなります。ただし、カスタムデータ属性の文法上はそうなっていますが、HTML文書においてはすべての属性名は自動的に小文字に変換した上で処理されるため、大文字が含まれていても処理上の影響はありません。"
    },
    {
      type: "blank",
      title: "例題1.29「1.1.2 HTMLの書式」",
      content: "レベル1の出題範囲「1.1.2 HTMLの書式」からの出題です。\nHTML文書の内容が日本語で書かれている場合に、`[    ]` に入れるhtml要素のlang属性に指定すべき値を記述しなさい。\n\n`@blank:1`\n\n```\n<!DOCTYPE html>\n<html lang=\"[    ]\">\n```",
      blanks: [
        { id: "1", key: "1", answer: "ja" }
      ],
      solution: "lang属性に指定できるのは、IETF（The Internet Engineering Task Force）の「BCP 47」によって定義されている言語タグで、日本語なら「ja」、アメリカ英語なら「en-US」などと決められています。lang属性の値は空にしておくこともできますが、その場合は言語が不明であることを示していることになります。\n\n言語タグは大文字で書いても小文字で書いてもかまわないものとして定義されています。したがって、「ja」はもちろん「JA」や「Ja」「jA」でも正解となります。"
    },
    {
      type: "choice",
      title: "例題1.28「1.1.2 HTMLの書式」",
      content: "レベル1の出題範囲「1.1.2 HTMLの書式」からの出題です。\nmeta要素に指定できない属性を1つ選びなさい。",
      options: [
        { content: "http-equiv" },
        { content: "name" },
        { content: "content" },
        { content: "scheme", shouldChoose: true },
        { content: "charset" }
      ],
      solution: "グローバル属性を除けば、meta要素に指定可能な属性は次の4つのみです。\n\n・http-equiv\n・name\n・content\n・charset\n\nscheme属性は、HTML 4.01 や XHTML 1.0 では指定可能でしたが、HTML5以降では指定できなくなっています。\n\ncharset属性はHTML5で新しく追加された属性で、meta要素で文字コードを指定する際に使用します。とはいえ、HTML5においても HTML 4.01 や XHTML 1.0 と同様にhttp-equiv属性を使って次のように文字コードを示すことも可能です。\n\n<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">\n\nただし、1つのHTML文書内にcharset属性とhttp-equiv属性の両方で文字コードを指定しておくことはできません。指定する場合は、どちらか一方でしか指定できない仕様となっています。"
    },
    {
      type: "choice",
      title: "例題1.27「1.1.2 HTMLの書式」",
      content: "レベル1の出題範囲「1.1.2 HTMLの書式」からの出題です。\nhtml要素のタグの省略に関する説明のうち、正しいものを１つ選びなさい。",
      options: [
        { content: "開始タグのみ省略できる" },
        { content: "終了タグのみ省略できる" },
        { content: "開始タグ・終了タグとも省略できる", shouldChoose: true },
        { content: "開始タグ・終了タグとも省略できない" },
        { content: "動的に生成されるページの場合のみ、開始タグ・終了タグともに省略できる" }
      ],
      solution: "HTMLの要素の中には、「開始タグ・終了タグとも省略できないもの」「開始タグ・終了タグとも省略できるもの」「終了タグのみ省略できるもの」の3種類があります。HTMLの全要素のうち8割以上は「開始タグ・終了タグとも省略できないもの」に該当しますが、html要素・head要素・body要素・colgroup要素・tbody要素は、開始タグ・終了タグともに省略できます。この5種類の要素については、しっかり暗記しておきましょう。\n\nなお、タグの省略は無条件にできるものではなく、どういう場合に省略可能なのかが要素ごとに決められています。たとえばhtml要素であれば、開始タグが省略できるのは「要素内の先頭にあるものがコメントではない場合」、終了タグが省略できるのは「終了タグの直後にコメントがない場合」にのみ限定されています。"
    },
    {
      type: "choice",
      title: "例題1.26「1.1.1 HTTP, HTTPSプロトコル」",
      content: "レベル1の出題範囲「1.1.1 HTTP, HTTPSプロトコル」からの出題です。\nHTTP cookie の説明として間違っているのは次のうちどれか。",
      options: [
        { content: "HTTP cookieによりステートフルなサービスを可能にする。" },
        { content: "HTTP cookieは通信時はHTTPヘッダに含まれる。" },
        { content: "HTTP cookieはクライアントに保存される。" },
        { content: "HTTP cookieに有効期限がないと削除しない限り残り続ける。", shouldChoose: true },
        { content: "HTTP cookieのサイズは4KBである。" }
      ],
      solution: "HTTP cookie(クッキー)は Ajaxと同様 Webページがアプリケーションとして成長できた基本技術の一つです。\n元来HTTPはステートレスなプロトコルですが、クッキーを利用することでショッピングサイトなどのようにステートフルなサービスを可能にします。（Aは正しい）\nクッキーの情報はHTTPヘッダに含んで通信を行うので基本的にJavaScriptでアクセスできますが、設定によりアクセス出来ない場合があります。（Bは正しい)\nクッキーはクライアント（ブラウザ）に保存され、ユーザはブラウザの機能を利用することで履歴の削除などと同時に削除することができます。(Cは正しい)\nクッキーは１つ4KB、１サーバーに20個、トータル300個まで保存できますが、制限があるためHTML5では、Web Storageなど大容量を扱えるAPIも用意されています。(Eは正しい)\nクッキーには有効期限を設定することができ、有効期限を超えると保存されていたクッキーは無効になります。有効期限が指定されていると、有効期限内はブラウザを終了しても保存されていますが、指定されていない場合ブラウザの終了とともに削除されます。（Dは間違っている）\n\nしたがって、HTTP cookie の説明として間違っているのはDです。"
    },
    {
      type: "choice",
      title: "例題1.25「1.1.3 Web関連技術の概要」",
      content: "レベル1の出題範囲「1.1.3 Web関連技術の概要」からの出題です。\nWebサーバーへの脆弱性攻撃の一つで、ブラウザから本来アクセスできないはずのサーバーのファイルにアクセスする攻撃で、別名「../ 攻撃」とも呼ばれるのは次のうちどれか。",
      options: [
        { content: "OSコマンドインジェクション" },
        { content: "SQLインジェクション" },
        { content: "ディレクトリトラバーサル", shouldChoose: true },
        { content: "クロスサイトスクリプティング（XSS）" },
        { content: "HTTPヘッダインジェクション" }
      ],
      solution: "ソフトウェアの脆弱性タイプの一覧は、CWE(Common Weakness Enumeration) として公開されています。\nWebサーバーを開発したら、注意すべき脆弱性攻撃とその対策について調べられるようにしておくことが重要です。\n\nWebサーバーのFORM入力画面を入り口として入力した文字列の検証が不十分なことにより、本来アクセスできないデータにアクセスしたり、データを削除・変更したりする脆弱性攻撃は、CWE-20 Improper Input Validation（不適切な入力確認）として分類されています。\n\n例題にある ../ は一つ上のディレクトリを示す文字列です。../../のように../を繰り返すことで上に上がり、そこから下に目的のディレクトリ名とファイル名を注入して、本来ならアクセスできないファイルに攻撃するので、../攻撃とも呼ばれています。CWE-20の分類の１つCWE-22パストラバーサルとして割り当てられており、ディレクトリトラバーサルとも呼ばれているCが正解です。\n\nAのOSコマンドインジェクションCWE-78もCWE-20の一つで、悪意のあるコマンドを注入してOSのコマンドを実行する攻撃で、不正解です。\n\nBのSQLインジェクションCWE-89もCWE-20の一つで、データベースをアクセスする標準言語SQLに悪意のある文字列を注入してデータアクセスを実行する攻撃で、不正解です。\n\nDのクロスサイトスクリプティングCWE-79もCWE-20の一つで、JavaScriptに悪意のある処理を注入してJavaScriptを実行する攻撃で、不正解です。\n\nEのHTTPヘッダインジェクションは、CWE-113のImproper Neutralization of CRLF Sequences in HTTP Headers ('HTTP Response Splitting')に分類され、HTTPヘッダに悪意のある文字列を注入して罠サイトに誘導したりする攻撃で、不正解です。\n\n../攻撃は、褒められた行為ではありませんが、HTML5 Level 1 に合格したら、つぎは一つ上のLevel 2 を目指すことは良い目標になると思います。"
    },
    {
      type: "choice",
      title: "例題1.24「1.1.1 HTTP, HTTPSプロトコル」",
      content: "レベル1の出題範囲「1.1.1 HTTP, HTTPSプロトコル」からの出題です。\nHTTPヘッダフィールドの内、Webアクセスの高速化を目的に設定できるのは次のうちどれか。3つ選びなさい。",
      options: [
        { content: "Cache-Control", shouldChoose: true },
        { content: "Expires", shouldChoose: true },
        { content: "Last-Modified", shouldChoose: true },
        { content: "Set-Cookie" },
        { content: "User-Agent" }
      ],
      solution: "Aの Cache-Control は General header の1つで、Cache を制御します。更新されていない情報についてキャッシュを利用させることでサーバーの負荷軽減とWebページの表示高速化を期待できます。よって、正解です。\n\nBの Expires は Entity header の1つで、ページの有効期限以前であれば、キャッシュを利用させるので、サーバーの負荷軽減とWebページの表示高速化を期待できます。よって、正解です。\n\nCの Last-Modified は Entity header の1つで、コンテンツが前回アクセス時から更新されていない場合、キャッシュを利用するので、サーバーの負荷軽減とWebページの表示高速化を期待できます。よって、正解です。\n\nDの Set-Cookie は Response header の1つで、設定するとクッキーによりステートレスな HTTP プロトコルのためにステートフルな情報を記憶します。ログイン状態の保持やショッピングカート状態の保持に利用されますが、高速化には寄与しないので不正解です。\n\nEの User-Agent は Request header の1つで、ブラウザの種類やOSの情報が含まれ、さまざまな目的に利用できるが、Webアクセスの高速化切り替えの基準に出来るかもしれませんが、直接高速化に影響しないので、不正解です。\n\nCache-Control などの設定は、apache などWebサーバーで行うのが一般的です。Webサーバーにより設定方法が異なりなりますので利用される環境で効果を測定してみてはいかがでしょうか。"
    },
    {
      type: "choice",
      title: "例題1.23「1.1.1 HTTP, HTTPSプロトコル」",
      content: "レベル1の出題範囲「1.1.1 HTTP, HTTPSプロトコル」からの出題です。\nHTTP/1.1プロトコルのリクエストメソッドの説明として正しくないのは次のうちどれか。",
      options: [
        { content: "HTMLのフォームで指定できるのはGETとPOSTのみである。" },
        { content: "GETでは、リクエストパラメータはURLに含まれるが、POSTではボディに含まれる。" },
        { content: "GETではデータサイズの制限があるが、POSTにはない。" },
        { content: "GETリクエストに対しては、PUTリクエスト付きのレスポンスメッセージが戻る。", shouldChoose: true }
      ],
      solution: "HTTPのメソッドはいくつもありますが、HTMLのform要素で指定できるmethod属性値はGETとPOSTのみです。\nでは、それ以外のPUTやDELETEなどはどのように使用されるのでしょうか。\n\nWebサービスは一般的には、人がブラウザを使用して情報を取得したり、情報の登録・更新を行うインターフェイスを提供しますが、システム同士で通信するインターフェイスも提供できます。PUTやDELETEはシステム同士で通信する場合などの、RESTやSOAPといった技術で使用されます。\n\nREST APIやSOAP APIを提供しているWebサービスには、例えば、クラウド環境提供のサイトがあり、REST APIを利用して、クラウドのサーバーの起動停止やサーバーの複製が可能になります。\n\n人がページを参照する場合、指定したURLのページが見つからなければ、URL中にtypoがないか確認したり、グーグル先生に正しいURLを問い合わせしたりしますが、システム同士の通信ではそうも行かないのでアプリケーションは、適切なメソッドを使用してリクエストを行い、ステータスコードにより正しい処理に分岐する必要があります。\n\nさて、選択肢ですが、それぞれ下記のとおりです。\nAは、その通りなので、不正解です。\nBも、その通りなので、不正解です。ブラウザのURL欄に?kkk=vvv&KKK=VVV のようにKey=Valueが＆で区切られてリクエストパラメータが付いているのはGETリクエストのURLです。\nCも、その通りで、GETは255文字の制限がありますが、POSTは制限がないので、不正解です。\nDは、レスポンスメッセージにリクエストメソッドが含まれるとしていますが、リクエストメソッドは含まれずステータスコードが含まれるので、間違いであり、正解となります。"
    },
    {
      type: "choice",
      title: "例題1.22「1.1.3 Web関連技術の概要」",
      content: "レベル1の出題範囲「1.1.3 Web関連技術の概要」からの出題です。\nAjax と最も関連のない技術は次のうちどれか。",
      options: [
        { content: "JavaScript" },
        { content: "JavaServerPages", shouldChoose: true },
        { content: "jQuery" },
        { content: "JSON" },
        { content: "XMLHttpRequest" }
      ],
      solution: "Ajax は従来のHTMLからの大幅な発展に貢献した技術の一つです。従来はクライアントからハイパーリンクをクリックするなどの対話型のリクエストに応答する形でサーバーがコンテンツを送信していました。そのためその都度ページが遷移していました。\nAjaxの登場で非同期にデータを送受信することが可能になり、よりリッチなアプリケーションへと発展しました。\n\nAjax は XMLHttpRequest を JavaScript を介して利用することで実装します。実際にはより実装しやすくした jQuery を利用するのが一般的です。XMLHttpRequest は非同期通信の根幹となるAPIで、requestに対する response はXMLだけでなくJSONも利用できます。したがって、A,C,D,EはAjax と関連が深い技術となります。\n\nBの JavaServerPages(JSP) はMVCアーキテクチャで使用される技術です。Model、View、Controller に分けて設計され、ModelはEJB(Enterprise JavaBeans)が担当し、ViewはJSPが担当します。Controller は Servlet とも呼ばれ、 Model と View を制御するJavaプログラムです。\nAjax とは直接関連のない技術なので、これが正解となります。"
    },
    {
      type: "choice",
      title: "例題1.21「1.1.3 Web関連技術の概要」",
      content: "レベル1の出題範囲「1.1.3 Web関連技術の概要」からの出題です。\nカスタムデータ属性 (data-*) 名の * 部分の使用制限として正しいのは次のうちどれか。３つ選びなさい。",
      options: [
        { content: "ハイフン（-）を使ってはならない。" },
        { content: "xml で始めてはならない。", shouldChoose: true },
        { content: "コロン (:) を使ってはならない。", shouldChoose: true },
        { content: "大文字の A から Z を使ってはならない。", shouldChoose: true },
        { content: "アンダースコア（_）を使ってはならない。" }
      ],
      solution: "HTML5で導入された data- で始まるカスタムデータ属性（data-*）を使用することで、id, class に加えてCSS の装飾区分を増やすことができます。CSSでの指定方法は id, class と少し異なりますので、ぜひ試してみましょう。\ndata-* は、CSS 以外にも JavaScript でも利用できるので、さらに多彩な制御が可能になります。\n\nさて、例題ですが、MDN Web Docs - moz://a によれば、\ndata- の後の文字列の制限は、XML の命名規則に加え、下記の３つの制限が記載されています。\n- XML として使用する場合であっても、名前を xml で始めてはならない。\n- 名前にコロン (U+003A) を含めてはならない。\n- 名前に大文字の A から Z を含めてはならない。\nこの３つは、選択肢のB、C、Dになり、正解です。\nAのハイフンもDのアンダースコアも使用できるので、不正解です。"
    },
    {
      type: "choice",
      title: "例題1.20「1.1.2 HTMLの書式」",
      content: "レベル1の出題範囲「1.1.2 HTMLの書式」からの出題です。\n価格を表示する箇所で円マーク(¥)を正しく表示できないのは次のうちどれか。\nなお、文字セットは UTF8、フォントは arial、円マークの unicode 文字番号は10進表記で165とする。",
      options: [
        { content: "&yen;" },
        { content: "&#165;" },
        { content: "&#o245;", shouldChoose: true },
        { content: "&#xA5;" },
        { content: "¥" }
      ],
      solution: "今でも時々円マークがバックスラッシュ(\\)で表示されるサイトをみかけます。\nJIS配列キーボードのキートップや、MS Windows のディレクトリ区切り文字の ¥ に慣れていると、¥ は、どこでも ¥ として表示されるものと思っても仕方ないですが、HTML5 の技術者がそうでは困ります。\n\n日本語の文字がコンピュータに実装されてから、これまでにさまざまな苦労があったようです。\nそのため、ASCIIコードのバックスラッシュである16進表記の 0x5C の文字が、JISコード(ISO-2022-JP)では、円マーク(¥)に割り当てられており、同じ文字コードが環境によって異なった表示になることが多々あります。\n\nさて、例題ですが、選択肢A、B、Dは確実に円マークを表示する表記です。選択肢Aは、文字実体参照と呼ばれる方法で、人が理解・識別しやすいのでお勧めです。\n選択肢B、Dは数値文字参照と呼ばれる方法で、Bは10進表記、Dは16進表記となります。\n選択肢Eは、UTF8の環境で円マークであれば正しく表示されます。\n選択肢Cは、数値文字参照形式ですが8進表記では正しく表示できません。\n従って、正解は C となります。\n\n円マークは上記のとおりですが、バックスラッシュ（\\）はもっと気を使います。\n\n文字セットが Shift JIS の場合、フォントに ＭＳ ゴシックが指定された場合、ブラウザが Microsoft Internet Explorerの場合、円マークで表示される可能性が高く、下記のように指定せざるを得ないようです。\n\n<span style=\"font-family:arial\">\\</span>"
    },
    {
      type: "choice",
      title: "例題1.19「1.1.2 HTMLの書式」",
      content: "レベル1の出題範囲「1.1.2 HTMLの書式」からの出題です。\nlink 要素の rel 属性の使用方法として正しいものを2つ答えよ。",
      options: [
        { content: "<link rel=\"stylesheet\" href=\"/default.css\" type=\"text/css\">", shouldChoose: true },
        { content: "<link rel=\"alternate\" href=\"/en/index.html\" hreflang=\"English\">" },
        { content: "<link rel=\"alternate\" media=\"smartphone\" href=\"/m/index.html\">" },
        { content: "<link rel=\"canonical\" href=\"https://example.com/\">", shouldChoose: true }
      ],
      solution: "link要素は、外部リソースを参照する際に使用する要素です。\n\nBの他言語対応のページで指定できるhreflangは、ISO 639の言語コードと国コードの組み合わせで指定する必要があり、\"en\", \"en-us\", \"fr-ca\" などの形式になります。\nCのmediaに指定できる値に、smartphoneはありません。携帯デバイスの場合、\"handheld\"を使用します。\nDのcanonicalはSEOへの重複ページの影響を回避できます。"
    },
    {
      type: "choice",
      title: "例題1.18「1.1.3 Web関連技術の概要」",
      content: "レベル1の出題範囲「1.1.3 Web関連技術の概要」からの出題です。\n下記のように分類される画像をWebで使用する際にそれぞれフォーマットとして最も適した組み合わせは次のうちどれか。\n\nグループ①\n・写真が多く、フルカラー（1670万色）で表示したい\n・グラデーションのデザイン画がある\n・背景を透過したい\n\nグループ②\n・企業ロゴなどのイラスト、アイコンが多い\n・アイコンにアニメーションを入れたい",
      options: [
        { content: "BMP と PNG" },
        { content: "PNG と GIF", shouldChoose: true },
        { content: "JPEG と GIF" },
        { content: "JPEG と PNG" }
      ],
      solution: "選択肢の中でアニメーションが可能な画像はGIFのみなので、AとDは不正解です。\nBとCのPNGとJPEGでは、ともにフルカラーで表示できますが、背景を透過できるのはPNGのみなので、正解はBになります。\n\n・BMP(Bitmap Image)は、Windowsに作られた画像フォーマットで、Webでは使用できません。\n・JPEG(Joint Photographic Experts Group) の特徴は、フルカラーの表現ができ、グラデーションも綺麗に表現します。\n・PNG(Portable NetworkGraphics)は、JPEGと同様、フルカラーの表現ができますが、ファイルサイズがJPEGより大きくなる場合があります。JPEGと異なり、背景の透過が可能です。\n・GIF(Graphics Interchange Format)は、背景の透過が可能で、アニメーションも可能ですが、256色までしか表現できません。過去に透過GIFでライセンスの問題が発生しPNGが開発された経緯があります。\n上記以外にTIFF(Tagged Image File Format)と言うフォーマットもあります。高解像度の画像に向いていますが、サイズが大きくなります。"
    },
    {
      type: "choice",
      title: "例題1.17「1.1.3 Web関連技術の概要」",
      content: "レベル1の出題範囲「1.1.3 Web関連技術の概要」からの出題です。\nウェブサイトのコンテンツを、一元的に管理する仕組みの名称として最もふさわしいものを選択してください。",
      options: [
        { content: "Blog" },
        { content: "CMS", shouldChoose: true },
        { content: "リポジトリ" },
        { content: "データウェアハウス" },
        { content: "フレームワーク" }
      ],
      solution: "コンテンツを一元的に管理する仕組みのことを、CMS(Contents Management System)と呼びます。\n一般には、ウェブサイトのコンテンツをウェブブラウザからHTMLの知識を必要とせず編集できるものをCMSと呼ぶことが多いです。\nA. BlogもCMSの一形態と言えますが、時系列のある記事を管理することに特化しているため、最もふさわしいとは言えない選択肢です。\n\nその他の選択肢については、C.リポジトリはバージョン管理システム、D.データウェアハウスはデータベース、E.フレームワークはアプリケーション開発と、異なる領域の用語ですので間違いです。"
    },
    {
      type: "choice",
      title: "例題1.15「1.1.1 HTTP, HTTPSプロトコル」",
      content: "レベル1の出題範囲「1.1.1 HTTP, HTTPSプロトコル」からの出題です。\nHTTPに規定されている認証方式に関する説明として、正しいものを2つ選択してください。",
      options: [
        { content: "BASIC認証では、ID,パスワードをウェブブラウザ標準の暗号化方式で送信する" },
        { content: "Digest認証では、ユーザ名とパスワードを、MD5でダイジェスト化して送信する", shouldChoose: true },
        { content: "Digest認証では、ユーザ名とパスワードを、暗号化せずに一部のみ送信する" },
        { content: "BASIC認証では、ID,パスワードを暗号化せずに送信する", shouldChoose: true },
        { content: "Captcha認証では、機械には判別しにくい画像を使用して認証を行なう" }
      ],
      solution: "HTTPを使用してウェブページなどを表示する際に、ユーザ名とパスワードが一致しないとエラーにする手段を認証と言います。\nHTTPでは、BASIC認証とDigest認証という二種類の認証方法が規定されています。認証が必要とされるウェブページ(などのリソース)にアクセスすると、ユーザ名とパスワードの入力が求められます。\n\nBASIC認証では、ユーザが入力したユーザ名とパスワードは一切暗号化されることなく送信されます。\nDigest認証では、ユーザ名とパスワードは、MD5というハッシュ関数(簡単に言うと逆算して元の文字列を推測しにくい文字列に変換)を使用して、ユーザ名とパスワードをダイジェスト(ハッシュ)化して送信します。\nウェブサーバは、毎回異なるランダムな文字列をブラウザに送信してハッシュ関数に使用するため、ネットワークを盗聴しても、ユーザ名とパスワードを盗まれにくい仕組みになっています。\nウェブ制作の現場では、作成中のウェブページを非公開にして制作とクライアントの間でのみ閲覧可能にする場合などに認証はよく使われています。\n認証を行なうためにはウェブサーバ側に設定が必要ですので、利用する場合にはウェブサーバの仕様を確認してください。\nCaptcha認証の説明は、説明としては正しいですが、HTTPに規定されている認証方式ではありませんので、間違いとなります。"
    },
    {
      type: "choice",
      title: "例題1.13「1.1.2 HTMLの書式」",
      content: "レベル1の出題範囲「1.1.2 HTMLの書式」からの出題です。\nHTMLのtitle要素に関する記述のうち、間違っているものをすべて選びなさい。",
      options: [
        { content: "1つのHTML文書に必ず1つ必要。", shouldChoose: true },
        { content: "head要素内に配置する。" },
        { content: "複数は配置できない。" },
        { content: "要素内容にはテキストしか入れられない。" },
        { content: "条件によっては終了タグを省略できる。", shouldChoose: true }
      ],
      solution: "HTML5より前のHTML/XHTMLでは、title要素は1つの文書に必ず1つ必要でした。しかし、HTML5では「iframe要素のsrcdoc属性で指定する文書」および「上位レベルのプロトコルがタイトル情報を提供する場合（たとえば電子メールとしての件名が付けられているHTMLメールなど）」においては、title要素を省略することが可能です。したがって、選択肢のAは間違いです。 また、title要素自体は条件によっては省略可能ですが、開始タグ・終了タグともにタグの省略は一切できません。そのため、選択肢のEも間違いです。"
    },
    {
      type: "choice",
      title: "例題1.12「1.1.2 HTMLの書式」",
      content: "レベル1の出題範囲「1.1.2 HTMLの書式」からの出題です。\n文字（実体）参照として無効な記述を選択してください。",
      options: [
        { content: "&amp;" },
        { content: "&#39;" },
        { content: "&#x266A;" },
        { content: "&0x1A;", shouldChoose: true }
      ],
      solution: "HTMLなどで意味のある記号として扱われる、\"<\"、\">\"や、直接入力できない文字を表示するための仕組みが、文字(実体)参照です。\nたとえば、文章内に\"<p>\"と書かれていれば、Webブラウザはタグとして処理しようとします。しかし、製作者の意図としては、文章の一部として表示してほしいとします。\nこのようなときに、\"<\"を\"&lt;\"、\">\"を\"&gt;\"と記述することで、Webブラウザはタグとして処理せず、表示上だけ、それぞれ\"<\",\">\"とすることができます。\nよくつかわれる文字参照としては、\n&lt; <\n&gt; >\n&amp; &\n&copy; ©\n&nbsp; 空白文字\nなどが挙げられます。これらは、記号の名称(略称)を&の後に記述し、最後に\";\"を付けます。\n名称を指定する以外にも、文字コード(番号)を指定する方法もあります。\n文字コードを指定する場合には2種類の書き方があり、&#10進数; と、 &#x16進数; です。\nしたがって、D.の書式は無効です。"
    },
    {
      type: "choice",
      title: "例題1.11「1.1.2 HTMLの書式」",
      content: "レベル1の出題範囲「1.1.2 HTMLの書式」からの出題です。\nHTML5のコンテンツ・モデル（Content models）において、セクショニング・コンテンツ（Sectioning content）である要素の組み合わせで適切なものはどれか。正しいものを1つ選びなさい。",
      options: [
        { content: "h1 h2 h3 h4 h5 h6" },
        { content: "footer header main section" },
        { content: "blockquote body fieldset figure td" },
        { content: "article aside nav section", shouldChoose: true }
      ],
      solution: "HTML5ではコンテンツ・モデルに基いて要素を配置します。コンテンツ・モデルのコンテンツのカテゴリーは次の7つです。\n- メタデータ・コンテンツ\n- フロー・コンテンツ\n- セクショニング・コンテンツ\n- ヘッディング・コンテンツ\n- フレージング・コンテンツ\n- エンベッディッド・コンテンツ\n- インタラクティブ・コンテンツ\nセクショニング・コンテンツは基本的に、見出しとそれに関連付けられたコンテンツによるアウトラインを含みます。\n選択肢Aはヘッディング・コンテンツの要素です。選択肢Cはセクショニング・コンテンツには含まれませんが、セクショニング・ルートと呼ばれる要素で、独自のアウトラインを持つことができます。"
    },
    {
      type: "choice",
      title: "例題1.10「1.1.3 Web関連技術の概要」",
      content: "レベル1の出題範囲「1.1.3 Web関連技術の概要」からの出題です。\nData URIについての解説で誤っているのを選択してください。",
      options: [
        { content: "主にWebサイト表示の高速化のための技術である" },
        { content: "画像ファイルなど、HTMLファイルの外にあるファイルの場所を指すURIである", shouldChoose: true },
        { content: "画像データのエンコードはBase64形式で行なわれる" },
        { content: "ブラウザによって対応状況に差がある" },
        { content: "HTML、CSSで使用できる" }
      ],
      solution: "Data URIは、通常外部ファイルへのURIを記述する、imgタグのsrc属性やCSSのurl()に直接画像データなどを埋め込むための技術です。\nData URIはデータの場所を指すものではありませんので、B.の説明は間違っています。\nその他の説明は正しいです。\nA. 1度のリクエストでData URIで埋め込まれた画像も取得できるため、通信回数を削減できます。\nC. 画像データにはテキストとして見ると表示可能文字以外も含まれていますが、Base64エンコードをすることで文字として表わすことが出来るようになります。\nD. 一部ブラウザ(IE8未満など)では対応していなかったり、扱えるデータ形式に制限があります。\nE. HTMLではsrc属性など、CSSではbackground-imageのurl指定で使用することができます。"
    },
    {
      type: "choice",
      title: "例題1.9「1.1.2 HTMLの書式」",
      content: "レベル1の出題範囲「1.1.2 HTMLの書式」からの出題です。\nHTML5で、文字エンコーディングを設定するために有効な書式を2つ選びなさい。",
      options: [
        { content: "<html lang=\"ja\">" },
        { content: "<html charset=\"UTF-8\">" },
        { content: "<meta charset=\"UTF-8\">", shouldChoose: true },
        { content: "<meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\">", shouldChoose: true },
        { content: "<meta encoding=\"UTF-8\">" }
      ],
      solution: "HTML5では、文書のエンコーディングをC.のように短縮して記述することができるようになりました。\nまた、D.のようなHTML4までの表記も継続して使用できます。\nA.は使用言語の指定ですので、文字エンコーディングの指定ではありません。\nB.はhtmlタグにはcharset属性はありません。\nE.はmetaタグにはencoding属性はありません。\nWebページの文字化けを防ぐためにも、文字エンコーディングは指定すべきですし、当然HTMLファイルの文字エンコーディングと一致させる必要があります。"
    },
    {
      type: "choice",
      title: "例題1.7「1.1.1 HTTP, HTTPSプロトコル」",
      content: "レベル1の出題範囲「1.1.1 HTTP, HTTPSプロトコル」からの出題です。\nHTTPSを使用して、Webサーバの正当性を確認するために必要なものを2つ選びなさい。",
      options: [
        { content: "認証局", shouldChoose: true },
        { content: "クライアント証明書" },
        { content: "承認局" },
        { content: "サーバ証明書", shouldChoose: true },
        { content: "署名局" }
      ],
      solution: "HTTPSはWebクライアントとWebサーバの間の通信を暗号化する他に、Webサーバの正当性を保証する仕組みを持っています。\n正当性を保証するために、Webサーバにはサーバ証明書(D)と呼ばれるファイルを設置します。\nサーバ証明書には、Webサーバのホスト名などの情報の他、正当性を保証するための第三者機関による認証局(A)による電子署名が付与されています。\nWebクライアントでは、アクセスするWebサーバからサーバ証明書を受けとると、認証局へ問い合わせを行ない、証明書の正当性を確認します。\n最近のWebブラウザでは、正当性が確認されたWebページにはアドレスバーに南京錠のアイコンなどが表示されるようになっています。\nなお、クライアント証明書(B)はクライアントの正当性を確認する必要がある場合にのみ使用されます。\nまた、承認局(C)、署名局(E)という用語はありません。"
    },
    {
      type: "choice",
      title: "例題1.6「1.1.3 Web関連技術の概要」",
      content: "レベル1の出題範囲「1.1.3 Web関連技術の概要」からの出題です。\nBase64についての説明で誤っているものを一つ選択しなさい。",
      options: [
        { content: "バイナリデータを印字可能文字に置き換える仕組みである" },
        { content: "データ量は変換前と変換後で変わらない", shouldChoose: true },
        { content: "英数字と記号を使用する" },
        { content: "端数に当たる部分には'='を使用する" },
        { content: "変換後は1行64文字で改行される" }
      ],
      solution: "Base64は、バイナリデータやマルチバイト文字列(日本語など)をルールに従ってASCII文字のうち、英数字と記号の印字可能文字だけで記述されたテキストデータに変換します。\nASCII文字とは英数字と記号など俗に半角文字(ASCII文字)と呼ばれる文字のことです。\nASCIIテキストデータに変換することで、ASCIIテキストしか扱えない通信方式やテキストエディタでデータを扱えるようになります。\n変換の手順は以下のようになります。\nまずもとになるデータを24ビット取りだし、6ビットずつ4つに切り分けます。次に、6ビットで表せる数、0から63までを対応表を使って0→A,1→Bのように4文字の印字可能文字に変換します。\n最後に印字可能文字をそれぞれASCIIコード8bitで表現します。そのため、変換前のデータ24ビットにつき、変換後のデータ量は32ビットになります。\nこれをデータが終わるまで繰り返します。\n\nその他の選択肢については以下の通りです。\nA.バイナリデータ(不可視文字を含む)を印字可能文字を使って表現する仕組みです。\nC.Base64ではA-Z,a-z,0-9,+,/の64文字を使用します。\nD.元のデータが24ビットで割り切れない場合は、足りない分を'='で埋めます。\nE.変換後の文字列が64文字以上になった場合は、64文字ごとに改行文字を挿入します。"
    },
    {
      type: "choice",
      title: "問題1.4 「1.1.2 HTMLの書式」",
      content: "レベル1の出題範囲「1.1.2 HTMLの書式」からの出題です。\nHTML文書において、外部スタイルシート「style.css」を読み込ませるための記述として正しいものを１つ選びなさい。",
      options: [
        { content: "<link href=\"style.css\">" },
        { content: "<link href=\"style.css\" type=\"text/css\">" },
        { content: "<link rel=\"text/css\" href=\"style.css\">" },
        { content: "<link rel=\"stylesheet\" href=\"style.css\">", shouldChoose: true },
        { content: "<link rel=\"stylesheet\" href=\"style.css\" type=\"text/plain\">" }
      ],
      solution: "HTML標準では、link要素には必ずrel属性を指定する必要があります。Cはrel属性の値として、キーワードではなくMIMEタイプを指定していますので間違いです。Eのtype属性に指定されているMIMEタイプ「text/plain」はCSS向けのものではありませんので、「style.css」は読み込まれません。Dのようにtype属性が省略されると、rel属性の値が「stylesheet」の場合のデフォルト値「text/css」が適用されます。\nよって正解はDとなります。"
    },
    {
      type: "choice",
      title: "例題1.3「1.1.3 Web関連技術の概要」",
      content: "レベル1の出題範囲「1.1.3 Web関連技術の概要」からの出題です。\nXHTML書式の特徴についての説明で、正しいものを2つ選びなさい。",
      options: [
        { content: "html要素の開始タグにXHTML用の名前空間を指定する。", shouldChoose: true },
        { content: "html要素の代わりにxhtml要素を使ってもよい。" },
        { content: "属性の値は「\"」や「'」で囲む必要はない。" },
        { content: "要素名や属性名は全て大文字で記述しなければならない。" },
        { content: "空要素には終了タグを付加するか、開始タグの閉じかっこを「/>」としなければならない。", shouldChoose: true }
      ],
      solution: "HTML5はXHTML書式を利用できます。\nその際、html要素にはデフォルト名前空間としてxmlns属性で「http://www.w3.org/1999/xhtml」を指定する必要があります。\n要素名や属性名は全て小文字で記述する必要があります。\n属性の値は「\"」や「'」で囲む必要があります。\nxhtml要素という要素はいずれのXHTML仕様にも存在しません（2014年5月現在）。"
    },
    {
      type: "choice",
      title: "例題1.2「1.1.1 HTTP, HTTPSプロトコル」",
      content: "レベル1の出題範囲「1.1.1 HTTP, HTTPSプロトコル」からの出題です。\nHTTPプロトコルにおけるExpiresヘッダフィールドに関する記述として間違っているものを１つ選びなさい。",
      options: [
        { content: "キャッシュを利用する事でウェブページに関するロードの高速化が期待できる。" },
        { content: "HTTPリクエストに付加され送信される。", shouldChoose: true },
        { content: "キャッシュの有効期間期限を指定できる。" },
        { content: "スクリプトやスタイルシートにも利用できる。" },
        { content: "HTTP/1.1において、Cache-Controlフィールドのmax-age指示子がある場合は、Expiresフィールドは上書きされる。" }
      ],
      solution: "Expiresヘッダフィールドは、Webコンテンツ提供者がそのコンテンツが最新である期間を示すために指定するものです。\nよって、レスポンスに記述されるものであり、リクエストに付加されるというBの記述は間違いです。\nA,C,D,EはExpiresヘッダフィールドの説明として適切です。"
    },
    {
      type: "choice",
      title: "例題1.1「1.1.1 HTTP, HTTPSプロトコル」",
      content: "レベル1の出題範囲「1.1.1 HTTP, HTTPSプロトコル」からの例題を解説します。\nHTTP/1.1に関する記述のうち、間違っているものを選びなさい。",
      options: [
        { content: "トランスポート・プロトコルとして、通常はTCPを使用する。" },
        { content: "デフォルトのポート番号は80番である。" },
        { content: "定義されているメソッドは、GETとPOSTの2種類である。", shouldChoose: true },
        { content: "リクエストには、リクエストライン・リクエストヘッダフィールド・ボディメッセージなどが含まれる。" },
        { content: "レスポンスにおけるステータスコードの番号が5から始まる場合は、サーバ側でなにか問題が発生している可能性が高い。" }
      ],
      solution: "Aは正しい記述です。HTTPプロトコルは、アプリケーション層のプロトコルとして定義されており、OSI参照モデルにおける第7層に位置するプロトコルです。HTTPは第4層のトランスポート・プロトコルに、通常TCPを利用します。よって、ファイアウォールにおいてTCPに関する設定をしている場合は、HTTPのプロトコルにも影響する場合があります。\nBは正しい記述です。デフォルトポートは80番で、ブラウザで特にアクセスするポート番号を指定しない場合は、自動的に80番ポートに接続する事になります。\nCは、間違いです。HTTP/1.1では、GET、POST以外にも、PUT、DELETE、HEADなど合計8個のメソッドが定義されています。ほとんどの場合、GETかPOSTを使いますが、最近ではRESTアーキテクチャのような、相互データ交換の目的でPUTやDELETEを使うこともあります。\nDは正しい記述です。リクエストには様々なヘッダを記述することができ、それによってクライアントに関する情報（利用しているブラウザの種類など）をサーバに送信することができます。\nEは正しい記述です。RFC2616（Hypertext Transfer Protocol -- HTTP/1.1）の定義では、ステータスコードが5xxの場合、つまり5で始まる3桁の数字であればサーバがエラー状態にあるか、処理する能力がない場合に返すと定義されています。"
    }
  ]
};