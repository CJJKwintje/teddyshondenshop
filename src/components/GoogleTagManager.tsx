import React from 'react';

const GTM_ID = 'GTM-TTT8QLFG';

export function GoogleTagManagerScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${GTM_ID}');
        `
      }}
    />
  );
}

export function GoogleTagManagerNoScript() {
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </noscript>
  );
}

// Initialize dataLayer
if (typeof window !== 'undefined') {
  window.dataLayer = window.dataLayer || [];
}

export const GTMPageView = (url: string) => {
  interface PageViewProps {
    event: string;
    page: string;
  }

  const pageView: PageViewProps = {
    event: 'pageview',
    page: url,
  };

  window.dataLayer?.push(pageView);
  return pageView;
};

export default {
  GoogleTagManagerScript,
  GoogleTagManagerNoScript,
  GTMPageView,
}; 