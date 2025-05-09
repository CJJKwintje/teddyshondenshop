import { useContentfulData } from './useContentfulData';
import { BLOCKS } from '@contentful/rich-text-types';

export function useFooterContent() {
  const { data, isLoading, error } = useContentfulData();

  // Provide sensible defaults if data is not loaded yet
  const footer = data?.footer || {
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
  };

  return { ...footer, isLoading, error: error ? 'Failed to load footer content' : null };
}