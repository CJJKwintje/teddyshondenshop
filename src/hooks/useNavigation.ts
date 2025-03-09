import { useState, useEffect } from 'react';
import { getNavigation, NavigationCategory, getCategoryPageBySlug, CategoryPage } from '../services/contentful';

export function useNavigation() {
  const [categories, setCategories] = useState<(NavigationCategory & { categoryPage: CategoryPage | null })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNavigation = async () => {
      try {
        const navigationData = await getNavigation();
        const categoriesWithPages = await Promise.all(
          navigationData.map(async (category) => {
            const categoryPage = await getCategoryPageBySlug(category.slug);
            return { ...category, categoryPage };
          })
        );
        // Sort categories by the 'order' field
        categoriesWithPages.sort((a, b) => (a.order || 0) - (b.order || 0));
        setCategories(categoriesWithPages);
      } catch (err) {
        console.error('Error fetching navigation:', err);
        setError('Failed to load navigation');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNavigation();
  }, []);

  return { categories, isLoading, error };
}