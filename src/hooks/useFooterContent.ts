import { useState, useEffect } from 'react';
import { contentfulClient } from '../services/contentful';
import { Document } from '@contentful/rich-text-types';

interface FooterLink {
  fields: {
    title: string;
    link: string;
  };
}

interface FooterContent {
  col1Title: string;
  col1: Array<FooterLink>;
  col1Text: Document;
  col2title: string;
  col2: Array<FooterLink>;
  col3title: string;
  col3: Array<FooterLink>;
  isLoading: boolean;
  error: string | null;
}

export function useFooterContent(): FooterContent {
  const [content, setContent] = useState<Omit<FooterContent, 'isLoading' | 'error'>>({
    col1Title: '',
    col1: [],
    col1Text: {
      nodeType: 'document',
      data: {},
      content: []
    },
    col2title: '',
    col2: [],
    col3title: '',
    col3: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFooter = async () => {
      if (!contentfulClient) {
        setError('Contentful client not initialized');
        setIsLoading(false);
        return;
      }

      try {
        const response = await contentfulClient.getEntries({
          content_type: 'footer',
          limit: 1
        });

        if (response.items.length > 0) {
          const footerData = response.items[0].fields;
          setContent({
            col1Title: footerData.col1Title || '',
            col1: footerData.col1 || [],
            col1Text: footerData.col1text || {
              nodeType: 'document',
              data: {},
              content: []
            },
            col2title: footerData.col2title || '',
            col2: footerData.col2 || [],
            col3title: footerData.col3title || '',
            col3: footerData.col3 || []
          });
        }
      } catch (err) {
        console.error('Error fetching footer content:', err);
        setError('Failed to load footer content');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFooter();
  }, []);

  return { ...content, isLoading, error };
}