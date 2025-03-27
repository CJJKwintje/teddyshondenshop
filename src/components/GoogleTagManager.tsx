import React from 'react';
import Cookies from 'js-cookie';

const GTM_ID = 'GTM-TTT8QLFG';
const COOKIE_CONSENT_KEY = 'cookie_preferences';

interface CookiePreferences {
  required: boolean;
  personalization: boolean;
  marketing: boolean;
  analytics: boolean;
}

const getCookiePreferences = (): CookiePreferences | null => {
  const savedPreferences = Cookies.get(COOKIE_CONSENT_KEY);
  if (!savedPreferences) return null;
  try {
    return JSON.parse(savedPreferences);
  } catch (error) {
    console.error('Error parsing cookie preferences:', error);
    return null;
  }
};

export function GoogleTagManagerScript() {
  const preferences = getCookiePreferences();
  
  // Only load GTM if user has accepted analytics cookies
  if (!preferences?.analytics) {
    return null;
  }

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
  const preferences = getCookiePreferences();
  
  // Only load GTM if user has accepted analytics cookies
  if (!preferences?.analytics) {
    return null;
  }

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
  const preferences = getCookiePreferences();
  
  // Only track page views if user has accepted analytics cookies
  if (!preferences?.analytics) {
    return null;
  }

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