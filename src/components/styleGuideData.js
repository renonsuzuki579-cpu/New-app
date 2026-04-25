// ═══════════════════════════════════════════════════════════════
// 📚 styleGuideData.js
// ─────────────────────────────────────────────────────────────────
// 384通り（8タイプ×3骨格×16PC）対応のスタイルガイドデータ。
//
// 思想：
//   384通り全部を別エントリで持たない。
//   「テイスト＝8タイプ」「形＝骨格」「色＝16PC」の3軸を独立に持ち、
//   UI 側で組み合わせて読み出す。
//
// 使い方：
//   import { FACE_TYPE_GUIDE, BONE_TYPE_GUIDE, PC16_GUIDE,
//            CONFLICT_RULES, SPRING_2026_TREND_FIT,
//            HEIGHT_ADJUSTMENTS, buildStyleAdvice } from "./styleGuideData";
//
//   const advice = buildStyleAdvice({
//     faceType: "フェミニン",
//     boneType: "ウェーブ",
//     pc16: "Cool Summer",
//     height: 158,
//   });
// ═══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────
// 1. 8タイプ × ファッション系統 × ヘア × 春の鉄板アイテム
// ─────────────────────────────────────────────────────────────────
export const FACE_TYPE_GUIDE = {
  "キュート": {
    category: "子供顔×曲線",
    fashionGenres: ["ガーリー", "カジュアル可愛い", "ソフトカジュアル"],
    impressionWords: ["かわいい", "親しみやすい", "コンパクト"],
    springItems: ["小花柄ブラウス", "丸首カーデ", "Aラインスカート", "リボンモチーフ"],
    avoidItems: ["シャープすぎるジャケット", "モード系の鋭い直線", "重厚アースカラー全身"],
    hair: {
      recommend: ["丸みボブ", "マッシュ", "タッセルボブ"],
      bangs: ["シースルーバング", "カーテンバング"],
      curl: "内巻き／ふんわりウェーブ",
      color: ["ピンクニュアンスブラウン", "ベージュブラウン"],
      avoid: ["センターパート＋ストレートロング", "刈り上げ系"],
    },
    spring2026: ["3Dフラワーシュシュ", "丸みセーラー衿", "いちごモチーフ小物"],
  },
  "アクティブキュート": {
    category: "子供顔×曲線×パーツ大",
    fashionGenres: ["カジュアル", "ストリート寄り", "ポップ"],
    impressionWords: ["元気", "華やか", "キャッチー"],
    springItems: ["大きめドット", "はっきり花柄", "明色トップス", "スニーカー", "ポップ小物"],
    avoidItems: ["地味な無地ワントーン", "オフィスきれいめ系全身"],
    hair: {
      recommend: ["ミディアム〜ロングのレイヤーカット", "ウルフ", "ハイレイヤー"],
      bangs: ["シースルーバング", "カーテンバング"],
      curl: "外ハネ／毛先動きあり",
      color: ["ヘルシーブラウン", "軽めハイトーン"],
      avoid: ["きっちりまとめた重ためロング", "無動きストレート"],
    },
    spring2026: ["立体フラワーモチーフトップス", "ライトブルーデニム", "推しチャーム"],
  },
  "フレッシュ": {
    category: "子供顔×直線+曲線ミックス",
    fashionGenres: ["ベーシックカジュアル", "きれいめカジュアル", "清潔感系"],
    impressionWords: ["爽やか", "清潔感", "親しみ"],
    springItems: ["白シャツ", "ボーダーTシャツ", "デニム", "カーディガン", "白スニーカー"],
    avoidItems: ["過剰なフリル", "重厚エレガンス", "奇抜なモード"],
    hair: {
      recommend: ["ミディアムストレート", "くびれミディ", "タッセルボブ"],
      bangs: ["シースルーバング", "流し前髪"],
      curl: "軽い内巻き／ナチュラル",
      color: ["ナチュラルブラウン", "ベージュブラウン"],
      avoid: ["派手すぎるパーマ", "極端なハイトーン"],
    },
    spring2026: ["白×ライトブルーデニム×スニーカー", "シンプルなセットアップ"],
  },
  "クールカジュアル": {
    category: "子供顔×直線",
    fashionGenres: ["ボーイッシュ", "ストリート", "アメカジ"],
    impressionWords: ["クール", "凛々しい", "辛口"],
    springItems: ["シンプルT", "デニム", "ライダース", "スニーカー", "キャップ"],
    avoidItems: ["フリル多用", "大きめ花柄", "淡くふんわりフェミニン全身"],
    hair: {
      recommend: ["ハンサムショート", "ベリーショート", "ウルフカット", "ハイレイヤー"],
      bangs: ["センターパート", "流し前髪"],
      curl: "毛先のみ／タイトめ",
      color: ["ダークブラウン", "アッシュ系"],
      avoid: ["ふわふわパーマのロング", "リボン系アレンジ"],
    },
    spring2026: ["オーバーシャツ", "カーゴパンツ", "軽アウター×Tシャツ"],
  },
  "フェミニン": {
    category: "大人顔×曲線",
    fashionGenres: ["フェミニン", "エレガンス寄り"],
    impressionWords: ["女性らしい", "華やか", "上品"],
    springItems: ["シフォンブラウス", "フレアスカート", "レース", "ボウタイ", "大きめ花柄"],
    avoidItems: ["ボーイッシュなアメカジ全身", "極端なミニマルモード"],
    hair: {
      recommend: ["ウェーブロング", "韓国風ロング", "ミディアムウェーブ"],
      bangs: ["かきあげ", "カーテンバング"],
      curl: "大きめウェーブ／ヨシンモリ",
      color: ["ピンクブラウン", "艶やかブラウン"],
      avoid: ["マッシュショート", "ボーイッシュショート"],
    },
    spring2026: ["レース×シアー", "3Dフラワー", "トレンチコート"],
  },
  "ソフトエレガント": {
    category: "大人顔×直線+曲線×パーツ控えめ",
    fashionGenres: ["きれいめ", "コンサバ", "オフィスカジュアル"],
    impressionWords: ["上品", "優しい", "繊細"],
    springItems: ["無地ブラウス", "落ち感スカート", "淡色ワントーン", "シンプルジャケット"],
    avoidItems: ["派手すぎる柄", "ストリート全身", "大きすぎるオーバーサイズ"],
    hair: {
      recommend: ["ロブ（ロングボブ）", "くびれミディ", "ストレートロング"],
      bangs: ["シースルーバング", "流し前髪"],
      curl: "毛先のみ・ナチュラル",
      color: ["上品なベージュブラウン", "グレージュ"],
      avoid: ["派手すぎるパーマ", "明るすぎるハイトーン"],
    },
    spring2026: ["ジャケットセットアップ", "淡色ワントーン", "トレンチコート"],
  },
  "エレガント": {
    category: "大人顔×直線+曲線×パーツ華やか",
    fashionGenres: ["エレガンス", "きれいめ華やか"],
    impressionWords: ["華やか", "洗練", "存在感"],
    springItems: ["存在感ブラウス", "上質ジャケット", "大きめ柄", "上品な小物"],
    avoidItems: ["小さすぎる柄だけ", "地味すぎる無地全身", "子供っぽいガーリー"],
    hair: {
      recommend: ["ロングレイヤー", "ウェーブロング", "韓国風ロング", "くびれミディ"],
      bangs: ["かきあげ", "センターパート"],
      curl: "大きめウェーブ",
      color: ["艶ブラウン", "ヴィヴィッドな赤みブラウン"],
      avoid: ["マッシュ", "ベリーショート"],
    },
    spring2026: ["抽象大柄", "カラーブロッキング", "上質セットアップ"],
  },
  "クール": {
    category: "大人顔×直線",
    fashionGenres: ["モード", "マニッシュ", "ミニマル"],
    impressionWords: ["シャープ", "知的", "都会的"],
    springItems: ["白シャツ", "Iラインスカート", "テーラードジャケット", "モノトーン", "細アクセ"],
    avoidItems: ["ふわふわフリル全身", "子供っぽいガーリー", "過度な暖色アースカラー"],
    hair: {
      recommend: ["ストレートロング", "ハンサムショート", "センターパートのロブ"],
      bangs: ["センターパート", "かきあげ"],
      curl: "ストレート／毛先のみ",
      color: ["ダークブラウン", "ブラック寄り", "アッシュ"],
      avoid: ["ふわふわパーマ", "極端なハイトーン"],
    },
    spring2026: ["ジャケットセットアップ", "ロイヤルブルー差し色", "シャープなトレンチ"],
  },
};

// ─────────────────────────────────────────────────────────────────
// 2. 3骨格 × シルエット × 素材 × 身長別調整
// ─────────────────────────────────────────────────────────────────
export const BONE_TYPE_GUIDE = {
  "ストレート": {
    feature: "上半身に厚み、立体感あり、肌にハリ・弾力",
    silhouettes: ["Vネック", "Iライン", "ストレートパンツ", "ジャストサイズ"],
    materials: ["ハリのあるコットン", "サテン", "しっかりニット"],
    avoid: ["大オーバーサイズ", "フリル多用", "広がるフレア大"],
    springStaples: ["白シャツ＋ストレートデニム", "Vネックニット＋タイトスカート"],
    heightTips: {
      short:  "〜155cm: ジャストサイズ徹底、トップス短めかインする、9分丈で足首見せ",
      medium: "155〜165cm: 王道どおり。ストレートパンツ＋シャツが最強",
      tall:   "165cm〜: 縦長活かす。ロングシャツワンピやフルレングスのきれいめパンツが映える",
    },
    spring2026Fit: {
      good: ["ジャケットセットアップ", "シアー（トップス1点）", "カラーブロッキング"],
      careful: ["バルーンシルエット（ボトムなら可）", "ワイドデニム（細めワイドにする）"],
    },
  },
  "ウェーブ": {
    feature: "上半身が薄く華奢、下重心、肌は柔らかい質感",
    silhouettes: ["ハイウエスト", "短丈トップス", "フレア", "マーメイド", "Xライン"],
    materials: ["シフォン", "とろみ", "薄手レース", "軽いリブ"],
    avoid: ["厚手で硬い素材", "ローライズ", "長すぎるトップス", "メンズ大ぶり"],
    springStaples: ["リブニット＋ハイウエストフレアスカート", "ボウタイブラウス＋短丈ボトム"],
    heightTips: {
      short:  "〜155cm: 相性◎。ハイウエスト＋短丈の王道がそのまま使える",
      medium: "155〜165cm: 定番どおり。マーメイドやフレアミディが映える",
      tall:   "165cm〜: 短丈にこだわらず、ハイウエスト＋ロングフレアで縦長を生かす",
    },
    spring2026Fit: {
      good: ["ボウタイブラウス", "セーラー衿", "レース", "シアー", "3Dフラワー"],
      careful: ["バルーンパンツ（短丈トップスで重心調整）", "セットアップ（短丈ジャケットを選ぶ）"],
    },
  },
  "ナチュラル": {
    feature: "骨格・関節がしっかり、フレーム感、手足長め、肌はドライ",
    silhouettes: ["オーバーサイズ", "ワイドパンツ", "ロング丈", "レイヤード", "Aライン", "Yライン"],
    materials: ["リネン", "デニム", "コーデュロイ", "ざっくりニット"],
    avoid: ["ピチピチ", "繊細レース全身", "サイズが小さすぎる甘い服"],
    springStaples: ["オーバーサイズシャツ＋ワイドデニム", "ロングワンピ＋デニムジャケット"],
    heightTips: {
      short:  "〜155cm: サイズ選びがシビア。MよりS／9号、丈は足首見せで止める",
      medium: "155〜165cm: 定番どおり。マキシワンピ、ワイドデニムが王道",
      tall:   "165cm〜: 相性最強。フルレングスのワイド、ロング丈すべて映える",
    },
    spring2026Fit: {
      good: ["ワイドデニム", "カーゴ", "オーバーシャツ", "バルーンシルエット", "ゆるめセットアップ"],
      careful: ["シアー・レース（1点だけ・大きめサイズで）"],
    },
  },
};

// ─────────────────────────────────────────────────────────────────
// 3. 16タイプ PC × 色パレット × 春の使い方
// ─────────────────────────────────────────────────────────────────
export const PC16_GUIDE = {
  // ── スプリンググループ（イエベ春） ──
  "Light Spring": {
    group: "Spring", undertone: "イエローベース",
    keyword: "明るさ・パステル・柔らかさ",
    bestColors: ["アイボリー", "ピーチピンク", "ミントグリーン", "ライトコーラル"],
    avoidColors: ["黒（強すぎ）", "ダークブラウン", "ビビッド原色"],
    springUsage: "パステルワントーンが得意。淡色全身がそのまま映える",
    coordExample: "アイボリーのブラウス＋ピーチのフレアスカート＋ゴールド小物",
  },
  "Bright Spring": {
    group: "Spring", undertone: "イエローベース",
    keyword: "鮮やか・クリア・ビタミン",
    bestColors: ["ブライトコーラル", "ポピーレッド", "ターコイズブルー", "ライムグリーン"],
    avoidColors: ["くすみ系全般", "グレージュ", "ダスティカラー"],
    springUsage: "クリアな鮮やか色を1点投入。差し色使いが得意",
    coordExample: "ターコイズブルーのトップス＋白パンツ＋小物に明るい赤",
  },
  "Warm Spring": {
    group: "Spring", undertone: "イエローベース",
    keyword: "暖かさ・黄み・典型的イエベ春",
    bestColors: ["アプリコット", "オレンジ", "キャメル", "コーラル"],
    avoidColors: ["青みピンク", "グレー", "白すぎる純白"],
    springUsage: "イエベの王道、黄み×ベージュトーンが最強",
    coordExample: "アプリコットのカーデ＋アイボリーのフレアスカート＋キャメル小物",
  },
  "Vivid Spring": {
    group: "Spring", undertone: "イエローベース",
    keyword: "強烈な鮮やかさ・原色寄り",
    bestColors: ["ホットピンク", "エメラルドグリーン", "ロイヤルブルー（明るめ）"],
    avoidColors: ["くすみカラー全般", "淡パステル"],
    springUsage: "派手な色を主役にできる稀少タイプ。黒との切り替えも◎",
    coordExample: "ホットピンクのトップス＋白デニム＋エメラルド小物",
  },

  // ── サマーグループ（ブルベ夏） ──
  "Light Summer": {
    group: "Summer", undertone: "ブルーベース",
    keyword: "明るさ・淡パステル・透明感",
    bestColors: ["ベビーピンク", "スカイブルー", "ラベンダー", "ライトグレー"],
    avoidColors: ["濃い暖色", "ビビッド原色", "黒の全身"],
    springUsage: "淡色ワントーンが最も得意。ふんわりした春の主役",
    coordExample: "ベビーピンクのカーデ＋ライトグレーのスカート＋シルバー小物",
  },
  "Cool Summer": {
    group: "Summer", undertone: "ブルーベース",
    keyword: "青み・涼やかさ・典型的ブルベ夏",
    bestColors: ["ローズピンク", "ブルーグレー", "ラベンダー", "ソフトブルー"],
    avoidColors: ["黄みオレンジ", "ビビッド原色", "純白"],
    springUsage: "青み寄りの淡色で品よく。ローズピンクが特に映える",
    coordExample: "ローズピンクのブラウス＋ライトグレーのパンツ＋シルバーアクセ",
  },
  "Soft Summer": {
    group: "Summer", undertone: "ブルーベース",
    keyword: "穏やかなくすみ・低彩度",
    bestColors: ["ローズベージュ", "ブルーグレー", "ミントグリーン", "ダスティローズ"],
    avoidColors: ["ビビッド原色", "純白", "真っ黒"],
    springUsage: "くすみピンクやスモーキー系。落ち着いた春コーデ",
    coordExample: "くすみピンクのニット＋グレージュのパンツ＋ベージュバッグ",
  },
  "Muted Summer": {
    group: "Summer", undertone: "ブルーベース",
    keyword: "強めのくすみ・ニュアンス",
    bestColors: ["ダスティローズ", "グレイッシュブルー", "モーヴ", "煙ったラベンダー"],
    avoidColors: ["クリアな鮮やか色", "純白", "原色"],
    springUsage: "ニュアンス系の春。Soft Summerより一段くすみ強め",
    coordExample: "モーヴのトップス＋グレイッシュブルーのスカート＋シルバー小物",
  },

  // ── オータムグループ（イエベ秋） ──
  "Soft Autumn": {
    group: "Autumn", undertone: "イエローベース",
    keyword: "穏やか・スモーキー・黄みあり",
    bestColors: ["テラコッタ", "マスタードイエロー", "カーキ", "ベージュ"],
    avoidColors: ["純白", "ビビッドピンク", "青みアイシー"],
    springUsage: "スモーキーなアースカラーで春。重くせず軽い素材で",
    coordExample: "マスタードのブラウス＋ベージュのフレアスカート＋ブラウン小物",
  },
  "Warm Autumn": {
    group: "Autumn", undertone: "イエローベース",
    keyword: "暖かさ・深み・典型的イエベ秋",
    bestColors: ["パンプキン", "オリーブグリーン", "コーヒーブラウン", "テラコッタ"],
    avoidColors: ["青みピンク", "純白", "アイシー寄り"],
    springUsage: "深みアースカラーを軽い素材で。春は薄めシャツで取り入れる",
    coordExample: "オリーブのシャツ＋ライトデニム＋ブラウン小物",
  },
  "Deep Autumn": {
    group: "Autumn", undertone: "イエローベース",
    keyword: "深み・重厚感・低明度",
    bestColors: ["ダークトマトレッド", "チョコレートブラウン", "モスグリーン", "深いネイビー"],
    avoidColors: ["パステル全般", "純白", "淡い青"],
    springUsage: "深い色をトップスに、ボトムに春らしい軽さを",
    coordExample: "ダークレッドのニット＋ベージュパンツ＋ブラウンシューズ",
  },
  "Dark Autumn": {
    group: "Autumn", undertone: "イエローベース",
    keyword: "暗さ・シック",
    bestColors: ["バーガンディ", "フォレストグリーン", "ダークブラウン", "ボルドー"],
    avoidColors: ["パステル", "明るすぎる色全般"],
    springUsage: "春でも深色を1点。素材で軽さを出す",
    coordExample: "バーガンディのブラウス＋デニム＋ブラウンレザー小物",
  },

  // ── ウィンターグループ（ブルベ冬） ──
  "Bright Winter": {
    group: "Winter", undertone: "ブルーベース",
    keyword: "鮮やか・クリア・コントラスト",
    bestColors: ["チェリーピンク", "トゥルーレッド", "アイシーブルー", "純白"],
    avoidColors: ["くすみ系全般", "ベージュ", "グレージュ"],
    springUsage: "純白＋鮮やかな差し色。コントラスト強めで春らしく",
    coordExample: "純白シャツ＋チェリーピンクのスカート＋黒小物",
  },
  "Cool Winter": {
    group: "Winter", undertone: "ブルーベース",
    keyword: "青み・シャープ・典型的ブルベ冬",
    bestColors: ["ロイヤルブルー", "フューシャピンク", "バーガンディ", "純黒"],
    avoidColors: ["黄みオレンジ", "アースカラー全般", "暖色ベージュ"],
    springUsage: "白×黒のコントラストに鮮やか色を1点",
    coordExample: "白T＋黒ジャケット＋ロイヤルブルーのスカート",
  },
  "Deep Winter": {
    group: "Winter", undertone: "ブルーベース",
    keyword: "深み・重厚・低明度",
    bestColors: ["ワインレッド", "エメラルドグリーン", "チャコールグレー", "ダークパープル"],
    avoidColors: ["パステル", "明るいアースカラー"],
    springUsage: "深色トップスに白系ボトム。軽素材で重く見せない",
    coordExample: "エメラルドのブラウス＋白パンツ＋黒の小物",
  },
  "Vivid Winter": {
    group: "Winter", undertone: "ブルーベース",
    keyword: "強烈な鮮やか・原色",
    bestColors: ["マゼンタ", "レモンイエロー", "ロイヤルブルー", "純黒", "純白"],
    avoidColors: ["くすみ系全般", "ニュアンスカラー"],
    springUsage: "原色を主役に。普通の人が着れない鮮やか色が似合う特別タイプ",
    coordExample: "マゼンタのトップス＋黒スラックス＋シルバーアクセ",
  },
};

// ─────────────────────────────────────────────────────────────────
// 4. 軸が衝突したときのルール
// ─────────────────────────────────────────────────────────────────
export const CONFLICT_RULES = {
  basic: "顔まわり（トップス・襟・スカーフ・アクセ・ヘア）は顔タイプ×PCを優先、体（ボトム・全体シルエット）は骨格を優先。主役は1軸だけに絞る。",
  examples: [
    {
      pattern: "クール顔 × ウェーブ骨格",
      solution: "顔まわりは直線シャツ、ボトムは骨格に合わせて短丈＆フレアやハイウエスト",
    },
    {
      pattern: "フェミニン顔 × ストレート骨格",
      solution: "レースは小面積でトップスのみ、ボトムは Iライン",
    },
    {
      pattern: "フェミニン顔 × ナチュラル骨格",
      solution: "大きめサイズの花柄シャツで甘さと骨格感を両立",
    },
    {
      pattern: "キュート顔 × ナチュラル骨格",
      solution: "小花柄を大きめサイズで／オーバーサイズの可愛い系シャツ",
    },
    {
      pattern: "クールカジュアル顔 × ウェーブ骨格",
      solution: "デニムは華奢デニム or ハイウエスト、トップスは短丈シンプル",
    },
    {
      pattern: "フェミニン顔 × Cool Winter PC",
      solution: "レースは黒・白・濃色を選ぶ、淡いピンクは△",
    },
    {
      pattern: "クール顔 × Warm Spring PC",
      solution: "コーラルやアイボリーをモノトーンで挟むサンドイッチ配色",
    },
  ],
};

// ─────────────────────────────────────────────────────────────────
// 5. 2026年春のトレンドアイテム × タイプマッチング
// ─────────────────────────────────────────────────────────────────
export const SPRING_2026_TREND_FIT = {
  trendKeywords: ["軽やかさ", "華やぎ", "甘辛ミックス"],
  trendColors2026: ["ロイヤルブルー", "カーキグリーン", "ライトピンク", "レッド", "ブラウン", "パープル", "ライトブルー"],
  trendItems: [
    {
      name: "ボウタイブラウス・セーラー衿",
      goodFor: { faceType: ["フェミニン", "キュート", "ソフトエレガント", "エレガント", "アクティブキュート"], boneType: ["ウェーブ"] },
      careful: { faceType: ["クール", "クールカジュアル"], boneType: ["ナチュラル"] },
      adjustments: {
        "ストレート": "小さめ襟・主張控えめなものを選ぶ",
        "ナチュラル": "大きめサイズで甘さを抜く",
        "クール": "モノトーン色で甘さを中和",
      },
    },
    {
      name: "3Dフラワー・立体モチーフ",
      goodFor: { faceType: ["キュート", "アクティブキュート", "フェミニン"] },
      careful: { faceType: ["クール", "クールカジュアル"] },
      adjustments: {
        "クール": "髪飾りなど顔から離れた場所に1点だけ",
      },
    },
    {
      name: "セットアップ（ジャケット）",
      goodFor: { faceType: ["クール", "エレガント", "ソフトエレガント", "フレッシュ"], boneType: ["ストレート"] },
      careful: { faceType: ["キュート"], boneType: ["ウェーブ"] },
      adjustments: {
        "ウェーブ": "短丈ジャケット＋ハイウエスト寄りのパンツのセットを選ぶ",
        "キュート": "カジュアルなセットアップ＋スニーカー",
      },
    },
    {
      name: "デニム（ライトブルー・ワイド）",
      goodFor: { faceType: ["フレッシュ", "クールカジュアル"], boneType: ["ナチュラル"] },
      careful: { boneType: ["ストレート", "ウェーブ"] },
      adjustments: {
        "ストレート": "ストレートデニム or 細めワイド",
        "ウェーブ": "ハイウエスト＋ライト素材のもの",
      },
    },
    {
      name: "シアー・レース",
      goodFor: { faceType: ["フェミニン", "エレガント"], boneType: ["ウェーブ"] },
      careful: { faceType: ["クールカジュアル"], boneType: ["ナチュラル"] },
      adjustments: {
        "クール": "ベージュやモノトーンのシアー素材を選ぶ",
        "ナチュラル": "大きめサイズで抜け感を出す",
      },
    },
    {
      name: "バルーンシルエット（パンツ）",
      goodFor: { boneType: ["ナチュラル"] },
      careful: { boneType: ["ストレート", "ウェーブ"] },
      adjustments: {
        "ストレート": "トップスをコンパクトに",
        "ウェーブ": "短丈トップスでウエスト位置を上げる",
      },
    },
    {
      name: "カラーブロッキング",
      goodFor: { faceType: ["クール", "エレガント"], boneType: ["ストレート"] },
      careful: { faceType: ["ソフトエレガント"], pc16: ["Light Summer", "Soft Summer", "Muted Summer"] },
      adjustments: {
        "ソフトエレガント": "淡色×淡色のソフトカラーブロッキングに",
      },
    },
  ],
  // 2026年春の注目色 × PCマッチング
  trendColorMatch: {
    "ロイヤルブルー": ["Bright Spring", "Cool Winter", "Vivid Winter"],
    "カーキグリーン": ["Soft Autumn", "Warm Autumn", "Deep Autumn"],
    "ライトピンク": ["Light Spring", "Light Summer", "Cool Summer"],
    "レッド": ["Bright Spring", "Bright Winter", "Cool Winter", "Deep Autumn"],
    "ブラウン": ["Warm Autumn", "Soft Autumn", "Deep Autumn"],
    "パープル・ライラック": ["Cool Summer", "Soft Summer", "Muted Summer"],
    "純白": ["Cool Winter", "Bright Winter", "Vivid Winter"],
    "アイボリー": ["Warm Spring", "Light Spring", "Soft Autumn"],
  },
};

// ─────────────────────────────────────────────────────────────────
// 6. 身長別の調整
// ─────────────────────────────────────────────────────────────────
export const HEIGHT_ADJUSTMENTS = {
  veryShort: {
    range: "〜150cm",
    label: "超低身長",
    tips: [
      "全アイテム：ジャストサイズか少しコンパクトめ",
      "ボトム：ハイウエスト必須、ロング丈は足首見せ",
      "アウター：ショート丈〜ヒップ丈、ロングはマキシ避ける",
      "柄：小さめ柄、大柄は△",
      "髪：ミディアム〜ロブが軽やか",
      "靴：厚底スニーカーやチャンキーソールで脚を長く",
    ],
  },
  short: {
    range: "150〜160cm",
    label: "低身長〜やや低め",
    tips: [
      "王道のスタイル本どおりで概ねOK",
      "ハイウエスト＋短丈トップスで重心を上げる",
      "ワイドパンツは丈に注意（足首見せ or くるぶし丈）",
      "ロングコートは身長近くまでに",
    ],
  },
  medium: {
    range: "160〜170cm",
    label: "標準",
    tips: ["大半のアイテムが似合う", "骨格どおりに選んでOK"],
  },
  tall: {
    range: "170cm〜",
    label: "高身長",
    tips: [
      "ロング丈・オーバーサイズが映える",
      "短丈トップスは丈が短すぎになりがち、長めの丈感を",
      "ハイウエスト効果は小さい、無理にこだわらない",
      "フルレングスのワイドパンツが映える",
      "縦長を生かす方が今っぽい",
    ],
  },
};

// 身長 → カテゴリへの変換ヘルパー
export const heightCategory = (cm) => {
  if (!cm) return null;
  if (cm < 150) return "veryShort";
  if (cm < 160) return "short";
  if (cm < 170) return "medium";
  return "tall";
};

// ─────────────────────────────────────────────────────────────────
// 7. 16PCを4PC（既存アプリ）にマッピング
// ─────────────────────────────────────────────────────────────────
export const PC16_TO_PC4 = {
  "Light Spring": "スプリング",   "Bright Spring": "スプリング",
  "Warm Spring": "スプリング",    "Vivid Spring": "スプリング",
  "Light Summer": "サマー",       "Cool Summer": "サマー",
  "Soft Summer": "サマー",        "Muted Summer": "サマー",
  "Soft Autumn": "オータム",      "Warm Autumn": "オータム",
  "Deep Autumn": "オータム",      "Dark Autumn": "オータム",
  "Bright Winter": "ウィンター",  "Cool Winter": "ウィンター",
  "Deep Winter": "ウィンター",    "Vivid Winter": "ウィンター",
};

// 4PC → そのグループの16PC一覧（既存4PCしかわからないユーザー向け）
export const PC4_TO_PC16 = {
  "スプリング":   ["Light Spring", "Bright Spring", "Warm Spring", "Vivid Spring"],
  "サマー":       ["Light Summer", "Cool Summer", "Soft Summer", "Muted Summer"],
  "オータム":     ["Soft Autumn", "Warm Autumn", "Deep Autumn", "Dark Autumn"],
  "ウィンター":   ["Bright Winter", "Cool Winter", "Deep Winter", "Vivid Winter"],
};

// 4PCしかわからないとき、デフォルトで使う「典型」サブタイプ
// → ユーザーが後でカラータブで自分のサブタイプを選び直せる
export const DEFAULT_PC4_REPRESENTATIVE = {
  "スプリング": "Warm Spring",
  "サマー":     "Cool Summer",
  "オータム":   "Warm Autumn",
  "ウィンター": "Cool Winter",
};

// ─────────────────────────────────────────────────────────────────
// 8. 統合ヘルパー関数
//    アプリのUI側で「この人へのアドバイス」を組み立てるための関数
// ─────────────────────────────────────────────────────────────────
/**
 * 3軸のキーから、その人向けのスタイルアドバイスを組み立てる
 * @param {Object} params
 * @param {string} params.faceType - 8タイプのいずれか（"フェミニン"など）
 * @param {string} params.boneType - 3骨格のいずれか（"ウェーブ"など）
 * @param {string} params.pc16     - 16PCのいずれか（"Cool Summer"など）
 * @param {number} [params.height] - 身長 cm（任意）
 * @returns {Object} 統合されたスタイル情報
 */
export const buildStyleAdvice = ({ faceType, boneType, pc16, height }) => {
  const face = FACE_TYPE_GUIDE[faceType];
  const bone = BONE_TYPE_GUIDE[boneType];
  const pc = PC16_GUIDE[pc16];
  if (!face || !bone || !pc) return null;

  const heightKey = heightCategory(height);
  const heightInfo = heightKey ? HEIGHT_ADJUSTMENTS[heightKey] : null;
  const heightTip = heightKey && bone.heightTips
    ? bone.heightTips[heightKey === "veryShort" || heightKey === "short" ? "short"
                    : heightKey === "tall" ? "tall" : "medium"]
    : null;

  // 衝突する組み合わせのアドバイスを抽出
  const conflicts = CONFLICT_RULES.examples.filter(c =>
    c.pattern.includes(faceType) ||
    c.pattern.includes(boneType) ||
    c.pattern.includes(pc16)
  );

  // 2026年春のトレンドのうち、似合うもの／注意するものを抽出
  const goodTrends = SPRING_2026_TREND_FIT.trendItems.filter(t =>
    t.goodFor?.faceType?.includes(faceType) ||
    t.goodFor?.boneType?.includes(boneType) ||
    t.goodFor?.pc16?.includes(pc16)
  );
  const carefulTrends = SPRING_2026_TREND_FIT.trendItems.filter(t =>
    t.careful?.faceType?.includes(faceType) ||
    t.careful?.boneType?.includes(boneType) ||
    t.careful?.pc16?.includes(pc16)
  );

  return {
    summary: `${faceType} × ${boneType} × ${pc16}`,
    fashionGenres: face.fashionGenres,
    impressionWords: face.impressionWords,
    silhouettes: bone.silhouettes,
    materials: bone.materials,
    bestColors: pc.bestColors,
    avoidColors: pc.avoidColors,
    springStaples: bone.springStaples,
    coordExample: pc.coordExample,
    hair: face.hair,
    spring2026Items: [...face.spring2026, ...bone.spring2026Fit.good],
    spring2026Careful: bone.spring2026Fit.careful,
    heightTip,
    heightInfo,
    conflicts,
    goodTrends: goodTrends.map(t => t.name),
    carefulTrends: carefulTrends.map(t => ({
      name: t.name,
      adjust: t.adjustments?.[boneType] || t.adjustments?.[faceType],
    })).filter(t => t.adjust),
  };
};
