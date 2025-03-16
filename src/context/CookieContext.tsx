import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface CookieContextType {
  showCookieBanner: () => void;
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
}

const CookieContext = createContext<CookieContextType | undefined>(undefined);

export function CookieProvider({ children }: { children: ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if the URL has the cookie settings parameter
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('cookie-settings') === 'show') {
      setIsVisible(true);
      
      // Remove the cookie-settings parameter from URL
      searchParams.delete('cookie-settings');
      const newSearch = searchParams.toString();
      const newPath = location.pathname + (newSearch ? `?${newSearch}` : '');
      
      // Replace the current URL without the parameter
      navigate(newPath, { replace: true });
    }
  }, [location.search, navigate, location.pathname]);

  const showCookieBanner = () => {
    setIsVisible(true);
  };

  return (
    <CookieContext.Provider value={{ showCookieBanner, isVisible, setIsVisible }}>
      {children}
    </CookieContext.Provider>
  );
}

export function useCookies() {
  const context = useContext(CookieContext);
  if (context === undefined) {
    throw new Error('useCookies must be used within a CookieProvider');
  }
  return context;
} 