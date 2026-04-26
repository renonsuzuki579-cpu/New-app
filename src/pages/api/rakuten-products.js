// ═══════════════════════════════════════════════════════════════
// 📡 rakuten-products.js
// ═══════════════════════════════════════════════════════════════
// 役割：
//   ブラウザから受け取ったキーワードを、サーバー経由で楽天Item Search APIに送り、
//   実商品（商品名・画像・価格・アフィリエイトURL）を返す。
//   applicationIdはサーバー側の環境変数から読むのでブラウザに漏れない。
//
// 動作モード：
//   ・RAKUTEN_APPLICATION_ID が設定されている → 実商品を返す
//   ・設定されていない / エラー → 空配列＋demo:true（フロント側でモックにフォールバック）
//
// 使うAPI：
//   楽天 Ichiba Item Search API（version: 2026-04-01 / 新ドメイン版）
//   旧 app.rakuten.co.jp は 2026年5月13日に廃止予定なので新ドメインのみ使用
// ═══════════════════════════════════════════════════════════════

const RAKUTEN_API_URL =
  "https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260401";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const appId = process.env.RAKUTEN_APPLICATION_ID;
  const affId = process.env.RAKUTEN_AFFILIATE_ID;

  // 設定がなければデモ応答（フロント側でモックにフォールバック）
  if (!appId) {
    return res.status(200).json({
      demo: true,
      items: [],
      reason: "RAKUTEN_APPLICATION_ID not set",
    });
  }

  const { keyword, hits = "3" } = req.query;
  if (!keyword || typeof keyword !== "string") {
    return res.status(400).json({ error: "keyword (string) required" });
  }

  try {
    const url = new URL(RAKUTEN_API_URL);
    url.searchParams.set("applicationId", appId);
    if (affId) url.searchParams.set("affiliateId", affId);
    url.searchParams.set("keyword", keyword);
    url.searchParams.set("hits", String(hits));
    url.searchParams.set("sort", "-reviewCount"); // レビュー数の多い順（人気順）
    url.searchParams.set("imageFlag", "1");        // 画像ありの商品のみ
    url.searchParams.set("availability", "1");     // 在庫あり
    url.searchParams.set("formatVersion", "2");    // フラットなレスポンス形式

    const r = await fetch(url.toString(), { method: "GET" });
    const data = await r.json();

    if (!r.ok) {
      console.error("Rakuten API error:", data);
      return res.status(200).json({
        demo: true,
        items: [],
        error: data?.error_description || data?.error || "API request failed",
      });
    }

    // formatVersion=2 だと Items は直接 [item, item, ...] の配列
    const rawItems = Array.isArray(data.Items) ? data.Items : [];
    const items = rawItems.map((it) => ({
      itemCode: it.itemCode,
      itemName: it.itemName,
      itemPrice: it.itemPrice,
      shopName: it.shopName,
      // 画像URLからサイズ指定（?_ex=128x128）を除去して大きめに表示できるように
      imageUrl: cleanImageUrl(
        pickFirst(it.mediumImageUrls) ||
        pickFirst(it.smallImageUrls)
      ),
      // affiliateIdを渡しているので affiliateUrl が返ってくる
      itemUrl: it.affiliateUrl || it.itemUrl,
      reviewAverage: it.reviewAverage,
      reviewCount: it.reviewCount,
    }));

    return res.status(200).json({ demo: false, items });
  } catch (err) {
    console.error("Rakuten fetch error:", err);
    return res.status(200).json({
      demo: true,
      items: [],
      error: String(err),
    });
  }
}

// ───────────────────────────────────────────────
// ヘルパー
// ───────────────────────────────────────────────

// formatVersion=2 では mediumImageUrls の各要素が文字列の場合と
// {imageUrl: "..."} オブジェクトの場合があるので両対応
function pickFirst(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const first = arr[0];
  if (typeof first === "string") return first;
  if (first && typeof first === "object" && first.imageUrl) return first.imageUrl;
  return null;
}

// 楽天画像URLには ?_ex=128x128 のようなサイズ指定が末尾につく。
// これを除くとオリジナルサイズで取得でき、見栄えが良くなる。
function cleanImageUrl(url) {
  if (!url) return null;
  return String(url).replace(/\?_ex=\d+x\d+$/i, "");
}
