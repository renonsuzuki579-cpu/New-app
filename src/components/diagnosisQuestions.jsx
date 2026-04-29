// ═══════════════════════════════════════════════════════════════
// 🎯 diagnosisQuestions.jsx
// ─────────────────────────────────────────────────────────────────
// 役割：
//   AI診断の精度を上げるための「ユーザー自己申告クイズ」。
//   ① 骨格7問 → ローカルでスコアリング → AIに正解を伝える
//   ② パーソナルカラー3問 → AIへのヒントとして使う
//
// なぜ必要：
//   骨格は本来「鎖骨・手首・膝・全身バランス」を見ないと判定不能。
//   顔写真だけのAI判定は信頼度 low が限界。
//   ユーザー自身の体感に基づく回答の方が信頼できる。
// ═══════════════════════════════════════════════════════════════

import React from "react";

// ─────────────────────────────────────────────────────────────────
// 骨格判定の質問データ（7問）
// 各選択肢に各タイプへのスコア（0〜2点）を持たせる
// ─────────────────────────────────────────────────────────────────
export const BONE_QUESTIONS = [
  {
    id: "shoulderHip",
    label: "肩幅と腰幅、どっちが広い感覚?",
    icon: "👤",
    options: [
      { id: "shoulder", label: "肩幅",       score: { ストレート: 2, ウェーブ: 0, ナチュラル: 1 } },
      { id: "hip",      label: "腰幅",       score: { ストレート: 0, ウェーブ: 2, ナチュラル: 0 } },
      { id: "same",     label: "ほぼ同じ",   score: { ストレート: 0, ウェーブ: 0, ナチュラル: 2 } },
    ],
  },
  {
    id: "clavicle",
    label: "鎖骨はどう見える?",
    icon: "🦴",
    options: [
      { id: "hidden",  label: "あまり見えない",     score: { ストレート: 2, ウェーブ: 0, ナチュラル: 0 } },
      { id: "visible", label: "細くしっかり浮き出る", score: { ストレート: 0, ウェーブ: 2, ナチュラル: 0 } },
      { id: "bony",    label: "太く骨ばって目立つ",  score: { ストレート: 0, ウェーブ: 0, ナチュラル: 2 } },
    ],
  },
  {
    id: "wrist",
    label: "手首の形は?",
    icon: "💎",
    options: [
      { id: "round", label: "丸く薄い",           score: { ストレート: 2, ウェーブ: 1, ナチュラル: 0 } },
      { id: "oval",  label: "楕円で細い",         score: { ストレート: 0, ウェーブ: 2, ナチュラル: 0 } },
      { id: "flat",  label: "平たくて骨が目立つ", score: { ストレート: 0, ウェーブ: 0, ナチュラル: 2 } },
    ],
  },
  {
    id: "neck",
    label: "首の長さは?",
    icon: "🦢",
    options: [
      { id: "short",  label: "短めでしっかり", score: { ストレート: 2, ウェーブ: 0, ナチュラル: 0 } },
      { id: "long",   label: "細くて長い",    score: { ストレート: 0, ウェーブ: 2, ナチュラル: 0 } },
      { id: "sinewy", label: "長くて筋っぽい", score: { ストレート: 0, ウェーブ: 0, ナチュラル: 2 } },
    ],
  },
  {
    id: "weight",
    label: "太るとき最初に出るのは?",
    icon: "⚖️",
    options: [
      { id: "upper", label: "上半身（胸・お腹）",     score: { ストレート: 2, ウェーブ: 0, ナチュラル: 0 } },
      { id: "lower", label: "下半身（お尻・太もも）", score: { ストレート: 0, ウェーブ: 2, ナチュラル: 0 } },
      { id: "even",  label: "全体・あまり太らない",   score: { ストレート: 0, ウェーブ: 0, ナチュラル: 2 } },
    ],
  },
  {
    id: "skin",
    label: "肌の質感は?",
    icon: "🌸",
    options: [
      { id: "firm", label: "ハリ・弾力ある",       score: { ストレート: 2, ウェーブ: 0, ナチュラル: 0 } },
      { id: "soft", label: "柔らかく薄い",         score: { ストレート: 0, ウェーブ: 2, ナチュラル: 0 } },
      { id: "dry",  label: "ドライで関節が目立つ", score: { ストレート: 0, ウェーブ: 0, ナチュラル: 2 } },
    ],
  },
  {
    id: "knee",
    label: "膝のお皿は?",
    icon: "🦵",
    options: [
      { id: "small", label: "小さく目立たない", score: { ストレート: 2, ウェーブ: 0, ナチュラル: 0 } },
      { id: "round", label: "小さく丸みがある", score: { ストレート: 0, ウェーブ: 2, ナチュラル: 0 } },
      { id: "big",   label: "大きく目立つ",     score: { ストレート: 0, ウェーブ: 0, ナチュラル: 2 } },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────
// パーソナルカラーのヒント質問（3問）
// ローカルで判定はせず、AIへのヒントとして渡す
// ─────────────────────────────────────────────────────────────────
export const PC_QUESTIONS = [
  {
    id: "sunburn",
    label: "日焼けするとどうなる?",
    icon: "☀️",
    options: [
      { id: "tan",     label: "黒くなる（赤くなりにくい）",   hint: "日焼けで黒くなる→イエベ傾向（春・秋）" },
      { id: "red",     label: "赤くなる（黒くなりにくい）",   hint: "日焼けで赤くなる→ブルベ傾向（夏・冬）" },
      { id: "unknown", label: "両方 / わからない",           hint: null },
    ],
  },
  {
    id: "naturalHair",
    label: "地毛の色（染めていない時）は?",
    icon: "💁",
    options: [
      { id: "black",      label: "真っ黒（青みがかる）",       hint: "地毛が真っ黒→ウィンター傾向" },
      { id: "darkBrown",  label: "こげ茶（赤み・黄み）",       hint: "地毛がこげ茶→オータム傾向" },
      { id: "lightBrown", label: "明るめの茶色",               hint: "地毛が明るい茶→スプリング or サマー傾向" },
      { id: "unknown",    label: "わからない",                 hint: null },
    ],
  },
  {
    id: "complimentColor",
    label: "「似合う」と言われた色は?",
    icon: "🎨",
    options: [
      { id: "warmBright", label: "明るい暖色（コーラル・オレンジ）", hint: "明るい暖色が似合う→スプリング傾向" },
      { id: "coolSoft",   label: "淡い寒色（ラベンダー・水色）",     hint: "淡い寒色が似合う→サマー傾向" },
      { id: "warmDeep",   label: "深い暖色（テラコッタ・カーキ）",   hint: "深い暖色が似合う→オータム傾向" },
      { id: "coolBright", label: "鮮やか or モノトーン（黒・赤）",   hint: "鮮やか・モノトーンが似合う→ウィンター傾向" },
      { id: "unknown",    label: "特にない / わからない",           hint: null },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────
// 骨格スコアリング関数
// 戻り値: { primary, breakdown, confidence, answered } | null
// ─────────────────────────────────────────────────────────────────
export const calcBoneType = (answers) => {
  const scores = { "ストレート": 0, "ウェーブ": 0, "ナチュラル": 0 };
  let answered = 0;

  for (const q of BONE_QUESTIONS) {
    const selectedId = answers?.[q.id];
    if (!selectedId) continue;
    const opt = q.options.find(o => o.id === selectedId);
    if (!opt) continue;
    answered++;
    for (const [type, points] of Object.entries(opt.score)) {
      scores[type] += points;
    }
  }

  if (answered === 0) return null;

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const total = scores.ストレート + scores.ウェーブ + scores.ナチュラル;
  const gap = sorted[0][1] - sorted[1][1];

  // 信頼度判定
  // high:   4問以上 + 1位と2位の差が3点以上（明確）
  // medium: 3問以上 + 1位と2位の差が2点以上（やや明確）
  // low:    それ以外（ヒント程度）
  let confidence = "low";
  if (answered >= 4 && gap >= 3) confidence = "high";
  else if (answered >= 3 && gap >= 2) confidence = "medium";

  const breakdown = sorted.map(([type, score]) => ({
    type,
    percentage: total > 0 ? Math.round((score / total) * 100) : 0,
  }));

  return { primary: sorted[0][0], breakdown, confidence, answered };
};

// ─────────────────────────────────────────────────────────────────
// PC回答からヒント文字列を集める
// ─────────────────────────────────────────────────────────────────
export const collectPcHints = (answers) => {
  const hints = [];
  for (const q of PC_QUESTIONS) {
    const selectedId = answers?.[q.id];
    if (!selectedId) continue;
    const opt = q.options.find(o => o.id === selectedId);
    if (opt?.hint) hints.push(opt.hint);
  }
  return hints;
};

// ─────────────────────────────────────────────────────────────────
// AIプロンプトに追加する extraInfo を組み立てる
// ─────────────────────────────────────────────────────────────────
export const buildExtraInfoForPrompt = ({ bodyHeight, boneAnswers, pcAnswers }) => {
  const parts = [];
  const boneResult = calcBoneType(boneAnswers);
  const pcHints = collectPcHints(pcAnswers);

  if (bodyHeight || boneResult || pcHints.length > 0) {
    parts.push("\n\n═══════════════════════════════════");
    parts.push("■ ユーザーからの追加情報");
    parts.push("═══════════════════════════════════");
  }

  if (bodyHeight) {
    parts.push(`\n身長: ${bodyHeight}cm`);
  }

  if (boneResult) {
    if (boneResult.confidence === "high" || boneResult.confidence === "medium") {
      parts.push(`\n【骨格はユーザー回答により確定】`);
      parts.push(`ユーザーが${boneResult.answered}問の質問に答え、その結果から骨格は「${boneResult.primary}」と判定されています。`);
      parts.push(`内訳: ${boneResult.breakdown.map(b => `${b.type} ${b.percentage}%`).join(' / ')}`);
      parts.push(`信頼度: ${boneResult.confidence}`);
      parts.push(`★必ず bone.primary を "${boneResult.primary}" として、breakdown も上記のままで出力してください。`);
      parts.push(`bone.confidence は "${boneResult.confidence}" にし、bone.note には「あなたの回答に基づいて判定しました」と書いてください。`);
    } else {
      parts.push(`\n【骨格判定のヒント】`);
      parts.push(`ユーザー回答（${boneResult.answered}問）から、${boneResult.primary}傾向（${boneResult.breakdown[0].percentage}%）が見られます。写真と総合して判定してください。`);
    }
  }

  if (pcHints.length > 0) {
    parts.push(`\n【パーソナルカラー判定のヒント（ユーザー自己申告）】`);
    pcHints.forEach(h => parts.push(`・${h}`));
    parts.push(`★これらのヒントは判定の有力な根拠です。写真の観察と総合し、矛盾なければヒント側を優先してください。`);
  }

  return parts.join("\n");
};

// ═══════════════════════════════════════════════════════════════
// 🎨 UI: DiagnosisQuestionsForm
// ═══════════════════════════════════════════════════════════════

const cardStyle = {
  padding: "14px 16px", borderRadius: 14,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const sectionTitleStyle = {
  fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.85)",
  display: "flex", alignItems: "center", gap: 8, marginBottom: 4,
};

const sectionDescStyle = {
  fontSize: 10, color: "rgba(255,255,255,0.45)",
  lineHeight: 1.6, marginBottom: 14,
};

const questionLabelStyle = {
  fontSize: 11, fontWeight: 700,
  color: "rgba(255,255,255,0.7)", marginBottom: 6,
};

// 1問分のボタン群
function QuestionRow({ question, value, onChange }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={questionLabelStyle}>
        {question.icon} {question.label}
      </div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {question.options.map(opt => {
          const active = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(active ? null : opt.id)}
              style={{
                flex: "1 1 calc(50% - 3px)", minWidth: 0,
                padding: "8px 6px", borderRadius: 9,
                border: "none", cursor: "pointer",
                background: active
                  ? "linear-gradient(135deg,#8b5cf6,#ec4899)"
                  : "rgba(255,255,255,0.05)",
                color: active ? "#fff" : "rgba(255,255,255,0.6)",
                fontSize: 11, fontWeight: 700,
                lineHeight: 1.3,
                transition: "all .15s",
                whiteSpace: "normal",
                wordBreak: "keep-all",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DiagnosisQuestionsForm({
  bodyHeight, setBodyHeight,
  boneAnswers, setBoneAnswers,
  pcAnswers, setPcAnswers,
}) {
  const setBoneAnswer = (qId, optId) =>
    setBoneAnswers(prev => ({ ...prev, [qId]: optId }));
  const setPcAnswer = (qId, optId) =>
    setPcAnswers(prev => ({ ...prev, [qId]: optId }));

  const boneResult = calcBoneType(boneAnswers);
  const pcAnsweredCount = PC_QUESTIONS.filter(q => pcAnswers?.[q.id]).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* ─── イントロ ─── */}
      <div style={cardStyle}>
        <div style={sectionTitleStyle}>
          <span>💎</span>
          <span>診断の精度を上げる質問（任意）</span>
        </div>
        <div style={sectionDescStyle}>
          全部スキップしても診断できます。答えるほど精度が上がります。
          特に骨格は顔写真だけだと判定が難しいので、質問に答えるのがオススメです。
        </div>
      </div>

      {/* ─── 身長 ─── */}
      <div style={cardStyle}>
        <div style={sectionTitleStyle}>
          <span>📏</span>
          <span>身長</span>
        </div>
        <input
          type="number"
          value={bodyHeight}
          onChange={(e) => setBodyHeight(e.target.value)}
          placeholder="例: 160"
          style={{
            width: "100%", padding: "10px 12px",
            borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(0,0,0,0.2)", color: "#fff",
            fontSize: 13, fontWeight: 600, outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* ─── 骨格判定の質問 ─── */}
      <div style={cardStyle}>
        <div style={sectionTitleStyle}>
          <span>🦴</span>
          <span>
            骨格を見つける質問
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginLeft: 6, fontWeight: 600 }}>
              （{Object.values(boneAnswers || {}).filter(Boolean).length} / {BONE_QUESTIONS.length}問）
            </span>
          </span>
        </div>
        <div style={sectionDescStyle}>
          自分の体を鏡で見ながら、近いものを選んでください。
          <span style={{ color: "#a78bfa", fontWeight: 700 }}>4問以上で精度がぐっと上がります。</span>
        </div>

        {BONE_QUESTIONS.map(q => (
          <QuestionRow
            key={q.id}
            question={q}
            value={boneAnswers?.[q.id]}
            onChange={(v) => setBoneAnswer(q.id, v)}
          />
        ))}

        {/* 途中結果プレビュー */}
        {boneResult && (
          <div style={{
            marginTop: 10, padding: "10px 12px", borderRadius: 10,
            background: "linear-gradient(135deg,rgba(139,92,246,0.15),rgba(236,72,153,0.1))",
            border: "1px solid rgba(139,92,246,0.3)",
          }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", marginBottom: 4 }}>
              現在のあなたの傾向
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>
              💫 {boneResult.primary}（{boneResult.breakdown[0].percentage}%）
              {boneResult.confidence === "high" && (
                <span style={{ fontSize: 10, color: "#34d399", marginLeft: 6, fontWeight: 700 }}>
                  ◎ 信頼度高
                </span>
              )}
              {boneResult.confidence === "medium" && (
                <span style={{ fontSize: 10, color: "#fbbf24", marginLeft: 6, fontWeight: 700 }}>
                  ○ 信頼度中
                </span>
              )}
              {boneResult.confidence === "low" && (
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginLeft: 6, fontWeight: 700 }}>
                  あと{4 - boneResult.answered > 0 ? 4 - boneResult.answered : "少し"}問で精度UP
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── パーソナルカラーのヒント ─── */}
      <div style={cardStyle}>
        <div style={sectionTitleStyle}>
          <span>🎨</span>
          <span>
            パーソナルカラーのヒント
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginLeft: 6, fontWeight: 600 }}>
              （{pcAnsweredCount} / {PC_QUESTIONS.length}問）
            </span>
          </span>
        </div>
        <div style={sectionDescStyle}>
          わかるものだけ答えてください。AIが写真と合わせて判定します。
        </div>

        {PC_QUESTIONS.map(q => (
          <QuestionRow
            key={q.id}
            question={q}
            value={pcAnswers?.[q.id]}
            onChange={(v) => setPcAnswer(q.id, v)}
          />
        ))}
      </div>

    </div>
  );
}
