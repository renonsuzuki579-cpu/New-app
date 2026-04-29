// ═══════════════════════════════════════════════════════════════
// 🧠 /api/diagnose - AI診断のサーバーサイドエンドポイント
// ═══════════════════════════════════════════════════════════════
// 動作モード：
//   ・GEMINI_API_KEY が設定されている → Gemini APIで実診断
//   ・設定されていない → 空応答（フロントが次の手段にフォールバック）
//
// 改善ポイント（前バージョンからの変更）：
//   ① maxOutputTokens を 2048 → 4096（日本語JSONが途中で切れる対策）
//   ② JSONの最初の { と最後の } を切り出す堅牢なパース
//   ③ Geminiの finishReason を捕捉（SAFETYフィルタなどを検出）
//   ④ パース失敗時に rawTextPreview を返してデバッグ可能に
//   ⑤ safetySettings を緩める（顔写真の通常の解析を可能に）
// ═══════════════════════════════════════════════════════════════

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export const config = {
  api: {
    bodyParser: { sizeLimit: "8mb" },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  // APIキー未設定時：デモ応答を返してフロントを次の手段に流す
  if (!apiKey) {
    return res.status(200).json({
      demo: true,
      result: null,
      reason: "GEMINI_API_KEY not set",
    });
  }

  const { image, prompt } = req.body || {};
  if (!image || !prompt) {
    return res.status(400).json({ error: "image (base64) and prompt required" });
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: "image/jpeg", data: image } },
          ],
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4096,                  // ← 増量（前は 2048 で切れていた可能性）
          responseMimeType: "application/json",
        },
        // 顔写真診断は安全フィルタが過敏に反応しがちなので緩める
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error("Gemini HTTP error:", response.status, errText);
      return res.status(200).json({
        demo: true,
        result: null,
        error: `Gemini HTTP ${response.status}`,
        detail: errText.slice(0, 500),
      });
    }

    const data = await response.json();
    const candidate = data?.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text || "";
    const finishReason = candidate?.finishReason || "unknown";

    // 空応答（SAFETYフィルタ等で content が来なかった場合）
    if (!text) {
      console.error("Gemini returned empty text. finishReason:", finishReason);
      return res.status(200).json({
        demo: true,
        result: null,
        error: "Gemini returned empty response",
        finishReason,
      });
    }

    // ─── JSON抽出：マークダウン除去 → 最初の { と最後の } を切り出す
    let cleaned = text.replace(/```json|```/gi, "").trim();
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    let result;
    try {
      result = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("JSON parse failed:", parseErr.message);
      console.error("finishReason:", finishReason);
      console.error("raw text (first 1000 chars):", text.slice(0, 1000));
      return res.status(200).json({
        demo: true,
        result: null,
        error: "Failed to parse Gemini response as JSON",
        finishReason,
        rawTextPreview: text.slice(0, 800),       // ← Networkタブで実物を見られる
      });
    }

    return res.status(200).json({ demo: false, result });
  } catch (err) {
    console.error("Diagnose handler error:", err);
    return res.status(200).json({
      demo: true,
      result: null,
      error: String(err?.message || err),
    });
  }
}
