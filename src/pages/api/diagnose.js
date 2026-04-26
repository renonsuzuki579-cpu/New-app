// ═══════════════════════════════════════════════════════════════
// 📡 diagnose.js（Gemini API版）
// ═══════════════════════════════════════════════════════════════
// 役割：
//   ブラウザから受け取った画像を、サーバー経由でGemini APIに送り、
//   診断結果（JSON）を返す。APIキーはサーバー側の環境変数から読むので
//   ブラウザに漏れない設計。
//
// 動作モード：
//   ・環境変数 GEMINI_API_KEY が設定されている → リアルAI診断
//   ・設定されていない / エラー → デモモード（ダミーJSONを返す）
//
// 使うモデル：
//   gemini-2.5-flash（2026年4月時点の無料枠・安定版・マルチモーダル対応）
// ═══════════════════════════════════════════════════════════════

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
    note: "柔らかい印象と曲線的なラインが特徴的に見える傾向です。",
  },
  bone: {
    primary: "ウェーブ",
    breakdown: [
      { type: "ウェーブ", percentage: 55 },
      { type: "ストレート", percentage: 25 },
      { type: "ナチュラル", percentage: 20 },
    ],
    note: "首や肩の印象からの推測です。全身写真があるとより正確に判定できます。",
  },
  personalColor: {
    primary: "スプリング",
    undertone: "イエローベース",
    note: "肌の明るさと温かみのあるトーンから判定しました。",
    recommendedColors: ["コーラル", "ピーチ", "クリーム"],
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  // デモモード：APIキーがなければダミー応答を返す
  if (!apiKey) {
    await new Promise((r) => setTimeout(r, 1500));
    return res.status(200).json({ demo: true, result: DEMO_RESPONSE });
  }

  try {
    const { image, prompt } = req.body;
    if (!image || !prompt) {
      return res.status(400).json({ error: "image and prompt required" });
    }

    // Gemini APIエンドポイント
    const model = "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: image, // base64エンコード済みの画像データ
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2500,
          // JSON形式での出力を強制（パース失敗を減らす）
          responseMimeType: "application/json",
        },
      }),
    });

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      console.error("Gemini API error:", data);
      // エラー時もデモ応答を返してユーザー体験を壊さない
      return res.status(200).json({
        demo: true,
        error: data?.error?.message || "Gemini API request failed",
        result: DEMO_RESPONSE,
      });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "{}";
    // 念のため、コードブロック記号が混じっていたら除去
    const cleaned = text.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr, "raw:", text);
      return res.status(200).json({
        demo: true,
        error: "AIの応答がJSON形式ではありませんでした",
        result: DEMO_RESPONSE,
      });
    }

    return res.status(200).json({ demo: false, result: parsed });
  } catch (err) {
    console.error("AI API error:", err);
    return res.status(200).json({
      demo: true,
      error: String(err),
      result: DEMO_RESPONSE,
    });
  }
}
