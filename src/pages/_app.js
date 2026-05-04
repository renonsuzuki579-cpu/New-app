import "@/styles/globals.css";
import Script from "next/script";
import { useRouter } from "next/router";
import { useEffect } from "react";

// ═══════════════════════════════════════════════════════════════
// Google Analytics 4 (GA4) 設定
// ═══════════════════════════════════════════════════════════════
const GA_MEASUREMENT_ID = "G-CWZGS1LYQD";

export default function App({ Component, pageProps }) {
  const router = useRouter();

  // ページ遷移ごとにGA4にイベントを送る
  useEffect(() => {
    const handleRouteChange = (url) => {
      if (typeof window.gtag === "function") {
        window.gtag("config", GA_MEASUREMENT_ID, {
          page_path: url,
        });
      }
    };
    router.events.on("routeChangeComplete", handleRouteChange);
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events]);

  return (
    <>
      {/* GA4 スクリプト本体 */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="ga4-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
      <Component {...pageProps} />
    </>
  );
}
