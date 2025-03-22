import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    window.dataLayer?.push({
      event: 'page_view',
      page_path: location.pathname,
      page_search: location.search,
      page_hash: location.hash
    });
  }, [location]);
} 