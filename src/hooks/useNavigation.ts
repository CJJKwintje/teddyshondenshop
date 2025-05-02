import { useQuery } from '@tanstack/react-query';
import { getNavigation, NavigationCategory, getCategoryPageBySlug, CategoryPage } from '../services/contentful';

async function getNavigationWithCategories() {
  const navigationData = await getNavigation();
  const categoriesWithPages = await Promise.all(
    navigationData.map(async (category) => {
      const categoryPage = await getCategoryPageBySlug(category.slug);
      return { ...category, categoryPage };
    })
  );
  // Sort categories by the 'order' field
  return categoriesWithPages.sort((a, b) => (a.order || 0) - (b.order || 0));
}

export function useNavigation() {
  const { data: categories = [], isLoading, error } = useQuery<(NavigationCategory & { categoryPage: CategoryPage | null })[]>({
    queryKey: ['navigation'],
    queryFn: getNavigationWithCategories,
    staleTime: Infinity, // Data is static, never stale
    gcTime: Infinity, // Keep in cache forever
  });

  return { categories, isLoading, error: error ? 'Failed to load navigation' : null };
}