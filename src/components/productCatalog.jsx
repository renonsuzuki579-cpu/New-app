// ═══════════════════════════════════════════════════════════════
// 🛍 productCatalog.jsx（楽天API連携版）
// ═══════════════════════════════════════════════════════════════
// 役割：
//   診断結果ページに並べる「具体的な商品カード」のデータと表示。
//
// 仕組み：
//   ・モック（PRODUCT_CATALOG）: searchKeyword・解説文（why）・TPOタグを保持。
//     これは編集の手作業で価値を入れた部分なので必ず残す。
//   ・楽天API: searchKeywordを使って実商品（名前・画像・価格・URL）を取得。
//   ・カード表示時: 実商品が取れたらそれを表示、取れなければモックの体裁で表示。
//
// データフロー：
//   ProductCard マウント
//     → /api/rakuten-products?keyword=... を fetch
//     → 取れた1件目を上書きして表示
//     → 取れなければモックのまま（プレースホルダー＋楽天検索URL）
//
// キャッシュ：
//   同じkeywordへの重複呼び出しを防ぐ module-level Map。
//   ページ再読み込みでクリア（軽量に）。
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";

// ───────── 設定 ─────────
export const CATALOG_CONFIG = {
  // 楽天アフィリエイトID（フォールバック用、検索URL生成に使用）
  rakutenAffiliateId: "532f53ca.02addeb3.532f53cb.ef93f387",
  // Amazonアソシエイトタグ（取得後にここを書き換える）
  amazonAssociateTag: "",
};

// 楽天検索URLビルダー（API取得失敗時のフォールバック）
export const buildRakutenAffiliateUrl = (keyword) => {
  const encoded = encodeURIComponent(keyword);
  const baseUrl = `https://search.rakuten.co.jp/search/mall/${encoded}/`;
  if (CATALOG_CONFIG.rakutenAffiliateId) {
    return `https://hb.afl.rakuten.co.jp/hgc/${CATALOG_CONFIG.rakutenAffiliateId}/?pc=${encodeURIComponent(baseUrl)}`;
  }
  return baseUrl;
};

// ═══════════════════════════════════════════════════════════════
// 🔁 楽天API取得＆キャッシュ
// ═══════════════════════════════════════════════════════════════
// 同じキーワードで何度も叩かないようにするための単純キャッシュ。
// Mapを使うので、同一ページ内の再レンダリングでは即時返る。
const productCache = new Map();
// 進行中のfetchをキーごとに記録して、同時呼び出しを1本にまとめる
const inFlight = new Map();

async function fetchRakutenItem(searchKeyword) {
  if (!searchKeyword) return null;

  // キャッシュ済みなら即返す
  if (productCache.has(searchKeyword)) {
    return productCache.get(searchKeyword);
  }
  // 進行中なら同じPromiseを共有
  if (inFlight.has(searchKeyword)) {
    return inFlight.get(searchKeyword);
  }

  const promise = (async () => {
    try {
      const res = await fetch(
        `/api/rakuten-products?keyword=${encodeURIComponent(searchKeyword)}&hits=3`
      );
      if (!res.ok) throw new Error("api_error");
      const data = await res.json();
      const first = data?.items?.[0] || null;
      productCache.set(searchKeyword, first);
      return first;
    } catch (err) {
      // エラー時はnullをキャッシュしてフォールバックを誘発
      productCache.set(searchKeyword, null);
      return null;
    } finally {
      inFlight.delete(searchKeyword);
    }
  })();

  inFlight.set(searchKeyword, promise);
  return promise;
}

// 商品プレースホルダ画像（CSSグラデーション + 絵文字）
// 実商品画像が取得できなかった時のフォールバック
const PLACEHOLDERS = {
  white:    { bg: "linear-gradient(135deg,#FAFAF7,#E8DDD0)", emoji: "👚", textColor: "#8B7355" },
  ivory:    { bg: "linear-gradient(135deg,#FFF8E8,#F5E8C8)", emoji: "👚", textColor: "#A88A55" },
  beige:    { bg: "linear-gradient(135deg,#F0E5D0,#D4BFA0)", emoji: "🧥", textColor: "#7A5F3F" },
  pink:     { bg: "linear-gradient(135deg,#FCE0E8,#F4B5C8)", emoji: "👚", textColor: "#A85070" },
  lavender: { bg: "linear-gradient(135deg,#E8DEF5,#C8B5E0)", emoji: "👚", textColor: "#6B4E8C" },
  blue:     { bg: "linear-gradient(135deg,#C8DFF0,#7FA9D0)", emoji: "👖", textColor: "#2C5778" },
  navy:     { bg: "linear-gradient(135deg,#3A5278,#1F3550)", emoji: "🧥", textColor: "#FFFFFF" },
  denim:    { bg: "linear-gradient(135deg,#6B8FB5,#3D5F85)", emoji: "👖", textColor: "#FFFFFF" },
  black:    { bg: "linear-gradient(135deg,#3A3A3A,#1A1A1A)", emoji: "👗", textColor: "#FFFFFF" },
  khaki:    { bg: "linear-gradient(135deg,#9CA37A,#6F7548)", emoji: "🧥", textColor: "#FFFFFF" },
  brown:    { bg: "linear-gradient(135deg,#8B6F4F,#5C4530)", emoji: "🧥", textColor: "#FFFFFF" },
  coral:    { bg: "linear-gradient(135deg,#FFC9B5,#FF9576)", emoji: "👚", textColor: "#A04020" },
  green:    { bg: "linear-gradient(135deg,#C5DDB5,#88B070)", emoji: "👚", textColor: "#3F5F2C" },
  gray:     { bg: "linear-gradient(135deg,#D8D8D8,#A0A0A0)", emoji: "👖", textColor: "#404040" },
};

// 商品データ生成ヘルパー
const p = (id, name, brand, price, ph, tpo, why, keyword) => ({
  id, name, brand, price,
  image: null,
  imageStyle: PLACEHOLDERS[ph],
  tpo, why, searchKeyword: keyword,
  affiliateUrl: null,
});

// ═══════════════════════════════════════════════════════════════
// 📦 商品カタログ（解説文・TPOタグ・検索キーワードのソース）
// ═══════════════════════════════════════════════════════════════
// 楽天API化後も、こちらの「why」「tpo」「searchKeyword」は使う。
// API失敗時のフォールバックとして「name」「brand」「price」も保持。
// ═══════════════════════════════════════════════════════════════
export const PRODUCT_CATALOG = {

  // ───────────────────────────────── 春 ─────────────────────────────────
  "春": {
    "ストレート": {
      "トップス": [
        p("spr-st-top-1","白Vネックリブニット","GU",1990,"white",["普段着","通学","きれいめ"],
          "首元のVネックでストレートさんの得意な縦長ラインを作れる定番。リブの程よいフィット感が体のハリを活かします。",
          "Vネックリブニット 白 レディース"),
        p("spr-st-top-2","オーバーサイズ白シャツ","ユニクロ",2990,"white",["きれいめ","お出かけ","通学"],
          "ハリのあるコットンシャツはストレートさんの王道。襟元を抜くだけで着こなしがきれいに見えます。",
          "白シャツ レディース ハリ感"),
      ],
      "ボトムス": [
        p("spr-st-bot-1","ハイウエストストレートデニム","GU",2990,"denim",["普段着","通学","お出かけ"],
          "ストレート寄りのIラインが脚をまっすぐ長く見せる。落ち感のある厚手デニムが◎",
          "ストレートデニム ハイウエスト レディース"),
        p("spr-st-bot-2","センタープレステーパードパンツ","INGNI",3990,"black",["きれいめ","通学","お出かけ"],
          "センタープレスで縦のラインが強調され、ストレートさんのスタイルが一段と整って見える1本。",
          "テーパードパンツ センタープレス レディース"),
      ],
      "アウター": [
        p("spr-st-out-1","ショート丈テーラードジャケット","ユニクロ",4990,"navy",["きれいめ","お出かけ","通学"],
          "肩のラインがきれいに出るジャストサイズのテーラードはストレートさんの得意分野。春は明るめのネイビーで軽さを出して。",
          "テーラードジャケット ショート丈 レディース"),
        p("spr-st-out-2","薄手デニムジャケット（ジャスト丈）","コーエン",6990,"denim",["普段着","お出かけ"],
          "ジャストサイズのGジャンはストレートさんのカジュアルの定番。ヒップが隠れない丈感がポイント。",
          "デニムジャケット ジャスト レディース"),
      ],
    },
    "ウェーブ": {
      "トップス": [
        p("spr-wv-top-1","ボウタイ袖シフォンブラウス","merlot",3990,"ivory",["きれいめ","お出かけ","通学"],
          "首元のリボンで重心を上げるとウェーブさんの華奢さが際立ちます。シフォンの軽やかさが春にぴったり。",
          "ボウタイブラウス シフォン レディース"),
        p("spr-wv-top-2","ショート丈リブカーディガン","Honeys",2490,"pink",["普段着","通学","お出かけ"],
          "腰よりも上の丈で重心アップ。春の淡いピンクはウェーブさんの柔らかい雰囲気と相性抜群です。",
          "ショート丈 カーディガン リブ レディース"),
      ],
      "ボトムス": [
        p("spr-wv-bot-1","ハイウエスト ティアードフレアスカート","INGNI",3490,"lavender",["お出かけ","きれいめ"],
          "揺れる軽い素材がウェーブさんの動きをきれいに見せる。ハイウエストで脚長効果も。",
          "フレアスカート ハイウエスト ティアード"),
        p("spr-wv-bot-2","マーメイドニットスカート","アースミュージック&エコロジー",3990,"beige",["きれいめ","お出かけ"],
          "膝下からふわっと広がるシルエットがウェーブさんの体のラインを最大限きれいに見せます。",
          "マーメイドスカート ニット レディース"),
      ],
      "アウター": [
        p("spr-wv-out-1","ショート丈ノーカラーコート","studio CLIP",6990,"ivory",["きれいめ","お出かけ"],
          "首元すっきりのノーカラー＋ショート丈はウェーブさんの王道。アイボリーで春らしい軽さが出ます。",
          "ノーカラーコート ショート丈 春 レディース"),
        p("spr-wv-out-2","フリル襟ショートカーディガン","niko and...",4990,"pink",["普段着","お出かけ"],
          "首元の装飾と短い丈の組み合わせで重心がぐっと上がる。ウェーブさんの「可愛い」を最大化。",
          "ショートカーディガン フリル レディース"),
      ],
    },
    "ナチュラル": {
      "トップス": [
        p("spr-nt-top-1","オーバーサイズ ストライプシャツ","niko and...",4990,"white",["普段着","お出かけ"],
          "ゆるっとしたシルエットがナチュラルさんのフレーム感を活かす。袖まくりでさらにこなれ感アップ。",
          "オーバーサイズ ストライプシャツ レディース"),
        p("spr-nt-top-2","ざっくりニットベスト","GU",1990,"khaki",["普段着","通学"],
          "Tシャツやシャツの上に重ねるだけで一気にこなれる。ナチュラルさん得意のレイヤード王道。",
          "ニットベスト オーバーサイズ レディース"),
      ],
      "ボトムス": [
        p("spr-nt-bot-1","ワイドデニムパンツ","ユニクロ",3990,"denim",["普段着","通学","お出かけ"],
          "太めのストレートシルエットがナチュラルさんの長い手足を綺麗に見せます。フルレングスでスタイルアップ。",
          "ワイドデニム ストレート レディース"),
        p("spr-nt-bot-2","リネンライク カーゴパンツ","studio CLIP",4990,"khaki",["普段着","お出かけ"],
          "カーゴはナチュラルさんの定番。春はリネン調素材で軽やかさをプラスして。",
          "カーゴパンツ リネン レディース 春"),
      ],
      "アウター": [
        p("spr-nt-out-1","ロング丈デニムジャケット","coca",5990,"denim",["普段着","お出かけ"],
          "ヒップが隠れる長め丈のGジャンはナチュラルさんの「縦の長さ」を最大限活かせる1着。",
          "デニムジャケット ロング丈 レディース"),
        p("spr-nt-out-2","ざっくりロングカーディガン","studio CLIP",4990,"beige",["普段着","通学"],
          "羽織るだけで縦長シルエット完成。ナチュラルさんのこなれ感が爆増します。",
          "ロングカーディガン ざっくり レディース"),
      ],
    },
  },

  // ───────────────────────────────── 夏 ─────────────────────────────────
  "夏": {
    "ストレート": {
      "トップス": [
        p("smr-st-top-1","コットン100%クルーネックT","ユニクロ",1500,"white",["普段着","通学"],
          "ハリのあるコットンTはストレートさんの得意素材。1枚でもさまになる定番。",
          "クルーネックT コットン100 レディース"),
      ],
      "ボトムス": [
        p("smr-st-bot-1","白テーパードパンツ","GU",2990,"white",["きれいめ","お出かけ"],
          "夏の白パンツは清潔感の決定版。テーパードでストレートさんの脚をすっきり見せて。",
          "白テーパードパンツ レディース 夏"),
      ],
      "アウター": [
        p("smr-st-out-1","UVカットジャストカーディガン","ユニクロ",2990,"navy",["普段着","通学"],
          "ジャスト丈のシンプルなUVカーデは夏のストレートさんの相棒。冷房対策にも◎",
          "UVカット カーディガン ジャスト丈 レディース"),
      ],
    },
    "ウェーブ": {
      "トップス": [
        p("smr-wv-top-1","ノースリーブフリルブラウス","INGNI",2990,"lavender",["お出かけ","きれいめ"],
          "首元と肩周りの装飾がウェーブさんの上半身の華奢さを引き立てます。",
          "ノースリーブブラウス フリル レディース"),
      ],
      "ボトムス": [
        p("smr-wv-bot-1","ティアードギャザースカート","Honeys",2990,"ivory",["お出かけ","きれいめ"],
          "段になった軽やかなスカートはウェーブさんの「揺れる」シルエットの王道。",
          "ティアードスカート ギャザー レディース 夏"),
      ],
      "アウター": [
        p("smr-wv-out-1","ショート丈リネンカーディガン","アースミュージック&エコロジー",3490,"pink",["普段着","お出かけ"],
          "薄手で短い丈のリネンカーデは、ウェーブさんの夏の冷房対策にぴったり。",
          "リネンカーディガン ショート丈 レディース"),
      ],
    },
    "ナチュラル": {
      "トップス": [
        p("smr-nt-top-1","オーバーサイズ リネンシャツ","studio CLIP",4990,"white",["普段着","お出かけ"],
          "ゆるっと大きめのリネンシャツはナチュラルさんの夏の鉄板。袖をまくって抜け感を。",
          "リネンシャツ オーバーサイズ レディース"),
      ],
      "ボトムス": [
        p("smr-nt-bot-1","ワイドリネンパンツ","ユニクロ",3990,"beige",["普段着","お出かけ"],
          "ゆったりしたリネン素材のワイドパンツは、ナチュラルさんの夏の最強アイテム。",
          "リネンパンツ ワイド レディース"),
      ],
      "アウター": [
        p("smr-nt-out-1","ロング丈シアーシャツ","niko and...",4990,"ivory",["普段着","お出かけ"],
          "羽織りとして使える透け感シャツ。ロング丈でナチュラルさんの縦長シルエットを強化。",
          "シアーシャツ ロング レディース"),
      ],
    },
  },

  // ───────────────────────────────── 秋 ─────────────────────────────────
  "秋": {
    "ストレート": {
      "トップス": [
        p("aut-st-top-1","ハイゲージVネックニット","ユニクロ",2990,"navy",["きれいめ","通学","お出かけ"],
          "ハリのある編み目のニットはストレートさんの得意。Vネックで首元すっきり。",
          "ハイゲージニット Vネック レディース"),
      ],
      "ボトムス": [
        p("aut-st-bot-1","ストレートデニム(濃色)","GU",2990,"denim",["普段着","通学","お出かけ"],
          "深い色のデニムでシュッと見せる。ストレートさんの脚を綺麗に縦長に。",
          "ストレートデニム 濃色 レディース"),
      ],
      "アウター": [
        p("aut-st-out-1","ショートトレンチコート","ユニクロ",6990,"beige",["きれいめ","お出かけ"],
          "膝上のショート丈トレンチはストレートさんの王道アウター。きちっと感が活きます。",
          "ショートトレンチコート レディース"),
      ],
    },
    "ウェーブ": {
      "トップス": [
        p("aut-wv-top-1","パフ袖ハイゲージニット","INGNI",3990,"pink",["きれいめ","お出かけ"],
          "袖のボリュームが上半身に重心を上げる。ウェーブさんの可愛らしさが映えます。",
          "パフ袖ニット ハイゲージ レディース"),
      ],
      "ボトムス": [
        p("aut-wv-bot-1","プリーツミディスカート","Honeys",2990,"brown",["きれいめ","お出かけ"],
          "細かいプリーツの揺れがウェーブさんの動きを軽やかに見せます。",
          "プリーツスカート ミディ丈 レディース"),
      ],
      "アウター": [
        p("aut-wv-out-1","ショート丈チェスターコート","アースミュージック&エコロジー",7990,"beige",["きれいめ","お出かけ"],
          "ショート丈で腰位置を上げ、薄手で重さを出さない。ウェーブさんの秋アウター王道。",
          "ショート チェスターコート レディース"),
      ],
    },
    "ナチュラル": {
      "トップス": [
        p("aut-nt-top-1","オーバーサイズ ローゲージニット","niko and...",4990,"khaki",["普段着","お出かけ"],
          "ざっくり編みの大きめニットはナチュラルさん専売特許。フレーム感が魅力に変わります。",
          "オーバーサイズニット ローゲージ レディース"),
      ],
      "ボトムス": [
        p("aut-nt-bot-1","ワイドコーデュロイパンツ","studio CLIP",4990,"brown",["普段着","お出かけ"],
          "コーデュロイの素材感とワイドシルエット、両方ナチュラルさんの得意。",
          "コーデュロイパンツ ワイド レディース"),
      ],
      "アウター": [
        p("aut-nt-out-1","ロング丈チェスターコート","coca",8990,"khaki",["普段着","お出かけ"],
          "膝下までのロングコートで縦の長さを最大化。ナチュラルさんの秋冬主役。",
          "ロング チェスターコート レディース"),
      ],
    },
  },

  // ───────────────────────────────── 冬 ─────────────────────────────────
  "冬": {
    "ストレート": {
      "トップス": [
        p("wnt-st-top-1","タートルネックニット(薄手)","ユニクロ",2990,"black",["きれいめ","通学","お出かけ"],
          "首元すっきりの薄手タートル。ストレートさんは厚手より薄手のほうがすっきり見えます。",
          "タートルネックニット 薄手 レディース"),
      ],
      "ボトムス": [
        p("wnt-st-bot-1","ウールライクテーパードパンツ","GU",2990,"black",["きれいめ","通学","お出かけ"],
          "落ち感のある冬素材で1段グレードアップ。ストレートさんの定番テーパードを冬仕様に。",
          "テーパードパンツ ウール レディース"),
      ],
      "アウター": [
        p("wnt-st-out-1","ショートダウンジャケット","ユニクロ",6990,"black",["普段着","通学"],
          "ショート丈ダウンはストレートさんの冬の救世主。腰位置キープで重く見せません。",
          "ショート ダウンジャケット レディース"),
      ],
    },
    "ウェーブ": {
      "トップス": [
        p("wnt-wv-top-1","リブニット ボウタイブラウス","merlot",4990,"ivory",["きれいめ","お出かけ"],
          "首元のリボンとリブの細やかさで、ウェーブさんの華奢さを冬も活かせます。",
          "ボウタイ ニット レディース 冬"),
      ],
      "ボトムス": [
        p("wnt-wv-bot-1","ベロアフレアスカート","INGNI",3990,"navy",["お出かけ","きれいめ"],
          "光沢のあるベロア素材は華やかでウェーブさん向き。フレアで軽やかに。",
          "ベロアスカート フレア レディース"),
      ],
      "アウター": [
        p("wnt-wv-out-1","ショート丈ファーコート","Honeys",6990,"pink",["お出かけ","きれいめ"],
          "ショート丈＋柔らかい素材＝ウェーブさん冬の正解。重心が上がって可愛さも出ます。",
          "ショート丈 ファーコート レディース"),
      ],
    },
    "ナチュラル": {
      "トップス": [
        p("wnt-nt-top-1","オーバーサイズ ハイネックニット","niko and...",4990,"brown",["普段着","お出かけ"],
          "大きめサイズのハイネックはナチュラルさんを冬らしく仕上げる。ゆるっと感が魅力に。",
          "ハイネックニット オーバーサイズ レディース"),
      ],
      "ボトムス": [
        p("wnt-nt-bot-1","ワイドコーデュロイパンツ(ロング)","studio CLIP",5990,"brown",["普段着","お出かけ"],
          "暖かい素材＋ワイドシルエットで冬のナチュラルさんに最適。フルレングスでスタイルアップ。",
          "コーデュロイパンツ ワイド ロング レディース"),
      ],
      "アウター": [
        p("wnt-nt-out-1","オーバーサイズ ボアコート","coca",8990,"khaki",["普段着","お出かけ"],
          "大きめサイズのボアコートはナチュラルさんの冬の主役。ラフな雰囲気が生きる1着。",
          "ボアコート オーバーサイズ レディース"),
      ],
    },
  },
};

// ───────── 季節判定 ─────────
const getCurrentSeason = () => {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5)  return "春";
  if (month >= 6 && month <= 8)  return "夏";
  if (month >= 9 && month <= 11) return "秋";
  return "冬";
};

// ───────── データ取り出しヘルパー ─────────
export const pickProductsForUser = (boneType, season = null) => {
  const useSeason = season || getCurrentSeason();
  const seasonData = PRODUCT_CATALOG[useSeason];
  if (!seasonData) return null;
  const boneData = seasonData[boneType];
  if (!boneData) return null;
  return { season: useSeason, ...boneData };
};

// ═══════════════════════════════════════════════════════════════
// 🎨 ProductCard：1商品分のカード（楽天API実商品 or モック）
// ═══════════════════════════════════════════════════════════════
function ProductCard({ product }) {
  const {
    name: mockName, brand: mockBrand, price: mockPrice,
    imageStyle, tpo, why, searchKeyword,
    affiliateUrl: mockAffUrl,
  } = product;

  const [realProduct, setRealProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // マウント時に楽天APIから実商品を取りに行く
  useEffect(() => {
    let cancelled = false;
    fetchRakutenItem(searchKeyword).then((item) => {
      if (cancelled) return;
      setRealProduct(item);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [searchKeyword]);

  // 表示する内容（実商品があれば実商品、なければモック）
  const isReal = !!realProduct;
  const displayName  = realProduct?.itemName  || mockName;
  const displayBrand = realProduct?.shopName  || mockBrand;
  const displayPrice = realProduct?.itemPrice ?? mockPrice;
  const displayImage = realProduct?.imageUrl  || null;
  const displayUrl   = realProduct?.itemUrl
                    || mockAffUrl
                    || buildRakutenAffiliateUrl(searchKeyword);

  return (
    <div style={{
      flex:"0 0 168px", scrollSnapAlign:"start",
      borderRadius:14, overflow:"hidden",
      background:"rgba(255,255,255,0.04)",
      border:"1px solid rgba(255,255,255,0.08)",
      display:"flex", flexDirection:"column",
    }}>
      {/* 商品画像エリア */}
      <div style={{
        width:"100%", aspectRatio:"4/5",
        background: displayImage
          ? `#fff url(${displayImage}) center/cover no-repeat`
          : imageStyle.bg,
        display:"flex", alignItems:"center", justifyContent:"center",
        position:"relative",
      }}>
        {!displayImage && !loading && (
          <>
            <div style={{fontSize:54, opacity:0.85}}>{imageStyle.emoji}</div>
            <div style={{position:"absolute", bottom:6, right:8,
              fontSize:8, fontWeight:700, color:imageStyle.textColor, opacity:0.5,
              letterSpacing:0.5}}>
              SAMPLE
            </div>
          </>
        )}
        {loading && !displayImage && (
          <div style={{fontSize:10, color:"rgba(255,255,255,0.6)", fontWeight:700,
            background:"rgba(0,0,0,0.3)", padding:"4px 10px", borderRadius:10}}>
            読み込み中…
          </div>
        )}
      </div>

      {/* 商品情報エリア */}
      <div style={{padding:"10px 11px 12px", display:"flex", flexDirection:"column",
        gap:6, flex:1, justifyContent:"space-between"}}>
        <div>
          {/* ブランド/ショップ名 */}
          {displayBrand && (
            <div style={{fontSize:9, fontWeight:700, color:"rgba(255,255,255,0.45)",
              letterSpacing:0.3, marginBottom:3,
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>
              {displayBrand}
            </div>
          )}
          {/* 商品名（楽天は長いので2行で省略） */}
          <div style={{fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.92)",
            lineHeight:1.4, minHeight:30, marginBottom:6,
            display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical",
            overflow:"hidden"}}>
            {displayName}
          </div>
          {/* 価格 */}
          <div style={{fontSize:13, fontWeight:900,
            background:"linear-gradient(135deg,#fbbf24,#f472b6)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
            marginBottom:6}}>
            ¥{Number(displayPrice).toLocaleString()}
            {!isReal && (
              <span style={{fontSize:9, color:"rgba(255,255,255,0.35)",
                marginLeft:4, fontWeight:600,
                WebkitTextFillColor:"rgba(255,255,255,0.35)"}}>
                目安
              </span>
            )}
          </div>
          {/* TPOタグ */}
          <div style={{display:"flex", flexWrap:"wrap", gap:3, marginBottom:6}}>
            {tpo.slice(0, 2).map((t, i) => (
              <span key={i} style={{
                fontSize:8, fontWeight:700,
                color:"rgba(196,181,253,0.9)",
                background:"rgba(139,92,246,0.15)",
                border:"1px solid rgba(139,92,246,0.3)",
                padding:"2px 6px", borderRadius:6,
              }}>{t}</span>
            ))}
          </div>
          {/* なぜおすすめ（編集の解説文） */}
          <div style={{fontSize:9, color:"rgba(255,255,255,0.55)",
            lineHeight:1.5, marginTop:4,
            display:"-webkit-box", WebkitLineClamp:3, WebkitBoxOrient:"vertical",
            overflow:"hidden"}}>
            {why}
          </div>
        </div>

        {/* 楽天で見るボタン */}
        <a href={displayUrl} target="_blank" rel="noopener noreferrer sponsored"
           style={{textDecoration:"none", marginTop:6}}>
          <div style={{
            padding:"7px 8px", borderRadius:8,
            background:"linear-gradient(135deg,#bf0000,#e60012)",
            display:"flex", alignItems:"center", justifyContent:"center", gap:4,
            boxShadow:"0 2px 6px rgba(191,0,0,0.25)",
          }}>
            <span style={{fontSize:10, fontWeight:800, color:"#fff"}}>
              {isReal ? "楽天で買う" : "楽天で探す"}
            </span>
            <span style={{fontSize:11, color:"#fff", opacity:0.9}}>↗</span>
          </div>
        </a>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 🛍 ProductShowcase：診断結果に並べる商品セクション本体
// ═══════════════════════════════════════════════════════════════
//   AIAnalysisCard / StyleAdviceHub / BuyGuideCard の下に配置する想定。
//   骨格タイプを元に、現在の季節の商品を3カテゴリ分横スクロールで表示。
//   ヘッダークリックで開閉できる折り畳み機能つき。
// ═══════════════════════════════════════════════════════════════
export function ProductShowcase({ analysis }) {
  const [open, setOpen] = useState(true);

  const boneType = analysis?.bone?.primary;
  if (!boneType) return null;

  const data = pickProductsForUser(boneType);
  if (!data) return null;

  const { season } = data;
  const categories = ["トップス", "ボトムス", "アウター"];
  const categoryEmoji = { "トップス":"👕", "ボトムス":"👖", "アウター":"🧥" };

  return (
    <div style={{borderRadius:18, overflow:"hidden",
      background:"linear-gradient(145deg,rgba(244,114,182,0.08),rgba(139,92,246,0.06))",
      border:"1px solid rgba(244,114,182,0.22)"}}>

      {/* ヘッダー（クリックで開閉） */}
      <div onClick={()=>setOpen(o=>!o)}
        style={{padding:"14px 16px", cursor:"pointer",
          background:"linear-gradient(135deg,rgba(244,114,182,0.2),rgba(139,92,246,0.15))",
          borderBottom: open ? "1px solid rgba(255,255,255,0.08)" : "none",
          display:"flex", alignItems:"center", justifyContent:"space-between"}}>
        <div style={{flex:1, minWidth:0}}>
          <div style={{fontSize:14, fontWeight:900,
            background:"linear-gradient(135deg,#f472b6,#a78bfa)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent"}}>
            ✨ あなた専用・{season}のおすすめアイテム
          </div>
          <div style={{fontSize:11, color:"rgba(255,255,255,0.55)", marginTop:4, lineHeight:1.6}}>
            <span style={{color:"#f472b6", fontWeight:700}}>{boneType}</span>
            のあなたに、この季節似合う服を選びました。気になったアイテムは楽天でチェックできます🛍
          </div>
        </div>
        <div style={{fontSize:11, color:"rgba(255,255,255,0.5)", fontWeight:700, marginLeft:8}}>
          {open ? "▲" : "▼"}
        </div>
      </div>

      {open && (
        <div style={{padding:"16px 0"}}>
          {categories.map((category, idx) => {
            const items = data[category] || [];
            if (items.length === 0) return null;

            return (
              <div key={category} style={{marginTop: idx === 0 ? 0 : 18}}>
                {/* カテゴリ見出し */}
                <div style={{padding:"0 16px", marginBottom:10,
                  display:"flex", alignItems:"center", gap:8}}>
                  <div style={{width:4, height:18, borderRadius:2,
                    background:"linear-gradient(180deg,#f472b6,#a78bfa)"}}/>
                  <div style={{fontSize:13, fontWeight:900, color:"#fff"}}>
                    {categoryEmoji[category]} {category}
                  </div>
                  <div style={{fontSize:10, color:"rgba(255,255,255,0.4)", marginLeft:"auto"}}>
                    {items.length}点 ›
                  </div>
                </div>

                {/* 商品横スクロール */}
                <div style={{
                  display:"flex", gap:10, overflowX:"auto", paddingBottom:6,
                  paddingLeft:16, paddingRight:16,
                  scrollSnapType:"x mandatory",
                  WebkitOverflowScrolling:"touch",
                }}>
                  {items.map(product => (
                    <ProductCard key={product.id} product={product}/>
                  ))}
                </div>
              </div>
            );
          })}

          {/* 注意書き */}
          <div style={{margin:"14px 16px 0", padding:"10px 12px", borderRadius:10,
            background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)"}}>
            <div style={{fontSize:10, color:"rgba(255,255,255,0.45)", lineHeight:1.6}}>
              💡 商品は楽天市場の人気アイテム（レビュー数順）から自動取得しています。
              在庫・価格は変動します。「楽天で買う」ボタンから商品ページに移動できます。
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
