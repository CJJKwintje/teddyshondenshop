import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { useCookies } from '../context/CookieContext';

const COOKIE_CONSENT_KEY = 'cookie_preferences';

interface CookiePreferences {
  required: boolean;
  personalization: boolean;
  marketing: boolean;
  analytics: boolean;
}

export default function CookieBanner() {
  const { isVisible, setIsVisible } = useCookies();
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    required: true, // Always true
    personalization: false,
    marketing: false,
    analytics: false
  });

  useEffect(() => {
    // Check if user has already given consent
    const savedPreferences = Cookies.get(COOKIE_CONSENT_KEY);
    if (!savedPreferences) {
      setIsVisible(true);
    } else {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences(parsed);
      } catch (error) {
        console.error('Error parsing cookie preferences:', error);
        setIsVisible(true);
      }
    }
  }, [setIsVisible]);

  const acceptAllCookies = () => {
    const allAccepted: CookiePreferences = {
      required: true,
      personalization: true,
      marketing: true,
      analytics: true
    };
    Cookies.set(COOKIE_CONSENT_KEY, JSON.stringify(allAccepted), { expires: 365 });
    setPreferences(allAccepted);
    setIsVisible(false);
  };

  const savePreferences = () => {
    Cookies.set(COOKIE_CONSENT_KEY, JSON.stringify(preferences), { expires: 365 });
    setIsVisible(false);
  };

  const handlePreferenceChange = (key: keyof CookiePreferences) => {
    if (key === 'required') return; // Cannot change required cookies
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="text-sm text-gray-600 flex-1">
              <p>
                Wij gebruiken cookies om je de beste ervaring op onze website te bieden. 
                Sommige cookies zijn noodzakelijk voor de werking van de website, terwijl andere 
                worden gebruikt om je ervaring te personaliseren en ons te helpen de website te verbeteren.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-gray-600 hover:text-gray-800 flex items-center gap-1"
              >
                {showDetails ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Verberg details
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Toon details
                  </>
                )}
              </button>
              <button
                onClick={acceptAllCookies}
                className="bg-[#63D7B2] text-white px-6 py-2 rounded-full hover:bg-[#47C09A] transition-colors whitespace-nowrap"
              >
                Alles accepteren
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Sluiten"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {showDetails && (
            <div className="border-t pt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Vereist</h3>
                    <p className="text-sm text-gray-500">Deze cookies zijn noodzakelijk voor het functioneren van de website.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.required}
                    disabled
                    className="h-4 w-4 text-[#63D7B2] border-gray-300 rounded cursor-not-allowed"
                    aria-label="Vereiste cookies"
                    id="required-cookies"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Personalisatie</h3>
                    <p className="text-sm text-gray-500">Cookies om je winkelervaring te personaliseren.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.personalization}
                    onChange={() => handlePreferenceChange('personalization')}
                    className="h-4 w-4 text-[#63D7B2] border-gray-300 rounded cursor-pointer"
                    aria-label="Personalisatie cookies"
                    id="personalization-cookies"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Marketing</h3>
                    <p className="text-sm text-gray-500">Cookies voor gerichte advertenties en marketing doeleinden.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={() => handlePreferenceChange('marketing')}
                    className="h-4 w-4 text-[#63D7B2] border-gray-300 rounded cursor-pointer"
                    aria-label="Marketing cookies"
                    id="marketing-cookies"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Analyse</h3>
                    <p className="text-sm text-gray-500">Cookies om websitegebruik te analyseren en te verbeteren.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={() => handlePreferenceChange('analytics')}
                    className="h-4 w-4 text-[#63D7B2] border-gray-300 rounded cursor-pointer"
                    aria-label="Analyse cookies"
                    id="analytics-cookies"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={savePreferences}
                  className="bg-gray-800 text-white px-6 py-2 rounded-full hover:bg-gray-700 transition-colors"
                >
                  Voorkeuren opslaan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 