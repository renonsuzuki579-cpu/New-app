import { useState, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════
// タイプ定義（こちら）
// ═══════════════════════════════════════════════════════════════

const FACE_PARTS = [
  { id:"目", ラベル:"目", 絵文字:"👁" },
  { id:"眉毛", ラベル:"眉毛", 絵文字:"✏️" },
  { id:"nose", label:"鼻", emoji:"👃" },
  { id:"mouth", label:"口", emoji:"👄" },
  { id:"耳", ラベル:"耳", 絵文字:"👂" },
  { id:"balance", label:"顔の余白", emoji:"🪞" },
  { id:"深さ", label:"顔の凹凸", emoji:"⛰" },
];

const EIGHT_TYPES = [
  { id:"cute", label:"キュート", axes:"子供寄り × 予想 × 膨", grad:"linear-gradient(135deg,#fbcfe8,#f9a8d4)" },
  { id:"fresh", label:"フレッシュ", axes:"子供寄り × 予想 × 直線", grad:"linear-gradient(135deg,#bbf7d0,#86efac)" },
  { id:"activeCute", label:"アクティブキュート", axes:"子供寄り × かっこいい × 膨らみ", grad:"linear-gradient(135deg,#fde68a,#fbbf24)" },
  { id:"coolCasual", label:"クールカジュアル", axes:"子供寄り × かっこいい × 直線", grad:"linear-gradient(135deg,#bae6fd,#7dd3fc)" },
  { id:"feminine", label:"フェミニン", axes:"大人寄り × 予想 × 膨らみ", grad:"linear-gradient(135deg,#f5d0fe,#e879f9)" },
  { id:"softElegant", label:"ソフトエレガント", axes:"大人寄り × 予想 × 直線", grad:"linear-gradient(135deg,#e9d5ff,#c084fc)" },
  { id:"elegant", label:"エレガント", axes:"大人寄り × かっこいい × 膨らみ", grad:"linear-gradient(135deg,#fecaca,#f87171)" },
  { id:"cool", label:"クール", axes:"大人寄り × かっこいい × 直線", grad:"linear-gradient(135deg,#c7d2fe,#818cf8)" },
];

const BONE_TYPES = [
  { id:"straight", label:"ストレート", feature:"メリハリがあり上半身厚み、肌に弾力", grad:"linear-gradient(135deg,#fef3c7,#fbbf24)" },
  { id:"wave", label:"ウェーブ", feature:"柔らかく柔らかい、下半身にボリューム", grad:"linear-gradient(135deg,#fce7f3,#f472b6)" },
  { id:"natural", label:"ナチュラル", feature:"フレーム感があり骨・関節が目立つ", grad:"linear-gradient(135deg,#d1fae5,#34d399)" },
];

const PC_TYPEs = [
  { id:"spring", label:"スプリング", tone:"イエローベース・明るい", color:["コーラル","ピーチ","クリーム","サーモンピンク"], grad:"linear-gradient(135deg,#fde68a,#fb923c)" },
  { id:"サマー", ラベル:"サマー", トーン:"ブルーベース・柔らかい", 色:["ラベンダー","ローズピンク","スカイブルー","ミントグリーン"], grad:"linear-gradient(135deg,#bae6fd,#c4b5fd)" },
  { id:"秋", ラベル:"オータム", トーン:"イエローベース・深い", 色:["テラコッタ","マスタード","カーキ","ブラウン"], grad:"linear-gradient(135deg,#fdba74,#c2410c)" },
  { id:"冬", ラベル:"ウィンター", トーン:"ブルーベース・発色", 色:["ロイヤルブルー","マゼンタ","ピュアホワイト","黒"], grad:"linear-gradient(135deg,#67e8f9,#6366f1)" },
];

// ═══════════════════════════════════════════════════════════════
// 🆕 投票システムの定義
// ═══════════════════════════════════════════════════════════════
// 「わからない」を表す特別な値（タイプ一覧に存在しない文字列）
export const UNKNOWN_VOTE = "unknown";

// 3つの診断軸。オプションは既存のタイプ定義を流用
const VOTE_AXES = [
  { id:"eightType", label:"8タイプ", emoji:"💫", options: EIGHT_TYPES, grad:"linear-gradient(135deg,#818cf8,#c084fc)" },
  { id:"bone", label:"", emoji:"🦴", options: BONE_TYPES, grad:"linear-gradient(135deg,#34d399,#06b6d4)" },
  { id:"personalColor", label:"パーソナルカラー", emoji:"🎨", options: PC_TYPES, grad:"linear-gradient(135deg,#fb923c,#f43f5e)" },
];

// 新しい投稿のため、空の投票オブジェクトを作る
const emptyVotes = () => ({ eightType:{}, bone:{}, personalColor:{} });

// 3軸すべての得票数を合計する（人気度表示用ではなく「何票集まったか」の総計）
const totalVoteCount = (投票数) => {
  投票がない場合、0を返す。
  return VOTE_AXES.reduce((sum, axis) => {
    const axisVotes = votes[axis.id] || {};
    return sum + Object.values(axisVotes).reduce((a,b) => a+b, 0);
  }, 0);
};

// 特定の軸の総得票数
const axisVoteCount = (votes, axisId) => {
  const axisVotes = votes?.[axisId] || {};
  return Object.values(axisVotes).reduce((a,b) => a+b, 0);
};

// ある軸での最多得票タイプを返す（"unknown" は賞賛）
// 例: { type: "フェミン", count: 12 }
const topVote = (votes, axisId) => {
  const axisVotes = votes?.[axisId] || {};
  const entries = Object.entries(axisVotes).filter(([k]) => k !== UNKNOWN_VOTE);
  if (entries.length === 0) return null;
  entries.sort((a,b) => b[1] - a[1]);
  return { type: entries[0][0], count: entries[0][1] };
};

// AI判定と、みんなの投票がどれくらい一致している割合%で返す（0〜100）
const agreementWithAI = (votes, axisId, aiPrimary) => {
  if (!aiPrimary) return null;
  const axisVotes = votes?.[axisId] || {};
  const matching = axisVotes[aiPrimary] || 0;
  const total = axisVoteCount(votes, axisId);
  if (total === 0) return null;
  return Math.round((一致する数 / 合計) * 100);
};

// 🆕 タスク 6: 注目度スコア（いいね + 投票の合計）
// 投票は少し軽め（×0.5）にして、いいねを重視した指標にする
const attentionScore = (post) => {
  const likes = post.likes || 0;
  const 投票 = totalVoteCount(post.votes);
  いいね数×2＋投票数を返します。
};

// 🆕 タスク 6: 投稿主だけが使うランキング計算
// 指定された投稿が、全投稿の中で注目度何位戻ってくる
// 例: { ランク: 3, 合計: 6, パーセンタイル: 50 }
const getPostRanking = (targetPost, allPosts) => {
  !targetPost の場合は null を返す。
  const sorted = [...allPosts].sort((a,b) => attentionScore(b) - attentionScore(a));
  const rank = sorted.findIndex(p => p.id === targetPost.id) + 1;
  const total = allPosts.length;
  ランクが0の場合はnullを返す。
  // パーセンタイル = 下位から見た位置%（上位ほど大きい）
  const percentile = Math.round(((total - rank + 1) / total) * 100);
  {順位、合計、パーセンタイル}を返します。
};

// 🆕 タスク 6: 並び順の定義
const SORT_ORDERS = [
  { id:"最新", label:"新着", icon:"🆕", grad:"linear-gradient(135deg,#60a5fa,#818cf8)" },
  { id:"注目", ラベル:"注目", アイコン:"🔥", grad:"linear-gradient(135deg,#f43f5e,#f97316)" },
  { id:"シャッフル", label:"シャッフル", icon:"🔀", grad:"linear-gradient(135deg,#c084fc,#ec4899)" },
];

// 並び順を投稿配列に適用する
// shuffleSeed は同じ値なら同じ順番になる（再順番で順番がブレないように）
const applySortOrder = (posts, sortId, shuffleSeed = 0) => {
  if (sortId === "attention") {
    return [...posts].sort((a,b) => attentionScore(b) - attentionScore(a));
  }
  if (sortId === "shuffle") {
    // 疑似ランダム（シード固定）
    return [...posts].sort((a,b) => {
      const ha = ((a.id * 9301 + shuffleSeed * 49297) % 233280) / 233280;
      const hb = ((b.id * 9301 + shuffleSeed * 49297) % 233280) / 233280;
      ha - hb を返します。
    });
  }
  // 安心: 新しい順（idが大きいほど新しい）
  return [...posts].sort((a,b) => b.id - a.id);
};

// ═══════════════════════════════════════════════════════════════
// 🆕人気度ティア（いいね数ベースに変更）
// ═══════════════════════════════════════════════════════════════
const POPULARITY_TIERS = [
  { id:"t0", label:"0〜5", range:[0, 5], icon:"🌱", grad:"linear-gradient(135deg,#34d399,#06b6d4)" },
  { id:"t1", label:"6〜20", range:[6, 20], icon:"💫", grad:"linear-gradient(135deg,#f472b6,#c084fc)" },
  { id:"t2", label:"21〜50", range:[21, 50], icon:"🔥", grad:"linear-gradient(135deg,#f43f5e,#f97316)" },
  { id:"t3", label:"51以上", range:[51, Infinity], icon:"👑", grad:"linear-gradient(135deg,#fbbf24,#f97316)" },
];

// ═══════════════════════════════════════════════════════════════
// サンプル診断データ（あります）
// ═══════════════════════════════════════════════════════════════
const sampleAnalysis = (eightType="フェミニン",bone="ウェーブ",pc="スプリング") => ({
  部品：{
    eyes:"いやつらを耐えた、印象的な目元です。",
    眉毛：「自然なアーチを描き、優しい印象。」
    names:"鼻筋が通り、バランスの良い形。",
    口:「口角がやや上がる、ありそうな印象。」
    耳:"顔とのバランスが整いました。",
    バランス:"パーツの配置に余裕があり、落ち着いた印象。",
    Depth:"自然な陰影があり、立体感があります。",
  },
  魅力：「温かみのある自然体な表情が魅力です。」
  eightType:{
    プライマリ: 8Type、
    axes:{ age:"大人寄り", 印象:"今度", line:"膨らみ" },
    注:「柔らかい印象と曲線的なラインが特徴的に見えます。」
  },
  骨：{
    プライマリー: 骨、
    壊す：[
      { タイプ: 骨、パーセンテージ:55 }、
      { type: BONE_TYPES.filter(b=>b.label!==bone)[0].label, percentage:25 },
      { type: BONE_TYPES.filter(b=>b.label!==bone)[1].label, percentage:20 },
    ],
    note:"首や肩の印象からの推測です。より正確な判定には全身写真が必要です。",
  },
  personalColor:{
    プライマリ: PC、
    アンダートーン: pc==="スプリング"||pc==="オータム" ? "イエローベース" : "ブルーベース",
    note:"肌の明るささとトーンから判定しました。",
    recommendedColors: PC_TYPES.find(p=>p.label===pc)?.colors.slice(0,3) || [],
  },
});

// ═══════════════════════════════════════════════════════════════
// 🆕 DEMO_POSTS（新しい投票 + いいねの構造）
// ═══════════════════════════════════════════════════════════════
const DEMO_POSTS = [
  {
    id:1、ユーザー名:"sakura_chan", sns:"https://twitter.com/sakura",
    画像:"https://api.dicebear.com/7.x/avataaars/svg?seed=sakura&backgroundColor=ffd5dc",
    分析:sampleAnalysis("フェミニン","ウェーブ","スプリング"),
    投票数: {
      EightType: { "フェミニン":5, "ソフトエレガント":2, "エレガント":1, [UNKNOWN_VOTE]:1 },
      ボーン: { "ウェーブ":4, "ストレート":1, [UNKNOWN_VOTE]:2 },
      PersonalColor: { "スプリング":3, "サマー":1, [UNKNOWN_VOTE]:4 },
    },
    いいね: 8、
    isMyPost: false、
  },
  {
    id:2、ユーザー名:"taro_cool", sns:"https://instagram.com/taro",
    画像:"https://api.dicebear.com/7.x/avataaars/svg?seed=taro&backgroundColor=c0e8ff",
    分析:サンプル分析("クール","ストレート","ウィンター"),
    投票数: {
      EightType: { "クール":7, "クールカジュアル":3, "エレガント":1, [UNKNOWN_VOTE]:1 },
      ボーン: { "ストレート":8, "ナチュラル":2, [UNKNOWN_VOTE]:1 },
      PersonalColor: { "ウィンター":5, "オータム":2, [UNKNOWN_VOTE]:4 },
    },
    いいね: 15、
    isMyPost: false、
  },
  {
    id:3、ユーザー名:"mimi_style", sns:"https://tiktok.com/@mimi",
    画像:"https://api.dicebear.com/7.x/avataaars/svg?seed=mimi&backgroundColor=d4f5d4",
    分析:sampleAnalysis("キュート","ウェーブ","スプリング"),
    投票数: {
      EightType: { "キュート":18, "フェミニン":8, "フレッシュ":4, "アクティブキュート":2, [UNKNOWN_VOTE]:2 },
      ボーン: { "ウェーブ":15, "ストレート":3, [UNKNOWN_VOTE]:6 },
      パーソナルカラー: { "スプリング":14, "サマー":5, [UNKNOWN_VOTE]:7 },
    },
    いいね: 42、
    isMyPost: false、
  },
  {
    id:4、ユーザー名:"kei_vibes", sns:"",
    画像:"https://api.dicebear.com/7.x/avataaars/svg?seed=kei&backgroundColor=ffe4e1",
    分析:sampleAnalysis("ソフトエレガント","ナチュラル","サマー"),
    投票数: {
      EightType: { "ソフトエレガント":2, "フェミニン":1 },
      ボーン: { "ナチュラル":1, [UNKNOWN_VOTE]:2 },
      パーソナルカラー: { "サマー":1, [UNKNOWN_VOTE]:2 },
    },
    いいね: 2、
    isMyPost: false、
  },
  {
    ID:5、ユーザー名:"hana_fox", SNS:"https://instagram.com/hana",
    画像:"https://api.dicebear.com/7.x/avataaars/svg?seed=hana&backgroundColor=e8f4fd",
    分析:sampleAnalysis("エレガント","ストレート","オータム"),
    投票: emptyVotes()、
    いいね: 0、
    isMyPost: false、
  },
];

// ═══════════════════════════════════════════════════════════════
// 画像サイズ変更ヘルパー（あり）
// ═══════════════════════════════════════════════════════════════
const resizeImage = (dataUrl, maxSize = 1024) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > height && width > maxSize) {
        height = Math.round((height * maxSize) / width);
        幅 = 最大サイズ;
      } else if (height > maxSize) {
        width = Math.round((width * maxSize) / height);
        高さ = 最大サイズ;
      }
      const canvas = document.createElement("canvas");
      キャンバスの幅 = 幅;
      キャンバスの高さ = 高さ;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};

// ═══════════════════════════════════════════════════════════════
// 共有 UI コンポーネント（あり）
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
    幅:"100%", パディング:small?10px 14px":"15px", borderRadius:small?12:18,
    border:"none", background:disabled?"rgba(255,255,255,0.08):grad,
    color:disabled?"rgba(255,255,255,0.25)":"#fff", fontWeight:800,
    フォントサイズ:small?13:15、カーソル:disabled?not-allowed":"pointer",
    boxShadow:disabled?"none":"0 4px 18px rgba(0,0,0,0.3)", transition:"all .15s",
    letterSpacing:"0.2px",
  }}>{children}</button>
);

const GlassInput = ({ placeholder, value, onChange }) => (
  <input placeholder={placeholder} value={value} onChange={onChange} style={{
    幅:"100%", パディング:"13px 16px", 角丸:14、
    border:"1.5px solid rgba(255,255,255,0.15)", fontSize:15, outline:"none",
    背景:"rgba(255,255,255,0.07)", 背景フィルター:"blur(12px)",
    color:"#fff", caretColor:"#f472b6", boxSizing:"border-box",
  }}/>
);

const BackBtn = ({ onClick }) => (
  <button onClick={onClick} style={{
    背景:"なし", 境界線:"なし", カーソル:"ポインター", パディング:0,
    fontSize:14、fontWeight:700、color:"rgba(255,255,255,0.4)", alignSelf:"flex-start",
  }}>← 戻る</ボタン>
);

const Glass = ({ children, style={} }) => (
  <div style={{borderRadius:24, background:"rgba(255,255,255,0.06)", backdropFilter:"blur(18px)",
    border:"1.5px solid rgba(255,255,255,0.11)", boxShadow:"0 6px 28px rgba(0,0,0,0.3)", ...style}}>
    {子供たち}
  </div>
);

const FilterChip = ({ label, active, onClick, grad }) => (
  <button onClick={onClick} style={{
    padding:"7px 14px", borderRadius:99, border:"none", cursor:"pointer",
    background:active?(grad||"linear-gradient(135deg,#f472b6,#c084fc)"):"rgba(255,255,255,0.08)",
    color:active?"#fff":"rgba(255,255,255,0.45)",
    fontWeight:active?800:500、fontSize:12、whiteSpace:"nowrap"、
    boxShadow:active?"0 2px 10px rgba(0,0,0,0.25)":"none", transition:"all .15s",
  }}>{label}</button>
);

const activeFilterCount = (f) => (f.eightType?1:0) + (f.bone?1:0) + (f.color?1:0) + (f.popularity?1:0);

// 🆕人気度判定を「いいね数」ベースに変更
const matchFilter = (post, f) => {
  if (f.eightType && post.analysis?.eightType?.primary !== f.eightType) return false;
  if (f.bone && post.analysis?.bone?.primary !== f.bone) return false;
  if (f.color && post.analysis?.personalColor?.primary !== f.color) return false;
  if (f.popularity) {
    const tier = POPULARITY_TIERS.find(t=>t.id===f.popularity);
    if (tier) {
      const likes = post.likes || 0;
      if (likes < tier.range[0] || likes > tier.range[1]) return false;
    }
  }
  trueを返します。
};

const FilterIconButton = ({ count, onClick }) => (
  <button onClick={onClick} style={{
    位置:「相対」、幅:42、高さ:42、ボーダー半径:14、カーソル:「ポインター」、
    背景: count>0 ? "linear-gradient(135deg,#f472b6,#c084fc)" : "rgba(255,255,255,0.08)",
    border: count>0 ? "none" : "1.5px solid rgba(255,255,255,0.12)",
    display:"flex", alignItems:"center", justifyContent:"center",
    boxShadow: count>0 ? "0 3px 14px rgba(244,114,182,0.4)" : "none",
    トランジション:"すべて0.15秒",
  }}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={count>0?"#fff":"rgba(255,255,255,0.55)"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
    {count>0 && (
      <span style={{
        position:"absolute", top:-4, right:-4, minWidth:18, height:18, borderRadius:9,
        背景:"#fff", 色:"#c9184a", フォントサイズ:10、フォントウェイト:900、
        display:"flex", alignItems:"center", justifyContent:"center", padding:"0 4px",
        boxShadow:"0 2px 6px rgba(0,0,0,0.3)",
      }}>{count}</span>
    )}
  </button>
);

const FilterPanel = ({ filter, onChange, onClose }) => {
  const update = (key, val) => onChange({ ...filter, [key]: filter[key]===val ? null : val });
  const clearAll = () => onChange({ eightType:null, bone:null, color:null, popularity:null });
  戻る （
    <div style={{position:"fixed", inset:0, zIndex:1000, display:"flex", alignItems:"flex-end", justifyContent:"center"}}>
      <div onClick={onClose} style={{position:"absolute", inset:0, background:"rgba(0,0,0,0.5)", backdropFilter:"blur(4px)"}}/>
      <div style={{position:"relative", width:"100%", maxWidth:430,
        背景:"linear-gradient(180deg,#1e1b4b 0%,#0f172a 100%)",
        borderRadius:"28px 28px 0 0", padding:"20px 24px 32px",
        maxHeight:"85vh", overflowY:"auto", borderTop:"1px solid rgba(255,255,255,0.1)",
        boxShadow:"0 -10px 40px rgba(0,0,0,0.5)"}}>
        <div style={{width:40, height:4, background:"rgba(255,255,255,0.2)", borderRadius:99, margin:"0 auto 16px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div>
            <h2 style={{margin:0,fontSize:20,fontWeight:900,
              背景:"linear-gradient(135deg,#f9a8d4,#c084fc)",
              WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>🔍 絞り込み</h2>
            <p style={{margin:"3px 0 0",fontSize:11,color:"rgba(255,255,255,0.4)"}}>AI診断の結果でフィルター</p>
          </div>
          {activeFilterCount(filter)>0 && (
            <button onClick={clearAll} style={{
              背景:"rgba(255,255,255,0.08)",境界線:"1px solid rgba(255,255,255,0.15)",
              color:"rgba(255,255,255,0.7)",padding:"6px 12px",borderRadius:99,
              fontSize:11,fontWeight:700,cursor:"ポインタ"}}>クリア</button>
          )}
        </div>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:12,fontWeight:800,color:"rgba(255,255,255,0.6)",marginBottom:10}}>💫 8タイプ分類</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {EIGHT_TYPES.map(e => (
              <FilterChip key={e.id} label={e.label} active={filter.eightType===e.label}
                grad={e.grad} onClick={()=>update("eightType", e.label)}/>
            ))}
          </div>
        </div>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:12,fontWeight:800,color:"rgba(255,255,255,0.6)",marginBottom:10}}>🦴骨格診断</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {BONE_TYPES.map(b => (
              <FilterChip key={b.id} label={b.label} active={filter.bone===b.label}
                grad={b.grad} onClick={()=>update("bone", b.label)}/>
            ))}
          </div>
        </div>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:12,fontWeight:800,color:"rgba(255,255,255,0.6)",marginBottom:10}}>🎨パーソナルカラー</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {PC_TYPES.map(p => (
              <FilterChip key={p.id} label={p.label} active={filter.color===p.label}
                grad={p.grad} onClick={()=>update("color", p.label)}/>
            ))}
          </div>
        </div>
        <div style={{marginBottom:20}}>
          {/* 🔐 数字は投稿主にしか見えないが、フィルターとしては使える */}
          <div style={{fontSize:12,fontWeight:800,color:"rgba(255,255,255,0.6)",marginBottom:10}}>❤️人気度で絞り込み</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {POPULARITY_TIERS.map(t => (
              <FilterChip key={t.id} label={`${t.icon} ${t.label}`}
                active={filter.popularity===t.id} grad={t.grad}
                onClick={()=>update("popularity", t.id)}/>
            ))}
          </div>
        </div>
        <GradBtn grad="linear-gradient(135deg,#f43f5e,#f472b6,#c084fc)" onClick={onClose}>
          ✨絞り込みを適用
        </GradBtn>
      </div>
    </div>
  );
};

const ActiveFilterRow = ({ filter, onClear }) => {
  const chips = [];
  if (filter.eightType) {
    const t = EIGHT_TYPES.find(e=>e.label===filter.eightType);
    chips.push({ key:"eightType", label:"💫 "+filter.eightType, grad:t?.grad });
  }
  if (filter.bone) {
    const t = BONE_TYPES.find(b=>b.label===filter.bone);
    chips.push({ key:"bone", label:"🦴 "+filter.bone, grad:t?.grad });
  }
  if (filter.color) {
    const t = PC_TYPES.find(p=>p.label===filter.color);
    chips.push({ key:"color", label:"🎨 "+filter.color, grad:t?.grad });
  }
  if (filter.popularity) {
    const t = POPULARITY_TIERS.find(p=>p.id===filter.popularity);
    if (t) chips.push({ key:"popularity", label:`${t.icon} ${t.label}`, grad:t.grad });
  }
  チップの長さが0の場合は、nullを返します。
  戻る （
    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
      {chips.map(c => (
        <button key={c.key} onClick={()=>onClear(c.key)} style={{
          padding:"5px 12px", borderRadius:99, border:"none", cursor:"pointer",
          背景: c.grad || "linear-gradient(135deg,#f472b6,#c084fc)",
          color:"#fff", fontSize:11, fontWeight:800, display:"flex", alignItems:"center", gap:5,
          boxShadow:"0 2px 8px rgba(0,0,0,0.25)"}}>
          {c.label}
          <span style={{opacity:0.8,fontSize:12,marginLeft:2}}>×</span>
        </button>
      ))}
    </div>
  );
};

const BottomNav = ({ current, onChange }) => {
  const tabs = [
    { id:"feed", label:"ホーム", icon:"🏠", grad:"linear-gradient(135deg,#818cf8,#60a5fa)" },
    { id:"post", label:"投稿", icon:"📸", grad:"linear-gradient(135deg,#f472b6,#e879f9)" },
    { id:"aiOnly", label:"AI診断", icon:"🤖", grad:"linear-gradient(135deg,#8b5cf6,#ec4899)" },
    { id:"mypage", label:"マイ", icon:"👤", grad:"linear-gradient(135deg,#06b6d4,#34d399)" },
  ];
  戻る （
    <div style={{position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)",
      幅:"100%", 最大幅:430、zインデックス:100、
      背景:"rgba(15,10,30,0.85)", 背景フィルター:"blur(24px)",
      borderTop:"1px solid rgba(255,255,255,0.1)", padding:"8px 10px 18px"}}>
      <div style={{display:"flex",justifyContent:"space-around",alignItems:"center"}}>
        {tabs.map(t => {
          const active = current === t.id;
          戻る （
            <button key={t.id} onClick={()=>onChange(t.id)} style={{
              背景:"なし", 境界線:"なし", カーソル:"ポインター", パディング:"6px 10px",
              display:"flex", flexDirection:"column", alignItems:"center", gap:3, flex:1}}>
              <div style={{fontSize:22, transition:"transform .15s",
                transform:active?"scale(1.15)":"scale(1)",
                filter:active?"none":"grayscale(1) opacity(0.5)"}}>{t.icon}</div>
              <div style={{fontSize:10, fontWeight:800,
                背景: アクティブ? t.grad: "透明",
                WebkitBackgroundClip: アクティブ ? "text" : "initial",
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
// AI分析カード（あり、変更なし）
// ═══════════════════════════════════════════════════════════════
const AIAnalysisCard = ({ analysis, defaultOpen=true }) => {
  const [open, setOpen] = useState(defaultOpen);
  const [tab, setTab] = useState("eight");
  if (!analysis) return null;

  const tabs = [
    { id:"eight", label:"8タイプ", icon:"💫", show: !!analysis.eightType },
    { id:「bone」、label:「骨格」、icon:「🦴」、show: !!analysis.bone },
    { id:"カラー", ラベル:"カラー", アイコン:"🎨", 表示: !!analysis.personalColor },
    { id:"パーツ", ラベル:"パーツ", アイコン:"👁", 表示: !!analysis.parts },
  ].filter(t => t.show);

  戻る （
    <div style={{borderRadius:16,overflow:"hidden",
      背景:"linear-gradient(145deg,rgba(139,92,246,0.12),rgba(236,72,153,0.08))",
      border:"1px solid rgba(139,92,246,0.3)"}}>
      <div style={{padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",
        背景:"linear-gradient(135deg,rgba(139,92,246,0.25),rgba(236,72,153,0.15))",
        borderBottom:"1px solid rgba(255,255,255,0.08)",cursor:"pointer"}}
        onClick={()=>setOpen(o=>!o)}>
        <span style={{fontSize:12,fontWeight:800,
          背景:"linear-gradient(135deg,#c084fc,#ec4899)",
          WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
          🤖 AI詳細診断 by Claude
        </span>
        <span style={{fontSize:11,color:"rgba(255,255,255,0.5)",fontWeight:700}}>
          {open?"▲閉じる":"▼詳細"}
        </span>
      </div>

      <div style={{padding:"14px 16px"}}>
        {analysis.charm && (
          <div style={{fontSize:14,color:"rgba(255,255,255,0.85)",lineHeight:1.6,fontStyle:"italic",
            背景:"linear-gradient(135deg,#f9a8d4,#c084fc,#818cf8)",
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

        {開ける ＆＆ （
          <>
            {tabs.length > 1 && (
              <div style={{display:"flex",gap:5,marginTop:16,padding:"3px",
                背景:"rgba(0,0,0,0.25)",borderRadius:12,
                border:"1px solid rgba(255,255,255,0.05)"}}>
                {tabs.map(t => (
                  <button key={t.id} onClick={()=>setTab(t.id)} style={{
                    flex:1、padding:"7px 4px", borderRadius:9、border:"none",
                    背景: tab===t.id ? "linear-gradient(135deg,#8b5cf6,#ec4899)" : "transparent",
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
                        {分析パーツ[パーツID]}
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
                  <div style={{fontSize:11,fontWeight:700,opacity:0.85}}> あなたのタイプは</div>
                  <div style={{fontSize:22,fontWeight:900,marginTop:4}}>💫 {analysis.eightType.primary}</div>
                </div>
                {analysis.eightType.axes && (
                  <div style={{marginTop:12,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                    {[
                      { key:"年齢", label:"年齢感" },
                      { key:"印象", label:"印象" },
                      { キー:"ライン", ラベル:"ライン" },
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
                        背景: e.label===analysis.eightType.primary ? e.grad : "rgba(255,255,255,0.04)",
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
                <div style={{fontSize:11,fontWeight:800,color:"rgba(255,255,255,0.55)",marginBottom:10}}>◆骨格診断</div>
                <div style={{padding:"14px",borderRadius:14,
                  背景:BONE_TYPES.find(b=>b.label===analysis.bone.primary)?.grad||"linear-gradient(135deg,#34d399,#06b6d4)",
                  color:"#fff",textAlign:"center"}}>
                  <div style={{fontSize:11,fontWeight:700,opacity:0.85}}> あなたの骨格は</div>
                  <div style={{fontSize:22,fontWeight:900,marginTop:4}}>🦴 {analysis.bone.primary}タイプ</div>
                  <div style={{fontSize:11,marginTop:4,opacity:0.85}}>
                    {BONE_TYPES.find(b=>b.label===analysis.bone.primary)?.feature}
                  </div>
                </div>
                {分析.骨の分解 && (
                  <div style={{marginTop:12}}>
                    {analysis.bone.breakdown.map((item, i) => {
                      const typeData = BONE_TYPES.find(b=>b.label===item.type);
                      戻る （
                        <div key={i} style={{marginBottom:8}}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                            <span style={{fontSize:12,fontWeight:700,color:i===0?"#fff":"rgba(255,255,255,0.6)"}}>
                              {i===0?"🏆 ":""}{item.type}
                            </span>
                            <span style={{fontSize:11,fontWeight:800,color:"#34d399"}}>{item.percentage}%</span>
                          </div>
                          <div style={{background:"rgba(255,255,255,0.08)",borderRadius:99,height:5,overflow:"hidden"}}>
                            <div style={{width:`${item.percentage}%`,height:"100%",borderRadius:99,
                              背景: typeData?.grad || "linear-gradient(90deg,#34d399,#06b6d4)",
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
                <div style={{fontSize:11,fontWeight:800,color:"rgba(255,255,255,0.55)",marginBottom:10}}>◆パーソナルカラー</div>
                <div style={{padding:"14px",borderRadius:14,
                  background:PC_TYPES.find(p=>p.label===analysis.personalColor.primary)?.grad||"linear-gradient(135deg,#fb923c,#f43f5e)",
                  color:"#fff",textAlign:"center"}}>
                  <div style={{fontSize:11,fontWeight:700,opacity:0.85}}> あなたのシーズンは</div>
                  <div style={{fontSize:22,fontWeight:900,marginTop:4}}>🎨 {analysis.personalColor.primary}</div>
                  {analysis.personalColor.undertone && (
                    <div style={{fontSize:11,marginTop:4,opacity:0.9}}>{analysis.personalColor.undertone}</div>
                  )}
                </div>
                {analysis.personalColor.recommendedColors && analysis.personalColor.recommendedColors.length > 0 && (
                  <div style={{marginTop:12}}>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.5)",marginBottom:8,fontWeight:700}}>🎨おすすめカラー</div>
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
                      戻る （
                        <div key={p.id} style={{padding:"8px",borderRadius:10,
                          背景: アクティブ? p.grad : "rgba(255,255,255,0.04)",
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
                ⚠️AIの分析は参考情報です。 あなたの魅力はタイプで決まりません。
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// メインアプリ
// ═══════════════════════════════════════════════════════════════
export default function HyokaApp() {
  const [mode, setMode] = useState("feed");
  const [posts, setPosts] = useState(DEMO_POSTS);
  const [myPost, setMyPost] = useState(null);
  // 🆕 myEvals の構造を変更します。各要素は { postId, postUsername, Liked, votes, time }
  const [myEvals, setMyEvals] = useState([]);
  const [uploadedImg, setUploadedImg] = useState(null);
  const [snsLink, setSnsLink] = useState("");
  const [username, setUsername] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [toast, setToast] = useState(null);
  const [feedFilter, setFeedFilter] = useState({ eightType:null, bone:null, color:null, popularity:null });
  const [browseFilter, setBrowseFilter] = useState({ eightType:null, bone:null, color:null, popularity:null });
  const [filterOpen, setFilterOpen] = useState(false);
  // 🆕 タスク 6: 並び順の状態（フィードとブラウズで独立）
  const [feedSort, setFeedSort] = useState("newest");
  const [browseSort, setBrowseSort] = useState("newest");
  // シャッフルのシード値（「シャッフル」ボタンを押すたびに更新 → 新しい順）
  const [shuffleSeed, setShuffleSeed] = useState(() => Date.now() % 10000);
  const [aiOnlyHistory, setAiOnlyHistory] ​​= useState([]);
  const [inviteUrl, setInviteUrl] = useState("");
  // 🆕 fileRef は labelパターンに変更したので不要になりました

  useEffect(() => {
    if (typeof window !== "undefined") {
      setInviteUrl(window.location.href);
    }
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(null),2400); };

  // 🆕エラー時も正しくフィードバックが出るように改善
  const handleImageUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    // 入力リセット（同じファイルを選択直せるように）
    e.target.value = "";

    // 画像ファイルかチェック
    if (!file.type.startsWith("image/")) {
      showToast("⚠️画像ファイルを選んでください");
      戻る;
    }

    showToast("📸画像を読み込み中...");
    試す {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        試す {
          const resized = await resizeImage(ev.target.result, 1024);
          setUploadedImg(resized);
          setAnalysisResult(null);
          showToast("✅画像を読み込みました");
        } catch (err) {
          console.error("画像リサイズエラー:", err);
          showToast("⚠️画像の読み込みに失敗しました");
        }
      };
      reader.onerror = () => {
        showToast("⚠️ファイルの読み込みに失敗しました");
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("画像アップロードエラー:", err);
      showToast("⚠️エラーが発生しました");
    }
  };

  // AI診断
  // 🆕 3 段階フォールバック:
  // 1. /api/diagnoseを呼ぶ（Vercel本番ではAPIルート経由 → 安全）
  // 2. 失敗したら Anthropic API を直接呼ぶ（開発者向け、CORSで動かない環境もある）
  // 3. それも失敗したら → デモ結果を返す（チャットプレビュー・ローカルHTMLなど、どこでも動く）
  // これで「AI診断を押すのに何も起きない」が絶対に発生しない
  const diagnoseWithAI = async () => {
    if (!uploadedImg) return;
    setAiLoading(true);

    constプロンプト = `この写真の外観観察し、以下のJSON形式のみで返信してください（前後の説明文不要、JSON以外は出力しません）。

【観察するパーツ】目、眉毛、鼻、口、耳、バランス（余白）、深さ（凹凸）
【3つの診断】
① 8タイプ分類：キュート / フレッシュ / アクティブキュート / クールカジュアル / フェミニン / ソフトエレガント / エレガント / クール
②骨格：ストレート / ウェーブ / ナチュラル（上位3タイプを合計100%でおまかせ、全身写真がない旨を安心）
③パーソナルカラー：スプリング / 通常 / オータム / ウィンター

【ルール】
- 各パーツは25文字程度、観察ベースで「〜な傾向」「〜の印象」
- 魅力は20文字以内、自信が持てる言葉
- 辛辣・否定的な表現は絶対禁止

{
  「パーツ」：{「目」：...」、「眉毛」：...、「鼻」：...、「口」：...、「耳」：...、「バランス」：...、「奥行き」：...}、
  "魅力"： "..."、
  "eightType": {
    「プライマリ」: 「〇〇」、
    "axes": {"age":"子供寄り|大人寄り","impression":"すごい|かっこいい","line":"曲線|直線"},
    "note": "観察コメント"
  },
  「骨」：{
    「プライマリ」: 「〇〇」、
    "内訳": [{"type":"〇〇","percentage":50},{"type":"〇〇","percentage":30},{"type":"〇〇","percentage":20}],
    "note": "全身写真がないため参考程度です。..."
  },
  「パーソナルカラー」：{
    「プライマリ」: 「〇〇」、
    "undertone": "イエローベース|ブルーベース",
    "note": "判定理由",
    "recommendedColors": ["色1","色2","色3"]
  }
}`;

    // データURL →base64とmedia_typeに分解
    const match = uploadedImg.match(/^data:(image\/\w+);base64,(.+)$/);
    const mediaType = match ? match[1] : "image/jpeg";
    const base64Data = match ? match[2] : uploadedImg.split(",")[1];

    // 【段階1】 /api/diagnoseを試す（Vercel本番で有効）
    試す {
      const res = await fetch("/api/diagnose", {
        メソッド: "POST",
        ヘッダー: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Data, prompt }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.result) {
          setAnalysisResult(data.result);
          if (data.demo) showToast("🎨デモモードで診断しました");
          setAiLoading(false);
          戻る;
        }
      }
      // 404 や 500 → 次のフォールバックへ
      throw new Error("api_diagnose_unavailable");
    } catch (err) {
      console.log("[AI診断] /api/diagnose 利用不可、次の方法を試します");
    }

    // 【段階2】 Anthropic APIを直接呼ぶ（開発者がlocalhostなどで想定）
    // プレビュー環境・一般の本番ではCORSで失敗する
    試す {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        メソッド: "POST",
        ヘッダー: {
          "Content-Type": "application/json",
          「anthropic-dangerous-direct-browser-access」：「true」
        },
        body: JSON.stringify({
          モデル: "claude-sonnet-4-20250514",
          max_tokens: 1000、
          メッセージ: [{
            役割: "ユーザー",
            コンテンツ： [
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
        戻る;
      }
      throw new Error("anthropic_direct_unavailable");
    } catch (err) {
      console.log("[AI診断]直接API利用不可、デモモードで表示します");
    }

    // 【段階3】どこでも必ず動くデモ結果
    // AIの代わりに、見た目の多様性のためサンプルをランダムに作る
    await new Promise(r => setTimeout(r, 1500));
    const randomPick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const demoResult = sampleAnalysis(
      randomPick(EIGHT_TYPES).label、
      randomPick(BONE_TYPES).label、
      randomPick(PC_TYPEs).label、
    );
    setAnalysisResult(demoResult);
    showToast("🎨デモモード：サンプル結果を表示しています");
    setAiLoading(false);
  };

  // 🆕 新しい投稿は票（空）といいね:0 を持つ
  const submitPost = () => {
    if (!uploadedImg||!username||!analysisResult) return;
    const newPost = {
      id:Date.now()、username、sns:snsLink、image:uploadedImg、
      分析: 分析結果、
      投票: emptyVotes()、
      いいね: 0、
      isMyPost: true、
    };
    setMyPost(newPost);
    setPosts(p=>[newPost,...p]);
    setUploadedImg(null); setAnalysisResult(null); setUsername(""); setSnsLink("");
    setMode("result");
    showToast("💝投稿しました！");
  };

  const saveAiOnly = () => {
    if (!uploadedImg || !analysisResult) return;
    setAiOnlyHistory(h => [{
      id: Date.now()、画像: uploadedImg、
      分析: analysisResult、時間: new Date().toLocaleString("ja-JP")、
    }, ...h]);
    setUploadedImg(null); setAnalysisResult(null);
    showToast("💾あなただけの記録に保存しました");
    setMode("aiHistory");
  };

  // 🆕 タスク 2 で本実現（いいねボタン）
  //同じ人が同じ投稿に何度もいいねできないように、myEvalsで管理する
  //自分の投稿にはいいねできない
  const handleLike = (postId) => {
    const post = posts.find(p=>p.id===postId); if (!post) return;
    if (post.isMyPost) {
      showToast("自分の投稿にはいいねできません");
      戻る;
    }
    const present = myEvals.find(e=>e.postId===postId);
    const wasLiked = existing?.liked || false;
    const nowLiked = !wasLiked;

    // 投稿の「いいね！」を更新
    const delta = nowLiked ? 1 : -1;
    setPosts(p => p.map(pp => pp.id===postId ? {...pp, likes: Math.max(0, (pp.likes||0) + delta)} : pp));
    if (myPost?.id===postId) setMyPost(p => ({...p, likes: Math.max(0, (p.likes||0) + delta)}));

    // myEvals を更新（いいねのみ変更）
    （既存の）{
      setMyEvals(e => e.map(ev => ev.postId===postId
        ? {...ev, liked: nowLiked, time: new Date().toLocaleTimeString("ja-JP")}
        : ev ));
    } それ以外 {
      setMyEvals(e => [...e, {
        postId、postUsername: post.username、
        いいね: nowいいね、
        投票数: { eightType: null, bone: null, personalColor: null },
        時間: 新しい Date().toLocaleTimeString("ja-JP")、
      }]);
    }
    showToast(nowLiked ? "❤️ いいね！" : "💔 いいね取り消し");
  };

  // 🆕 タスク 3 で本実装（タイプ投票）
  // 動作仕様:
  // - 1軸だけでも投票可能（3軸すべて先に必要はない）
  // - いずれかの選択肢を再タップすると投票取り消し（nullになる）
  // - 違う選択肢をタップすると上書き（前の票をマイナスして新しい票をプラス）
  // - 自分の投稿には投票できない
  const handleVote = (postId, axisId, Choice) => {
    const post = posts.find(p=>p.id===postId); if (!post) return;
    if (post.isMyPost) {
      showToast("自分の投稿には投票できません");
      戻る;
    }
    const present = myEvals.find(e=>e.postId===postId);
    const prevChoice = existing?.votes?.[axisId] || null;
    //いずれかの選択肢をもう一度押したら取り消す
    const newChoice = prevChoice === choice ? null : choice;

    //posts.votes を更新（前の票を消す → 新しい票を足す）
    const updateVotes = (votes) => {
      const axisVotes = { ...(votes[axisId] || {}) };
      if (prevChoice && axisVotes[prevChoice]) {
        axisVotes[prevChoice] = axisVotes[prevChoice] - 1;
        if (axisVotes[prevChoice] <= 0) delete axisVotes[prevChoice];
      }
      if (newChoice) {
        axisVotes[newChoice] = (axisVotes[newChoice] || 0) + 1;
      }
      return { ...votes, [axisId]: axisVotes };
    };
    setPosts(p => p.map(pp => pp.id===postId ? {...pp, 投票: updateVotes(pp.votes)} : pp));
    if (myPost?.id===postId) setMyPost(p => ({...p, votes: updateVotes(p.votes)}));

    // myEvals を更新
    （既存の）{
      setMyEvals(e => e.map(ev => ev.postId===postId
        ? {...ev, votes: {...ev.votes, [axisId]: newChoice}, time: new Date().toLocaleTimeString("ja-JP")}
        : ev ));
    } それ以外 {
      setMyEvals(e => [...e, {
        postId、postUsername: post.username、
        いいね: false、
        投票: { eightType: null, bone: null, personalColor: null, [axisId]: newChoice },
        時間: 新しい Date().toLocaleTimeString("ja-JP")、
      }]);
    }

    const axis = VOTE_AXES.find(a=>a.id===axisId);
    if (newChoice === null) {
      showToast(`🗑 ${axis?.label}の投票を取り消しました`);
    } それ以外 {
      const label = newChoice === UNKNOWN_VOTE ? "疑問" : newChoice;
      showToast(`💫 ${axis?.label}：${label} に投票`);
    }
  };

  const copyInviteLink = async () => {
    試す {
      navigator.clipboard.writeText(inviteUrl) を待機します。
      showToast("📋 リンクをコピーしました！");
    } catch {
      showToast("⚠️コピーに失敗しました");
    }
  };

  const shareInviteLink = async () => {
    const shareData = {
      タイトル: "タイプ診断アプリ",
      text: "顔タイプ・骨格・パーソナルカラーをAI診断！みんなで評価し合おう✨",
      URL: 招待URL、
    };
    if (navigator.share) {
      試してください { await navigator.share(shareData); } catch { /*ユーザーキャンセル */ }
    } それ以外 {
      copyInviteLink();
    }
  };

  // 🆕 タスク 6: フィルター後に並び順を適用
  const feedPosts = applySortOrder(
    posts.filter(p=>!p.isMyPost && matchFilter(p, feedFilter)),
    フィードソート、
    shuffleSeed、
  );
  const browsePosts = applySortOrder(
    posts.filter(p=>matchFilter(p, browseFilter)),
    ブラウズソート、
    shuffleSeed、
  );
  const isMainTab = ["feed","post","aiOnly","mypage"].includes(mode);

  // シャッフルボタンが押されたときはシードを更新して、最初から順番が変わるようにする
  const handleSortChange = (setter) => (newSort) => {
    setter(newSort);
    if (newSort === "shuffle") setShuffleSeed(s => s + 1);
  };

  戻る （
    <div style={{minHeight:"100vh",
      背景:"linear-gradient(145deg,#1a0533 0%,#2d1065 30%,#1e1b4b 60%,#0f172a 100%)",
      fontFamily:"'Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif",
      maxWidth:430、margin:"0 auto", position:"relative", overflowX:"hidden",
      paddingBottom: isMainTab ? 90 : 20}}>
      <オーブ/>

      {トースト && (
        <div style={{position:"fixed",top:24,left:"50%",transform:"translateX(-50%)",
          background:"linear-gradient(135deg,#f472b6,#818cf8)",color:"#fff",borderRadius:24,
          padding:"10px 28px",zIndex:9999,fontSize:14,fontWeight:700,whiteSpace:"nowrap",
          boxShadow:"0 4px 24px rgba(244,114,182,0.5)",maxWidth:"90%",textAlign:"center"}}>
          {トースト}
        </div>
      )}

      <style>{`
        button:active{transform:scale(0.96)!important}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{display:none}
      `}</style>

      {/* 餌 */}
      {mode==="feed" && (
        <div style={{position:"relative",zIndex:1,padding:"36px 24px 24px",display:"flex",flexDirection:"column",gap:18}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
            <div style={{flex:1}}>
              <h1 style={{margin:0,fontSize:28,fontWeight:900,lineHeight:1.15,
                背景:"linear-gradient(135deg,#f9a8d4,#c084fc,#818cf8)",
                WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
                💘みんなを評価
              </h1>
              <p style={{margin:"6px 0 0",fontSize:12,color:"rgba(255,255,255,0.4)"}}>
                誰かの魅力を見つけて、いいねと投票を送ろう
              </p>
            </div>
            <FilterIconButton count={activeFilterCount(feedFilter)} onClick={()=>setFilterOpen("feed")}/>
          </div>
          {activeFilterCount(feedFilter)>0 && (
            <ActiveFilterRow filter={feedFilter}
              onClear={(key)=>setFeedFilter(f=>({...f, [key]:null}))}/>
          )}
          {/* 🆕 タスク 6: 並び順切り替え */}
          <SortTabs current={feedSort} onChange={handleSortChange(setFeedSort)}/>
          {feedPosts.length===0 && (
            <div style={{textAlign:"center",color:"rgba(255,255,255,0.2)",marginTop:60,fontSize:15}}>
              {activeFilterCount(feedFilter)===0?"投稿がまだありません":"この条件に合う投稿はありません"}
            </div>
          )}
          {feedPosts.map(post=>(
            <EvalCard key={post.id} post={post}
              myEval={myEvals.find(e=>e.postId===post.id)}
              onLike={()=>handleLike(post.id)}
              onVote={(axisId, choice)=>handleVote(post.id, axisId, choice)}/>
          ))}
        </div>
      )}

      {/* 役職 */}
      {mode==="post" && (
        <div style={{position:"relative",zIndex:1,padding:"36px 24px 24px",display:"flex",flexDirection:"column",gap:18}}>
          <div>
            <h1 style={{margin:0,fontSize:28,fontWeight:900,
              background:"linear-gradient(135deg,#f9a8d4,#c084fc)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
              📸写真を投稿
            </h1>
            <p style={{margin:"6px 0 0",fontSize:12,color:"rgba(255,255,255,0.4)"}}>
              AI詳細を診断経て、みんなから評価してもおう
            </p>
          </div>

          {/* 🆕 ラベルで入力を確実に開く（スマホでも移動） */}
          <label htmlFor="post-image-upload" style={{
            表示:"ブロック", カーソル:"ポインター",
          }}>
            <div style={{
              幅:"100%",アスペクト比:"1",ボーダー半径:28、
              border:"2px solid rgba(244,114,182,0.35)",
              背景:uploadedImg?"透明":"rgba(255,255,255,0.04)",
              backdropFilter:"blur(12px)",
              display:"flex",alignItems:"center",justifyContent:"center",
              overflow:"hidden"}}>
              {アップロードされた画像}
                ? <img src={uploadedImg} style={{width:"100%",height:"100%",objectFit:"cover"}} alt="アップロード画像"/>
                : <div style={{textAlign:"center",color:"rgba(244,114,182,0.6)"}}>
                    <div style={{fontSize:48}}>📷</div>
                    <div style={{fontSize:13,marginTop:10}}> タップして写真を選ぶ</div>
                    <div style={{fontSize:10,marginTop:4,color:"rgba(244,114,182,0.4)"}}>カメラロール・ファイルから選択</div>
                  </div>
              }
            </div>
          </label>
          <入力
            id="post-image-upload"
            タイプ="ファイル"
            accept="image/*"
            onChange={handleImageUpload}
            style={{position:"absolute", width:1, height:1, opacity:0, pointerEvents:"none"}}
          ＞

          {uploadedImg && !analysisResult && (
            <GradBtn
              grad={aiLoading?"rgba(255,255,255,0.08)":"linear-gradient(135deg,#f97316,#f43f5e,#e879f9)"}
              onClick={diagnoseWithAI} disabled={aiLoading}>
              {aiLoading?"✨パーツを細かく見ています...":"🤖 AI詳細診断（必須）"}
            </GradBtn>
          )}

          {analysisResult && <AIAnalysisCard analysis={analysisResult}/>}

          {分析結果 && (
            <>
              <GlassInput placeholder="ニックネーム *" value={username} onChange={e=>setUsername(e.target.value)}/>
              <GlassInput placeholder="SNSリンク（任意）" value={snsLink} onChange={e=>setSnsLink(e.target.value)}/>
              <GradBtn
                grad={!username?"rgba(255,255,255,0.08)":"linear-gradient(135deg,#f43f5e,#f472b6,#c084fc)"}
                onClick={submitPost} disabled={!username}>
                💝みんなに公開して投稿
              </GradBtn>
            </>
          )}
        </div>
      )}

      {/* AI専用 */}
      {mode==="aiOnly" && (
        <div style={{position:"relative",zIndex:1,padding:"36px 24px 24px",display:"flex",flexDirection:"column",gap:18}}>
          <div>
            <h1 style={{margin:0,fontSize:28,fontWeight:900,
              background:"linear-gradient(135deg,#8b5cf6,#ec4899,#f97316)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
              🤖 AI診断だけ
            </h1>
            <p style={{margin:"6px 0 0",fontSize:12,color:"rgba(255,255,255,0.4)",lineHeight:1.7}}>
              他の人には公開せず、AIのみ診断してもらえます
            </p>
          </div>

          <div style={{padding:"10px 14px",borderRadius:14,display:"flex",alignItems:"center",gap:8,
            背景:"linear-gradient(135deg,rgba(139,92,246,0.15),rgba(236,72,153,0.1))",
            border:"1px solid rgba(139,92,246,0.3)"}}>
            <span style={{fontSize:18}}>🔒</span>
            <span style={{fontSize:12,color:"rgba(255,255,255,0.7)",fontWeight:600}}>
              プライベートモード：あなた以外には見えません
            </span>
          </div>

          {/* 🆕 ラベルで入力を確実に開く（スマホでも移動） */}
          <label htmlFor="ai-only-image-upload" style={{
            表示:"ブロック", カーソル:"ポインター",
          }}>
            <div style={{
              幅:"100%",アスペクト比:"1",ボーダー半径:28、
              border:"2px solid rgba(139,92,246,0.4)",
              背景:uploadedImg?"透明":"rgba(255,255,255,0.04)",
              backdropFilter:"blur(12px)",
              display:"flex",alignItems:"center",justifyContent:"center",
              overflow:"hidden"}}>
              {アップロードされた画像}
                ? <img src={uploadedImg} style={{width:"100%",height:"100%",objectFit:"cover"}} alt="アップロード画像"/>
                : <div style={{textAlign:"center",color:"rgba(139,92,246,0.7)"}}>
                    <div style={{fontSize:48}}>📷</div>
                    <div style={{fontSize:13,marginTop:10}}> タップして写真を選ぶ</div>
                    <div style={{fontSize:10,marginTop:4,color:"rgba(139,92,246,0.5)"}}>カメラロール・ファイルから選択</div>
                  </div>
              }
            </div>
          </label>
          <入力
            id="ai-only-image-upload"
            タイプ="ファイル"
            accept="image/*"
            onChange={handleImageUpload}
            style={{position:"absolute", width:1, height:1, opacity:0, pointerEvents:"none"}}
          ＞

          {uploadedImg && !analysisResult && (
            <GradBtn
              grad={aiLoading?"rgba(255,255,255,0.08)":"linear-gradient(135deg,#8b5cf6,#ec4899,#f97316)"}
              onClick={diagnoseWithAI} disabled={aiLoading}>
              {aiLoading?"✨ パーツを細かく見ています...":"🤖 AI詳細診断スタート"}
            </GradBtn>
          )}

          {分析結果 && (
            <>
              <AIAnalysisCard analysis={analysisResult}/>
              <div style={{padding:"14px",borderRadius:16,
                background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)"}}>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.5)",marginBottom:12,textAlign:"center",fontWeight:600}}>
                  結果をどうしますか？
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  <GradBtn grad="linear-gradient(135deg,#8b5cf6,#ec4899)" onClick={saveAiOnly}>
                    💾自分だけの記録として保存
                  </GradBtn>
                  <GradBtn grad="linear-gradient(135deg,#f43f5e,#f472b6,#c084fc)" onClick={()=>setMode("post")}>
                    📸みんなにも公開する（投稿へ）
                  </GradBtn>
                  <button onClick={()=>{setUploadedImg(null); setAnalysisResult(null);}} style={{
                    背景:"なし",境界線:"なし",色:"rgba(255,255,255,0.4)",
                    fontSize:13,fontWeight:600,cursor:"pointer",padding:"8px"}}>
                    🗑 この結果を捨ててやり直す
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* マイページ */}
      {mode==="mypage" && (
        <div style={{position:"relative",zIndex:1,padding:"36px 24px 24px",display:"flex",flexDirection:"column",gap:20}}>
          <div>
            <h1 style={{margin:0,fontSize:28,fontWeight:900,
              background:"linear-gradient(135deg,#06b6d4,#34d399)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
              👤マイページ
            </h1>
            <p style={{margin:"6px 0 0",fontSize:12,color:"rgba(255,255,255,0.4)"}}>
              あなたの記録と評価
            </p>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <GradBtn grad="linear-gradient(135deg,#06b6d4,#34d399)" onClick={()=>setMode("result")}
              disabled={!myPost}>
              📊自分の投稿への反応{myPost?"":"（未投稿）"}
            </GradBtn>
            <GradBtn grad="linear-gradient(135deg,#8b5cf6,#ec4899)" onClick={()=>setMode("aiHistory")}>
              🗂 AI診断の履歴 {aiOnlyHistory.length>0 && `(${aiOnlyHistory.length})`}
            </GradBtn>
            <GradBtn grad="linear-gradient(135deg,#6366f1,#818cf8)" onClick={()=>setMode("myeval")}>
              📝自分の評価履歴 {myEvals.length>0 && `(${myEvals.length})`}
            </GradBtn>
            <GradBtn grad="linear-gradient(135deg,#475569,#64748b)" onClick={()=>setMode("browse")}>
              🔍タイプで投稿を探す
            </GradBtn>
            <GradBtn grad="linear-gradient(135deg,#ec4899,#f97316,#fbbf24)" onClick={()=>setMode("invite")}>
              💌アプリを身内に招待する
            </GradBtn>
          </div>
        </div>
      )}

      {/* 招待する */}
      {mode==="invite" && (
        <div style={{position:"relative",zIndex:1,padding:"36px 24px 60px",display:"flex",flexDirection:"column",gap:20}}>
          <BackBtn onClick={()=>setMode("mypage")}/>
          <div>
            <h2 style={{margin:0,fontSize:24,fontWeight:900,
              背景:"linear-gradient(135deg,#ec4899,#f97316,#fbbf24)",
              WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
              💌身内に招待する
            </h2>
            <p style={{margin:"8px 0 0",fontSize:12,color:"rgba(255,255,255,0.4)",lineHeight:1.7}}>
              リンクを知っている人だけがアクセスできます。<br/>
              仲良しグループにシェアしてね✨
            </p>
          </div>

          <ガラススタイル={{padding:"20px"}}>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginBottom:8,fontWeight:700}}>
              🔗招待リンク
            </div>
            <div style={{
              padding:"14px 16px", background:"rgba(0,0,0,0.3)", borderRadius:12,
              フォントサイズ:11、色:"#f9a8d4", フォントファミリー:"monospace",
              wordBreak:"break-all", marginBottom:14,
              border:"1px solid rgba(255,255,255,0.08)",
              minHeight:44, display:"flex", alignItems:"center"}}>
              {招待URL || "読み込み中..."}
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <GradBtn
                grad={inviteUrl?"linear-gradient(135deg,#ec4899,#f97316)":"rgba(255,255,255,0.06)"}
                onClick={shareInviteLink} disabled={!inviteUrl}>
                📤共有する（LINE / メッセージなど）
              </GradBtn>
              <GradBtn
                grad={inviteUrl?"linear-gradient(135deg,#6366f1,#818cf8)":"rgba(255,255,255,0.06)"}
                onClick={copyInviteLink} disabled={!inviteUrl} small>
                📋 リンクだけコピー
              </GradBtn>
            </div>
          </ガラス>

          <ガラスのスタイル={{padding:"16px 18px"}}>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginBottom:10,fontWeight:700}}>
              💬 共有される内容プレビュー
            </div>
            <div style={{padding:"12px 14px",background:"rgba(255,255,255,0.04)",
              borderRadius:12,border:"1px dashed rgba(255,255,255,0.12)"}}>
              <div style={{fontSize:13,fontWeight:800,color:"#fff",marginBottom:4}}>
                タイプアプリ診断
              </div>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.65)",lineHeight:1.5}}>
                顔タイプ・骨格・パーソナルカラーをAI診断！みんなで評価し合おう✨
              </div>
              <div style={{fontSize:11,color:"#60a5fa",marginTop:6,wordBreak:"break-all"}}>
                {inviteUrl}
              </div>
            </div>
          </ガラス>

          <div style={{padding:"14px 16px",borderRadius:14,
            background:"rgba(255,200,100,0.08)",border:"1px solid rgba(255,200,100,0.2)"}}>
            <div style={{fontSize:11,fontWeight:800,color:"#fbbf24",marginBottom:6}}>⚠️共有する前に</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.6)",lineHeight:1.7}}>
              このリンクを知っている人は誰でもアクセスできます。信頼できる身内だけ送ってね。SNSで公開する投稿は避けてください。
            </div>
          </div>
        </div>
      )}

      {/* 閲覧 */}
      {mode==="brows" && (
        <div style={{position:"relative",zIndex:1,padding:"36px 24px 60px",display:"flex",flexDirection:"column",gap:18}}>
          <BackBtn onClick={()=>setMode("mypage")}/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
            <div style={{flex:1}}>
              <h2 style={{margin:0,fontSize:24,fontWeight:900,
                background:"linear-gradient(135deg,#94a3b8,#cbd5e1)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
                🔍投稿を探す
              </h2>
              <p style={{margin:"4px 0 0",fontSize:11,color:"rgba(255,255,255,0.35)"}}>
                似たタイプの人を見つけよう
              </p>
            </div>
            <FilterIconButton count={activeFilterCount(browseFilter)} onClick={()=>setFilterOpen("browse")}/>
          </div>
          {activeFilterCount(browseFilter)>0 && (
            <ActiveFilterRow filter={browseFilter}
              onClear={(key)=>setBrowseFilter(f=>({...f, [key]:null}))}/>
          )}
          {/* 🆕 タスク 6: 並び順切り替え */}
          <SortTabs current={browseSort} onChange={handleSortChange(setBrowseSort)}/>
          {browsePosts.length===0 && (
            <div style={{textAlign:"center",color:"rgba(255,255,255,0.2)",marginTop:60,fontSize:15}}>
              {activeFilterCount(browseFilter)===0?"投稿がありません":"この条件に合う投稿はありません"}
            </div>
          )}
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {browsePosts.map(post=>{
              戻る （
                <Glass key={post.id} style={{overflow:"hidden"}}>
                  <div style={{position:"relative"}}>
                    <img src={post.image} style={{width:"100%",aspectRatio:"1",objectFit:"cover",display:"block"}}/>
                    <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(15,23,42,0.7) 0%,transparent 50%)"}}/>
                    {post.analysis?.eightType?.primary && (
                      <div style={{position:"absolute",bottom:12,left:12,
                        背景:EIGHT_TYPES.find(e=>e.label===post.analysis.eightType.primary)?.grad||"linear-gradient(135deg,#f9a8d4,#c084fc)",
                        borderRadius:20,padding:"4px 14px",
                        fontSize :12,fontWeight:800,color:"#fff"}}>💫 {post.analysis.eightType.primary}</div>
                    )}
                    {/* 🔐 いいね数は投稿主だけが見られる情報なので、非表示 */}
                  </div>
                  <div style={{padding:"14px 18px"}}>
                    <div style={{fontWeight:800,fontSize:15,color:"#fff"}}>@{post.username}</div>
                    {post.analysis?.charm && <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginTop:4,fontStyle:"italic"}}>💭 {post.analysis.charm}</div>}
                    {/* AI診断のタグを見せることで、投票数や評価数を出さなくてもタイプは広がる */}
                    <div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:8}}>
                      {post-analysis?.bone?.primary && (
                        <span style={{padding:"3px 10px",borderRadius:20,fontSize:10,fontWeight:800,color:"#fff",
                          background:BONE_TYPES.find(b=>b.label===post.analysis.bone.primary)?.grad}}>
                          🦴 {post.analysis.bone.primary}
                        </span>
                      )}
                      {post.analysis?.personalColor?.primary && (
                        <span style={{padding:"3px 10px",borderRadius:20,fontSize:10,fontWeight:800,color:"#fff",
                          background:PC_TYPES.find(p=>p.label===post.analysis.personalColor.primary)?.grad}}>
                          🎨 {post.analysis.personalColor.primary}
                        </span>
                      )}
                    </div>
                  </div>
                </ガラス>
              );
            })}
          </div>
        </div>
      )}

      {/* 私の結果 — タスク 5 で本実装予定、今は簡易表示 */}
      {mode==="result" && myPost && (
        <div style={{position:"relative",zIndex:1,padding:"36px 24px 60px",display:"flex",flexDirection:"column",gap:20}}>
          <BackBtn onClick={()=>setMode("mypage")}/>
          <h2 style={{margin:0,fontSize:24,fontWeight:900,
            background:"linear-gradient(135deg,#34d399,#06b6d4)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
            📊 あなたの投稿への反応
          </h2>

          {/* 🆕 タスク 6: みんなの中のあなたの位置（投稿主だけが見える） */}
          <MyPostRanking myPost={myPost} allPosts={posts}/>

          <Glass style={{overflow:"hidden"}}>
            <div style={{position:"relative"}}>
              <img src={myPost.image} style={{width:"100%",aspectRatio:"1",objectFit:"cover",display:"block"}}/>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(15,23,42,0.7) 0%,transparent 50%)"}}/>
              {myPost.analysis?.eightType?.primary && (
                <div style={{position:"absolute",bottom:14,left:14,
                  background:EIGHT_TYPES.find(e=>e.label===myPost.analysis.eightType.primary)?.grad||"linear-gradient(135deg,#f9a8d4,#c084fc)",
                  borderRadius:20,padding:"5px 14px",
                  fontSize:13,fontWeight:800,color:"#fff"}}>💫 {myPost.analysis.eightType.primary}</div>
              )}
            </div>
            <div style={{padding:"18px 20px"}}>
              <div style={{fontWeight:800,fontSize:17,color:"#fff",marginBottom:14}}>@{myPost.username}</div>
              {myPost.analysis && <AIAnalysisCard analysis={myPost.analysis} defaultOpen={false}/>}

              {/* 🆕 タスク 5 で完全実装。今は基本的な数値だけ表示 */}
              <div style={{marginTop:14,padding:"14px",borderRadius:16,
                background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)"}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                  <div style={{textAlign:"center",padding:"10px",borderRadius:12,
                    background:"linear-gradient(135deg,rgba(244,63,94,0.15),rgba(232,121,249,0.1))"}}>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.5)"}}>❤️ いいね</div>
                    <div style={{fontSize:26,fontWeight:900,color:"#f472b6",marginTop:2}}>
                      {myPost.likes || 0}
                    </div>
                  </div>
                  <div style={{textAlign:"center",padding:"10px",borderRadius:12,
                    background:"linear-gradient(135deg,rgba(139,92,246,0.15),rgba(99,102,241,0.1))"}}>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.5)"}}>👥投票総数</div>
                    <div style={{fontSize:26,fontWeight:900,color:"#818cf8",marginTop:2}}>
                      {totalVoteCount(myPost.votes)}
                    </div>
                  </div>
                </div>

                {/* 軸ごとの最多得票（AI判定との一致率付き） */}
                {totalVoteCount(myPost.votes) > 0 && (
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {VOTE_AXES.map(axis => {
                      const total = axisVoteCount(myPost.votes, axis.id);
                      const top = topVote(myPost.votes, axis.id);
                      const aiPrimary = myPost.analysis?.[axis.id]?.primary;
                      const agreement = agreementWithAI(myPost.votes, axis.id, aiPrimary);
                      if (total === 0) return null;
                      戻る （
                        <div key={axis.id} style={{padding:"10px 12px",borderRadius:12,
                          background:"rgba(0,0,0,0.2)",border:"1px solid rgba(255,255,255,0.05)"}}>
                          <div style={{fontSize:11,color:"rgba(255,255,255,0.5)",marginBottom:4}}>
                            {axis.emoji} {axis.label}（{total}票）
                          </div>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <div>
                              <div style={{fontSize:11,color:"rgba(255,255,255,0.35)"}}>🤖 AI</div>
                              <div style={{fontSize:13,fontWeight:800,color:"#fff"}}>{aiPrimary || "-"}</div>
                            </div>
                            <div style={{fontSize:18,color:"rgba(255,255,255,0.2)"}}>vs</div>
                            <div style={{textAlign:"right"}}>
                              <div style={{fontSize:11,color:"rgba(255,255,255,0.35)"}}>👥みんな</div>
                              <div style={{fontSize:13,fontWeight:800,color:"#fff"}}>{top?.type || "-"}</div>
                            </div>
                          </div>
                          {agreement !== null && (
                            <div style={{marginTop:8,fontSize:11,textAlign:"center",fontWeight:700,
                              color: agreement >= 50 ? "#34d399" : "#fbbf24"}}>
                              AIと一致率: {同意}%
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {totalVoteCount(myPost.votes) === 0 && (myPost.likes || 0) === 0 && (
                  <div style={{color:"rgba(255,255,255,0.35)",fontSize:13,textAlign:"center",padding:"10px"}}>
                    投稿は届いていますよ！
                  </div>
                )}

                <div style={{marginTop:12,padding:"8px 10px",borderRadius:10,
                  background:"rgba(139,92,246,0.08)",border:"1px solid rgba(139,92,246,0.2)"}}>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.5)",lineHeight:1.5}}>
                    💡詳しい投票配布はこの後のタスクで実装予定です
                  </div>
                </div>
              </div>
            </div>
          </ガラス>
        </div>
      )}

      {/* MY EVAL — タスク 7 で本実装予定、今は簡易表示 */}
      {mode==="myeval" && (
        <div style={{position:"relative",zIndex:1,padding:"36px 24px 60px",display:"flex",flexDirection:"column",gap:14}}>
          <BackBtn onClick={()=>setMode("mypage")}/>
          <h2 style={{margin:0,fontSize:24,fontWeight:900,
            background:"linear-gradient(135deg,#94a3b8,#cbd5e1)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
            📝自分の評価履歴
          </h2>
          <p style={{margin:0,fontSize:12,color:"rgba(255,255,255,0.28)"}}>
            ※ あなたが投稿したいいね・投票の記録
          </p>
          {myEvals.length===0 && (
            <div style={{color:"rgba(255,255,255,0.2)",textAlign:"center",marginTop:60,fontSize:15}}>
              まだ評価していません
            </div>
          )}
          {myEvals.map((ev,i)=>(
            <Glass key={i} style={{padding:"16px 18px"}}>
              <div style={{fontWeight:700,color:"#fff",fontSize:15}}>@{ev.postUsername}</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:10}}>
                {ev.liked && (
                  <span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:800,color:"#fff",
                    背景:"linear-gradient(135deg,#f43f5e,#e879f9)"}}>❤️ いいね</span>
                )}
                {VOTE_AXES.map(axis => {
                  const choice = ev.votes?.[axis.id];
                  if (!choice) return null;
                  const label = 選択肢 === UNKNOWN_VOTE ? 「わからない」 : 選択;
                  戻る （
                    <span key={axis.id} style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:800,color:"#fff",
                      背景: axis.grad}}>
                      {axis.emoji} {label}
                    </span>
                  );
                })}
              </div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.22)",marginTop:8}}>{ev.time}</div>
            </ガラス>
          ))}
        </div>
      )}

      {/* AIの歴史 */}
      {mode==="aiHistory" && (
        <div style={{position:"relative",zIndex:1,padding:"36px 24px 60px",display:"flex",flexDirection:"column",gap:16}}>
          <BackBtn onClick={()=>setMode("mypage")}/>
          <div>
            <h2 style={{margin:0,fontSize:24,fontWeight:900,
              background:"linear-gradient(135deg,#8b5cf6,#ec4899)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
              🗂 AI診断の履歴
            </h2>
            <p style={{margin:"8px 0 0",fontSize:12,color:"rgba(255,255,255,0.35)"}}>🔒だけの記録（非公開）</p>
          </div>
          {aiOnlyHistory.length===0 && (
            <div style={{color:"rgba(255,255,255,0.2)",textAlign:"center",marginTop:60,fontSize:15}}>まだ診断していません</div>
          )}
          {aiOnlyHistory.map(item => (
            <Glass key={item.id} style={{overflow:"hidden",padding:14}}>
              <div style={{display:"flex",gap:12,marginBottom:12}}>
                <img src={item.image} style={{width:70,height:70,borderRadius:14,objectFit:"cover",flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.3)"}}>{item.time}</div>
                  <div style={{fontSize:18,fontWeight:900,marginTop:3,
                    背景:"linear-gradient(135deg,#f9a8d4,#c084fc)",
                    WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
                    💫 {item.analysis?.eightType?.primary}
                  </div>
                  {item.analysis?.charm && <div style={{fontSize:11,color:"rgba(255,255,255,0.55)",marginTop:3,lineHeight:1.5,fontStyle:"italic"}}>💭 {item.analysis.charm}</div>}
                </div>
              </div>
              <AIAnalysisCard analysis={item.analysis} defaultOpen={false}/>
            </ガラス>
          ))}
          {aiOnlyHistory.length>0 && (
            <button onClick={()=>{
              if (window.confirm("すべての履歴を削除しますか?")) setAiOnlyHistory([]);
            }} style={{
              背景:"なし",枠線:"1px solid rgba(255,255,255,0.15)",
              color:"rgba(255,255,255,0.4)",fontSize:12,fontWeight:600,
              padding:"10px",borderRadius:12,cursor:"pointer",marginTop:8}}>
              🗑履歴をすべて削除
            </button>
          )}
        </div>
      )}

      {isMainTab && (
        <BottomNav current={mode} onChange={(t)=>{
          if (t !== mode) { setUploadedImg(null); setAnalysisResult(null); }
          setMode(t);
        }}/>
      )}

      {filterOpen==="feed" && (
        <FilterPanel filter={feedFilter} onChange={setFeedFilter} onClose={()=>setFilterOpen(false)}/>
      )}
      {filterOpen==="browse" && (
        <FilterPanel filter={browseFilter} onChange={setBrowseFilter} onClose={()=>setFilterOpen(false)}/>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// EvalCard（1つの投稿カード）
// タスク 2: ❤️ いいねボタンを本実装
// タスク 3: 💫タイプ投票UIを実装予定
// 🔐プライバシー：他人の評価数字（いいね数・投票数）はこのカードでは
// 一切表示しない。 投稿主だけが「自分の投稿への反応」でまとめて見られる。
// ═══════════════════════════════════════════════════════════════
function EvalCard({ post, myEval, onLike, onVote }) {
  const [showDetail, setShowDetail] = useState(false);

  戻る （
    <Glass style={{overflow:"hidden"}}>
      <div style={{position:"relative"}}>
        <img src={post.image} style={{width:"100%",aspectRatio:"1",objectFit:"cover",display:"block"}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(15,23,42,0.65) 0%,transparent 50%)"}}/>
        {post.analysis?.eightType?.primary && (
          <div style={{position:"absolute",bottom:12,left:12,
            背景:"rgba(255,255,255,0.15)",backdropFilter:"blur(10px)",
            borderRadius:20,padding:"4px 14px",fontSize:12,fontWeight:700,color:"#fff",
            border:"1px solid rgba(255,255,255,0.25)"}}>
            💫 {post.analysis.eightType.primary}
          </div>
        )}
        {/* 🔐 いいね数は投稿主だけが見られるようにしたので、ここでは非表示 */}
        {/*代わりに、あなたがすでに「いいね」していればそのバッジだけ表示 */}
        {myEval?.liked && (
          <div style={{position:"absolute",top:12,right:12,
            background:"linear-gradient(135deg,#f43f5e,#e879f9)",borderRadius:20,padding:"4px 12px",
            fontSize:11,fontWeight:800,color:"#fff",boxShadow:"0 2px 10px rgba(244,63,94,0.45)"}}>
            ❤️いいね既済
          </div>
        )}
      </div>

      <div style={{padding:"16px 18px"}}>
        <div style={{fontWeight:800,fontSize:15,color:"#fff"}}>@{post.username}</div>
        {post.sns && <div style={{fontSize:11,color:"rgba(255,255,255,0.28)",marginTop:2}}>🔗 {post.sns}</div>}
        {/* 🔐 投票数は投稿主だけが見られる情報なので、ここでは非表示 */}

        {ポスト分析 && (
          <div style={{marginTop:12}}>
            {showDetail ? (
              <AIAnalysisCard analysis={post.analysis} defaultOpen={true}/>
            ) : (
              <div style={{borderRadius:14,padding:"12px 14px",
                背景:"linear-gradient(145deg,rgba(139,92,246,0.12),rgba(236,72,153,0.08))",
                border:"1px solid rgba(139,92,246,0.25)"}}>
                <div style={{fontSize:11,fontWeight:800,
                  背景:"linear-gradient(135deg,#c084fc,#ec4899)",
                  WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:8}}>
                  🤖 AI診断
                </div>
                {post.analysis.charm && (
                  <div style={{fontSize:12,color:"rgba(255,255,255,0.75)",fontStyle:"italic",marginBottom:10,lineHeight:1.5}}>
                    💭 {投稿分析チャーム}
                  </div>
                )}
                <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:10}}>
                  {post.analysis.eightType?.primary && (
                    <span style={{padding:"3px 10px",borderRadius:20,fontSize:10,fontWeight:800,color:"#fff",
                      background:EIGHT_TYPES.find(e=>e.label===post.analysis.eightType.primary)?.grad}}>
                      💫 {post.analysis.eightType.primary}
                    </span>
                  )}
                  {post.analysis.bone?.primary && (
                    <span style={{padding:"3px 10px",borderRadius:20,fontSize:10,fontWeight:800,color:"#fff",
                      background:BONE_TYPES.find(b=>b.label===post.analysis.bone.primary)?.grad}}>
                      🦴 {post.analysis.bone.primary}
                    </span>
                  )}
                  {post.analysis.personalColor?.primary && (
                    <span style={{padding:"3px 10px",borderRadius:20,fontSize:10,fontWeight:800,color:"#fff",
                      background:PC_TYPES.find(p=>p.label===post.analysis.personalColor.primary)?.grad}}>
                      🎨 {post.analysis.personalColor.primary}
                    </span>
                  )}
                </div>
                <button onClick={()=>setShowDetail(true)} style={{
                  幅:"100%",パディング:"7px 12px",ボーダー半径:10,ボーダー:"なし",カーソル:"ポインター",
                  背景:"rgba(255,255,255,0.08)",色:"rgba(255,255,255,0.8)",
                  fontSize:11,fontWeight:800}}>📖 詳細を見る</button>
              </div>
            )}
            {showDetail && (
              <button onClick={()=>setShowDetail(false)} style={{
                幅:"100%",上マージン:8,パディング:"7px 12px",角丸:10,枠線:"なし",カーソル:"ポインター",
                背景:"rgba(255,255,255,0.06)",色:"rgba(255,255,255,0.6)",
                fontSize:11,fontWeight:700}}>▲ 詳細を閉じる</button>
            )}
          </div>
        )}

        {/* ═══ いいねボタン & 投票UIプレースホルダー ═══ */}
        <div style={{marginTop:14,display:"flex",flexDirection:"column",gap:10}}>

          {/* ❤️ いいねボタン（タスク 2 で本実装） */}
          {post.isMyPost ? (
            //自分の投稿にはいいねできない。代わりに案内を出す
            <div style={{padding:"12px 14px",borderRadius:14,textAlign:"center",
              background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)"}}>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",fontWeight:600}}>
                これはあなたの投稿です
              </div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:4}}>
                マイページ →「自分の投稿への反応」でまとめられます
              </div>
            </div>
          ) : (
            <button onClick={onLike} aria-pressed={!!myEval?.liked} style={{
              幅:"100%", パディング:"13px 16px", 角丸:14, 枠線:"なし", カーソル:"ポインター",
              背景: myEval?.liked
                ? "linear-gradient(135deg,#f43f5e,#e879f9)"
                : "rgba(255,255,255,0.08)",
              color: myEval?.liked ? "#fff" : "rgba(255,255,255,0.75)",
              フォントサイズ:14、フォントウェイト:800、
              display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              boxShadow: myEval?.liked ? "0 3px 14px rgba(244,63,94,0.4)" : "none",
              トランジション:"すべて0.15秒",
              border: myEval?.liked ? "none" : "1px solid rgba(255,255,255,0.1)",
            }}>
              <span style={{fontSize:18}}>{myEval?.liked ? "❤️" : "🤍"}</span>
              <span>{myEval?.いいね? " いいね済み（タップで取り消し）" : "いいね熊本"}</span>
            </button>
          )}

          {/* 💫タイプ投票UI */}
          {!post.isMyPost && (
            <VoteSection myEval={myEval} onVote={onVote}/>
          )}

        </div>
      </div>
    </ガラス>
  );
}

// ═══════════════════════════════════════════════════════════════
// VoteSection — 3軸まとめての投票UI（折りたたみ式）
// 折りたたみ状態: [💫タイプを投票する N/3 完了 ▼]
// 展開状態:各軸の選択ボタンが全て見える
// ═══════════════════════════════════════════════════════════════
function VoteSection({ myEval, onVote }) {
  const [expanded, setExpanded] = useState(false);
  const myVotes = myEval?.votes || {};
  const votedCount = VOTE_AXES.filter(ax => myVotes[ax.id] != null).length;
  const allVoted = votedCount === VOTE_AXES.length;

  // 折りたたみ状態：展開時にタップ
  if (!expanded) {
    戻る （
      <button onClick={()=>setExpanded(true)} style={{
        幅:"100%", パディング:"12px 14px", 角丸:14, カーソル:"ポインター",
        背景: 投票数 > 0
          ? "linear-gradient(135deg,rgba(139,92,246,0.25),rgba(236,72,153,0.18))"
          : "rgba(255,255,255,0.05)",
        color: votedCount > 0 ? "#fff" : "rgba(255,255,255,0.75)",
        フォントサイズ:13、フォントの太さ:800、
        display:"flex", alignItems:"center", justifyContent:"space-between",
        境界線: 投票数 > 0
          ？「1px solid rgba(139,92,246,0.4)」
          : "1px solid rgba(255,255,255,0.1)",
        トランジション:"すべて0.15秒",
      }}>
        <span style={{display:"flex", alignItems:"center", gap:8}}>
          <span style={{fontSize:18}}>💫</span>
          <span>タイプを投票する</span>
        </span>
        <span style={{display:"flex", alignItems:"center", gap:8}}>
          {votedCount > 0 && (
            <span style={{fontSize:10, fontWeight:800,
              padding:"3px 10px", borderRadius:99, color:"#fff",
              背景: 全員投票済み
                ? "linear-gradient(135deg,#34d399,#06b6d4)"
                : "linear-gradient(135deg,#8b5cf6,#ec4899)",
              boxShadow:"0 2px 8px rgba(0,0,0,0.2)"}}>
              {全員が投票しましたか? "✓ 全軸完了" : `${votedCount}/3 完了`}
            </span>
          )}
          <span style={{fontSize:12, color:"rgba(255,255,255,0.5)"}}>▼</span>
        </span>
      </button>
    );
  }

  // 展開状態
  戻る （
    <div style={{borderRadius:16, overflow:"hidden",
      背景:"linear-gradient(145deg,rgba(139,92,246,0.12),rgba(236,72,153,0.08))",
      border:"1px solid rgba(139,92,246,0.3)"}}>
      {/* ヘッダー */}
      <div style={{padding:"10px 14px", display:"flex", alignItems:"center", justifyContent:"space-between",
        背景:"linear-gradient(135deg,rgba(139,92,246,0.25),rgba(236,72,153,0.15))",
        borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
        <div style={{fontSize:12, fontWeight:800,
          背景:"linear-gradient(135deg,#c084fc,#ec4899)",
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent"}}>
          💫あなたの見立ては？
        </div>
        <button onClick={()=>setExpanded(false)} style={{
          背景:"なし", 境界線:"なし", カーソル:"ポインター",
          fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.55)"}}>
          ▲閉じる
        </button>
      </div>

      {/* 3軸の選択ブロック */}
      <div style={{padding:"14px 16px", display:"flex", flexDirection:"column", gap:18}}>
        {VOTE_AXES.map(axis => (
          <VoteAxisBlock
            key={axis.id}
            軸={軸}
            currentChoice={myVotes[axis.id]}
            onChoose={(choice) => onVote(axis.id, choice)}
          ＞
        ))}

        {/* ヒント */}
        <div style={{padding:"8px 10px", borderRadius:10,
          background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)"}}>
          <div style={{fontSize:10, color:"rgba(255,255,255,0.45)", lineHeight:1.6, textAlign:"center"}}>
            💡 1軸だけの投票でもOK／同じ選択肢をもう一度タップで取り消し<br/>
            🔐 投稿主だけが幅広く見られます
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// VoteAxisBlock — 1つの軸（8タイプ/骨格/パーソナルカラー）の選択UI
// 軸ごとにグリッドの列数を変更:
// 8タイプ → 2×4
// 骨格 → 1×3
//パーソナルカラー → 2×2
// ═══════════════════════════════════════════════════════════════
function VoteAxisBlock({ axis, currentChoice, onChoose }) {
  const cols = {
    8タイプ: 2、
    骨: 3、
    personalColor: 2、
  }[axis.id] || 2;

  //今選択しているもの表示名（ヘッダー右側のバッジ用）
  const selectedLabel = currentChoice === UNKNOWN_VOTE
    ? 「わからない」
    : currentChoice || null;

  戻る （
    <div>
      {/* 軸ヘッダー：タイトル + 現在の選択バッジ */}
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
        <div style={{fontSize:12, fontWeight:800, color:"rgba(255,255,255,0.75)"}}>
          {axis.emoji} {axis.label}
        </div>
        {selectedLabel && (
          <span style={{fontSize:10, fontWeight:800, color:"#f9a8d4",
            padding:"3px 10px", borderRadius:99,
            背景:"rgba(244,114,182,0.12)",
            border:"1px solid rgba(244,114,182,0.35)"}}>
            ✓ {selectedLabel}
          </span>
        )}
      </div>

      {/* 選択肢グリッド */}
      <div style={{display:"grid", gridTemplateColumns:`repeat(${cols},1fr)`, gap:6}}>
        {axis.options.map(opt => {
          const active = currentChoice === opt.label;
          戻る （
            <ボタン>
              key={opt.id}
              onClick={()=>onChoose(opt.label)}
              aria-pressed={active}
              style={{
                padding: "10px 6px",
                borderRadius: 10,
                境界線: アクティブ
                  ？「1.5px solid rgba(255,255,255,0.45)」
                  : "1px solid rgba(255,255,255,0.08)",
                カーソル: "ポインター",
                背景: アクティブ? opt.grad: "rgba(255,255,255,0.05)",
                色: アクティブ ? "#fff" : "rgba(255,255,255,0.65)",
                フォントサイズ: 11、
                fontWeight: active ? 800 : 600,
                トランジション: "すべての.15秒",
                boxShadow: active ? "0 3px 12px rgba(0,0,0,0.25)" : "none",
                lineHeight: 1.3、
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* 「わからない」ボタン（幅いっぱい、特別なスタイル） */}
      <ボタン>
        onClick={()=>onChoose(UNKNOWN_VOTE)}
        aria-pressed={currentChoice === UNKNOWN_VOTE}
        style={{
          幅:"100%", 上マージン:6、パディング:"9px",
          borderRadius: 10,
          境界線: 現在の選択肢 === UNKNOWN_VOTE
            ？「1.5px solid rgba(255,255,255,0.35)」
            : "1px dashed rgba(255,255,255,0.15)",
          カーソル:「ポインター」、
          背景: 現在の選択肢 === UNKNOWN_VOTE
            ? "rgba(100,116,139,0.45)"
            ： "透明"、
          color: currentChoice === UNKNOWN_VOTE ? "#fff" : "rgba(255,255,255,0.5)",
          フォントサイズ: 11、
          fontWeight: currentChoice === UNKNOWN_VOTE ? 800 : 600,
          トランジション:"すべて0.15秒",
        }}
      >
        {currentChoice === UNKNOWN_VOTE ? "✓ わからない" : "❓ わからない"}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 🆕 SortTabs — フィードの並び順切り替え（中間型UI）
// ═══════════════════════════════════════════════════════════════
function SortTabs({ current, onChange }) {
  戻る （
    <div style={{
      display:"flex", gap:4, padding:3,
      背景:"rgba(0,0,0,0.25)", 境界線半径:14、
      border:"1px solid rgba(255,255,255,0.05)",
    }}>
      {SORT_ORDERS.map(order => {
        const active = current === order.id;
        戻る （
          <ボタン>
            key={order.id}
            onClick={()=>onChange(order.id)}
            style={{
              flex:1、padding:"7px 4px", borderRadius:11、border:"none",
              背景: アクティブ ? order.grad : "透明",
              色: アクティブ ? "#fff" : "rgba(255,255,255,0.45)",
              フォントサイズ:11、フォントウェイト:800、カーソル:「ポインター」、
              トランジション:"すべて0.15秒",
              display:"flex", alignItems:"center", justifyContent:"center", gap:4,
              boxShadow: active ? "0 2px 10px rgba(0,0,0,0.3)" : "none",
            }}
          >
            <span>{order.icon}</span>
            <span>{order.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 🆕 タスク 6: MyPostRanking — 投稿主だけが見える順位バッジ
// 注目順ランキングであなたの位置をキラキラしたカードで表示する
// ═══════════════════════════════════════════════════════════════
function MyPostRanking({ myPost, allPosts }) {
  const ranking = getPostRanking(myPost, allPosts);
  ランキングが真でない場合は、nullを返す。

  // 順位に応じたメッセージ
  let tierIcon = "🌱";
  let tierLabel = "これから伸びる投稿";
  let tierGrad = "linear-gradient(135deg,#34d399,#06b6d4)";
  if (ranking.percentile >= 80) {
    tierIcon = "👑";
    tierLabel = "トップクラス！";
    tierGrad = "linear-gradient(135deg,#fbbf24,#f97316)";
  } else if (ranking.percentile >= 60) {
    tierIcon = "🔥";
    tierLabel = "注目されています";
    tierGrad = "linear-gradient(135deg,#f43f5e,#f472b6)";
  } else if (ranking.percentile >= 40) {
    tierIcon = "💫";
    tierLabel = "上位視しています";
    tierGrad = "linear-gradient(135deg,#c084fc,#ec4899)";
  }

  const score = attentionScore(myPost);
  const hasAnyActivity = (myPost.likes || 0) > 0 || totalVoteCount(myPost.votes) > 0;

  戻る （
    <div style={{
      borderRadius:20、overflow:"hidden"、
      背景: hasAnyActivity
        ? "linear-gradient(145deg,rgba(251,191,36,0.12),rgba(244,114,182,0.08))"
        : "rgba(255,255,255,0.04)",
      境界線: hasAnyActivity
        ？「1px solid rgba(251,191,36,0.3)」
        : "1px solid rgba(255,255,255,0.08)",
    }}>
      <div style={{padding:"10px 14px",
        背景: hasAnyActivity
          ? "linear-gradient(135deg,rgba(251,191,36,0.2),rgba(244,114,182,0.15))"
          : "rgba(255,255,255,0.03)",
        borderBottom:"1px solid rgba(255,255,255,0.08)",
      }}>
        <div style={{fontSize:12, fontWeight:800, color:"rgba(255,255,255,0.85)",
          display:"flex", alignItems:"center", justifyContent:"space-between"}}>
          <span>📊みんなの中のあなたの位置</span>
          <span style={{fontSize:10, color:"rgba(255,255,255,0.45)", fontWeight:600}}>🔒あなただけ表示</span>
        </div>
      </div>

      <div style={{padding:"16px 18px"}}>
        {!hasAnyActivity ? (
          <div style={{textAlign:"center", color:"rgba(255,255,255,0.4)", fontSize:13, lineHeight:1.7, padding:"10px 0"}}>
            まだ反応がありません。<br/>
            投稿は届いているので、少し待ってみましょう✨
          </div>
        ) : (
          <>
            {/* 順位のメイン表示 */}
            <div style={{padding:"16px", borderRadius:16, textAlign:"center",
              background: tierGrad, color:"#fff", marginBottom:14}}>
              <div style={{fontSize:36, marginBottom:2}}>{tierIcon}</div>
              <div style={{fontSize:13, opacity:0.85, fontWeight:700}}>🔥注目度ランキング</div>
              <div style={{fontSize:32, fontWeight:900, lineHeight:1.1, marginTop:4}}>
                {ranking.rank}<span style={{fontSize:18, fontWeight:700}}> 位</span>
                <span style={{fontSize:14, fontWeight:600, opacity:0.7, marginLeft:8}}>/ {ranking.total}投稿中</span>
              </div>
              <div style={{fontSize:12, fontWeight:700, marginTop:6, opacity:0.95}}>
                ✨ {tierLabel}
              </div>
            </div>

            {/* 数字の詳細 */}
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8}}>
              <div style={{textAlign:"center", padding:"10px 6px", borderRadius:12,
                background:"rgba(244,63,94,0.1)", border:"1px solid rgba(244,63,94,0.2)"}}>
                <div style={{fontSize:10, color:"rgba(255,255,255,0.5)"}}>❤️ いいね</div>
                <div style={{fontSize:20, fontWeight:900, color:"#f472b6", marginTop:2}}>
                  {myPost.likes || 0}
                </div>
              </div>
              <div style={{textAlign:"center", padding:"10px 6px", borderRadius:12,
                background:"rgba(139,92,246,0.1)", border:"1px solid rgba(139,92,246,0.2)"}}>
                <div style={{fontSize:10, color:"rgba(255,255,255,0.5)"}}>👥 投票</div>
                <div style={{fontSize:20, fontWeight:900, color:"#818cf8", marginTop:2}}>
                  {totalVoteCount(myPost.votes)}
                </div>
              </div>
              <div style={{textAlign:"center", padding:"10px 6px", borderRadius:12,
                background:"rgba(251,191,36,0.1)", border:"1px solid rgba(251,191,36,0.2)"}}>
                <div style={{fontSize:10, color:"rgba(255,255,255,0.5)"}}>🔥 スコア</div>
                <div style={{fontSize:20, fontWeight:900, color:"#fbbf24", marginTop:2}}>
                  {スコア}
                </div>
              </div>
            </div>

            {/* 小さい説明 */}
            <div style={{fontSize:10, color:"rgba(255,255,255,0.35)", marginTop:10, textAlign:"center", lineHeight:1.5}}>
              スコア = いいね×2 + 投票数
            </div>
          </>
        )}
      </div>
    </div>
  );
}
