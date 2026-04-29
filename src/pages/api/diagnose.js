// ═══════════════════════════════════════════════════════════════
// 🧠 /api/diagnose - AI診断のサーバーサイドエンドポイント
// ═══════════════════════════════════════════════════════════════
// 動作モード：
//   ・GEMINI_API_KEY が設定されている → Gemini APIで実診断
//   ・設定されていない → 空応答（フロントが次の手段にフォールバック）
//
// 注意：
//   このファイルは pages/api/ 配下なので Next.js のAPIルートとして扱われ、
//   default export の handler 関数が必須。
//   プロンプト本文は src/components/diagnosePrompt.js 側にあり、
//   フロント（HyokaApp.jsx）が body.prompt で送ってくる。
// ═══════════════════════════════════════════════════════════════

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Vercelの関数サイズ・タイムアウト調整（画像を扱うので余裕を持たせる）
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

  // ─── APIキー未設定時：デモ応答を返してフロントを次の手段（直接Anthropic→サンプル）に流す
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
    // Gemini API呼び出し（画像 + プロンプト）
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
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error("Gemini API error:", response.status, errText);
      // 200で返してフロント側のフォールバックチェーンを動かす
      return res.status(200).json({
        demo: true,
        result: null,
        error: `Gemini HTTP ${response.status}`,
      });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    // Gemini が ```json ... ``` で囲ってくることがあるので除去
    const cleaned = text.replace(/```json|```/g, "").trim();

    let result;
    try {
      result = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("Gemini JSON parse failed:", parseErr, "raw:", text);
      return res.status(200).json({
        demo: true,
        result: null,
        error: "Failed to parse Gemini response as JSON",
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
