import { useState, useEffect } from "react";

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

    const prompt = `この写真の顔を観察し、以下のJSONフォーマットのみで返してください（前後の説明文不要、JSON以外は出力しない）。

【観察するパーツ】eyes, eyebrows, nose, mouth, ears, balance（余白）, depth（凹凸）
【3つの診断】
① 8タイプ分類: キュート / フレッシュ / アクティブキュート / クールカジュアル / フェミニン / ソフトエレガント / エレガント / クール
② 骨格: ストレート / ウェーブ / ナチュラル（上位3タイプを合計100%で配分、全身写真がない旨を明記）
③ パーソナルカラー: スプリング / サマー / オータム / ウィンター

【ルール】
- 各パーツは25文字程度、観察ベースで「〜な傾向」「〜の印象」
- charmは20文字以内、温かく自信が持てる言葉
- 辛辣・否定的な表現は絶対禁止

{
  "parts": {"eyes":"...","eyebrows":"...","nose":"...","mouth":"...","ears":"...","balance":"...","depth":"..."},
  "charm": "...",
  "eightType": {
    "primary": "〇〇",
    "axes": {"age":"子供寄り|大人寄り","impression":"親しみ|かっこいい","line":"曲線|直線"},
    "note": "観察コメント"
  },
  "bone": {
    "primary": "〇〇",
    "breakdown": [{"type":"〇〇","percentage":50},{"type":"〇〇","percentage":30},{"type":"〇〇","percentage":20}],
    "note": "全身写真がないため参考程度です。..."
  },
  "personalColor": {
    "primary": "〇〇",
    "undertone": "イエローベース|ブルーベース",
    "note": "判定理由",
    "recommendedColors": ["色1","色2","色3"]
  }
}`;

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
          setAnalysisResult(data.result);
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
        setAnalysisResult(parsed);
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
    setAnalysisResult(demoResult);
    showToast("🎨 デモモード：サンプル結果を表示しています");
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

          <label htmlFor="home-image-upload" style={{display:"block",cursor:"pointer"}}>
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
          </label>
          <input
            id="home-image-upload"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{position:"absolute", width:1, height:1, opacity:0, pointerEvents:"none"}}
          />

          {uploadedImg && !analysisResult && (
            <GradBtn
              grad={aiLoading?"rgba(255,255,255,0.08)":"linear-gradient(135deg,#8b5cf6,#ec4899,#f97316)"}
              onClick={diagnoseWithAI} disabled={aiLoading}>
              {aiLoading?"✨ パーツを細かく見ています...":"🤖 AI診断スタート"}
            </GradBtn>
          )}

          {analysisResult && (
            <>
              <AIAnalysisCard analysis={analysisResult}/>

              {/* TODO: ここに「季節・TPO別の商品提案」セクションを追加予定
                  - 春夏秋冬 × シーン別のアイテム推薦
                  - 楽天・Amazonアフィリエイトリンク埋め込み
                  - タイプ（8タイプ/骨格/パーソナルカラー）に応じたフィルタ */}

              <div style={{padding:"14px",borderRadius:16,
                background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)"}}>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.5)",marginBottom:12,textAlign:"center",fontWeight:600}}>
                  結果をどうしますか？
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  <GradBtn grad="linear-gradient(135deg,#8b5cf6,#ec4899)" onClick={saveToHistory}>
                    💾 履歴に保存する
                  </GradBtn>
                  <button onClick={()=>{setUploadedImg(null); setAnalysisResult(null);}} style={{
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

          {/* TODO: 今後ここに追加予定のメニュー
              - 利用規約・プライバシーポリシー
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

      {isMainTab && (
        <BottomNav current={mode} onChange={(t)=>{
          if (t !== mode) { setUploadedImg(null); setAnalysisResult(null); }
          setMode(t);
        }}/>
      )}
    </div>
  );
}
