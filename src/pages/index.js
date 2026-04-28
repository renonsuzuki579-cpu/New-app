import Head from "next/head";
import HyokaApp from "@/components/HyokaApp";

// ═══════════════════════════════════════════════════════════════
// 🌐 サイト基本情報(変更したい場合はここだけ書き換え)
// ═══════════════════════════════════════════════════════════════
const SITE_CONFIG = {
  url: "https://new-app-rmmo.vercel.app",
  title: "タイプ診断アプリ ✨ | AIが顔タイプ・骨格・パーソナルカラーを診断",
  shortTitle: "タイプ診断アプリ",
  description: "顔タイプ8分類・骨格3タイプ・パーソナルカラー4シーズンをAIが瞬時に診断。あなたに似合うファッション・髪型・色までまるっと提案します✨",
  ogImage: "/og-image.png", // public/og-image.png に画像を置く
  themeColor: "#8b5cf6", // ブランドカラー(ブラウザのアドレスバーの色)
  siteName: "タイプ診断アプリ",
};

export default function Home() {
  return (
    <>
      <Head>
        {/* ─── 基本メタ情報 ─── */}
        <title>{SITE_CONFIG.title}</title>
        <meta name="description" content={SITE_CONFIG.description} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content={SITE_CONFIG.themeColor} />
        <meta charSet="utf-8" />

        {/* ─── 検索エンジン向け ─── */}
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        <link rel="canonical" href={SITE_CONFIG.url} />

        {/* ─── Open Graph (Facebook・LINE等で使われる) ─── */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE_CONFIG.url} />
        <meta property="og:title" content={SITE_CONFIG.title} />
        <meta property="og:description" content={SITE_CONFIG.description} />
        <meta property="og:image" content={`${SITE_CONFIG.url}${SITE_CONFIG.ogImage}`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={SITE_CONFIG.title} />
        <meta property="og:site_name" content={SITE_CONFIG.siteName} />
        <meta property="og:locale" content="ja_JP" />

        {/* ─── Twitter Card (X=旧Twitterで使われる) ─── */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={SITE_CONFIG.url} />
        <meta name="twitter:title" content={SITE_CONFIG.title} />
        <meta name="twitter:description" content={SITE_CONFIG.description} />
        <meta name="twitter:image" content={`${SITE_CONFIG.url}${SITE_CONFIG.ogImage}`} />
        <meta name="twitter:image:alt" content={SITE_CONFIG.title} />

        {/* ─── Apple/iOS 向け ─── */}
        <meta name="apple-mobile-web-app-title" content={SITE_CONFIG.shortTitle} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* ─── Favicon ─── */}
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="shortcut icon" href="/favicon.ico" />

        {/* ─── PWA Manifest ─── */}
        <link rel="manifest" href="/manifest.json" />

        {/* ─── 構造化データ(SEO強化、Google検索結果の表示が良くなる) ─── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": SITE_CONFIG.shortTitle,
              "description": SITE_CONFIG.description,
              "url": SITE_CONFIG.url,
              "applicationCategory": "LifestyleApplication",
              "operatingSystem": "Any",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "JPY",
              },
            }),
          }}
        />
      </Head>
      <HyokaApp />
    </>
  );
}
