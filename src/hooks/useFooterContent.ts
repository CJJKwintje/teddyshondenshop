import { useState, useEffect } from 'react';
import { loadContentfulData } from '../data/contentfulData';
import { Document, BLOCKS } from '@contentful/rich-text-types';

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
      nodeType: BLOCKS.DOCUMENT,
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
      try {
        const data = await loadContentfulData();
        if (data.footer) {
          setContent({
            col1Title: data.footer.col1Title || '',
            col1: data.footer.col1 || [],
            col1Text: data.footer.col1Text || {
              nodeType: BLOCKS.DOCUMENT,
              data: {},
              content: []
            },
            col2title: data.footer.col2title || '',
            col2: data.footer.col2 || [],
            col3title: data.footer.col3title || '',
            col3: data.footer.col3 || []
          });
        } else {
          setError('Footer data not found');
        }
      } catch (err) {
        console.error('Error loading footer content:', err);
        setError('Failed to load footer content');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFooter();
  }, []);

  return { ...content, isLoading, error };
}