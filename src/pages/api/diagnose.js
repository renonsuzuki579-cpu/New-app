// ═══════════════════════════════════════════════════════════════
// 📡 diagnose.js（v2・リトライ＆フォールバック対応版）
// ═══════════════════════════════════════════════════════════════
// 役割：
//   ブラウザから受け取った画像をGeminiに送って診断結果を返す。
//
// v2の強化点:
//   ① 503/429/500等の一時的エラー時に最大3回リトライ
//   ② リトライ間に指数バックオフ(待機時間を倍々に増やす)
//   ③ メインモデルが連続失敗したらフォールバックモデルに切替
//   ④ エラー詳細をフロントに渡してデバッグしやすく
//
// 動作モード:
//   ・GEMINI_API_KEY あり → リアルAI(失敗時はリトライ→デモ)
//   ・GEMINI_API_KEY なし → デモモード
// ═══════════════════════════════════════════════════════════════

const PRIMARY_MODEL = "gemini-2.5-flash";
const FALLBACK_MODEL = "gemini-2.0-flash"; // 旧安定モデル
const MAX_RETRIES = 3;

const DEMO_RESPONSE = {
  parts: {
    eyes: "やや丸みを帯びた、印象的な目元の傾向があります。",
    eyebrows: "自然なアーチを描き、柔らかな印象。",
    nose: "鼻筋が通り、バランスの良い形の傾向。",
    mouth: "口角がやや上がり、親しみやすい印象。",
    ears: "顔全体とのバランスが整っている傾向。",
    balance: "パーツの配置に余裕があり、落ち着いた印象。",
    depth: "自然な陰影があり、ほどよい立体感があります。",
  },
  charm: "温かみのある自然体な表情が魅力です。",
  eightType: {
    primary: "フェミニン",
    axes: { age: "大人寄り", impression: "親しみ", line: "曲線" },
    confidence: "low",
    note: "デモ応答です。",
  },
  bone: {
    primary: "ウェーブ",
    breakdown: [
      { type: "ウェーブ", percentage: 40 },
      { type: "ストレート", percentage: 32 },
      { type: "ナチュラル", percentage: 28 },
    ],
    confidence: "low",
    note: "デモ応答のためサンプル値です。",
  },
  personalColor: {
    primary: "スプリング",
    undertone: "イエローベース",
    confidence: "low",
    note: "デモ応答です。",
    recommendedColors: ["コーラル", "ピーチ", "クリーム"],
  },
};

// 待機ヘルパー
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 一時的エラーかどうか判定（リトライ対象）
const isRetryableStatus = (status) =>
  status === 429 || status === 500 || status === 502 || status === 503 || status === 504;

// 一時的エラーメッセージかどうか判定
const isRetryableError = (errorText) => {
  if (!errorText) return false;
  const t = String(errorText).toLowerCase();
  return (
    t.includes("currently experiencing") ||
    t.includes("overloaded") ||
    t.includes("temporarily unavailable") ||
    t.includes("rate limit") ||
    t.includes("quota")
  );
};

// Gemini API を1回呼ぶ
async function callGemini({ apiKey, model, prompt, image }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        role: "user",
        parts: [
          { text: prompt },
          { inline_data: { mime_type: "image/jpeg", data: image } },
        ],
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2500,
        responseMimeType: "application/json",
      },
    }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    await sleep(1500);
    return res.status(200).json({ demo: true, result: DEMO_RESPONSE, reason: "no_api_key" });
  }

  const { image, prompt } = req.body;
  if (!image || !prompt) {
    return res.status(400).json({ error: "image and prompt required" });
  }

  const errorLog = []; // すべての失敗を記録

  // モデル切替を伴うリトライループ
  for (const model of [PRIMARY_MODEL, FALLBACK_MODEL]) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const { ok, status, data } = await callGemini({ apiKey, model, prompt, image });

        if (ok) {
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "{}";
          const cleaned = text.replace(/```json|```/g, "").trim();
          try {
            const parsed = JSON.parse(cleaned);
            return res.status(200).json({ demo: false, result: parsed, model, attempt });
          } catch (parseErr) {
            errorLog.push({ model, attempt, type: "parse_error", raw: text.slice(0, 300) });
            // パースエラーはリトライしても結果が変わりにくいので次のモデルへ
            break;
          }
        }

        // エラーレスポンス
        const errMsg = data?.error?.message || `HTTP ${status}`;
        errorLog.push({ model, attempt, status, error: errMsg });

        // リトライ可能な場合は待ってから再試行
        if (isRetryableStatus(status) || isRetryableError(errMsg)) {
          if (attempt < MAX_RETRIES) {
            const wait = 1000 * Math.pow(2, attempt - 1); // 1秒→2秒→4秒
            await sleep(wait);
            continue;
          }
        } else {
          // リトライ不可のエラー（権限・課金・無効なリクエスト等）は次のモデルへ
          break;
        }
      } catch (err) {
        errorLog.push({ model, attempt, type: "exception", error: String(err?.message || err) });
        if (attempt < MAX_RETRIES) {
          await sleep(1000 * Math.pow(2, attempt - 1));
          continue;
        }
      }
    }
  }

  // 全モデル・全リトライが失敗 → デモにフォールバック
  console.error("All Gemini attempts failed:", errorLog);
  const lastError = errorLog[errorLog.length - 1]?.error || "AI診断に失敗しました";
  return res.status(200).json({
    demo: true,
    result: DEMO_RESPONSE,
    error: lastError,
    errorLog,
  });
}
