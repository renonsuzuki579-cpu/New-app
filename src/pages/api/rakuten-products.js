// ═══════════════════════════════════════════════════════════════
// 📡 rakuten-products.js（新API対応版・2026年2月仕様）
// ═══════════════════════════════════════════════════════════════
// 楽天Item Search APIを呼び出すサーバーサイドエンドポイント。
//
// 2026年2月10日のAPI刷新に対応：
//   ・ドメイン: openapi.rakuten.co.jp
//   ・パス: /ichibams/api/IchibaItem/Search/20220601
//   ・認証: applicationId (UUID) + accessKey (pk_...) の両方が必須
//   ・必須ヘッダー: Referer
//
// 動作モード：
//   ・必要な環境変数が揃っている → 実商品を返す
//   ・揃っていない / エラー → 空配列＋demo:true
//     (フロント側で従来のモック表示にフォールバック)
// ═══════════════════════════════════════════════════════════════

const RAKUTEN_API_URL =
  "https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20220601";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const appId  = process.env.RAKUTEN_APPLICATION_ID;
  const accKey = process.env.RAKUTEN_APPLICATION_SECRET; // pk_... で始まる
  const affId  = process.env.RAKUTEN_AFFILIATE_ID;

  // 必須キーがなければデモ応答（フロント側でモックにフォールバック）
  if (!appId || !accKey) {
    return res.status(200).json({
      demo: true,
      items: [],
      reason: !appId
        ? "RAKUTEN_APPLICATION_ID not set"
        : "RAKUTEN_APPLICATION_SECRET not set",
    });
  }

  const { keyword, hits = "3" } = req.query;
  if (!keyword || typeof keyword !== "string") {
    return res.status(400).json({ error: "keyword (string) required" });
  }

  // Refererヘッダーに使うサイトURLを決定。
  // Vercelの環境変数 VERCEL_URL は自動で設定される（"new-app-rmmo.vercel.app" 形式、スキーマなし）
  // それを優先して使い、なければ既知のドメインをフォールバックに。
  const referer =
    process.env.SITE_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://new-app-rmmo.vercel.app");

  try {
    const url = new URL(RAKUTEN_API_URL);
    url.searchParams.set("applicationId", appId);
    url.searchParams.set("accessKey", accKey);          // 新APIで必須
    if (affId) url.searchParams.set("affiliateId", affId);
    url.searchParams.set("keyword", keyword);
    url.searchParams.set("hits", String(hits));
    url.searchParams.set("sort", "-reviewCount");        // レビュー数の多い順（人気順）
    url.searchParams.set("imageFlag", "1");              // 画像ありの商品のみ
    url.searchParams.set("availability", "1");           // 在庫あり
    url.searchParams.set("format", "json");

    const r = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Referer: referer,                                // 新APIで必須
        Origin:  referer,                                // 念のため両方
      },
    });

    const data = await r.json();

    if (!r.ok) {
      console.error("Rakuten API error:", r.status, JSON.stringify(data));
      return res.status(200).json({
        demo: true,
        items: [],
        status: r.status,
        error: data?.errors?.errorMessage
            || data?.error_description
            || data?.error
            || `HTTP ${r.status}`,
      });
    }

    // formatVersion デフォルト(=1) なので Items は [{Item: {...}}, ...] という入れ子構造
    const rawItems = Array.isArray(data.Items) ? data.Items : [];
    const items = rawItems.map((wrap) => {
      const it = wrap?.Item || wrap || {};
      return {
        itemCode: it.itemCode,
        itemName: it.itemName,
        itemPrice: it.itemPrice,
        shopName: it.shopName,
        // 画像URLはサイズ指定(?_ex=128x128)を除去して大きく表示できるようにする
        imageUrl: cleanImageUrl(
          pickFirst(it.mediumImageUrls) ||
          pickFirst(it.smallImageUrls)
        ),
        // affiliateIdを渡しているのでaffiliateUrlが自動生成されて返る
        itemUrl: it.affiliateUrl || it.itemUrl,
        reviewAverage: it.reviewAverage,
        reviewCount: it.reviewCount,
      };
    });

    return res.status(200).json({ demo: false, items });
  } catch (err) {
    console.error("Rakuten fetch error:", err);
    return res.status(200).json({
      demo: true,
      items: [],
      error: String(err?.message || err),
    });
  }
}

// ───────────────────────────────────────────────
// ヘルパー
// ───────────────────────────────────────────────

// mediumImageUrls の各要素は文字列のことも {imageUrl: "..."} の形のこともある
function pickFirst(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const first = arr[0];
  if (typeof first === "string") return first;
  if (first && typeof first === "object" && first.imageUrl) return first.imageUrl;
  return null;
}

// 楽天画像URLには ?_ex=128x128 のようなサイズ指定が末尾に付く。
// これを除くとオリジナルサイズで取得でき、表示が綺麗になる。
function cleanImageUrl(url) {
  if (!url) return null;
  return String(url).replace(/\?_ex=\d+x\d+$/i, "");
}
