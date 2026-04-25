// ═══════════════════════════════════════════════════════════════
// 📄 legalContent.jsx
//   利用規約・プライバシーポリシーをアプリ内で表示するコンポーネント
//
//   このファイルの中身：
//   - LegalLayout：共通の見た目（タイトル + 戻るボタン + 本文エリア）
//   - TermsContent：利用規約の本文
//   - PrivacyContent：プライバシーポリシーの本文
//
//   サービス名や運営者情報を変えたいときは、このファイル末尾の
//   LEGAL_CONFIG を書き換えればOK。
// ═══════════════════════════════════════════════════════════════

// 共通設定（変更したい場合はここだけ書き換えればOK）
export const LEGAL_CONFIG = {
  serviceName: "タイプ診断アプリ",
  operatorName: "工房屋さん",
  contactEmail: "noir.54.official@gmail.com",
  jurisdiction: "大阪地方裁判所",
  lastUpdated: "2026年4月26日",
};

// ───────────────────────────────────────────────
// 共通スタイル（既存アプリのデザインに合わせた）
// ───────────────────────────────────────────────
const styles = {
  page: {
    position: "relative",
    zIndex: 1,
    padding: "36px 24px 60px",
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  titleWrap: {
    marginBottom: 4,
  },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 900,
    background: "linear-gradient(135deg,#a855f7,#ec4899,#f59e0b)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    margin: "6px 0 0",
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    lineHeight: 1.7,
  },
  card: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: "20px 18px",
    backdropFilter: "blur(12px)",
  },
  h2: {
    fontSize: 15,
    fontWeight: 900,
    color: "#fff",
    marginTop: 22,
    marginBottom: 8,
    paddingBottom: 6,
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },
  h2First: {
    marginTop: 4,
  },
  p: {
    fontSize: 12,
    color: "rgba(255,255,255,0.78)",
    lineHeight: 1.85,
    margin: "6px 0",
  },
  ol: {
    fontSize: 12,
    color: "rgba(255,255,255,0.78)",
    lineHeight: 1.85,
    margin: "6px 0",
    paddingLeft: 22,
  },
  ul: {
    fontSize: 12,
    color: "rgba(255,255,255,0.78)",
    lineHeight: 1.85,
    margin: "6px 0",
    paddingLeft: 22,
  },
  li: {
    marginBottom: 4,
  },
  strong: {
    color: "#fbbf24",
    fontWeight: 800,
  },
  meta: {
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    marginBottom: 16,
    lineHeight: 1.7,
  },
  footer: {
    marginTop: 24,
    padding: "14px 16px",
    borderRadius: 12,
    background: "rgba(168,85,247,0.08)",
    border: "1px solid rgba(168,85,247,0.2)",
  },
  footerLabel: {
    fontSize: 10,
    fontWeight: 800,
    color: "#c084fc",
    marginBottom: 6,
  },
  footerText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 1.7,
  },
  link: {
    color: "#60a5fa",
    textDecoration: "underline",
    wordBreak: "break-all",
  },
};

// ───────────────────────────────────────────────
// 共通レイアウト：戻るボタン + タイトル + 本文
// ───────────────────────────────────────────────
function LegalLayout({ title, subtitle, BackBtn, onBack, children }) {
  return (
    <div style={styles.page}>
      <BackBtn onClick={onBack} />
      <div style={styles.titleWrap}>
        <h2 style={styles.title}>{title}</h2>
        {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
      </div>
      <div style={styles.card}>
        <div style={styles.meta}>
          最終更新日：{LEGAL_CONFIG.lastUpdated}<br />
          施行日：{LEGAL_CONFIG.lastUpdated}
        </div>
        {children}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 📄 利用規約
// ═══════════════════════════════════════════════════════════════
export function TermsContent({ BackBtn, onBack }) {
  return (
    <LegalLayout
      title="📄 利用規約"
      subtitle={`${LEGAL_CONFIG.serviceName}をご利用いただく前に、必ずお読みください。`}
      BackBtn={BackBtn}
      onBack={onBack}
    >
      <p style={styles.p}>
        本利用規約（以下「本規約」といいます）は、{LEGAL_CONFIG.operatorName}（以下「当方」といいます）が提供するウェブサービス「{LEGAL_CONFIG.serviceName}」（以下「本サービス」といいます）の利用条件を定めるものです。利用者の皆様（以下「ユーザー」といいます）には、本規約に同意のうえ本サービスをご利用いただきます。
      </p>

      <h3 style={{...styles.h2, ...styles.h2First}}>第1条（適用）</h3>
      <ol style={styles.ol}>
        <li style={styles.li}>本規約は、ユーザーと当方との間の本サービス利用に関わる一切の関係に適用されます。</li>
        <li style={styles.li}>本サービスにアクセスし、または利用した時点で、ユーザーは本規約に同意したものとみなします。</li>
      </ol>

      <h3 style={styles.h2}>第2条（サービスの内容）</h3>
      <ol style={styles.ol}>
        <li style={styles.li}>本サービスは、ユーザーがアップロードした顔写真等の画像をもとに、AI（人工知能）を用いて、顔タイプ・骨格タイプ・パーソナルカラー等を簡易的に診断・提案するウェブサービスです。</li>
        <li style={styles.li}>診断結果はあくまで一般的な理論に基づくエンターテインメント目的の参考情報であり、医学的・専門家による鑑定を保証するものではありません。</li>
        <li style={styles.li}>本サービスでは、診断結果に応じてファッション関連商品を紹介することがあります（第8条を参照）。</li>
      </ol>

      <h3 style={styles.h2}>第3条（利用環境）</h3>
      <ol style={styles.ol}>
        <li style={styles.li}>本サービスの利用に必要な通信機器、通信回線、電力等の環境はユーザー自身で用意するものとします。</li>
        <li style={styles.li}>通信費用はユーザー負担とします。</li>
      </ol>

      <h3 style={styles.h2}>第4条（禁止事項）</h3>
      <p style={styles.p}>ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
      <ol style={styles.ol}>
        <li style={styles.li}>法令または公序良俗に違反する行為</li>
        <li style={styles.li}>犯罪行為に関連する行為</li>
        <li style={styles.li}>第三者の肖像権、プライバシー権、著作権その他の権利を侵害する行為（<span style={styles.strong}>特に、本人の同意を得ていない他人の写真をアップロードする行為</span>）</li>
        <li style={styles.li}>本サービスのサーバーやネットワークの機能を破壊・妨害する行為</li>
        <li style={styles.li}>本サービスを商用目的で利用する行為（当方が事前に許諾した場合を除く）</li>
        <li style={styles.li}>リバースエンジニアリング、スクレイピング、その他不正な手段によりデータを取得する行為</li>
        <li style={styles.li}>18歳未満のユーザーが、保護者の同意なく本サービスを利用する行為</li>
        <li style={styles.li}>その他、当方が不適切と判断する行為</li>
      </ol>

      <h3 style={styles.h2}>第5条（知的財産権）</h3>
      <ol style={styles.ol}>
        <li style={styles.li}>本サービスに含まれるコンテンツ（テキスト、画像、デザイン、ロゴ、プログラム等）の著作権その他の知的財産権は、当方または正当な権利者に帰属します。</li>
        <li style={styles.li}>ユーザーがアップロードした画像の著作権はユーザーに帰属します。ただし、ユーザーは当方が本サービスの提供に必要な範囲（AI診断のための一時的な処理等）で画像を利用することを許諾するものとします。</li>
      </ol>

      <h3 style={styles.h2}>第6条（診断結果に関する免責）</h3>
      <ol style={styles.ol}>
        <li style={styles.li}>本サービスの診断結果は、骨格診断・パーソナルカラー診断・顔タイプ診断などの一般的理論に基づく自動的な分析であり、その正確性・有用性・特定の目的への適合性を保証するものではありません。</li>
        <li style={styles.li}>当方は、ユーザーが診断結果を利用したことにより生じたいかなる損害についても責任を負いません。</li>
        <li style={styles.li}>診断結果はAI（人工知能）による自動処理であり、人間の専門家による判定とは異なる結果が出ることがあります。</li>
      </ol>

      <h3 style={styles.h2}>第7条（画像の取扱い）</h3>
      <ol style={styles.ol}>
        <li style={styles.li}>ユーザーが本サービスにアップロードした画像は、診断のためにAIサービス提供事業者（プライバシーポリシーで明記）に送信されます。</li>
        <li style={styles.li}>アップロードされた画像および診断結果は、ユーザーのブラウザのローカルストレージに保存され、当方のサーバーには原則として保存されません。</li>
        <li style={styles.li}>ユーザーはマイページ等から、いつでも自身の画像・履歴を削除することができます。</li>
      </ol>

      <h3 style={styles.h2}>第8条（アフィリエイトリンクについて）</h3>
      <ol style={styles.ol}>
        <li style={styles.li}>本サービスでは、診断結果に応じて、楽天市場・Amazon等のオンラインショッピングサイトへのリンク（アフィリエイトリンク）を表示することがあります。</li>
        <li style={styles.li}>ユーザーがこれらのリンクを経由して商品を購入された場合、当方は紹介料（アフィリエイト報酬）を受け取ることがあります。</li>
        <li style={styles.li}><span style={styles.strong}>当方が紹介する商品の選定にあたっては、報酬の有無に関わらず、ユーザーにとって有用と判断したものを掲載しています。</span>ただし、商品の品質・効果・価格・在庫状況については各販売事業者の責任に帰属し、当方は一切の責任を負いません。</li>
        <li style={styles.li}>商品購入に関するトラブル（不良品、配送遅延、返品等）は、ユーザーと販売事業者との間で直接解決していただきます。</li>
      </ol>

      <h3 style={styles.h2}>第9条（未成年者の利用）</h3>
      <ol style={styles.ol}>
        <li style={styles.li}>18歳未満の方が本サービスを利用する場合は、必ず保護者の同意を得たうえで利用してください。</li>
        <li style={styles.li}>18歳未満の方が商品購入リンク（アフィリエイトリンク）を経由して商品を購入する場合も、必ず保護者の同意のもとで行ってください。</li>
      </ol>

      <h3 style={styles.h2}>第10条（サービスの変更・中断・終了）</h3>
      <ol style={styles.ol}>
        <li style={styles.li}>当方は、ユーザーへの事前通知なく、本サービスの内容を変更し、または提供を中断・終了することができます。</li>
        <li style={styles.li}>当方は、本サービスの変更・中断・終了によってユーザーに生じたいかなる損害についても責任を負いません。</li>
      </ol>

      <h3 style={styles.h2}>第11条（免責事項）</h3>
      <ol style={styles.ol}>
        <li style={styles.li}>当方は、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティ等に関する欠陥、エラー、バグ、権利侵害等）がないことを明示的にも黙示的にも保証しません。</li>
        <li style={styles.li}>当方は、本サービスに起因してユーザーに生じたあらゆる損害について一切の責任を負いません。</li>
        <li style={styles.li}>当方とユーザーとの間で紛争が生じた場合、当該ユーザーの責任において解決するものとします。</li>
      </ol>

      <h3 style={styles.h2}>第12条(規約の変更)</h3>
      <ol style={styles.ol}>
        <li style={styles.li}>当方は、必要と判断した場合、ユーザーへの事前通知なく本規約を変更できるものとします。</li>
        <li style={styles.li}>変更後の本規約は、本サービス上に掲示された時点から効力を生じます。</li>
      </ol>

      <h3 style={styles.h2}>第13条(準拠法・裁判管轄)</h3>
      <ol style={styles.ol}>
        <li style={styles.li}>本規約の解釈は日本法に準拠するものとします。</li>
        <li style={styles.li}>本サービスに関して紛争が生じた場合、{LEGAL_CONFIG.jurisdiction}を第一審の専属的合意管轄裁判所とします。</li>
      </ol>

      <div style={styles.footer}>
        <div style={styles.footerLabel}>📮 お問い合わせ</div>
        <div style={styles.footerText}>
          運営者：{LEGAL_CONFIG.operatorName}<br />
          メール：<a href={`mailto:${LEGAL_CONFIG.contactEmail}`} style={styles.link}>{LEGAL_CONFIG.contactEmail}</a>
        </div>
      </div>
    </LegalLayout>
  );
}

// ═══════════════════════════════════════════════════════════════
// 🔐 プライバシーポリシー
// ═══════════════════════════════════════════════════════════════
export function PrivacyContent({ BackBtn, onBack }) {
  return (
    <LegalLayout
      title="🔐 プライバシーポリシー"
      subtitle="お預かりする情報の取り扱いについて、誠実にご説明します。"
      BackBtn={BackBtn}
      onBack={onBack}
    >
      <p style={styles.p}>
        {LEGAL_CONFIG.operatorName}（以下「当方」といいます）は、ウェブサービス「{LEGAL_CONFIG.serviceName}」（以下「本サービス」といいます）におけるユーザーの個人情報およびプライバシー情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます）を定めます。
      </p>

      <h3 style={{...styles.h2, ...styles.h2First}}>1. 基本方針</h3>
      <p style={styles.p}>
        当方は、ユーザーの個人情報およびプライバシー情報の重要性を認識し、個人情報の保護に関する法律(個人情報保護法)その他関連法令を遵守し、適切に取り扱います。
      </p>

      <h3 style={styles.h2}>2. 取得する情報</h3>
      <p style={styles.p}>本サービスでは、以下の情報を取得することがあります。</p>
      <p style={styles.p}><span style={styles.strong}>(1) ユーザーが直接提供する情報</span></p>
      <ul style={styles.ul}>
        <li style={styles.li}>顔写真等の画像データ：AI診断のためにユーザーがアップロードする画像</li>
        <li style={styles.li}>お問い合わせ時にいただく情報：メールアドレス、お問い合わせ内容等</li>
      </ul>
      <p style={styles.p}><span style={styles.strong}>(2) 自動的に取得される情報</span></p>
      <ul style={styles.ul}>
        <li style={styles.li}>アクセス情報：IPアドレス、ブラウザの種類、OS、リファラ、アクセス日時、閲覧ページ等</li>
        <li style={styles.li}>Cookie等の識別子：ブラウザに保存される識別情報</li>
      </ul>
      <p style={styles.p}><span style={styles.strong}>(3) ローカルストレージに保存される情報</span></p>
      <ul style={styles.ul}>
        <li style={styles.li}>診断履歴(画像と診断結果)</li>
        <li style={styles.li}>ユーザー設定</li>
      </ul>
      <p style={styles.p}>これらは<span style={styles.strong}>ユーザー自身のブラウザ内に保存される</span>情報であり、当方のサーバーには送信されません。</p>

      <h3 style={styles.h2}>3. 利用目的</h3>
      <p style={styles.p}>取得した情報は、以下の目的のために利用します。</p>
      <ol style={styles.ol}>
        <li style={styles.li}>AI診断機能の提供(画像をAI処理する目的)</li>
        <li style={styles.li}>診断結果の表示および履歴管理</li>
        <li style={styles.li}>ユーザーに合った商品提案の表示</li>
        <li style={styles.li}>本サービスの改善・新機能の開発</li>
        <li style={styles.li}>お問い合わせへの対応</li>
        <li style={styles.li}>不正利用の防止</li>
        <li style={styles.li}>利用統計の作成(個人を特定しない形)</li>
        <li style={styles.li}>法令に基づく対応</li>
      </ol>

      <h3 style={styles.h2}>4. 顔写真等の画像データの取扱い(重要)</h3>
      <p style={styles.p}>
        ユーザーから特に慎重な取扱いが求められる「顔写真等の画像データ」については、以下のとおり取り扱います。
      </p>
      <p style={styles.p}><span style={styles.strong}>(1) 送信先</span></p>
      <p style={styles.p}>
        ユーザーがアップロードした画像は、AI診断の処理を行うため、以下の事業者が提供するAPIに送信されます。
      </p>
      <ul style={styles.ul}>
        <li style={styles.li}>
          <span style={styles.strong}>Anthropic, PBC(米国)</span>：本サービスのAI診断は、AnthropicのClaude APIを利用しています。
          <br />
          <a href="https://www.anthropic.com/legal/privacy" target="_blank" rel="noopener noreferrer" style={styles.link}>
            Anthropicのプライバシーポリシー
          </a>
        </li>
      </ul>
      <p style={styles.p}><span style={styles.strong}>(2) 保存について</span></p>
      <ul style={styles.ul}>
        <li style={styles.li}>アップロードされた画像および診断結果は、原則として<span style={styles.strong}>ユーザーのブラウザ内(ローカルストレージ)にのみ保存</span>されます。</li>
        <li style={styles.li}>当方のサーバーには画像を保存しません。</li>
        <li style={styles.li}>AI APIに送信された画像は、各事業者のポリシーに従って取り扱われます(一般的に、API経由で送信されたデータはモデル学習には利用されません)。</li>
      </ul>
      <p style={styles.p}><span style={styles.strong}>(3) 削除</span></p>
      <ul style={styles.ul}>
        <li style={styles.li}>ユーザーは本サービスの「履歴」画面から、いつでも自身の画像・診断結果を削除できます。</li>
        <li style={styles.li}>ブラウザの履歴・キャッシュ・サイトデータを削除することでも、保存された情報を消去できます。</li>
      </ul>
      <p style={styles.p}><span style={styles.strong}>(4) 国外への移転</span></p>
      <ul style={styles.ul}>
        <li style={styles.li}>上記AIサービスは米国の事業者によって提供されているため、画像データは<span style={styles.strong}>日本国外(米国)に送信されます</span>。ユーザーは本サービスを利用することにより、これに同意したものとみなします。</li>
      </ul>

      <h3 style={styles.h2}>5. 第三者への提供</h3>
      <p style={styles.p}>
        当方は、ユーザーの個人情報を、以下のいずれかに該当する場合を除き、第三者に提供しません。
      </p>
      <ol style={styles.ol}>
        <li style={styles.li}>ユーザーの同意がある場合</li>
        <li style={styles.li}>法令に基づく場合</li>
        <li style={styles.li}>人の生命・身体・財産の保護のために必要な場合</li>
        <li style={styles.li}>本ポリシー第4項に定めるAPIサービスへの送信(業務委託)</li>
      </ol>

      <h3 style={styles.h2}>6. 業務の委託</h3>
      <p style={styles.p}>
        本サービスの提供のため、以下の事業者にデータの処理を委託しています。
      </p>
      <ul style={styles.ul}>
        <li style={styles.li}><span style={styles.strong}>Anthropic, PBC</span>：AI画像分析(Claude API) ／ 米国</li>
        <li style={styles.li}><span style={styles.strong}>Vercel Inc.</span>：ウェブサイトのホスティング・配信 ／ 米国</li>
      </ul>
      <p style={styles.p}>
        これらの事業者は、各社のプライバシーポリシーに従って情報を取り扱います。
      </p>

      <h3 style={styles.h2}>7. Cookieおよびアクセス解析について</h3>
      <p style={styles.p}>
        本サービスでは、利便性の向上やアクセス状況の分析のために、Cookieまたは類似の技術を使用することがあります。
      </p>
      <p style={styles.p}>
        ユーザーはブラウザの設定により、Cookieの受け取りを拒否することができますが、その場合、本サービスの一部機能が利用できなくなる可能性があります。
      </p>

      <h3 style={styles.h2}>8. アフィリエイトリンクについて</h3>
      <p style={styles.p}>
        本サービスでは、楽天市場・Amazon等のアフィリエイトプログラムを利用しています。これらのプログラムを通じて、各サービス事業者がCookie等を用いてユーザーの情報を取得することがあります。詳細は各事業者のプライバシーポリシーをご確認ください。
      </p>
      <ul style={styles.ul}>
        <li style={styles.li}>
          <a href="https://affiliate.rakuten.co.jp/" target="_blank" rel="noopener noreferrer" style={styles.link}>楽天アフィリエイト</a>
        </li>
        <li style={styles.li}>
          <a href="https://affiliate.amazon.co.jp/" target="_blank" rel="noopener noreferrer" style={styles.link}>Amazonアソシエイト</a>
        </li>
      </ul>

      <h3 style={styles.h2}>9. 安全管理措置</h3>
      <p style={styles.p}>
        当方は、取り扱う情報の漏洩、滅失、毀損の防止その他の安全管理のために、以下の措置を講じます。
      </p>
      <ol style={styles.ol}>
        <li style={styles.li}>通信のSSL/TLS暗号化</li>
        <li style={styles.li}>顔写真等の重要データの自社サーバーへの非保存</li>
        <li style={styles.li}>不正アクセス対策</li>
        <li style={styles.li}>情報取扱者の限定</li>
      </ol>

      <h3 style={styles.h2}>10. ユーザーの権利</h3>
      <p style={styles.p}>
        ユーザーは、自身の個人情報について、以下の権利を有します。
      </p>
      <ol style={styles.ol}>
        <li style={styles.li}>個人情報の開示請求</li>
        <li style={styles.li}>個人情報の訂正・追加・削除の請求</li>
        <li style={styles.li}>個人情報の利用停止・消去の請求</li>
        <li style={styles.li}>第三者提供の停止の請求</li>
      </ol>
      <p style={styles.p}>
        これらの請求は、本ポリシー末尾のお問い合わせ先までご連絡ください。本人確認のうえ、合理的な期間内に対応いたします。
      </p>

      <h3 style={styles.h2}>11. 未成年者の個人情報</h3>
      <p style={styles.p}>
        18歳未満のユーザーが本サービスを利用する場合は、保護者(親権者)の同意を得たうえでご利用ください。当方は、未成年者の個人情報については、特に慎重に取り扱います。
      </p>

      <h3 style={styles.h2}>12. プライバシーポリシーの変更</h3>
      <p style={styles.p}>
        当方は、必要に応じて本ポリシーを変更することがあります。変更後の本ポリシーは、本サービス上に掲示された時点から効力を生じます。重要な変更がある場合は、本サービス上で告知します。
      </p>

      <p style={styles.p}>
        本ポリシーに関する一切の紛争については、日本法を準拠法とし、{LEGAL_CONFIG.jurisdiction}を第一審の専属的合意管轄裁判所とします。
      </p>

      <div style={styles.footer}>
        <div style={styles.footerLabel}>📮 お問い合わせ窓口</div>
        <div style={styles.footerText}>
          個人情報の取扱いに関するお問い合わせは、以下までご連絡ください。<br /><br />
          運営者：{LEGAL_CONFIG.operatorName}<br />
          メール：<a href={`mailto:${LEGAL_CONFIG.contactEmail}`} style={styles.link}>{LEGAL_CONFIG.contactEmail}</a>
        </div>
      </div>
    </LegalLayout>
  );
}
