import Script from "next/script";
import { getAnalyticsConfig } from "@/lib/analytics";

/**
 * Loads analytics only when IDs are present.
 * If GTM is set, direct GA4 script is skipped (load GA via GTM).
 * Optional props override env defaults (from Site Settings).
 */
export function AnalyticsScripts(props?: {
  gaId?: string;
  gtmId?: string;
  clarityId?: string;
}) {
  const env = getAnalyticsConfig();
  const gtmId = props?.gtmId ?? env.gtmId;
  const gaId = props?.gaId ?? env.gaId;
  const clarityId = props?.clarityId ?? env.clarityId;
  const loadDirectGa = Boolean(gaId && !gtmId);

  return (
    <>
      {gtmId ? (
        <Script id="gtm" strategy="afterInteractive">{`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${gtmId}');
        `}</Script>
      ) : null}

      {loadDirectGa ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga4" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', { anonymize_ip: true });
          `}</Script>
        </>
      ) : null}

      {clarityId ? (
        <Script id="clarity" strategy="afterInteractive">{`
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${clarityId}");
        `}</Script>
      ) : null}
    </>
  );
}
