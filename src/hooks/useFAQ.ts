import { useState, useEffect } from 'react';
import { getFAQPage } from '../services/contentful';
import { FAQPage } from '../types/content';

export function useFAQ() {
  const [faqPage, setFaqPage] = useState<FAQPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFAQPage = async () => {
      try {
        const page = await getFAQPage('veelgestelde-vragen');
        if (page) {
          setFaqPage(page);
        } else {
          setError('FAQ pagina niet gevonden');
        }
      } catch (err) {
        console.error('Error fetching FAQ page:', err);
        setError('Er is een fout opgetreden bij het laden van de FAQ pagina.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFAQPage();
  }, []);

  return { faqPage, isLoading, error };
} 