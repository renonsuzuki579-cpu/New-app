import { useState, useEffect, useMemo } from "react";
import {
  FACE_TYPE_GUIDE,
  BONE_TYPE_GUIDE,
  PC16_GUIDE,
  CONFLICT_RULES,
  SPRING_2026_TREND_FIT,
  HEIGHT_ADJUSTMENTS,
  PC4_TO_PC16,
  DEFAULT_PC4_REPRESENTATIVE,
} from "./styleGuideData";
import { TermsContent, PrivacyContent } from "./legalContent";
import { ProductShowcase } from "./productCatalog";
import { DIAGNOSE_PROMPT } from "./diagnosePrompt";// 🆕 この行を追加

// ═══════════════════════════════════════════════════════════════
// 🔧 AI応答の正規化
//   Gemini が "ウェーブタイプ" や "スプリング(イエベ春)" のように
//   余計な文字をつけて返してきても、辞書のキーに合うよう整える。
//   これがないと楽天リンク・髪型・メイクなどが表示されない。
// ═══════════════════════════════════════════════════════════════
const normalizeBone = (s) => {
  if (!s) return s;
  const t = String(s);
  if (t.includes("ストレート") || /straight/i.test(t)) return "ストレート";
  if (t.includes("ウェーブ")   || /wave/i.test(t))     return "ウェーブ";
  if (t.includes("ナチュラル") || /natural/i.test(t))  return "ナチュラル";
  return t;
};

const normalizePC = (s) => {
  if (!s) return s;
  const t = String(s);
  if (t.includes("スプリング") || t.includes("春") || /spring/i.test(t)) return "スプリング";
  if (t.includes("サマー")     || t.includes("夏") || /summer/i.test(t)) return "サマー";
  if (t.includes("オータム")   || t.includes("秋") || /autumn|fall/i.test(t)) return "オータム";
  if (t.includes("ウィンター") || t.includes("冬") || /winter/i.test(t)) return "ウィンター";
  return t;
};

const normalizeFaceType = (s) => {
  if (!s) return s;
  const t = String(s).replace(/タイプ|系/g, "").trim();
  const order = ["アクティブキュート","クールカジュアル","ソフトエレガント",
                 "フェミニン","エレガント","フレッシュ","キュート","クール"];
  for (const x of order) if (t.includes(x)) return x;
  return t;
};

const normalizeAnalysis = (a) => {
  if (!a) return a;
  return {
    ...a,
    eightType: a.eightType ? { ...a.eightType, primary: normalizeFaceType(a.eightType.primary) } : a.eightType,
    bone: a.bone ? {
      ...a.bone,
      primary: normalizeBone(a.bone.primary),
      breakdown: Array.isArray(a.bone.breakdown)
        ? a.bone.breakdown.map(x => ({ ...x, type: normalizeBone(x.type) }))
        : a.bone.breakdown,
    } : a.bone,
    personalColor: a.personalColor ? { ...a.personalColor, primary: normalizePC(a.personalColor.primary) } : a.personalColor,
  };
};
// ═══════════════════════════════════════════════════════════════
// タイプ定義
// ═══════════════════════════════════════════════════════════════

const FACE_PARTS = [
  { id:"eyes",     label:"目",       emoji:"👁" },
  { id:"eyebrows", label:"眉毛",     emoji:"✏️" },
  { id:"nose",     label:"鼻",       emoji:"👃" },
  { id:"mouth",    label:"口",       emoji:"👄" },
  { id:"ears",     label:"耳",       emoji:"👂" },
  { id:"balance",  label:"顔の余白", emoji:"🪞" },
  { id:"depth",    label:"顔の凹凸", emoji:"⛰" },
];

const EIGHT_TYPES = [
  { id:"cute",           label:"キュート",           axes:"子供寄り × 親しみ × 曲線",    grad:"linear-gradient(135deg,#fbcfe8,#f9a8d4)" },
  { id:"fresh",          label:"フレッシュ",         axes:"子供寄り × 親しみ × 直線",    grad:"linear-gradient(135deg,#bbf7d0,#86efac)" },
  { id:"activeCute",     label:"アクティブキュート", axes:"子供寄り × かっこいい × 曲線", grad:"linear-gradient(135deg,#fde68a,#fbbf24)" },
  { id:"coolCasual",     label:"クールカジュアル",   axes:"子供寄り × かっこいい × 直線", grad:"linear-gradient(135deg,#bae6fd,#7dd3fc)" },
  { id:"feminine",       label:"フェミニン",         axes:"大人寄り × 親しみ × 曲線",    grad:"linear-gradient(135deg,#f5d0fe,#e879f9)" },
  { id:"softElegant",    label:"ソフトエレガント",   axes:"大人寄り × 親しみ × 直線",    grad:"linear-gradient(135deg,#e9d5ff,#c084fc)" },
  { id:"elegant",        label:"エレガント",         axes:"大人寄り × かっこいい × 曲線", grad:"linear-gradient(135deg,#fecaca,#f87171)" },
  { id:"cool",           label:"クール",             axes:"大人寄り × かっこいい × 直線", grad:"linear-gradient(135deg,#c7d2fe,#818cf8)" },
];

const BONE_TYPES = [
  { id:"straight", label:"ストレート", feature:"メリハリがあり上半身に厚み、肌に弾力", grad:"linear-gradient(135deg,#fef3c7,#fbbf24)" },
  { id:"wave",     label:"ウェーブ",   feature:"柔らかく華奢、下半身にボリューム",    grad:"linear-gradient(135deg,#fce7f3,#f472b6)" },
  { id:"natural",  label:"ナチュラル", feature:"フレーム感があり骨・関節が目立つ",    grad:"linear-gradient(135deg,#d1fae5,#34d399)" },
];

const PC_TYPES = [
  { id:"spring", label:"スプリング", tone:"イエローベース・明るい", colors:["コーラル","ピーチ","クリーム","サーモンピンク"], grad:"linear-gradient(135deg,#fde68a,#fb923c)" },
  { id:"summer", label:"サマー",     tone:"ブルーベース・柔らかい", colors:["ラベンダー","ローズピンク","スカイブルー","ミントグリーン"], grad:"linear-gradient(135deg,#bae6fd,#c4b5fd)" },
  { id:"autumn", label:"オータム",   tone:"イエローベース・深い",   colors:["テラコッタ","マスタード","カーキ","ブラウン"], grad:"linear-gradient(135deg,#fdba74,#c2410c)" },
  { id:"winter", label:"ウィンター", tone:"ブルーベース・鮮やか",   colors:["ロイヤルブルー","マゼンタ","ピュアホワイト","黒"], grad:"linear-gradient(135deg,#67e8f9,#6366f1)" },
];

// ═══════════════════════════════════════════════════════════════
// 🛍 商品提案データ
// ═══════════════════════════════════════════════════════════════
// 思想：
//   メインは「なぜ似合うのか」の論理的説明。
//   商品リンクはあくまで参考（ユーザーが理解した上で見に行ける場所）。
//
// 構造：
//   骨格3タイプ × カテゴリ3つ = 9パターンの「形」の提案
//   パーソナルカラー4タイプ      = 4パターンの「色」のガイド
//   この2つを組み合わせて、一人ひとりに合った提案を動的に作る。
//
// なぜこの分け方？
//   服選びで一番大事なのは「形（骨格）」と「色（パーソナルカラー）」。
//   8タイプ（フェミニン/クールなど）は印象づくりの軸であって、
//   実際の購入判断には骨格と色の方が直接影響する。
// ═══════════════════════════════════════════════════════════════

// 骨格 × カテゴリ別の「形」の提案
const BONE_RECOMMENDATIONS = {
  "ストレート": {
    "トップス": {
      itemName: "白のきれいめシャツ or Vネックニット",
      whyFits: "ストレートさんは上半身にハリがあって、シンプルな服ほどスタイルがよく見えるタイプ。Vネックや襟つきシャツで首元をスッキリ抜くと、それだけで一気に垢抜けます。",
      avoid: "フリル・リボン・パフ袖など甘めの装飾。盛りすぎると上半身が重くなって、せっかくのきれいめさが消えちゃいます。",
      checklist: ["素材: ハリのあるコットン、しっかりしたニット", "形: Vネック、襟つきシャツ、ジャストサイズ", "甘めを入れるなら: トップスか小物の1か所だけに", "避けたい: フリル多め、薄すぎる素材"],
      searchKeyword: "Vネックニット レディース",
    },
    "ボトムス": {
      itemName: "ストレートデニム or タイトスカート",
      whyFits: "ストレートさんは縦のラインを強調するボトムスが得意。ストレートデニムやIラインのスカートで脚をまっすぐ見せると、全体が縦長にすっきり整います。",
      avoid: "ふわっと広がるフレアスカート、プリーツ多め、ティアード。下半身にボリュームが出てバランスが崩れます。",
      checklist: ["素材: ハリのあるデニム、しっかりした生地", "形: ストレート、テーパード、Iラインスカート", "丈: フルレングス〜くるぶし", "避けたい: ふんわりフレア、ローライズ"],
      searchKeyword: "ストレートデニム レディース",
    },
    "アウター": {
      itemName: "テーラードジャケット or デニムジャケット",
      whyFits: "ストレートさんはきっちりした形が得意。テーラードジャケットでかっこよくキメるか、ジャストサイズのデニムジャケットでカジュアルに振るかで雰囲気を変えられます。",
      avoid: "ボアコート、もこもこダウン、フリル装飾の多いアウター。上半身がさらに大きく見えてしまいます。",
      checklist: ["素材: しっかりしたコットン、ウール、デニム", "形: テーラード、ジャストサイズのGジャン", "丈: ヒップ程度〜ショート丈", "避けたい: ボリューム素材、フリル多め"],
      searchKeyword: "テーラードジャケット レディース 春",
    },
  },
  "ウェーブ": {
    "トップス": {
      itemName: "ボウタイブラウス or ショート丈カーディガン",
      whyFits: "ウェーブさんは華奢で柔らかい上半身が魅力。ボウタイブラウスやリブニットのショート丈で重心を上げると、可愛さもスタイルアップも両方叶います。今春は特にボウタイ系が来てます。",
      avoid: "厚手のごつい素材、長すぎるトップス、ローウエスト。重心が下がってウェーブのバランスが崩れます。",
      checklist: ["素材: シフォン、薄手のリブ、とろみ素材", "形: ショート丈、ウエスト位置を高く、ボウタイ・パフ袖", "首元: リボン、フリル、丸みのある襟", "避けたい: 厚手の重い生地、長すぎる丈"],
      searchKeyword: "ボウタイブラウス レディース",
    },
    "ボトムス": {
      itemName: "ハイウエストのフレアスカート or マーメイドスカート",
      whyFits: "ウェーブさんはハイウエストで脚を長く見せるのが鉄則。フレアやマーメイドの揺れる軽やかなシルエットなら、女の子らしさがそのまま強みになります。",
      avoid: "ローライズデニム、ハードなストレートパンツ。ウエスト位置が下がるとスタイルが崩れて見えます。",
      checklist: ["素材: 軽くて柔らかい、揺れる生地", "形: フレア、マーメイド、プリーツ", "ウエスト: ハイウエスト必須", "避けたい: ローライズ、硬めのデニム"],
      searchKeyword: "ハイウエスト フレアスカート",
    },
    "アウター": {
      itemName: "ショート丈のデニムジャケット or カーディガン",
      whyFits: "ウェーブさんはとにかく「ショート丈」と相性が良いです。デニムジャケットやカーディガンを腰より上の丈で羽織ると、重心が上がって脚が長く見えます。",
      avoid: "ロングコート、ロングカーディガン、ボリュームたっぷりのダウン。下重心がさらに強調されてしまいます。",
      checklist: ["素材: 柔らかいニット、軽いデニム", "形: ノーカラー、丸みのあるライン、ショート丈", "丈: ウエスト〜ヒップ手前", "避けたい: ロング丈、重い素材"],
      searchKeyword: "ショート丈 デニムジャケット レディース",
    },
  },
  "ナチュラル": {
    "トップス": {
      itemName: "オーバーサイズシャツ or ニットベスト",
      whyFits: "ナチュラルさんはラフでこなれ感のある服が得意。オーバーサイズシャツでゆるっと羽織ったり、ニットベストでレイヤードすると、骨格感が一気にスタイルの良さに変わります。",
      avoid: "ピチピチのカットソー、繊細すぎる甘いブラウス。骨っぽさが目立って服に着られている印象になります。",
      checklist: ["素材: コットン、リネン、デニム、ざっくりニット", "形: オーバーサイズ、ドロップショルダー、ベスト重ね", "雰囲気: 抜け感、こなれ、レイヤード", "避けたい: ピチピチ、繊細レース、上品すぎる素材"],
      searchKeyword: "オーバーサイズシャツ レディース",
    },
    "ボトムス": {
      itemName: "ワイドデニム or カーゴパンツ",
      whyFits: "ナチュラルさんは長めの手足とフレーム感を活かせる、ゆったり系ボトムスが鉄板。ワイドデニムやカーゴはこなれ感が出て、今っぽい韓国系コーデにも振れます。",
      avoid: "スキニーデニム、ピタッとしたミニタイトスカート。骨や関節が強調されて本来の良さが消えてしまいます。",
      checklist: ["素材: しっかりしたデニム、コットン、リネン", "形: ワイド、ストレート、カーゴ", "丈: フルレングス、マキシ、足首見せ", "避けたい: スキニー、ミニタイト"],
      searchKeyword: "ワイドデニム レディース",
    },
    "アウター": {
      itemName: "デニムジャケット（ロング） or ロングカーディガン",
      whyFits: "ナチュラルさんは「縦の長さ」が武器。ロングのデニムジャケットやざっくりロングカーデを羽織るだけで、スタイル良く見えてこなれた雰囲気が出ます。",
      avoid: "ジャストサイズのテーラードジャケット、きっちりしすぎたコート。ナチュラルのラフさと合わず堅苦しく見えます。",
      checklist: ["素材: デニム、ざっくりニット、リネン", "形: ロング、ゆるめのライン", "丈: ヒップ下〜膝下", "避けたい: ジャストサイズのテーラード"],
      searchKeyword: "ロング デニムジャケット レディース",
    },
  },
};

// パーソナルカラー別の「色」のガイド
const PC_COLOR_GUIDE = {
  "スプリング": {
    description: "明るくクリアな色が肌をフレッシュに見せるイエベタイプ。春らしい軽やかさやポップさが得意で、明るいデニムや白小物との相性が抜群です。",
    recommend: ["コーラル", "ピーチ", "アイボリー", "明るいベージュ", "ライトグリーン", "オレンジ"],
    avoid: ["くすんだ色", "暗すぎる色", "真っ黒"],
    tip: "明るく澄んだ色を選ぶと、肌のツヤと透明感が出ます。",
    coordExample: "アイボリーのブラウス＋明るいデニム＋ゴールド小物",
  },
  "サマー": {
    description: "柔らかく透明感のある色が似合うブルベタイプ。淡い色や少しスモーキーなトーンで、上品で清楚な雰囲気が作れます。",
    recommend: ["ラベンダー", "ローズピンク", "スモーキーブルー", "ミントグリーン", "グレージュ"],
    avoid: ["鮮やかな暖色", "オレンジ", "蛍光色"],
    tip: "白っぽい柔らかい色を選ぶと、清楚で上品な印象が出ます。",
    coordExample: "ラベンダーのカーディガン＋白トップス＋ライトグレーのスカート",
  },
  "オータム": {
    description: "深みと温かみのある色が似合うイエベタイプ。アースカラーやこっくりした色を使うと、こなれて大人っぽい雰囲気に。",
    recommend: ["テラコッタ", "マスタード", "カーキ", "ブラウン", "ボルドー", "オリーブ"],
    avoid: ["蛍光色", "明るすぎるパステル", "純白"],
    tip: "アースカラーや深い色を選ぶと、洗練された大人っぽさが出ます。",
    coordExample: "ブラウンのシャツ＋カーキのワイドパンツ＋レザー小物",
  },
  "ウィンター": {
    description: "ハッキリした色やコントラストの効いた色が映えるブルベタイプ。鮮やかな色と白黒のメリハリで、シャープでかっこいい印象が作れます。",
    recommend: ["ロイヤルブルー", "マゼンタ", "ピュアホワイト", "ブラック", "ワインレッド", "ネイビー"],
    avoid: ["アースカラー", "オフホワイト", "くすんだ色"],
    tip: "はっきりした色や白黒のメリハリで、一気に垢抜けます。",
    coordExample: "白シャツ＋ブラックのストレートデニム＋差し色の赤小物",
  },
};

// 楽天市場の検索URLを作る
// アフィリエイトIDを使用してアフィリエイトリンクとして発行する
const RAKUTEN_AFFILIATE_ID = "532f53ca.02addeb3.532f53cb.ef93f387";
const buildRakutenSearchUrl = (keyword) => {
  const encoded = encodeURIComponent(keyword);
  const baseUrl = `https://search.rakuten.co.jp/search/mall/${encoded}/`;
  if (RAKUTEN_AFFILIATE_ID) {
    return `https://hb.afl.rakuten.co.jp/hgc/${RAKUTEN_AFFILIATE_ID}/?pc=${encodeURIComponent(baseUrl)}`;
  }
  return baseUrl;
};

// 今の月から季節を判定する
const getCurrentSeason = () => {
  const month = new Date().getMonth() + 1; // 1-12
  if (month >= 3 && month <= 5) return "春";
  if (month >= 6 && month <= 8) return "夏";
  if (month >= 9 && month <= 11) return "秋";
  return "冬";
};

// ═══════════════════════════════════════════════════════════════
// 🌸 2026年春の組み合わせデータ
// ═══════════════════════════════════════════════════════════════
// 思想：
//   既存の商品提案は「定番の理論」で年中使える内容。
//   こちらは「今年・今シーズン」のリアルなコーデ感を補強する。
//   骨格別の具体的なコーデ例 + 旬のトレンド + 4軸調整のコツ。
// ═══════════════════════════════════════════════════════════════

// 骨格別の春コーデ例（4パターンずつ）
const SPRING_OUTFITS_2026 = {
  "ストレート": [
    "白のきれいめシャツ × ストレートデニム × ローファー",
    "Vネックニット × タイトスカート × ミニバッグ",
    "テーラードジャケット × ストレートパンツ × Tシャツ",
    "シンプルワンピース × ショート丈カーディガン × きれいめサンダル",
  ],
  "ウェーブ": [
    "リブニット × ハイウエストのフレアスカート",
    "ショート丈カーディガン × マーメイドスカート",
    "ボウタイブラウス × テーパードパンツ × パンプス",
    "透け感ブラウス × ショート丈ボトム × サンダル",
  ],
  "ナチュラル": [
    "オーバーサイズシャツ × ワイドデニム × スニーカー",
    "ロングワンピース × デニムジャケット × フラットシューズ",
    "ニットベスト × Tシャツ × カーゴパンツ",
    "ストライプシャツワンピ × ブーツ",
  ],
};

// 骨格別の夏コーデ例（基本パターン4つずつ）
// ※ トレンド情報は省略。夏のリアルなトレンド資料が来たら、SPRING相当に拡張する
const SUMMER_OUTFITS_BASIC = {
  "ストレート": [
    "シンプルな半袖カットソー × ストレートデニム × サンダル",
    "リネンシャツ × タイトスカート × ローファー",
    "ノースリーブブラウス × ストレートパンツ × バレエシューズ",
    "Vネックワンピース × ミニバッグ × フラットサンダル",
  ],
  "ウェーブ": [
    "フリル袖ブラウス × ハイウエストフレアスカート × サンダル",
    "キャミソール × 透け感カーディガン × ミニスカート",
    "ショート丈Tシャツ × プリーツスカート × パンプス",
    "ボウタイブラウス × ハイウエストショートパンツ × ストラップサンダル",
  ],
  "ナチュラル": [
    "リネンシャツ × ワイドパンツ × スニーカー",
    "Tシャツワンピ × デニムジャケット × フラットサンダル",
    "オーバーサイズTシャツ × ワイドデニム × スポーツサンダル",
    "ノースリーブのリネンワンピ × バスケット型バッグ",
  ],
};

// 骨格別の秋コーデ例（基本パターン4つずつ）
const AUTUMN_OUTFITS_BASIC = {
  "ストレート": [
    "白シャツ × タイトスカート × ローファー",
    "ハリのあるニット × ストレートデニム × ショートブーツ",
    "トレンチコート × きれいめパンツ × ローファー",
    "シンプルニット × Iラインスカート × パンプス",
  ],
  "ウェーブ": [
    "ふんわりニット × プリーツスカート × ショートブーツ",
    "ショート丈カーディガン × ハイウエストパンツ × パンプス",
    "リブニット × フレアスカート × バレエシューズ",
    "ボウタイブラウス × タイトスカート × パンプス",
  ],
  "ナチュラル": [
    "オーバーサイズニット × ワイドパンツ × スニーカー",
    "ロングカーディガン × デニム × ブーツ",
    "チェックシャツ × ワイドデニム × ブーツ",
    "ニットベスト × Tシャツ × カーゴパンツ × スニーカー",
  ],
};

// 骨格別の冬コーデ例（基本パターン4つずつ）
const WINTER_OUTFITS_BASIC = {
  "ストレート": [
    "チェスターコート × きれいめニット × ストレートパンツ",
    "タートルネックニット × タイトスカート × ロングブーツ",
    "テーラードジャケット × Vネックニット × ストレートデニム",
    "シンプルなコート × タートル × きれいめパンツ × ローファー",
  ],
  "ウェーブ": [
    "ショート丈ダウン × フレアスカート × ショートブーツ",
    "ノーカラーコート × リブニット × ハイウエストパンツ",
    "ふんわりニット × プリーツスカート × ブーツ",
    "ファー付きコート × ボウタイブラウス × タイトスカート",
  ],
  "ナチュラル": [
    "ロングダウン × ニット × ワイドデニム × スニーカー",
    "ボアコート × オーバーサイズニット × ワイドパンツ",
    "ロングコート × タートルネック × ブーツ",
    "ニットワンピ × ロングカーディガン × ロングブーツ",
  ],
};

// 季節 → コーデデータのマップ（季節判定で出し分けるための索引）
const SEASONAL_OUTFITS = {
  "春": SPRING_OUTFITS_2026,
  "夏": SUMMER_OUTFITS_BASIC,
  "秋": AUTUMN_OUTFITS_BASIC,
  "冬": WINTER_OUTFITS_BASIC,
};

// 2026年春の旬トレンド（全骨格共通）
const SPRING_TRENDS_2026 = {
  description: "2026年春のキーワードは「軽やかさ」「華やぎ」「甘辛ミックス」。少し大人っぽく見える組み方が今っぽいです。",
  keyItems: ["ボウタイブラウス", "3Dフラワー", "セットアップ", "スカーフ", "ライトブルーデニム", "セーラー衿"],
  trendColors: ["赤", "白", "パープル", "ライトブルー", "明るいパステル"],
  patterns: ["花柄", "ドット", "ボタニカル"],
  styling: [
    "かわいく見せたいなら → ボウタイブラウス × デニム",
    "きれいめに寄せるなら → セットアップ × スニーカー",
    "こなれ感を出すなら → 白トップス × ワイドデニム × スカーフ",
    "韓国っぽく見せるなら → シンプルなトップスに立体モチーフや赤小物",
  ],
};

// 「似合わない服」を着たいときの4軸調整理論
const FOUR_AXIS_TIPS = [
  {
    axis: "丈",
    icon: "📏",
    tip: "上半身が重く見えるなら短丈トップス。下重心ならハイウエスト＋短丈で目線を上げる。",
  },
  {
    axis: "重心",
    icon: "⚖️",
    tip: "ウエストマークやベルトで重心を調整。ロングスカートでも、トップスをインして足首を見せれば軽く見える。",
  },
  {
    axis: "素材",
    icon: "🧵",
    tip: "服が重く見えるなら軽い素材へ。甘すぎるなら、デニムやスニーカーを足して中和する。",
  },
  {
    axis: "小物",
    icon: "👜",
    tip: "顔周りの小物（スカーフ・ピアス）で華やかさをプラス。バッグや靴で「抜け感」を演出。",
  },
];

// ═══════════════════════════════════════════════════════════════
// サンプル診断データ（AI呼び出し失敗時のフォールバック用）
// ═══════════════════════════════════════════════════════════════
const sampleAnalysis = (eightType="フェミニン", bone="ウェーブ", pc="スプリング") => ({
  parts:{
    eyes:"やや丸みを帯びた、印象的な目元です。",
    eyebrows:"自然なアーチを描き、優しい印象。",
    nose:"鼻筋が通り、バランスの良い形。",
    mouth:"口角がやや上がり、親しみやすい印象。",
    ears:"顔とのバランスが整っています。",
    balance:"パーツの配置に余裕があり、落ち着いた印象。",
    depth:"自然な陰影があり、立体感があります。",
  },
  charm:"温かみのある自然体な表情が魅力です。",
  eightType:{
    primary: eightType,
    axes:{ age:"大人寄り", impression:"親しみ", line:"曲線" },
    note:"柔らかい印象と曲線的なラインが特徴的に見えます。",
  },
  bone:{
    primary: bone,
    breakdown:[
      { type: bone, percentage:55 },
      { type: BONE_TYPES.filter(b=>b.label!==bone)[0].label, percentage:25 },
      { type: BONE_TYPES.filter(b=>b.label!==bone)[1].label, percentage:20 },
    ],
    note:"首や肩の印象からの推測です。より正確な判定には全身写真が必要です。",
  },
  personalColor:{
    primary: pc,
    undertone: pc==="スプリング"||pc==="オータム" ? "イエローベース" : "ブルーベース",
    note:"肌の明るさとトーンから判定しました。",
    recommendedColors: PC_TYPES.find(p=>p.label===pc)?.colors.slice(0,3) || [],
  },
});

// ═══════════════════════════════════════════════════════════════
// 画像リサイズ
// ═══════════════════════════════════════════════════════════════
const resizeImage = (dataUrl, maxSize = 1024) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > height && width > maxSize) {
        height = Math.round((height * maxSize) / width);
        width = maxSize;
      } else if (height > maxSize) {
        width = Math.round((width * maxSize) / height);
        height = maxSize;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};

// ═══════════════════════════════════════════════════════════════
// 共通UI部品
// ═══════════════════════════════════════════════════════════════
const Orbs = () => (
  <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
    <div style={{position:"absolute",top:"-80px",left:"-60px",width:280,height:280,borderRadius:"50%",
      background:"radial-gradient(circle,rgba(244,114,182,0.28),transparent 70%)",filter:"blur(8px)"}}/>
    <div style={{position:"absolute",top:"35%",right:"-80px",width:240,height:240,borderRadius:"50%",
      background:"radial-gradient(circle,rgba(167,139,250,0.22),transparent 70%)",filter:"blur(8px)"}}/>
    <div style={{position:"absolute",bottom:"8%",left:"5%",width:200,height:200,borderRadius:"50%",
      background:"radial-gradient(circle,rgba(96,165,250,0.18),transparent 70%)",filter:"blur(8px)"}}/>
  </div>
);

const GradBtn = ({ grad, onClick, disabled, children, small }) => (
  <button onClick={onClick} disabled={disabled} style={{
    width:"100%", padding:small?"10px 14px":"15px", borderRadius:small?12:18,
    border:"none", background:disabled?"rgba(255,255,255,0.08)":grad,
    color:disabled?"rgba(255,255,255,0.25)":"#fff", fontWeight:800,
    fontSize:small?13:15, cursor:disabled?"not-allowed":"pointer",
    boxShadow:disabled?"none":"0 4px 18px rgba(0,0,0,0.3)", transition:"all .15s",
    letterSpacing:"0.2px",
  }}>{children}</button>
);

const BackBtn = ({ onClick }) => (
  <button onClick={onClick} style={{
    background:"none", border:"none", cursor:"pointer", padding:0,
    fontSize:14, fontWeight:700, color:"rgba(255,255,255,0.4)", alignSelf:"flex-start",
  }}>← 戻る</button>
);

const Glass = ({ children, style={} }) => (
  <div style={{borderRadius:24, background:"rgba(255,255,255,0.06)", backdropFilter:"blur(18px)",
    border:"1.5px solid rgba(255,255,255,0.11)", boxShadow:"0 6px 28px rgba(0,0,0,0.3)", ...style}}>
    {children}
  </div>
);

// 履歴画面のタイプ絞り込みチップでだけ使用
const FilterChip = ({ label, active, onClick, grad }) => (
  <button onClick={onClick} style={{
    padding:"7px 14px", borderRadius:99, border:"none", cursor:"pointer",
    background:active?(grad||"linear-gradient(135deg,#f472b6,#c084fc)"):"rgba(255,255,255,0.08)",
    color:active?"#fff":"rgba(255,255,255,0.45)",
    fontWeight:active?800:500, fontSize:12, whiteSpace:"nowrap",
    boxShadow:active?"0 2px 10px rgba(0,0,0,0.25)":"none", transition:"all .15s",
  }}>{label}</button>
);

// ═══════════════════════════════════════════════════════════════
// ボトムナビ（3タブに縮小）
// ═══════════════════════════════════════════════════════════════
const BottomNav = ({ current, onChange }) => {
  const tabs = [
    { id:"home",    label:"診断",  icon:"🤖", grad:"linear-gradient(135deg,#8b5cf6,#ec4899)" },
    { id:"history", label:"履歴",  icon:"🗂", grad:"linear-gradient(135deg,#818cf8,#60a5fa)" },
    { id:"mypage",  label:"マイ",  icon:"👤", grad:"linear-gradient(135deg,#06b6d4,#34d399)" },
  ];
  return (
    <div style={{position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)",
      width:"100%", maxWidth:430, zIndex:100,
      background:"rgba(15,10,30,0.85)", backdropFilter:"blur(24px)",
      borderTop:"1px solid rgba(255,255,255,0.1)", padding:"8px 10px 18px"}}>
      <div style={{display:"flex",justifyContent:"space-around",alignItems:"center"}}>
        {tabs.map(t => {
          const active = current === t.id;
          return (
            <button key={t.id} onClick={()=>onChange(t.id)} style={{
              background:"none", border:"none", cursor:"pointer", padding:"6px 10px",
              display:"flex", flexDirection:"column", alignItems:"center", gap:3, flex:1}}>
              <div style={{fontSize:22, transition:"transform .15s",
                transform:active?"scale(1.15)":"scale(1)",
                filter:active?"none":"grayscale(1) opacity(0.5)"}}>{t.icon}</div>
              <div style={{fontSize:10, fontWeight:800,
                background: active ? t.grad : "transparent",
                WebkitBackgroundClip: active ? "text" : "initial",
                WebkitTextFillColor: active ? "transparent" : "rgba(255,255,255,0.4)"}}>
                {t.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// AI Analysis Card（診断結果のメイン表示）
// ═══════════════════════════════════════════════════════════════
const AIAnalysisCard = ({ analysis, defaultOpen=true }) => {
  const [open, setOpen] = useState(defaultOpen);
  const [tab, setTab] = useState("eight");
  if (!analysis) return null;

  const tabs = [
    { id:"eight", label:"8タイプ",   icon:"💫", show: !!analysis.eightType },
    { id:"bone",  label:"骨格",      icon:"🦴", show: !!analysis.bone },
    { id:"color", label:"カラー",    icon:"🎨", show: !!analysis.personalColor },
    { id:"parts", label:"パーツ",    icon:"👁",  show: !!analysis.parts },
  ].filter(t => t.show);

  return (
    <div style={{borderRadius:16,overflow:"hidden",
      background:"linear-gradient(145deg,rgba(139,92,246,0.12),rgba(236,72,153,0.08))",
      border:"1px solid rgba(139,92,246,0.3)"}}>
      <div style={{padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",
        background:"linear-gradient(135deg,rgba(139,92,246,0.25),rgba(236,72,153,0.15))",
        borderBottom:"1px solid rgba(255,255,255,0.08)",cursor:"pointer"}}
        onClick={()=>setOpen(o=>!o)}>
        <span style={{fontSize:12,fontWeight:800,
          background:"linear-gradient(135deg,#c084fc,#ec4899)",
          WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
          🤖 AI詳細診断 by Claude
        </span>
        <span style={{fontSize:11,color:"rgba(255,255,255,0.5)",fontWeight:700}}>
          {open?"▲ 閉じる":"▼ 詳細"}
        </span>
      </div>

      <div style={{padding:"14px 16px"}}>
        {analysis.charm && (
          <div style={{fontSize:14,color:"rgba(255,255,255,0.85)",lineHeight:1.6,fontStyle:"italic",
            background:"linear-gradient(135deg,#f9a8d4,#c084fc,#818cf8)",
            WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontWeight:700}}>
            💭 {analysis.charm}
          </div>
        )}

        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:12}}>
          {analysis.eightType?.primary && (
            <span style={{padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:800,color:"#fff",
              background:EIGHT_TYPES.find(e=>e.label===analysis.eightType.primary)?.grad||"linear-gradient(135deg,#818cf8,#c084fc)"}}>
              💫 {analysis.eightType.primary}
            </span>
          )}
          {analysis.bone?.primary && (
            <span style={{padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:800,color:"#fff",
              background:BONE_TYPES.find(b=>b.label===analysis.bone.primary)?.grad||"linear-gradient(135deg,#34d399,#06b6d4)"}}>
              🦴 {analysis.bone.primary}
            </span>
          )}
          {analysis.personalColor?.primary && (
            <span style={{padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:800,color:"#fff",
              background:PC_TYPES.find(p=>p.label===analysis.personalColor.primary)?.grad||"linear-gradient(135deg,#fb923c,#f43f5e)"}}>
              🎨 {analysis.personalColor.primary}
            </span>
          )}
        </div>

        {open && (
          <>
            {tabs.length > 1 && (
              <div style={{display:"flex",gap:5,marginTop:16,padding:"3px",
                background:"rgba(0,0,0,0.25)",borderRadius:12,
                border:"1px solid rgba(255,255,255,0.05)"}}>
                {tabs.map(t => (
                  <button key={t.id} onClick={()=>setTab(t.id)} style={{
                    flex:1, padding:"7px 4px", borderRadius:9, border:"none",
                    background: tab===t.id ? "linear-gradient(135deg,#8b5cf6,#ec4899)" : "transparent",
                    color: tab===t.id ? "#fff" : "rgba(255,255,255,0.45)",
                    fontSize:11, fontWeight:800, cursor:"pointer", transition:"all .15s"}}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            )}

            {tab==="parts" && analysis.parts && (
              <div style={{marginTop:14}}>
                <div style={{fontSize:11,fontWeight:800,color:"rgba(255,255,255,0.55)",marginBottom:10,letterSpacing:"0.5px"}}>◆ パーツごとの観察</div>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {FACE_PARTS.map(part => analysis.parts[part.id] && (
                    <div key={part.id} style={{display:"flex",gap:10,alignItems:"flex-start",
                      padding:"10px 12px",borderRadius:12,background:"rgba(255,255,255,0.04)"}}>
                      <div style={{fontSize:13,minWidth:72,color:"rgba(255,255,255,0.6)",fontWeight:800}}>
                        {part.emoji} {part.label}
                      </div>
                      <div style={{fontSize:12,color:"rgba(255,255,255,0.8)",lineHeight:1.6,flex:1}}>
                        {analysis.parts[part.id]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab==="eight" && analysis.eightType && (
              <div style={{marginTop:14}}>
                <div style={{fontSize:11,fontWeight:800,color:"rgba(255,255,255,0.55)",marginBottom:10}}>◆ 8タイプ分類</div>
                <div style={{padding:"14px",borderRadius:14,
                  background:EIGHT_TYPES.find(e=>e.label===analysis.eightType.primary)?.grad||"linear-gradient(135deg,#818cf8,#c084fc)",
                  color:"#fff",textAlign:"center"}}>
                  <div style={{fontSize:11,fontWeight:700,opacity:0.85}}>あなたのタイプは</div>
                  <div style={{fontSize:22,fontWeight:900,marginTop:4}}>💫 {analysis.eightType.primary}</div>
                </div>
                {analysis.eightType.axes && (
                  <div style={{marginTop:12,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                    {[
                      { key:"age",        label:"年齢感" },
                      { key:"impression", label:"印象" },
                      { key:"line",       label:"ライン" },
                    ].map(a => (
                      <div key={a.key} style={{padding:"8px",borderRadius:10,
                        background:"rgba(255,255,255,0.06)",textAlign:"center"}}>
                        <div style={{fontSize:10,color:"rgba(255,255,255,0.4)"}}>{a.label}</div>
                        <div style={{fontSize:12,fontWeight:800,color:"#fff",marginTop:3}}>
                          {analysis.eightType.axes[a.key] || "-"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {analysis.eightType.note && (
                  <div style={{fontSize:12,color:"rgba(255,255,255,0.7)",marginTop:12,lineHeight:1.6,
                    padding:"10px 12px",borderRadius:10,background:"rgba(255,255,255,0.04)"}}>
                    {analysis.eightType.note}
                  </div>
                )}
                <div style={{marginTop:14,paddingTop:14,borderTop:"1px dashed rgba(255,255,255,0.12)"}}>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",marginBottom:8}}>8タイプ一覧</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
                    {EIGHT_TYPES.map(e => (
                      <div key={e.id} style={{padding:"6px 8px",borderRadius:8,
                        background: e.label===analysis.eightType.primary ? e.grad : "rgba(255,255,255,0.04)",
                        border: e.label===analysis.eightType.primary ? "1px solid rgba(255,255,255,0.3)" : "1px solid rgba(255,255,255,0.06)"}}>
                        <div style={{fontSize:11,fontWeight:800,color: e.label===analysis.eightType.primary ? "#fff" : "rgba(255,255,255,0.5)"}}>
                          {e.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab==="bone" && analysis.bone && (
              <div style={{marginTop:14}}>
                <div style={{fontSize:11,fontWeight:800,color:"rgba(255,255,255,0.55)",marginBottom:10}}>◆ 骨格診断</div>
                <div style={{padding:"14px",borderRadius:14,
                  background:BONE_TYPES.find(b=>b.label===analysis.bone.primary)?.grad||"linear-gradient(135deg,#34d399,#06b6d4)",
                  color:"#fff",textAlign:"center"}}>
                  <div style={{fontSize:11,fontWeight:700,opacity:0.85}}>あなたの骨格は</div>
                  <div style={{fontSize:22,fontWeight:900,marginTop:4}}>🦴 {analysis.bone.primary}タイプ</div>
                  <div style={{fontSize:11,marginTop:4,opacity:0.85}}>
                    {BONE_TYPES.find(b=>b.label===analysis.bone.primary)?.feature}
                  </div>
                </div>
                {analysis.bone.breakdown && (
                  <div style={{marginTop:12}}>
                    {analysis.bone.breakdown.map((item, i) => {
                      const typeData = BONE_TYPES.find(b=>b.label===item.type);
                      return (
                        <div key={i} style={{marginBottom:8}}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                            <span style={{fontSize:12,fontWeight:700,color:i===0?"#fff":"rgba(255,255,255,0.6)"}}>
                              {i===0?"🏆 ":""}{item.type}
                            </span>
                            <span style={{fontSize:11,fontWeight:800,color:"#34d399"}}>{item.percentage}%</span>
                          </div>
                          <div style={{background:"rgba(255,255,255,0.08)",borderRadius:99,height:5,overflow:"hidden"}}>
                            <div style={{width:`${item.percentage}%`,height:"100%",borderRadius:99,
                              background: typeData?.grad || "linear-gradient(90deg,#34d399,#06b6d4)",
                              transition:"width .6s ease"}}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {analysis.bone.note && (
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.55)",marginTop:12,lineHeight:1.5,
                    padding:"8px 10px",borderRadius:10,
                    background:"rgba(255,200,100,0.08)",border:"1px solid rgba(255,200,100,0.2)"}}>
                    ⚠️ {analysis.bone.note}
                  </div>
                )}
              </div>
            )}

            {tab==="color" && analysis.personalColor && (
              <div style={{marginTop:14}}>
                <div style={{fontSize:11,fontWeight:800,color:"rgba(255,255,255,0.55)",marginBottom:10}}>◆ パーソナルカラー</div>
                <div style={{padding:"14px",borderRadius:14,
                  background:PC_TYPES.find(p=>p.label===analysis.personalColor.primary)?.grad||"linear-gradient(135deg,#fb923c,#f43f5e)",
                  color:"#fff",textAlign:"center"}}>
                  <div style={{fontSize:11,fontWeight:700,opacity:0.85}}>あなたのシーズンは</div>
                  <div style={{fontSize:22,fontWeight:900,marginTop:4}}>🎨 {analysis.personalColor.primary}</div>
                  {analysis.personalColor.undertone && (
                    <div style={{fontSize:11,marginTop:4,opacity:0.9}}>{analysis.personalColor.undertone}</div>
                  )}
                </div>
                {analysis.personalColor.recommendedColors && analysis.personalColor.recommendedColors.length > 0 && (
                  <div style={{marginTop:12}}>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.5)",marginBottom:8,fontWeight:700}}>🎨 おすすめカラー</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                      {analysis.personalColor.recommendedColors.map((c,i) => (
                        <span key={i} style={{padding:"5px 12px",borderRadius:20,fontSize:12,fontWeight:700,color:"#fff",
                          background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)"}}>{c}</span>
                      ))}
                    </div>
                  </div>
                )}
                {analysis.personalColor.note && (
                  <div style={{fontSize:12,color:"rgba(255,255,255,0.7)",marginTop:12,lineHeight:1.6,
                    padding:"10px 12px",borderRadius:10,background:"rgba(255,255,255,0.04)"}}>
                    {analysis.personalColor.note}
                  </div>
                )}
                <div style={{marginTop:14,paddingTop:14,borderTop:"1px dashed rgba(255,255,255,0.12)"}}>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",marginBottom:8}}>4シーズン一覧</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
                    {PC_TYPES.map(p => {
                      const active = p.label===analysis.personalColor.primary;
                      return (
                        <div key={p.id} style={{padding:"8px",borderRadius:10,
                          background: active ? p.grad : "rgba(255,255,255,0.04)",
                          border: active ? "1px solid rgba(255,255,255,0.3)" : "1px solid rgba(255,255,255,0.06)"}}>
                          <div style={{fontSize:11,fontWeight:800,color:active?"#fff":"rgba(255,255,255,0.5)"}}>
                            {p.label}
                          </div>
                          <div style={{fontSize:9,color:active?"rgba(255,255,255,0.8)":"rgba(255,255,255,0.35)",marginTop:2}}>
                            {p.tone}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div style={{marginTop:14,padding:"8px 10px",borderRadius:10,
              background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)"}}>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",lineHeight:1.5}}>
                ⚠️ AIの分析は参考情報です。あなたの魅力はタイプで決まりません。
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// Main App
// ═══════════════════════════════════════════════════════════════
export default function HyokaApp() {
  // mode: "home" | "history" | "mypage" | "invite"
  const [mode, setMode] = useState("home");
  const [uploadedImg, setUploadedImg] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [toast, setToast] = useState(null);
  const [aiHistoryTypeFilter, setAiHistoryTypeFilter] = useState(null);
  const [aiOnlyHistory, setAiOnlyHistory] = useState([]);
  const [inviteUrl, setInviteUrl] = useState("");

  // 🆕 体型情報(任意入力、骨格判定の精度UP用)
  const [bodyHeight, setBodyHeight] = useState("");
  const [bodyShoulderHip, setBodyShoulderHip] = useState(null); // null | "shoulder" | "hip" | "same"
  const [bodyClavicle, setBodyClavicle] = useState(null); // null | "visible" | "hidden"

  useEffect(() => {
    if (typeof window !== "undefined") {
      setInviteUrl(window.location.href);
    }
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(null),2400); };

  const handleImageUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    e.target.value = "";

    if (!file.type.startsWith("image/")) {
      showToast("⚠️ 画像ファイルを選んでください");
      return;
    }

    showToast("📸 画像を読み込み中...");
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const resized = await resizeImage(ev.target.result, 1024);
          setUploadedImg(resized);
          setAnalysisResult(null);
          showToast("✅ 画像を読み込みました");
        } catch (err) {
          console.error("画像リサイズエラー:", err);
          showToast("⚠️ 画像の読み込みに失敗しました");
        }
      };
      reader.onerror = () => {
        showToast("⚠️ ファイルの読み込みに失敗しました");
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("画像アップロードエラー:", err);
      showToast("⚠️ エラーが発生しました");
    }
  };

  // AI診断（3段階フォールバック）
  const diagnoseWithAI = async () => {
    if (!uploadedImg) return;
    setAiLoading(true);

    // 🆕 体型情報があればプロンプトに追加(骨格判定の精度UP)
    let extraInfo = "";
    if (bodyHeight || bodyShoulderHip || bodyClavicle) {
      extraInfo = "\n\n═══════════════════════════════════\n■ ユーザーからの追加情報(骨格判定の参考に)\n═══════════════════════════════════\n";
      if (bodyHeight) {
        extraInfo += `身長: ${bodyHeight}cm\n`;
      }
      if (bodyShoulderHip === "shoulder") {
        extraInfo += "肩幅と腰幅: 肩幅の方が広い感覚 → ストレート傾向\n";
      } else if (bodyShoulderHip === "hip") {
        extraInfo += "肩幅と腰幅: 腰幅の方が広い感覚 → ウェーブ傾向\n";
      } else if (bodyShoulderHip === "same") {
        extraInfo += "肩幅と腰幅: ほぼ同じ感覚 → ナチュラル傾向もあり\n";
      }
      if (bodyClavicle === "visible") {
        extraInfo += "鎖骨: くっきり目立つ → ウェーブ傾向強\n";
      } else if (bodyClavicle === "hidden") {
        extraInfo += "鎖骨: あまり見えない → ストレート傾向\n";
      }
      extraInfo += "\nこの情報を骨格判定の重要な根拠として使ってください。確信が持てる場合はbone.confidenceを\"medium\"以上にしてもOKです。";
    }
    const prompt = DIAGNOSE_PROMPT + extraInfo;

    const match = uploadedImg.match(/^data:(image\/\w+);base64,(.+)$/);
    const mediaType = match ? match[1] : "image/jpeg";
    const base64Data = match ? match[2] : uploadedImg.split(",")[1];

    // 【段階1】 /api/diagnose を試す
    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Data, prompt }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.result) {
          setAnalysisResult(normalizeAnalysis(data.result));
          if (data.demo) showToast("🎨 デモモードで診断しました");
          setAiLoading(false);
          return;
        }
      }
      throw new Error("api_diagnose_unavailable");
    } catch (err) {
      console.log("[AI診断] /api/diagnose 利用不可、次の方法を試します");
    }

    // 【段階2】 Anthropic APIを直接呼ぶ
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType, data: base64Data } },
              { type: "text", text: prompt },
            ],
          }],
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const text = data.content?.[0]?.text?.trim() || "{}";
        const cleaned = text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        setAnalysisResult(normalizeAnalysis(parsed));
        setAiLoading(false);
        return;
      }
      throw new Error("anthropic_direct_unavailable");
    } catch (err) {
      console.log("[AI診断] 直接API利用不可、デモモードで表示します");
    }

    // 【段階3】 デモ結果
    await new Promise(r => setTimeout(r, 1500));
    const randomPick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const demoResult = sampleAnalysis(
      randomPick(EIGHT_TYPES).label,
      randomPick(BONE_TYPES).label,
      randomPick(PC_TYPES).label,
    );
setAnalysisResult(normalizeAnalysis(demoResult));    showToast("🎨 デモモード：サンプル結果を表示しています");
    setAiLoading(false);
  };

  // 診断結果を履歴に保存
  const saveToHistory = () => {
    if (!uploadedImg || !analysisResult) return;
    setAiOnlyHistory(h => [{
      id: Date.now(), image: uploadedImg,
      analysis: analysisResult, time: new Date().toLocaleString("ja-JP"),
    }, ...h]);
    setUploadedImg(null); setAnalysisResult(null);
    setBodyHeight(""); setBodyShoulderHip(null); setBodyClavicle(null);  // 🆕 体型情報もリセット
    showToast("💾 履歴に保存しました");
    setMode("history");
  };

  // 履歴から1件削除
  const handleDeleteAiHistory = (id) => {
    if (!window.confirm("この診断結果を削除しますか？")) return;
    setAiOnlyHistory(prev => prev.filter(item => item.id !== id));
    showToast("🗑 削除しました");
  };

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      showToast("📋 リンクをコピーしました！");
    } catch {
      showToast("⚠️ コピーに失敗しました");
    }
  };

  const shareInviteLink = async () => {
    const shareData = {
      title: "タイプ診断アプリ",
      text: "顔タイプ・骨格・パーソナルカラーをAIが診断します✨",
      url: inviteUrl,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* ユーザーキャンセル */ }
    } else {
      copyInviteLink();
    }
  };

  const isMainTab = ["home","history","mypage"].includes(mode);

  return (
    <div style={{minHeight:"100vh",
      background:"linear-gradient(145deg,#1a0533 0%,#2d1065 30%,#1e1b4b 60%,#0f172a 100%)",
      fontFamily:"'Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif",
      maxWidth:430, margin:"0 auto", position:"relative", overflowX:"hidden",
      paddingBottom: isMainTab ? 90 : 20}}>
      <Orbs/>

      {toast && (
        <div style={{position:"fixed",top:24,left:"50%",transform:"translateX(-50%)",
          background:"linear-gradient(135deg,#f472b6,#818cf8)",color:"#fff",borderRadius:24,
          padding:"10px 28px",zIndex:9999,fontSize:14,fontWeight:700,whiteSpace:"nowrap",
          boxShadow:"0 4px 24px rgba(244,114,182,0.5)",maxWidth:"90%",textAlign:"center"}}>
          {toast}
        </div>
      )}

      <style>{`
        button:active{transform:scale(0.96)!important}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{display:none}
      `}</style>

      {/* HOME — AI診断メイン画面 */}
      {mode==="home" && (
        <div style={{position:"relative",zIndex:1,padding:"36px 24px 24px",display:"flex",flexDirection:"column",gap:18}}>
          <div>
            <h1 style={{margin:0,fontSize:28,fontWeight:900,lineHeight:1.15,
              background:"linear-gradient(135deg,#8b5cf6,#ec4899,#f97316)",
              WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
              ✨ タイプ診断
            </h1>
            <p style={{margin:"6px 0 0",fontSize:12,color:"rgba(255,255,255,0.4)",lineHeight:1.7}}>
              顔タイプ・骨格・パーソナルカラーをAIが分析します
            </p>
          </div>

          <label htmlFor="home-image-upload" style={{display:"block",cursor:"pointer",position:"relative"}}>
            <div style={{
              width:"100%",aspectRatio:"1",borderRadius:28,
              border:"2px solid rgba(139,92,246,0.4)",
              background:uploadedImg?"transparent":"rgba(255,255,255,0.04)",
              backdropFilter:"blur(12px)",
              display:"flex",alignItems:"center",justifyContent:"center",
              overflow:"hidden"}}>
              {uploadedImg
                ? <img src={uploadedImg} style={{width:"100%",height:"100%",objectFit:"cover"}} alt="アップロード画像"/>
                : <div style={{textAlign:"center",color:"rgba(139,92,246,0.7)"}}>
                    <div style={{fontSize:48}}>📷</div>
                    <div style={{fontSize:13,marginTop:10}}>タップして写真を選ぶ</div>
                    <div style={{fontSize:10,marginTop:4,color:"rgba(139,92,246,0.5)"}}>カメラロール・ファイルから選択</div>
                  </div>
              }
            </div>
            {/* 🆕 アップロード済み画像を削除する×ボタン */}
            {uploadedImg && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (window.confirm("この画像を削除しますか？")) {
                    setUploadedImg(null);
                    setAnalysisResult(null);
                    setBodyHeight(""); setBodyShoulderHip(null); setBodyClavicle(null);
                    showToast("🗑 画像を削除しました");
                  }
                }}
                aria-label="アップロードした画像を削除"
                style={{
                  position:"absolute", top:12, right:12,
                  width:38, height:38, borderRadius:"50%",
                  border:"1px solid rgba(255,255,255,0.2)",
                  background:"rgba(0,0,0,0.6)", backdropFilter:"blur(8px)",
                  color:"#fff", fontSize:18, fontWeight:900,
                  cursor:"pointer", display:"flex",
                  alignItems:"center", justifyContent:"center",
                  boxShadow:"0 2px 10px rgba(0,0,0,0.4)", zIndex:5,
                }}>×</button>
            )}
          </label>
          <input
            id="home-image-upload"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{position:"absolute", width:1, height:1, opacity:0, pointerEvents:"none"}}
          />

          {uploadedImg && !analysisResult && (
            <>
              {/* 🆕 体型情報フォーム(任意入力・骨格判定の精度UP) */}
              <div style={{
                padding:"14px 16px", borderRadius:14,
                background:"rgba(255,255,255,0.04)",
                border:"1px solid rgba(255,255,255,0.08)",
                marginBottom: 4,
              }}>
                <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:10}}>
                  <span style={{fontSize:14}}>💎</span>
                  <span style={{fontSize:12, fontWeight:800, color:"rgba(255,255,255,0.85)"}}>
                    さらに正確に診断するために(任意)
                  </span>
                </div>
                <div style={{fontSize:10, color:"rgba(255,255,255,0.45)", lineHeight:1.6, marginBottom:14}}>
                  骨格判定はもともと顔写真だけでは限界があります。下の項目を入れると判定がより正確になります。全部スキップしても診断はできます。
                </div>

                {/* 身長(任意) */}
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.65)", marginBottom:6}}>
                    📏 身長(cm)
                  </div>
                  <input
                    type="number"
                    value={bodyHeight}
                    onChange={(e) => setBodyHeight(e.target.value)}
                    placeholder="例: 160"
                    style={{
                      width:"100%", padding:"10px 12px",
                      borderRadius:10, border:"1px solid rgba(255,255,255,0.12)",
                      background:"rgba(0,0,0,0.2)", color:"#fff",
                      fontSize:13, fontWeight:600, outline:"none",
                      boxSizing:"border-box",
                    }}
                  />
                </div>

                {/* 肩幅と腰幅 */}
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.65)", marginBottom:6}}>
                    👤 肩幅と腰幅、どっちが広い感覚?
                  </div>
                  <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
                    {[
                      {id:"shoulder", label:"肩幅"},
                      {id:"hip", label:"腰幅"},
                      {id:"same", label:"ほぼ同じ"},
                    ].map(opt => {
                      const active = bodyShoulderHip === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setBodyShoulderHip(active ? null : opt.id)}
                          style={{
                            flex:1, padding:"9px 6px", borderRadius:10,
                            border:"none", cursor:"pointer",
                            background: active
                              ? "linear-gradient(135deg,#8b5cf6,#ec4899)"
                              : "rgba(255,255,255,0.05)",
                            color: active ? "#fff" : "rgba(255,255,255,0.55)",
                            fontSize:12, fontWeight:800,
                            transition:"all .15s",
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 鎖骨 */}
                <div>
                  <div style={{fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.65)", marginBottom:6}}>
                    🦴 鎖骨はくっきり目立ちますか?
                  </div>
                  <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
                    {[
                      {id:"visible", label:"くっきり目立つ"},
                      {id:"hidden", label:"あまり見えない"},
                    ].map(opt => {
                      const active = bodyClavicle === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setBodyClavicle(active ? null : opt.id)}
                          style={{
                            flex:1, padding:"9px 6px", borderRadius:10,
                            border:"none", cursor:"pointer",
                            background: active
                              ? "linear-gradient(135deg,#8b5cf6,#ec4899)"
                              : "rgba(255,255,255,0.05)",
                            color: active ? "#fff" : "rgba(255,255,255,0.55)",
                            fontSize:12, fontWeight:800,
                            transition:"all .15s",
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <GradBtn
                grad={aiLoading?"rgba(255,255,255,0.08)":"linear-gradient(135deg,#8b5cf6,#ec4899,#f97316)"}
                onClick={diagnoseWithAI} disabled={aiLoading}>
                {aiLoading?"✨ パーツを細かく見ています...":"🤖 AI診断スタート"}
              </GradBtn>
            </>
          )}

          {analysisResult && (
            <>
              <AIAnalysisCard analysis={analysisResult}/>

             {/* 🌟 384通り対応・統合スタイルアドバイス（5タブ：全体/形/色/春/ヘア） */}
              <StyleAdviceHub analysis={analysisResult}/>

              {/* 🛍 買い物ガイド（楽天検索リンク付きの購入提案） */}
              <BuyGuideCard analysis={analysisResult}/>

              {/* 🆕 ✨ 商品提案セクション（季節×骨格別の具体商品カード） */}
              <ProductShowcase analysis={analysisResult}/>

              <div style={{padding:"14px",borderRadius:16,
                background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)"}}>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.5)",marginBottom:12,textAlign:"center",fontWeight:600}}>
                  結果をどうしますか？
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {/* 🆕 シェアセクション */}
                  <ShareSection analysis={analysisResult} showToast={showToast}/>

                  <GradBtn grad="linear-gradient(135deg,#8b5cf6,#ec4899)" onClick={saveToHistory}>
                    💾 履歴に保存する
                  </GradBtn>
                  <button onClick={()=>{
                    setUploadedImg(null);
                    setAnalysisResult(null);
                    setBodyHeight(""); setBodyShoulderHip(null); setBodyClavicle(null);
                  }} style={{
                    background:"none",border:"none",color:"rgba(255,255,255,0.4)",
                    fontSize:13,fontWeight:600,cursor:"pointer",padding:"8px"}}>
                    🗑 この結果を捨ててやり直す
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* HISTORY — AI診断履歴 */}
      {mode==="history" && (() => {
        const filtered = aiHistoryTypeFilter
          ? aiOnlyHistory.filter(item => item.analysis?.eightType?.primary === aiHistoryTypeFilter)
          : aiOnlyHistory;
        const appearingTypes = Array.from(new Set(
          aiOnlyHistory.map(item => item.analysis?.eightType?.primary).filter(Boolean)
        ));

        return (
          <div style={{position:"relative",zIndex:1,padding:"36px 24px 24px",display:"flex",flexDirection:"column",gap:16}}>
            <div>
              <div style={{display:"flex",alignItems:"baseline",gap:10}}>
                <h2 style={{margin:0,fontSize:24,fontWeight:900,
                  background:"linear-gradient(135deg,#818cf8,#60a5fa)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
                  🗂 診断の履歴
                </h2>
                {aiOnlyHistory.length>0 && (
                  <span style={{fontSize:13,fontWeight:700,color:"rgba(255,255,255,0.5)"}}>
                    {aiOnlyHistory.length}件
                  </span>
                )}
              </div>
              <p style={{margin:"6px 0 0",fontSize:11,color:"rgba(255,255,255,0.35)"}}>🔒 自分だけの記録（非公開）</p>
            </div>

            {appearingTypes.length >= 2 && (
              <div>
                <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",marginBottom:6,fontWeight:700}}>💫 タイプで絞り込み</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                  <FilterChip label="すべて" active={aiHistoryTypeFilter===null}
                    grad="linear-gradient(135deg,#6366f1,#818cf8)"
                    onClick={()=>setAiHistoryTypeFilter(null)}/>
                  {appearingTypes.map(typeName => {
                    const t = EIGHT_TYPES.find(e=>e.label===typeName);
                    return (
                      <FilterChip key={typeName} label={typeName}
                        active={aiHistoryTypeFilter===typeName}
                        grad={t?.grad}
                        onClick={()=>setAiHistoryTypeFilter(
                          aiHistoryTypeFilter===typeName ? null : typeName
                        )}/>
                    );
                  })}
                </div>
              </div>
            )}

            {aiOnlyHistory.length===0 ? (
              <div style={{color:"rgba(255,255,255,0.2)",textAlign:"center",marginTop:60,fontSize:15}}>
                まだ診断していません
              </div>
            ) : filtered.length === 0 ? (
              <div style={{color:"rgba(255,255,255,0.25)",textAlign:"center",marginTop:40,fontSize:14}}>
                このタイプの履歴はありません
              </div>
            ) : (
              filtered.map(item => (
                <Glass key={item.id} style={{overflow:"hidden",padding:14,position:"relative"}}>
                  <button onClick={()=>handleDeleteAiHistory(item.id)}
                    aria-label="この履歴を削除"
                    style={{
                      position:"absolute",top:10,right:10,
                      width:26,height:26,borderRadius:"50%",border:"none",cursor:"pointer",
                      background:"rgba(0,0,0,0.35)",color:"rgba(255,255,255,0.7)",
                      fontSize:12,fontWeight:900,zIndex:2,
                      display:"flex",alignItems:"center",justifyContent:"center",
                      backdropFilter:"blur(6px)",
                    }}>×</button>

                  <div style={{display:"flex",gap:12,marginBottom:12}}>
                    <img src={item.image} alt="" style={{width:70,height:70,borderRadius:14,objectFit:"cover",flexShrink:0}}/>
                    <div style={{flex:1,minWidth:0,paddingRight:28}}>
                      <div style={{fontSize:10,color:"rgba(255,255,255,0.3)"}}>{item.time}</div>
                      <div style={{fontSize:18,fontWeight:900,marginTop:3,
                        background:"linear-gradient(135deg,#f9a8d4,#c084fc)",
                        WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
                        💫 {item.analysis?.eightType?.primary}
                      </div>
                      {item.analysis?.charm && <div style={{fontSize:11,color:"rgba(255,255,255,0.55)",marginTop:3,lineHeight:1.5,fontStyle:"italic"}}>💭 {item.analysis.charm}</div>}
                    </div>
                  </div>
                  <AIAnalysisCard analysis={item.analysis} defaultOpen={false}/>

                  {/* 履歴画面でも統合スタイルガイド＋買い物ガイドを表示 */}
                  <div style={{marginTop:12, display:"flex", flexDirection:"column", gap:12}}>
                    <StyleAdviceHub analysis={item.analysis}/>
                    <BuyGuideCard analysis={item.analysis}/>
                    {/* 🆕 商品提案セクション */}
                    <ProductShowcase analysis={item.analysis}/>
                  </div>
                </Glass>
              ))
            )}

            {aiOnlyHistory.length>0 && (
              <button onClick={()=>{
                if (window.confirm("すべての履歴を削除しますか？")) {
                  setAiOnlyHistory([]);
                  setAiHistoryTypeFilter(null);
                }
              }} style={{
                background:"none",border:"1px solid rgba(255,255,255,0.15)",
                color:"rgba(255,255,255,0.4)",fontSize:12,fontWeight:600,
                padding:"10px",borderRadius:12,cursor:"pointer",marginTop:8}}>
                🗑 履歴をすべて削除
              </button>
            )}
          </div>
        );
      })()}

      {/* MYPAGE */}
      {mode==="mypage" && (
        <div style={{position:"relative",zIndex:1,padding:"36px 24px 24px",display:"flex",flexDirection:"column",gap:20}}>
          <div>
            <h1 style={{margin:0,fontSize:28,fontWeight:900,
              background:"linear-gradient(135deg,#06b6d4,#34d399)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
              👤 マイページ
            </h1>
            <p style={{margin:"6px 0 0",fontSize:12,color:"rgba(255,255,255,0.4)"}}>
              設定・招待リンク
            </p>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <GradBtn grad="linear-gradient(135deg,#818cf8,#60a5fa)" onClick={()=>setMode("history")}>
              🗂 診断の履歴 {aiOnlyHistory.length>0 && `(${aiOnlyHistory.length})`}
            </GradBtn>
            <GradBtn grad="linear-gradient(135deg,#ec4899,#f97316,#fbbf24)" onClick={()=>setMode("invite")}>
              💌 アプリを身内に招待する
            </GradBtn>
          </div>

          {/* 🆕 法的書類セクション */}
          <div style={{marginTop:20}}>
            <div style={{fontSize:10, color:"rgba(255,255,255,0.35)", marginBottom:10, fontWeight:700, paddingLeft:4}}>
              📋 サービスについて
            </div>
            <div style={{display:"flex", flexDirection:"column", gap:8}}>
              <button onClick={()=>setMode("terms")} style={{
                padding:"12px 16px", borderRadius:12,
                background:"rgba(255,255,255,0.04)",
                border:"1px solid rgba(255,255,255,0.08)",
                color:"rgba(255,255,255,0.7)", fontSize:13, fontWeight:600,
                textAlign:"left", cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"space-between",
              }}>
                <span>📄 利用規約</span>
                <span style={{opacity:0.4}}>›</span>
              </button>
              <button onClick={()=>setMode("privacy")} style={{
                padding:"12px 16px", borderRadius:12,
                background:"rgba(255,255,255,0.04)",
                border:"1px solid rgba(255,255,255,0.08)",
                color:"rgba(255,255,255,0.7)", fontSize:13, fontWeight:600,
                textAlign:"left", cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"space-between",
              }}>
                <span>🔐 プライバシーポリシー</span>
                <span style={{opacity:0.4}}>›</span>
              </button>
            </div>
          </div>

          {/* 🆕 データ管理セクション（プライバシー強化） */}
          <div style={{marginTop:20}}>
            <div style={{fontSize:10, color:"rgba(255,255,255,0.35)", marginBottom:10, fontWeight:700, paddingLeft:4}}>
              ⚠️ データ管理
            </div>
            <div style={{display:"flex", flexDirection:"column", gap:8}}>
              <div style={{
                padding:"12px 14px", borderRadius:12,
                background:"rgba(255,255,255,0.03)",
                border:"1px solid rgba(255,255,255,0.06)",
                fontSize:11, color:"rgba(255,255,255,0.5)", lineHeight:1.6,
              }}>
                💡 このアプリではあなたの画像と診断結果はあなたの端末（ブラウザ）にのみ保存されています。サーバーには送信されません。下のボタンですべてのデータを完全に削除できます。
              </div>
              <button
                onClick={() => {
                  const count = aiOnlyHistory.length;
                  if (count === 0 && !uploadedImg) {
                    showToast("削除するデータはありません");
                    return;
                  }
                  const msg = `すべてのデータを削除します。\n\n・診断履歴 ${count}件\n・アップロード中の画像\n\nこの操作は取り消せません。本当に削除しますか？`;
                  if (window.confirm(msg)) {
                    setAiOnlyHistory([]);
                    setUploadedImg(null);
                    setAnalysisResult(null);
                    setAiHistoryTypeFilter(null);
                    showToast("🗑 すべてのデータを削除しました");
                  }
                }}
                style={{
                  padding:"14px 16px", borderRadius:12,
                  background:"rgba(239,68,68,0.08)",
                  border:"1px solid rgba(239,68,68,0.3)",
                  color:"#fca5a5", fontSize:13, fontWeight:700,
                  textAlign:"left", cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"space-between",
                }}>
                <span>🗑 すべてのデータを削除する</span>
                <span style={{opacity:0.6}}>›</span>
              </button>
            </div>
          </div>

          {/* TODO: 今後ここに追加予定のメニュー
              - AIキー設定（本物のAI診断を使うため）
              - お気に入り商品（アフィリエイト実装後）
          */}
        </div>
      )}
      {/* INVITE */}
      {mode==="invite" && (
        <div style={{position:"relative",zIndex:1,padding:"36px 24px 60px",display:"flex",flexDirection:"column",gap:20}}>
          <BackBtn onClick={()=>setMode("mypage")}/>
          <div>
            <h2 style={{margin:0,fontSize:24,fontWeight:900,
              background:"linear-gradient(135deg,#ec4899,#f97316,#fbbf24)",
              WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
              💌 身内に招待する
            </h2>
            <p style={{margin:"8px 0 0",fontSize:12,color:"rgba(255,255,255,0.4)",lineHeight:1.7}}>
              リンクを知っている人だけがアクセスできます。<br/>
              仲良しグループにシェアしてね✨
            </p>
          </div>

          <Glass style={{padding:"20px"}}>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginBottom:8,fontWeight:700}}>
              🔗 招待リンク
            </div>
            <div style={{
              padding:"14px 16px", background:"rgba(0,0,0,0.3)", borderRadius:12,
              fontSize:11, color:"#f9a8d4", fontFamily:"monospace",
              wordBreak:"break-all", marginBottom:14,
              border:"1px solid rgba(255,255,255,0.08)",
              minHeight:44, display:"flex", alignItems:"center"}}>
              {inviteUrl || "読み込み中..."}
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <GradBtn
                grad={inviteUrl?"linear-gradient(135deg,#ec4899,#f97316)":"rgba(255,255,255,0.06)"}
                onClick={shareInviteLink} disabled={!inviteUrl}>
                📤 共有する（LINE / メッセージなど）
              </GradBtn>
              <GradBtn
                grad={inviteUrl?"linear-gradient(135deg,#6366f1,#818cf8)":"rgba(255,255,255,0.06)"}
                onClick={copyInviteLink} disabled={!inviteUrl} small>
                📋 リンクだけコピー
              </GradBtn>
            </div>
          </Glass>

          <Glass style={{padding:"16px 18px"}}>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginBottom:10,fontWeight:700}}>
              💬 共有される内容プレビュー
            </div>
            <div style={{padding:"12px 14px",background:"rgba(255,255,255,0.04)",
              borderRadius:12,border:"1px dashed rgba(255,255,255,0.12)"}}>
              <div style={{fontSize:13,fontWeight:800,color:"#fff",marginBottom:4}}>
                タイプ診断アプリ
              </div>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.65)",lineHeight:1.5}}>
                顔タイプ・骨格・パーソナルカラーをAIが診断します✨
              </div>
              <div style={{fontSize:11,color:"#60a5fa",marginTop:6,wordBreak:"break-all"}}>
                {inviteUrl}
              </div>
            </div>
          </Glass>

         <div style={{padding:"14px 16px",borderRadius:14,
            background:"rgba(255,200,100,0.08)",border:"1px solid rgba(255,200,100,0.2)"}}>
            <div style={{fontSize:11,fontWeight:800,color:"#fbbf24",marginBottom:6}}>⚠️ 共有する前に</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.6)",lineHeight:1.7}}>
              このリンクを知っている人は誰でもアクセスできます。信頼できる身内だけに送ってね。
            </div>
          </div>
        </div>
      )}

      {/* 🆕 TERMS — 利用規約 */}
      {mode==="terms" && (
        <TermsContent BackBtn={BackBtn} onBack={()=>setMode("mypage")} />
      )}

      {/* 🆕 PRIVACY — プライバシーポリシー */}
      {mode==="privacy" && (
        <PrivacyContent BackBtn={BackBtn} onBack={()=>setMode("mypage")} />
      )}

      {isMainTab && (
        <BottomNav current={mode} onChange={(t)=>{
          if (t !== mode) {
            setUploadedImg(null); setAnalysisResult(null);
            setBodyHeight(""); setBodyShoulderHip(null); setBodyClavicle(null);
          }
          setMode(t);
        }}/>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 📤 ShareSection
//   診断結果をX/LINE/コピー/OS標準シェアで共有するためのセクション。
//   テキストベースで実装(画像生成・URL発行は将来の拡張)。
//
//   各SNSでURLが「カード」として展開されるかは、サイト側の
//   OGPメタタグ次第(別途設定が必要)。
// ═══════════════════════════════════════════════════════════════
function ShareSection({ analysis, showToast }) {
  // シェアテキストを動的に組み立てる
  const buildShareText = () => {
    const eight = analysis?.eightType?.primary || "";
    const bone = analysis?.bone?.primary || "";
    const pc = analysis?.personalColor?.primary || "";
    const url = typeof window !== "undefined" ? window.location.origin : "https://new-app-rmmo.vercel.app";

    let text = "";
    if (eight) text += `私の顔タイプは「${eight}」でした✨\n`;
    if (bone) text += `🦴 骨格: ${bone}\n`;
    if (pc) text += `🎨 カラー: ${pc}\n`;
    text += `\nあなたも診断してみませんか?\n${url}\n\n#タイプ診断 #顔タイプ診断`;
    return text;
  };

  const shareText = buildShareText();
  const url = typeof window !== "undefined" ? window.location.origin : "https://new-app-rmmo.vercel.app";

  // X(旧Twitter)で共有
  const shareToX = () => {
    const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(intentUrl, "_blank", "noopener,noreferrer");
  };

  // LINEで共有
  const shareToLine = () => {
    const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`;
    window.open(lineUrl, "_blank", "noopener,noreferrer");
  };

  // クリップボードにコピー
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      showToast?.("📋 結果をコピーしました!");
    } catch {
      showToast?.("⚠️ コピーに失敗しました");
    }
  };

  // OS標準シェア(対応端末のみ)
  const [hasNativeShare, setHasNativeShare] = useState(false);
  useEffect(() => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      setHasNativeShare(true);
    }
  }, []);
  const nativeShare = async () => {
    try {
      await navigator.share({
        title: "タイプ診断アプリ",
        text: shareText,
      });
    } catch {
      // ユーザーがキャンセルした場合は何もしない
    }
  };

  // 各シェアボタンのスタイル(共通)
  const baseBtnStyle = {
    flex: 1, minWidth: 0,
    padding: "10px 8px", borderRadius: 10,
    border: "none", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
    fontSize: 11, fontWeight: 800, color: "#fff",
    transition: "all .15s",
    boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
  };

  return (
    <div style={{
      padding: "12px 14px", borderRadius: 12,
      background: "linear-gradient(135deg,rgba(29,161,242,0.08),rgba(0,195,0,0.06))",
      border: "1px solid rgba(255,255,255,0.1)",
    }}>
      <div style={{
        fontSize: 11, fontWeight: 800,
        color: "rgba(255,255,255,0.7)",
        marginBottom: 10, textAlign: "center",
      }}>
        📤 結果をシェアする
      </div>

      <div style={{display: "flex", gap: 6, flexWrap: "wrap"}}>
        {/* X */}
        <button onClick={shareToX} style={{
          ...baseBtnStyle,
          background: "linear-gradient(135deg,#1d9bf0,#1a8cd8)",
        }}>
          <span style={{fontSize: 13, fontWeight: 900}}>𝕏</span>
          <span>ポスト</span>
        </button>

        {/* LINE */}
        <button onClick={shareToLine} style={{
          ...baseBtnStyle,
          background: "linear-gradient(135deg,#06c755,#00b900)",
        }}>
          <span>LINE</span>
        </button>

        {/* コピー */}
        <button onClick={copyToClipboard} style={{
          ...baseBtnStyle,
          background: "linear-gradient(135deg,#6366f1,#818cf8)",
        }}>
          <span>📋</span>
          <span>コピー</span>
        </button>

        {/* OS標準シェア(対応端末のみ) */}
        {hasNativeShare && (
          <button onClick={nativeShare} style={{
            ...baseBtnStyle,
            background: "linear-gradient(135deg,#f472b6,#c084fc)",
          }}>
            <span>📤</span>
            <span>その他</span>
          </button>
        )}
      </div>

      <div style={{
        fontSize: 9, color: "rgba(255,255,255,0.4)",
        marginTop: 8, textAlign: "center", lineHeight: 1.5,
      }}>
        💡 結果テキスト + アプリのURLが共有されます(顔写真は共有されません)
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 🛍 BuyGuideCard
//   元の ProductRecommendationSection を「買い物特化」にスリム化したもの。
//   「色ガイド」と「春トレンド」は新しい StyleAdviceHub（色タブ・春タブ）
//   側に役割分担で移しているので、ここでは買う場所への動線に集中する。
// ═══════════════════════════════════════════════════════════════
function BuyGuideCard({ analysis }) {
  const [open, setOpen] = useState(true); // 🆕 折り畳み用 state（早期 return より前に置く）

  const boneType = analysis?.bone?.primary;
  const pcType = analysis?.personalColor?.primary;
  if (!boneType || !pcType) return null;
  const boneRecs = BONE_RECOMMENDATIONS[boneType];
  if (!boneRecs) return null;

  const season = getCurrentSeason();
  const categories = ["トップス", "ボトムス", "アウター"];

  return (
    <div style={{borderRadius:18, overflow:"hidden",
      background:"linear-gradient(145deg,rgba(251,191,36,0.08),rgba(244,114,182,0.05))",
      border:"1px solid rgba(251,191,36,0.25)"}}>

      {/* ヘッダー（クリックで開閉） */}
      <div onClick={()=>setOpen(o=>!o)}
        style={{padding:"14px 16px", cursor:"pointer",
          background:"linear-gradient(135deg,rgba(251,191,36,0.2),rgba(244,114,182,0.15))",
          borderBottom: open ? "1px solid rgba(255,255,255,0.08)" : "none",
          display:"flex", alignItems:"center", justifyContent:"space-between"}}>
        <div style={{flex:1, minWidth:0}}>
          <div style={{fontSize:14, fontWeight:900,
            background:"linear-gradient(135deg,#fbbf24,#f472b6)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent"}}>
            🛍 {season}に買うべきアイテム
          </div>
          <div style={{fontSize:11, color:"rgba(255,255,255,0.55)", marginTop:4, lineHeight:1.6}}>
            {boneType}のあなたに似合う服を、
            <span style={{color:"#fbbf24", fontWeight:700}}>「なぜ似合うのか」</span>
            という理由つきで紹介します。リンクから楽天で探せます✨
          </div>
        </div>
        <div style={{fontSize:11, color:"rgba(255,255,255,0.5)", fontWeight:700, marginLeft:8}}>
          {open ? "▲" : "▼"}
        </div>
      </div>

      {open && (
        <div style={{padding:"16px"}}>
          {categories.map((category, idx) => {
            // ...（ここから下は元のまま）
          const rec = boneRecs[category];
          if (!rec) return null;
          const searchKeyword = `${rec.searchKeyword} ${season}`;
          const searchUrl = buildRakutenSearchUrl(searchKeyword);

          return (
            <div key={category} style={{marginTop: idx === 0 ? 0 : 18}}>
              {/* カテゴリ見出し */}
              <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:10}}>
                <div style={{width:4, height:18, borderRadius:2,
                  background:"linear-gradient(180deg,#fbbf24,#f472b6)"}}/>
                <div style={{fontSize:13, fontWeight:900, color:"#fff"}}>
                  📌 {category}：<span style={{color:"#fbbf24"}}>{rec.itemName}</span>
                </div>
              </div>

              {/* なぜ似合うのか */}
              <div style={{padding:"12px 14px", borderRadius:12,
                background:"rgba(251,191,36,0.06)",
                border:"1px solid rgba(251,191,36,0.2)", marginBottom:8}}>
                <div style={{fontSize:10, fontWeight:800, color:"#fbbf24", marginBottom:6}}>
                  ✨ なぜ似合うのか
                </div>
                <div style={{fontSize:12, color:"rgba(255,255,255,0.85)", lineHeight:1.7}}>
                  {rec.whyFits}
                </div>
              </div>

              {/* 避けたいもの */}
              <div style={{padding:"12px 14px", borderRadius:12,
                background:"rgba(244,63,94,0.06)",
                border:"1px solid rgba(244,63,94,0.2)", marginBottom:8}}>
                <div style={{fontSize:10, fontWeight:800, color:"#f87171", marginBottom:6}}>
                  ⚠️ 避けたいもの
                </div>
                <div style={{fontSize:12, color:"rgba(255,255,255,0.85)", lineHeight:1.7}}>
                  {rec.avoid}
                </div>
              </div>

              {/* チェックリスト */}
              <div style={{padding:"12px 14px", borderRadius:12,
                background:"rgba(139,92,246,0.06)",
                border:"1px solid rgba(139,92,246,0.2)", marginBottom:8}}>
                <div style={{fontSize:10, fontWeight:800, color:"#c084fc", marginBottom:8}}>
                  ✓ 選ぶときのチェックリスト
                </div>
                <div style={{display:"flex", flexDirection:"column", gap:5}}>
                  {rec.checklist.map((item, i) => (
                    <div key={i} style={{fontSize:11, color:"rgba(255,255,255,0.75)", lineHeight:1.6,
                      paddingLeft:10, position:"relative"}}>
                      <span style={{position:"absolute", left:0, color:"#c084fc"}}>•</span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* 楽天検索リンク */}
              <a href={searchUrl} target="_blank" rel="noopener noreferrer"
                style={{textDecoration:"none", display:"block"}}>
                <div style={{padding:"11px 14px", borderRadius:12,
                  background:"linear-gradient(135deg,#bf0000,#e60012)",
                  display:"flex", alignItems:"center", justifyContent:"space-between",
                  boxShadow:"0 3px 12px rgba(191,0,0,0.3)"}}>
                  <span style={{fontSize:12, fontWeight:800, color:"#fff"}}>
                    👉 楽天で「{searchKeyword}」を見る
                  </span>
                  <span style={{fontSize:14, color:"#fff", opacity:0.8}}>↗</span>
                </div>
              </a>
            </div>
          );
        })}

        <div style={{marginTop:14, padding:"10px 12px", borderRadius:10,
          background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)"}}>
          <div style={{fontSize:10, color:"rgba(255,255,255,0.45)", lineHeight:1.6}}>
            💡 提案は骨格診断・パーソナルカラー理論に基づく一般的な指針です。
            最終的にはあなたが「着てみて気分が上がるもの」が一番です。
          </div>
        </div>
      </div>
       )}  
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 🌟 StyleAdviceHub
//   384通り（8タイプ × 3骨格 × 16PC）対応の統合スタイルアドバイス。
//   5タブ：全体／形／色／春／ヘア
//   styleGuideData.js から深いガイダンスを引いてきて表示する。
//
//   16PCはデフォルトで4PCの「典型サブタイプ」に固定し、
//   色タブでユーザーが4つから選び直せるようにしてある。
// ═══════════════════════════════════════════════════════════════
function StyleAdviceHub({ analysis }) {
  const faceType = analysis?.eightType?.primary;
  const boneType = analysis?.bone?.primary;
  const pc4 = analysis?.personalColor?.primary;

  // 16PC：4PCから「典型」サブタイプを初期値に。色タブで変更可。
  const [pc16, setPc16] = useState(() =>
    pc4 ? DEFAULT_PC4_REPRESENTATIVE[pc4] : null
  );
  const [activeTab, setActiveTab] = useState("overall");
  const [hubOpen, setHubOpen] = useState(true);

  // 必要なデータが揃ってないと表示しない
  if (!faceType || !boneType || !pc4) return null;
  const faceData = FACE_TYPE_GUIDE[faceType];
  const boneData = BONE_TYPE_GUIDE[boneType];
  const pcData = pc16 ? PC16_GUIDE[pc16] : null;
  if (!faceData || !boneData) return null;

  const pc16Options = PC4_TO_PC16[pc4] || [];

  // この組み合わせに当てはまる衝突パターン
  const applicableConflicts = useMemo(() =>
    CONFLICT_RULES.examples.filter(c =>
      c.pattern.includes(faceType) ||
      c.pattern.includes(boneType) ||
      (pc16 && c.pattern.includes(pc16))
    ), [faceType, boneType, pc16]
  );

  // この組み合わせに似合うトレンド／注意のトレンド
  const goodTrends = useMemo(() =>
    SPRING_2026_TREND_FIT.trendItems.filter(t =>
      t.goodFor?.faceType?.includes(faceType) ||
      t.goodFor?.boneType?.includes(boneType) ||
      t.goodFor?.pc16?.includes(pc16)
    ), [faceType, boneType, pc16]
  );
  const carefulTrends = useMemo(() =>
    SPRING_2026_TREND_FIT.trendItems.filter(t =>
      t.careful?.faceType?.includes(faceType) ||
      t.careful?.boneType?.includes(boneType) ||
      t.careful?.pc16?.includes(pc16)
    ), [faceType, boneType, pc16]
  );

  const tabs = [
    { id:"overall", icon:"💫", label:"全体", color:"#a855f7" },
    { id:"shape",   icon:"🦴", label:"形",   color:"#34d399" },
    { id:"color",   icon:"🎨", label:"色",   color:"#fb923c" },
    { id:"spring",  icon:"🌸", label:"春",   color:"#f472b6" },
    { id:"hair",    icon:"✂️", label:"ヘア", color:"#14b8a6" },
  ];

  return (
    <div style={{borderRadius:18, overflow:"hidden",
      background:"linear-gradient(145deg,rgba(168,85,247,0.1),rgba(20,184,166,0.06))",
      border:"1px solid rgba(168,85,247,0.25)"}}>

      {/* ヘッダー（クリックで開閉） */}
      <div onClick={()=>setHubOpen(o=>!o)}
        style={{padding:"14px 16px", cursor:"pointer",
          background:"linear-gradient(135deg,rgba(168,85,247,0.22),rgba(20,184,166,0.15))",
          borderBottom: hubOpen ? "1px solid rgba(255,255,255,0.08)" : "none",
          display:"flex", alignItems:"center", justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:14, fontWeight:900,
            background:"linear-gradient(135deg,#a855f7,#ec4899,#f59e0b)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent"}}>
            🌟 あなた専用スタイルガイド
          </div>
          <div style={{fontSize:11, color:"rgba(255,255,255,0.55)", marginTop:3, lineHeight:1.5}}>
            {faceType} × {boneType} × {pc4}（{pc16 || "サブタイプ未選択"}）
          </div>
        </div>
        <div style={{fontSize:11, color:"rgba(255,255,255,0.5)", fontWeight:700, marginLeft:8}}>
          {hubOpen ? "▲" : "▼"}
        </div>
      </div>

      {hubOpen && (
        <>
          {/* タブバー */}
          <div style={{padding:"10px 12px 4px",
            display:"flex", gap:4,
            background:"rgba(0,0,0,0.18)",
            overflowX:"auto"}}>
            {tabs.map(t => {
              const active = activeTab === t.id;
              return (
                <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{
                  flex:"1 1 auto", minWidth:0,
                  padding:"7px 4px", borderRadius:9, border:"none",
                  background: active
                    ? `linear-gradient(135deg,${t.color},rgba(168,85,247,0.8))`
                    : "transparent",
                  color: active ? "#fff" : "rgba(255,255,255,0.5)",
                  fontSize:11, fontWeight:800, cursor:"pointer",
                  whiteSpace:"nowrap", transition:"all .15s",
                }}>
                  {t.icon} {t.label}
                </button>
              );
            })}
          </div>

          {/* タブ中身 */}
          <div style={{padding:"14px 16px"}}>
            {activeTab === "overall" && (
              <OverallTabContent
                faceType={faceType} boneType={boneType} pc4={pc4} pc16={pc16}
                faceData={faceData} conflicts={applicableConflicts}/>
            )}
            {activeTab === "shape" && (
              <ShapeTabContent boneType={boneType} boneData={boneData}/>
            )}
            {activeTab === "color" && (
              <ColorTabContent
                pc4={pc4} pc16={pc16} pcData={pcData}
                pc16Options={pc16Options} setPc16={setPc16}/>
            )}
            {activeTab === "spring" && (
              <SpringTabContent
                boneType={boneType} faceType={faceType} pc16={pc16}
                goodTrends={goodTrends} carefulTrends={carefulTrends}/>
            )}
            {activeTab === "hair" && (
              <HairTabContent faceType={faceType} faceData={faceData}/>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// 共通：チップ風ピル（ハブ内のリスト表示で使い回す）
// ─────────────────────────────────────────────────────────────────
const Pill = ({ children, color="rgba(255,255,255,0.18)", border="rgba(255,255,255,0.25)", text="#fff" }) => (
  <span style={{padding:"4px 11px", borderRadius:20, fontSize:11, fontWeight:700,
    background: color, border: `1px solid ${border}`, color: text}}>
    {children}
  </span>
);

const SectionHead = ({ icon, label, color="rgba(255,255,255,0.55)" }) => (
  <div style={{fontSize:11, fontWeight:800, color, marginBottom:8, letterSpacing:"0.3px"}}>
    {icon} {label}
  </div>
);

// ─────────────────────────────────────────────────────────────────
// タブ1: 💫 全体（系統・印象・組み合わせ衝突）
// ─────────────────────────────────────────────────────────────────
function OverallTabContent({ faceType, boneType, pc4, pc16, faceData, conflicts }) {
  const eightTypeData = EIGHT_TYPES.find(e => e.label === faceType);

  return (
    <div style={{display:"flex", flexDirection:"column", gap:14}}>
      {/* メインバナー */}
      <div style={{padding:"14px", borderRadius:14,
        background: eightTypeData?.grad || "linear-gradient(135deg,#a855f7,#ec4899)",
        color:"#fff"}}>
        <div style={{fontSize:11, opacity:0.85, fontWeight:700}}>あなたの3軸の組み合わせ</div>
        <div style={{fontSize:18, fontWeight:900, marginTop:4, lineHeight:1.4}}>
          💫 {faceType} × 🦴 {boneType} × 🎨 {pc16 || pc4}
        </div>
        <div style={{fontSize:11, opacity:0.9, marginTop:6, lineHeight:1.6}}>
          {faceData.category}
        </div>
      </div>

      {/* 印象ワード */}
      <div>
        <SectionHead icon="💭" label="あなたが与える印象"/>
        <div style={{display:"flex", flexWrap:"wrap", gap:5}}>
          {faceData.impressionWords.map((w, i) => (
            <Pill key={i} color="rgba(168,85,247,0.18)" border="rgba(168,85,247,0.35)">
              {w}
            </Pill>
          ))}
        </div>
      </div>

      {/* 似合うファッション系統 */}
      <div>
        <SectionHead icon="👗" label="似合うファッション系統"/>
        <div style={{display:"flex", flexWrap:"wrap", gap:5}}>
          {faceData.fashionGenres.map((g, i) => (
            <Pill key={i} color="rgba(236,72,153,0.18)" border="rgba(236,72,153,0.35)">
              {g}
            </Pill>
          ))}
        </div>
      </div>

      {/* 春の鉄板アイテム */}
      <div>
        <SectionHead icon="✨" label="春の鉄板アイテム"/>
        <div style={{display:"flex", flexWrap:"wrap", gap:5}}>
          {faceData.springItems.map((item, i) => (
            <Pill key={i} color="rgba(34,197,94,0.15)" border="rgba(34,197,94,0.3)">
              {item}
            </Pill>
          ))}
        </div>
      </div>

      {/* 避けたいスタイル */}
      <div>
        <SectionHead icon="⚠️" label="避けたいスタイル"/>
        <div style={{display:"flex", flexWrap:"wrap", gap:5}}>
          {faceData.avoidItems.map((item, i) => (
            <Pill key={i} color="rgba(239,68,68,0.15)" border="rgba(239,68,68,0.3)" text="rgba(255,255,255,0.85)">
              {item}
            </Pill>
          ))}
        </div>
      </div>

      {/* 衝突パターン（軸が合わないときの解決法） */}
      {conflicts.length > 0 && (
        <div style={{padding:"12px 14px", borderRadius:12,
          background:"rgba(251,191,36,0.08)",
          border:"1px solid rgba(251,191,36,0.25)"}}>
          <div style={{fontSize:12, fontWeight:800, color:"#fbbf24", marginBottom:8}}>
            🤔 組み合わせで迷ったら
          </div>

          {/* 何が起きてるかの説明（やさしい言葉で） */}
          <div style={{fontSize:11, color:"rgba(255,255,255,0.75)", marginBottom:10, lineHeight:1.7}}>
            顔タイプ・骨格・PCはそれぞれ別の軸を見ているので、組み合わせによっては
            <span style={{color:"#fbbf24", fontWeight:700}}>「どっちに合わせればいいの？」</span>
            と迷うことがあります。
          </div>

          {/* 基本ルール（迷ったときの判断基準） */}
          <div style={{padding:"10px 12px", borderRadius:10,
            background:"rgba(0,0,0,0.22)", marginBottom:10,
            border:"1px solid rgba(251,191,36,0.18)"}}>
            <div style={{fontSize:10, fontWeight:800, color:"#fbbf24", marginBottom:6, letterSpacing:"0.3px"}}>
              📌 迷ったときの基本ルール
            </div>
            <div style={{fontSize:11, color:"rgba(255,255,255,0.85)", lineHeight:1.8}}>
              <div>・顔まわり（トップス・襟・アクセ・ヘア）</div>
              <div style={{paddingLeft:14, color:"rgba(255,255,255,0.7)"}}>
                → <span style={{color:"#fbbf24", fontWeight:700}}>顔タイプとPC</span>に合わせる
              </div>
              <div style={{marginTop:4}}>・体のシルエット（ボトム・全体の形）</div>
              <div style={{paddingLeft:14, color:"rgba(255,255,255,0.7)"}}>
                → <span style={{color:"#fbbf24", fontWeight:700}}>骨格</span>に合わせる
              </div>
              <div style={{marginTop:4}}>
                ・全部欲張らず、<span style={{color:"#fbbf24", fontWeight:700}}>主役は1つだけ</span>に絞る
              </div>
            </div>
          </div>

          {/* あなたの組み合わせの場合の具体例 */}
          <div style={{fontSize:10, fontWeight:800, color:"rgba(255,255,255,0.6)", marginBottom:6, letterSpacing:"0.3px"}}>
            ✨ あなたの組み合わせの場合
          </div>
          <div style={{display:"flex", flexDirection:"column", gap:8}}>
            {conflicts.slice(0, 3).map((c, i) => (
              <div key={i} style={{padding:"10px 12px", borderRadius:10,
                background:"rgba(0,0,0,0.2)", border:"1px solid rgba(255,255,255,0.06)"}}>
                <div style={{fontSize:11, fontWeight:800, color:"#fbbf24", marginBottom:4}}>
                  {c.pattern}
                </div>
                <div style={{fontSize:11, color:"rgba(255,255,255,0.8)", lineHeight:1.6}}>
                  → {c.solution}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// タブ2: 🦴 形（骨格別シルエット・素材・身長別tip）
// ─────────────────────────────────────────────────────────────────
function ShapeTabContent({ boneType, boneData }) {
  const boneVisual = BONE_TYPES.find(b => b.label === boneType);

  return (
    <div style={{display:"flex", flexDirection:"column", gap:14}}>
      {/* メインバナー */}
      <div style={{padding:"14px", borderRadius:14,
        background: boneVisual?.grad || "linear-gradient(135deg,#34d399,#06b6d4)",
        color:"#fff"}}>
        <div style={{fontSize:11, opacity:0.85, fontWeight:700}}>あなたの骨格</div>
        <div style={{fontSize:18, fontWeight:900, marginTop:4}}>🦴 {boneType}</div>
        <div style={{fontSize:11, opacity:0.9, marginTop:6, lineHeight:1.6}}>
          {boneData.feature}
        </div>
      </div>

      {/* 似合う形 */}
      <div>
        <SectionHead icon="✓" label="似合う形・シルエット"/>
        <div style={{display:"flex", flexWrap:"wrap", gap:5}}>
          {boneData.silhouettes.map((s, i) => (
            <Pill key={i} color="rgba(52,211,153,0.18)" border="rgba(52,211,153,0.35)">
              {s}
            </Pill>
          ))}
        </div>
      </div>

      {/* 似合う素材 */}
      <div>
        <SectionHead icon="🧵" label="似合う素材"/>
        <div style={{display:"flex", flexWrap:"wrap", gap:5}}>
          {boneData.materials.map((m, i) => (
            <Pill key={i} color="rgba(6,182,212,0.18)" border="rgba(6,182,212,0.35)">
              {m}
            </Pill>
          ))}
        </div>
      </div>

      {/* 苦手な形 */}
      <div>
        <SectionHead icon="✗" label="苦手な形"/>
        <div style={{display:"flex", flexWrap:"wrap", gap:5}}>
          {boneData.avoid.map((a, i) => (
            <Pill key={i} color="rgba(239,68,68,0.15)" border="rgba(239,68,68,0.3)" text="rgba(255,255,255,0.85)">
              {a}
            </Pill>
          ))}
        </div>
      </div>

      {/* 春の鉄板コーデ */}
      <div style={{padding:"12px 14px", borderRadius:12,
        background:"rgba(52,211,153,0.06)", border:"1px solid rgba(52,211,153,0.2)"}}>
        <SectionHead icon="🌸" label="春の鉄板コーデ" color="#34d399"/>
        <div style={{display:"flex", flexDirection:"column", gap:5}}>
          {boneData.springStaples.map((staple, i) => (
            <div key={i} style={{fontSize:11, color:"rgba(255,255,255,0.85)", lineHeight:1.6,
              paddingLeft:10, position:"relative"}}>
              <span style={{position:"absolute", left:0, color:"#34d399"}}>•</span>
              {staple}
            </div>
          ))}
        </div>
      </div>

      {/* 身長別の調整 */}
      <div style={{padding:"12px 14px", borderRadius:12,
        background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)"}}>
        <SectionHead icon="📏" label="身長別の調整"/>
        <div style={{display:"flex", flexDirection:"column", gap:8}}>
          {[
            { key:"short",  label:"〜155cm",   tip: boneData.heightTips.short },
            { key:"medium", label:"155〜165cm", tip: boneData.heightTips.medium },
            { key:"tall",   label:"165cm〜",   tip: boneData.heightTips.tall },
          ].map(h => (
            <div key={h.key} style={{padding:"8px 10px", borderRadius:8,
              background:"rgba(0,0,0,0.18)", border:"1px solid rgba(255,255,255,0.06)"}}>
              <div style={{fontSize:10, fontWeight:800, color:"#34d399", marginBottom:3}}>
                {h.label}
              </div>
              <div style={{fontSize:11, color:"rgba(255,255,255,0.78)", lineHeight:1.6}}>
                {h.tip}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2026年春トレンドとの相性 */}
      {boneData.spring2026Fit && (
        <div style={{padding:"12px 14px", borderRadius:12,
          background:"rgba(244,114,182,0.06)", border:"1px solid rgba(244,114,182,0.22)"}}>
          <SectionHead icon="🌸" label="2026年春トレンドとの相性" color="#f472b6"/>
          <div style={{marginBottom:8}}>
            <div style={{fontSize:10, fontWeight:700, color:"#34d399", marginBottom:4}}>◎ 似合う</div>
            <div style={{display:"flex", flexWrap:"wrap", gap:5}}>
              {boneData.spring2026Fit.good.map((g, i) => (
                <Pill key={i} color="rgba(52,211,153,0.18)" border="rgba(52,211,153,0.35)">{g}</Pill>
              ))}
            </div>
          </div>
          {boneData.spring2026Fit.careful?.length > 0 && (
            <div>
              <div style={{fontSize:10, fontWeight:700, color:"#fbbf24", marginBottom:4}}>△ 工夫が必要</div>
              <div style={{display:"flex", flexDirection:"column", gap:4}}>
                {boneData.spring2026Fit.careful.map((c, i) => (
                  <div key={i} style={{fontSize:11, color:"rgba(255,255,255,0.78)", lineHeight:1.5}}>
                    • {c}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// タブ3: 🎨 色（16PCサブタイプ選択 + パレット + トレンド色マッチ）
// ─────────────────────────────────────────────────────────────────
function ColorTabContent({ pc4, pc16, pcData, pc16Options, setPc16 }) {
  const pc4Visual = PC_TYPES.find(p => p.label === pc4);

  // 2026年春の流行色のうち、自分のPCに似合うものを抽出
  const matchingTrendColors = pc16
    ? Object.entries(SPRING_2026_TREND_FIT.trendColorMatch || {})
        .filter(([color, pcs]) => pcs.includes(pc16))
        .map(([color]) => color)
    : [];

  return (
    <div style={{display:"flex", flexDirection:"column", gap:14}}>
      {/* メインバナー */}
      <div style={{padding:"14px", borderRadius:14,
        background: pc4Visual?.grad || "linear-gradient(135deg,#fb923c,#f43f5e)",
        color:"#fff"}}>
        <div style={{fontSize:11, opacity:0.85, fontWeight:700}}>あなたのカラー</div>
        <div style={{fontSize:18, fontWeight:900, marginTop:4}}>
          🎨 {pc4}
          {pc16 && <span style={{fontSize:13, fontWeight:700, opacity:0.85, marginLeft:8}}>
            （{pc16}）
          </span>}
        </div>
        {pcData?.undertone && (
          <div style={{fontSize:11, opacity:0.85, marginTop:4}}>{pcData.undertone}</div>
        )}
      </div>

      {/* 16PCサブタイプ選択 */}
      <div style={{padding:"12px 14px", borderRadius:12,
        background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)"}}>
        <SectionHead icon="🎯" label="サブタイプを選び直す（16タイプ細分類）"/>
        <div style={{fontSize:10, color:"rgba(255,255,255,0.5)", marginBottom:10, lineHeight:1.5}}>
          {pc4}グループは4つに細分化されます。タップして自分に近いものを選べば、
          より精密な色アドバイスが見られます。
        </div>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:6}}>
          {pc16Options.map(opt => {
            const active = opt === pc16;
            const data = PC16_GUIDE[opt];
            return (
              <button key={opt} onClick={()=>setPc16(opt)} style={{
                padding:"9px 8px", borderRadius:10, border:"none", cursor:"pointer",
                background: active
                  ? (pc4Visual?.grad || "linear-gradient(135deg,#fb923c,#f43f5e)")
                  : "rgba(255,255,255,0.05)",
                color: active ? "#fff" : "rgba(255,255,255,0.65)",
                fontSize:11, fontWeight:800, textAlign:"left",
                transition:"all .15s",
              }}>
                <div>{opt}</div>
                <div style={{fontSize:9, opacity: active ? 0.85 : 0.5, marginTop:2, fontWeight:600}}>
                  {data?.keyword?.split("・").slice(0,2).join("・") || ""}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 選んだサブタイプの詳細 */}
      {pcData && (
        <>
          <div style={{padding:"12px 14px", borderRadius:12,
            background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)"}}>
            <div style={{fontSize:11, fontWeight:800, color:"rgba(255,255,255,0.7)", marginBottom:8}}>
              💭 {pc16}のキーワード
            </div>
            <div style={{fontSize:12, color:"rgba(255,255,255,0.85)", lineHeight:1.7}}>
              {pcData.keyword}
            </div>
          </div>

          <div>
            <SectionHead icon="✓" label="似合うベストカラー" color="#34d399"/>
            <div style={{display:"flex", flexWrap:"wrap", gap:5}}>
              {pcData.bestColors.map((c, i) => (
                <Pill key={i} color="rgba(52,211,153,0.18)" border="rgba(52,211,153,0.35)">{c}</Pill>
              ))}
            </div>
          </div>

          <div>
            <SectionHead icon="✗" label="避けたい色" color="#f87171"/>
            <div style={{display:"flex", flexWrap:"wrap", gap:5}}>
              {pcData.avoidColors.map((c, i) => (
                <Pill key={i} color="rgba(239,68,68,0.15)" border="rgba(239,68,68,0.3)" text="rgba(255,255,255,0.85)">{c}</Pill>
              ))}
            </div>
          </div>

          <div style={{padding:"12px 14px", borderRadius:12,
            background:"rgba(168,85,247,0.06)", border:"1px solid rgba(168,85,247,0.22)"}}>
            <SectionHead icon="🌸" label="春の使い方" color="#c084fc"/>
            <div style={{fontSize:12, color:"rgba(255,255,255,0.85)", lineHeight:1.7, marginBottom:8}}>
              {pcData.springUsage}
            </div>
            <div style={{padding:"8px 10px", borderRadius:8,
              background:"rgba(0,0,0,0.2)", border:"1px solid rgba(255,255,255,0.08)"}}>
              <div style={{fontSize:10, fontWeight:700, color:"#c084fc", marginBottom:3}}>👗 コーデ例</div>
              <div style={{fontSize:11, color:"rgba(255,255,255,0.85)", lineHeight:1.6, fontWeight:600}}>
                {pcData.coordExample}
              </div>
            </div>
          </div>
        </>
      )}

      {/* 2026春の流行色との相性 */}
      {matchingTrendColors.length > 0 && (
        <div style={{padding:"12px 14px", borderRadius:12,
          background:"rgba(244,114,182,0.08)", border:"1px solid rgba(244,114,182,0.25)"}}>
          <SectionHead icon="🎯" label="2026年春の流行色との相性" color="#f472b6"/>
          <div style={{fontSize:11, color:"rgba(255,255,255,0.65)", marginBottom:8, lineHeight:1.5}}>
            今年の春のトレンドカラーのうち、{pc16}のあなたに特に似合う色：
          </div>
          <div style={{display:"flex", flexWrap:"wrap", gap:5}}>
            {matchingTrendColors.map((c, i) => (
              <Pill key={i} color="rgba(244,114,182,0.22)" border="rgba(244,114,182,0.4)">
                {c}
              </Pill>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// タブ4: 🌸 春（季節別コーデ・トレンド適合・4軸調整）
// ─────────────────────────────────────────────────────────────────
function SpringTabContent({ boneType, faceType, pc16, goodTrends, carefulTrends }) {
  const [tipsOpen, setTipsOpen] = useState(false);
  const season = getCurrentSeason();
  const outfits = (SEASONAL_OUTFITS[season] || {})[boneType] || [];
  const isSpring = season === "春";
  const trends = SPRING_TRENDS_2026;

  return (
    <div style={{display:"flex", flexDirection:"column", gap:14}}>
      {/* メインバナー */}
      <div style={{padding:"14px", borderRadius:14,
        background:"linear-gradient(135deg,#f472b6,#c084fc)", color:"#fff"}}>
        <div style={{fontSize:11, opacity:0.85, fontWeight:700}}>
          {isSpring ? "2026年春のあなた向けガイド" : `${season}のあなた向けガイド`}
        </div>
        <div style={{fontSize:16, fontWeight:900, marginTop:4}}>
          🌸 {boneType} × {faceType}
        </div>
        <div style={{fontSize:11, opacity:0.9, marginTop:6, lineHeight:1.6}}>
          {isSpring
            ? trends.description
            : `${boneType}・${faceType}のあなたに似合う${season}コーデを紹介。`}
        </div>
      </div>

      {/* 骨格別コーデ例 */}
      {outfits.length > 0 && (
        <div>
          <SectionHead icon="☆" label={`${boneType}の${season}コーデ4選`} color="#f472b6"/>
          <div style={{display:"flex", flexDirection:"column", gap:6}}>
            {outfits.map((o, i) => (
              <div key={i} style={{padding:"10px 12px", borderRadius:10,
                background:"rgba(244,114,182,0.06)",
                border:"1px solid rgba(244,114,182,0.2)",
                fontSize:12, color:"rgba(255,255,255,0.85)", lineHeight:1.6}}>
                <span style={{color:"#f472b6", fontWeight:800, marginRight:5}}>0{i+1}</span>
                {o}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 春トレンド情報（春のみ） */}
      {isSpring && (
        <>
          <div>
            <SectionHead icon="🎯" label="今年のキーアイテム"/>
            <div style={{display:"flex", flexWrap:"wrap", gap:5}}>
              {trends.keyItems.map((item, i) => (
                <Pill key={i} color="linear-gradient(135deg,rgba(244,114,182,0.25),rgba(192,132,252,0.2))"
                  border="rgba(244,114,182,0.35)">
                  {item}
                </Pill>
              ))}
            </div>
          </div>

          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
            <div style={{padding:"10px 12px", borderRadius:10,
              background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)"}}>
              <div style={{fontSize:10, fontWeight:800, color:"rgba(255,255,255,0.5)", marginBottom:5}}>
                🎨 旬の色
              </div>
              <div style={{fontSize:11, color:"rgba(255,255,255,0.85)", lineHeight:1.6}}>
                {trends.trendColors.join("・")}
              </div>
            </div>
            <div style={{padding:"10px 12px", borderRadius:10,
              background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)"}}>
              <div style={{fontSize:10, fontWeight:800, color:"rgba(255,255,255,0.5)", marginBottom:5}}>
                🌼 旬の柄
              </div>
              <div style={{fontSize:11, color:"rgba(255,255,255,0.85)", lineHeight:1.6}}>
                {trends.patterns.join("・")}
              </div>
            </div>
          </div>
        </>
      )}

      {/* あなたに似合うトレンド */}
      {goodTrends.length > 0 && (
        <div style={{padding:"12px 14px", borderRadius:12,
          background:"rgba(52,211,153,0.06)", border:"1px solid rgba(52,211,153,0.2)"}}>
          <SectionHead icon="◎" label="あなたに似合う2026春トレンド" color="#34d399"/>
          <div style={{display:"flex", flexWrap:"wrap", gap:5}}>
            {goodTrends.map((t, i) => (
              <Pill key={i} color="rgba(52,211,153,0.22)" border="rgba(52,211,153,0.4)">
                {t.name}
              </Pill>
            ))}
          </div>
        </div>
      )}

      {/* 注意のトレンド + 調整法 */}
      {carefulTrends.length > 0 && (
        <div style={{padding:"12px 14px", borderRadius:12,
          background:"rgba(251,191,36,0.06)", border:"1px solid rgba(251,191,36,0.22)"}}>
          <SectionHead icon="△" label="取り入れに工夫が必要なトレンド" color="#fbbf24"/>
          <div style={{display:"flex", flexDirection:"column", gap:8}}>
            {carefulTrends.map((t, i) => {
              const adjustForUser = t.adjustments?.[boneType] || t.adjustments?.[faceType];
              return (
                <div key={i} style={{padding:"8px 10px", borderRadius:8,
                  background:"rgba(0,0,0,0.18)", border:"1px solid rgba(255,255,255,0.06)"}}>
                  <div style={{fontSize:11, fontWeight:800, color:"#fbbf24", marginBottom:3}}>
                    {t.name}
                  </div>
                  {adjustForUser && (
                    <div style={{fontSize:11, color:"rgba(255,255,255,0.78)", lineHeight:1.6}}>
                      → {adjustForUser}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 雰囲気別の組み方（春のみ） */}
      {isSpring && (
        <div style={{padding:"12px 14px", borderRadius:12,
          background:"rgba(192,132,252,0.08)",
          border:"1px solid rgba(192,132,252,0.25)"}}>
          <SectionHead icon="✨" label="雰囲気別の組み方" color="#c084fc"/>
          <div style={{display:"flex", flexDirection:"column", gap:5}}>
            {trends.styling.map((s, i) => (
              <div key={i} style={{fontSize:11, color:"rgba(255,255,255,0.8)", lineHeight:1.6}}>
                {s}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4軸調整のコツ（折りたたみ） */}
      <div style={{borderRadius:12, overflow:"hidden",
        background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)"}}>
        <button onClick={()=>setTipsOpen(o=>!o)} style={{
          width:"100%", padding:"11px 14px", border:"none", cursor:"pointer",
          background:"transparent", display:"flex", alignItems:"center", justifyContent:"space-between",
          color:"rgba(255,255,255,0.85)", fontSize:12, fontWeight:800}}>
          <span>💡 似合わない服を着たいときのコツ（4軸調整）</span>
          <span style={{fontSize:11, color:"rgba(255,255,255,0.5)"}}>{tipsOpen ? "▲" : "▼"}</span>
        </button>
        {tipsOpen && (
          <div style={{padding:"4px 14px 14px"}}>
            <div style={{fontSize:11, color:"rgba(255,255,255,0.6)", lineHeight:1.6, marginBottom:10}}>
              骨格に合わない服でも、下の4つを調整するとかなり着られるようになります。
            </div>
            <div style={{display:"flex", flexDirection:"column", gap:8}}>
              {FOUR_AXIS_TIPS.map((t, i) => (
                <div key={i} style={{display:"flex", gap:10, alignItems:"flex-start",
                  padding:"10px 12px", borderRadius:10,
                  background:"rgba(255,255,255,0.04)"}}>
                  <div style={{fontSize:18, flexShrink:0}}>{t.icon}</div>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontSize:12, fontWeight:800, color:"#f472b6", marginBottom:3}}>
                      {t.axis}
                    </div>
                    <div style={{fontSize:11, color:"rgba(255,255,255,0.8)", lineHeight:1.6}}>
                      {t.tip}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// タブ5: ✂️ ヘア（顔タイプ別の髪型推奨）
// ─────────────────────────────────────────────────────────────────
function HairTabContent({ faceType, faceData }) {
  const hair = faceData.hair;

  return (
    <div style={{display:"flex", flexDirection:"column", gap:14}}>
      {/* メインバナー */}
      <div style={{padding:"14px", borderRadius:14,
        background:"linear-gradient(135deg,#14b8a6,#06b6d4)", color:"#fff"}}>
        <div style={{fontSize:11, opacity:0.85, fontWeight:700}}>
          {faceType}に似合う髪型
        </div>
        <div style={{fontSize:16, fontWeight:900, marginTop:4}}>
          ✂️ {faceType}向けヘアガイド
        </div>
        <div style={{fontSize:11, opacity:0.9, marginTop:6, lineHeight:1.6}}>
          {faceData.category}
        </div>
      </div>

      {/* おすすめスタイル */}
      <div>
        <SectionHead icon="💇" label="おすすめのスタイル" color="#14b8a6"/>
        <div style={{display:"flex", flexWrap:"wrap", gap:5}}>
          {hair.recommend.map((s, i) => (
            <Pill key={i} color="rgba(20,184,166,0.18)" border="rgba(20,184,166,0.4)">{s}</Pill>
          ))}
        </div>
      </div>

      {/* 前髪 */}
      <div>
        <SectionHead icon="✨" label="似合う前髪"/>
        <div style={{display:"flex", flexWrap:"wrap", gap:5}}>
          {hair.bangs.map((b, i) => (
            <Pill key={i} color="rgba(6,182,212,0.18)" border="rgba(6,182,212,0.35)">{b}</Pill>
          ))}
        </div>
      </div>

      {/* 巻き */}
      <div style={{padding:"10px 12px", borderRadius:10,
        background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)"}}>
        <div style={{fontSize:10, fontWeight:800, color:"rgba(255,255,255,0.5)", marginBottom:4}}>
          🌀 巻き・スタイリング
        </div>
        <div style={{fontSize:12, color:"rgba(255,255,255,0.85)", lineHeight:1.6}}>
          {hair.curl}
        </div>
      </div>

      {/* カラー */}
      <div>
        <SectionHead icon="🎨" label="似合うヘアカラー"/>
        <div style={{display:"flex", flexWrap:"wrap", gap:5}}>
          {hair.color.map((c, i) => (
            <Pill key={i} color="rgba(168,85,247,0.18)" border="rgba(168,85,247,0.35)">{c}</Pill>
          ))}
        </div>
      </div>

      {/* 避けたい */}
      <div>
        <SectionHead icon="✗" label="避けたい髪型" color="#f87171"/>
        <div style={{display:"flex", flexWrap:"wrap", gap:5}}>
          {hair.avoid.map((a, i) => (
            <Pill key={i} color="rgba(239,68,68,0.15)" border="rgba(239,68,68,0.3)" text="rgba(255,255,255,0.85)">
              {a}
            </Pill>
          ))}
        </div>
      </div>

      {/* 2026年春の旬ヘアトレンド（全タイプ共通） */}
      <div style={{padding:"12px 14px", borderRadius:12,
        background:"rgba(244,114,182,0.08)", border:"1px solid rgba(244,114,182,0.25)"}}>
        <SectionHead icon="🌸" label="2026年春の旬ヘアトレンド" color="#f472b6"/>
        <div style={{fontSize:11, color:"rgba(255,255,255,0.7)", lineHeight:1.6, marginBottom:8}}>
          今年のキーワードは
          <span style={{color:"#f472b6", fontWeight:700}}>「自然な動き」「軽やかなレイヤー」</span>。
          韓国風・Y2Kの影響で、顔まわりにレイヤーを入れて抜け感を出すのがポイントです。
        </div>
        <div style={{display:"flex", flexDirection:"column", gap:6}}>
          <div style={{fontSize:11, color:"rgba(255,255,255,0.78)", lineHeight:1.5}}>
            • 人気カット：レイヤーカット（バタフライ・ハイレイヤー）／グラデーションボブ／タッセルボブ
          </div>
          <div style={{fontSize:11, color:"rgba(255,255,255,0.78)", lineHeight:1.5}}>
            • 前髪：カーテンバング・シースルーバング＋マイクロウェーブ
          </div>
          <div style={{fontSize:11, color:"rgba(255,255,255,0.78)", lineHeight:1.5}}>
            • カラー：透け感ブラウン・ベージュ・ピンクニュアンス
          </div>
        </div>
      </div>
    </div>
  );
}
