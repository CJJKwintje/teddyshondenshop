import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, ChevronLeft, ChevronRight, SlidersHorizontal, Share2 } from 'lucide-react';
import { useNavigation } from '../hooks/useNavigation';
import { getCategoryPageBySlug, NavigationCategory, NavigationLink } from '../services/contentful';
import { useQuery } from 'urql';
import { gql } from 'urql';
import SEO from '../components/SEO';
import ContentfulRichText from '../components/content/ContentfulRichText';
import Breadcrumbs from '../components/Breadcrumbs';
import SearchResults from '../components/SearchResults';
import Pagination from '../components/Pagination';
import { formatPrice } from '../utils/formatPrice';
import SearchFilters from '../components/SearchFilters';
import MobileFilterMenu from '../components/MobileFilterMenu';
import ActiveFilterTags from '../components/ActiveFilterTags';
import BackToTop from '../components/BackToTop';
import { trackPageView, trackFilterUse, trackPaginationClick, trackProductListView } from '../utils/analytics';

const PRODUCTS_PREFETCH_COUNT = 24;
const PRODUCTS_PER_PAGE = 12;

// Extend the NavigationLink fields type to include backgroundImage and backgroundColor
interface ExtendedNavigationLink extends NavigationLink {
  fields: NavigationLink['fields'] & {
    backgroundImage?: {
      fields: {
        file: {
          url: string;
        };
      };
    };
    backgroundColor?: string;
  };
}

const PRODUCT_CARD_FRAGMENT = gql`
  fragment ProductCard on Product {
    id
    handle
    title
    productType
    tags
    vendor
    variants(first: 1) {
      edges {
        node {
          id
          price {
            amount
            currencyCode
          }
          compareAtPrice {
            amount
            currencyCode
          }
          quantityAvailable
        }
      }
    }
    images(first: 1) {
      edges {
        node {
          originalSrc
          altText
        }
      }
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
  }
`;

// New query to fetch products by collection handle with filters
const COLLECTION_PRODUCTS_QUERY = gql`
  query GetCollectionProducts($handle: String!, $first: Int, $after: String) {
    collection(handle: $handle) {
      id
      title
      handle
      products(first: $first, after: $after) {
        edges {
          node {
            ...ProductCard
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;

// Query to get all products in a collection for filter options
const GET_COLLECTION_FILTERS_QUERY = gql`
  query GetCollectionFilters($handle: String!) {
    collection(handle: $handle) {
      products(first: 250) {
        edges {
          node {
            vendor
            priceRange {
              minVariantPrice {
                amount
              }
            }
          }
        }
      }
    }
  }
`;

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { categories, isLoading: isNavLoading, error: navError } = useNavigation();
  const [pageData, setPageData] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [cursors, setCursors] = useState<Record<number, string>>({});
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  
  // Filter state
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [priceRanges, setPriceRanges] = useState<number[]>([]);

  // Initialize filters from URL parameters
  useEffect(() => {
    const brandsParam = searchParams.get('brands');
    const priceParam = searchParams.get('price');
    
    if (brandsParam) {
      setSelectedBrands(brandsParam.split(','));
    }
    
    if (priceParam) {
      setSelectedPriceRanges([priceParam]);
    }
  }, [searchParams]);

  // Update URL when filters change
  const updateUrlParams = useCallback(() => {
    const params = new URLSearchParams();
    
    if (selectedBrands.length > 0) {
      params.set('brands', selectedBrands.join(','));
    }
    
    if (selectedPriceRanges.length > 0) {
      params.set('price', selectedPriceRanges[0]);
    }
    
    setSearchParams(params);
  }, [selectedBrands, selectedPriceRanges, setSearchParams]);

  // Find the current category
  const currentCategory = categories.find(cat => cat.slug === category);

  // Get all subcategories for this category
  const getAllSubcategories = () => {
    if (!currentCategory) return [] as ExtendedNavigationLink[];
    return (currentCategory.link || []) as ExtendedNavigationLink[];
  };

  const subcategories = getAllSubcategories();

  // Get collection handle from category
  const getCollectionHandle = useCallback(() => {
    if (!category || !currentCategory) return '';
    
    // Use the category title as the collection handle
    // Convert to lowercase and replace spaces with hyphens
    return currentCategory.mainCategory.toLowerCase().replace(/\s+/g, '-');
  }, [category, currentCategory]);

  // Products Query with collection handle
  const hasActiveFilters = selectedBrands.length > 0 || selectedPriceRanges.length > 0;
  
  const [result] = useQuery({ 
    query: COLLECTION_PRODUCTS_QUERY,
    variables: {
      handle: getCollectionHandle(),
      first: hasActiveFilters ? 250 : PRODUCTS_PREFETCH_COUNT,
      after: hasActiveFilters ? null : (cursors[currentPage - 1] || null),
      filtersKey: `${selectedBrands.join(',')}-${selectedPriceRanges.join(',')}` // triggers re-fetch
    },
    pause: !currentCategory
  });
  const { data, fetching: productsFetching, error: productsError } = result;

  // Fetch filters
  const [filtersResult] = useQuery({
    query: GET_COLLECTION_FILTERS_QUERY,
    variables: {
      handle: getCollectionHandle()
    },
    pause: !currentCategory
  });

  // Store cursor and accumulate products when we get results
  useEffect(() => {
    if (!data?.collection?.products?.edges) return;
  
    const fetchedProducts = data.collection.products.edges;
    
    setCursors(prev => ({
      ...prev,
      [currentPage]: data.collection.products.pageInfo.endCursor
    }));
    
    if (currentPage === 1) {
      setAllProducts(fetchedProducts);
      setHasMore(data.collection.products.pageInfo.hasNextPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setAllProducts(prev => {
        // When loading more, only add products that aren't already in the list
        const existingIds = new Set(prev.map(p => p.node.id));
        const newProducts = fetchedProducts.filter((p: { node: { id: string } }) => !existingIds.has(p.node.id));
        return [...prev, ...newProducts];
      });
    }
    
    setHasMore(data.collection.products.pageInfo.hasNextPage);
    setIsLoadingMore(false);
  }, [data, currentPage]);

  // Process available filters from initial query
  const processFilters = useCallback(() => {
    if (!filtersResult.data?.collection?.products?.edges) return {
      availableBrands: [],
      priceRanges: []
    };

    const products = filtersResult.data.collection.products.edges;
    const brands = new Set<string>();
    const prices = new Set<number>();

    products.forEach(({ node }: any) => {
      if (node.vendor) brands.add(node.vendor);
      const price = parseFloat(node.priceRange.minVariantPrice.amount);
      prices.add(Math.floor(price / 25) * 25); // Round to nearest 25
    });

    return {
      availableBrands: Array.from(brands),
      priceRanges: Array.from(prices).sort((a, b) => a - b)
    };
  }, [filtersResult.data]);

  // Update available filters when filter data changes
  useEffect(() => {
    const { availableBrands: brands, priceRanges: prices } = processFilters();
    setAvailableBrands(brands);
    setPriceRanges(prices);
  }, [processFilters]);

  // Process products with filters
  const processedProducts = useMemo(() => {
    if (!allProducts.length) return [];

    // Apply filters to the products
    let filteredProducts = allProducts;
    
    // Filter by brand
    if (selectedBrands.length > 0) {
      filteredProducts = filteredProducts.filter(({ node }: any) => 
        selectedBrands.includes(node.vendor)
      );
    }
    
    // Filter by price range
    if (selectedPriceRanges.length > 0) {
      filteredProducts = filteredProducts.filter(({ node }: any) => {
        const price = parseFloat(node.priceRange.minVariantPrice.amount);
        return selectedPriceRanges.some(range => {
          const [min, max] = range.split('-').map(parseFloat);
          return price >= min && price <= max;
        });
      });
    }

    return filteredProducts.map(({ node }: any) => {
      const variant = node.variants.edges[0]?.node;
      const compareAtPrice = variant?.compareAtPrice
        ? parseFloat(variant.compareAtPrice.amount)
        : undefined;

      return {
        ...node,
        hasAvailableVariant: variant?.quantityAvailable > 0,
        variantsCount: node.variants.edges.length,
        firstVariantId: variant?.id,
        compareAtPrice,
        formattedPrice: formatPrice(parseFloat(node.priceRange.minVariantPrice.amount)),
        formattedCompareAtPrice: compareAtPrice ? formatPrice(compareAtPrice) : undefined,
        image: {
          src: node.images.edges[0]?.node?.originalSrc,
          alt: node.images.edges[0]?.node?.altText
        }
      };
    });
  }, [allProducts, selectedBrands, selectedPriceRanges]);

  // Handle loading more products
  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    
    if (!data?.collection?.products?.pageInfo?.hasNextPage) {
      setHasMore(false);
      return;
    }
    
    setIsLoadingMore(true);
    setCurrentPage(prev => prev + 1);
  }, [isLoadingMore, hasMore, data]);

  // Filter handlers
  const handleFilterChange = (type: 'price' | 'brand' | 'type', value: string) => {
    // Reset pagination and product states
    setCurrentPage(1);
    setCursors({});
    setHasMore(true);
    setAllProducts([]);
    setIsLoadingMore(false);

    if (type === 'price') {
      setSelectedPriceRanges(prev =>
        prev.includes(value) ? prev.filter(range => range !== value) : [value]
      );
    } else if (type === 'brand') {
      setSelectedBrands(prev => {
        const newBrands = prev.includes(value) 
          ? prev.filter(brand => brand !== value)
          : [...prev, value];
        return newBrands;
      });
    }

    // Track filter usage
    if (type !== 'type') {
      trackFilterUse(type, value, { category });
    }
  };

  const clearFilters = () => {
    // Reset all states
    setSelectedPriceRanges([]);
    setSelectedBrands([]);
    setCurrentPage(1);
    setCursors({});
    setHasMore(true);
    setAllProducts([]);
    setIsLoadingMore(false);
    // Clear URL parameters
    setSearchParams({});
  };

  const handleRemoveFilter = (type: 'price' | 'brand', value: string) => {
    // Reset pagination state
    setCurrentPage(1);
    setCursors({});
    setHasMore(true);
    setAllProducts([]);
    setIsLoadingMore(false);

    if (type === 'price') {
      setSelectedPriceRanges(prev =>
        prev.filter(range => range !== value)
      );
    } else if (type === 'brand') {
      setSelectedBrands(prev =>
        prev.filter(brand => brand !== value)
      );
    }
  };

  // Fetch category page data from Contentful
  React.useEffect(() => {
    const fetchPageData = async () => {
      try {
        if (!category) {
          throw new Error('Invalid category');
        }

        const data = await getCategoryPageBySlug(category);
        setPageData(data);
      } catch (err) {
        console.error('Error fetching category page:', err);
        setError(err instanceof Error ? err.message : 'Failed to load category page');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPageData();
  }, [category]);

  // Generate shareable URL for current filters
  const getShareableUrl = useCallback(() => {
    const baseUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams();
    
    if (selectedBrands.length > 0) {
      params.set('brands', selectedBrands.join(','));
    }
    
    if (selectedPriceRanges.length > 0) {
      params.set('price', selectedPriceRanges[0]);
    }
    
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }, [selectedBrands, selectedPriceRanges]);

  // Full page skeleton loading (initial page load)
  if (isLoading || isNavLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumbs Skeleton */}
          <div className="mb-8">
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
          </div>

          {/* Title Skeleton */}
          <div className="mb-8">
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Skeleton - Desktop */}
            <aside className="hidden lg:block lg:w-72 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="h-6 w-1/2 bg-gray-200 rounded animate-pulse mb-4" />
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                  ))}
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1">
              {/* Mobile Filter Button Skeleton */}
              <div className="flex items-center justify-end mb-6">
                <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
              </div>

              {/* Active Filters Skeleton */}
              <div className="mb-6 flex gap-2">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
              
              {/* Product Grid Skeleton */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="aspect-square bg-gray-200 animate-pulse" />
                    <div className="p-4">
                      <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
                      <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse mb-4" />
                      <div className="h-8 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </main>
          </div>
        </div>

        <BackToTop />
      </div>
    );
  }

  // Product grid skeleton loading (when fetching products)
  const renderProductGrid = () => {
    if (productsFetching) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="aspect-square bg-gray-200 animate-pulse" />
              <div className="p-4">
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse mb-4" />
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <>
        <SearchResults
          products={processedProducts.slice(0, PRODUCTS_PER_PAGE * currentPage)}
          isLoading={false}
          pageContext={{
            pageType: 'category',
            pageName: currentCategory?.mainCategory || '',
            category: category
          }}
        />
        
        {(hasMore && processedProducts.length > PRODUCTS_PER_PAGE * currentPage) && (
          <div className="mt-8">
            <Pagination
              hasMore={hasMore}
              onLoadMore={handleLoadMore}
              isLoading={isLoadingMore || productsFetching}
            />
          </div>
        )}
      </>
    );
  };

  if (error || navError || !currentCategory) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Categorie niet gevonden
          </h1>
          <p className="text-gray-500 mb-6">
            De opgevraagde categorie bestaat niet of is verwijderd.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Ga terug
          </button>
        </div>
      </div>
    );
  }

  const canonicalUrl = `https://teddyshondenshop.nl/categorie/${category}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title={pageData?.seoTitle || `${currentCategory.mainCategory} voor honden`}
        description={pageData?.seoDescription || `Ontdek ons uitgebreide assortiment ${currentCategory.mainCategory.toLowerCase()} voor honden. De beste kwaliteit, direct bij jou thuisbezorgd.`}
        canonical={canonicalUrl}
        type="website"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Breadcrumbs
            items={[
              {
                label: currentCategory.mainCategory
              }
            ]}
          />
        </div>

        {/* Title Section */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {pageData?.title || currentCategory.mainCategory}
          </h1>
          {pageData?.bannerSubtitle && (
            <p className="text-lg text-gray-600">
              {pageData.bannerSubtitle}
            </p>
          )}
        </div>

        {/* Links Section */}
        {currentCategory.link.length > 0 && (
          <div className="mb-16">
            <div className="relative">
              {scrollPosition > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (containerRef.current) {
                      const scrollAmount = -containerRef.current.offsetWidth;
                      containerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                      setScrollPosition(prev => Math.max(0, prev + scrollAmount));
                    }
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-600" />
                </button>
              )}

              <div
                ref={containerRef}
                className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory gap-4 md:gap-6 pb-4"
                onScroll={(e) => setScrollPosition(e.currentTarget.scrollLeft)}
              >
                {(currentCategory.link as ExtendedNavigationLink[]).map((subcategory) => (
                  <Link
                    key={subcategory.fields.slug}
                    to={`/categorie/${category}/${subcategory.fields.slug}`}
                    className="flex-none w-[calc(85%-1rem)] sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1rem)] xl:w-[calc(25%-1rem)] snap-start relative rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group h-48 sm:h-48"
                  >
                    {subcategory.fields.backgroundImage ? (
                      <div 
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                        style={{ 
                          backgroundImage: `url(${subcategory.fields.backgroundImage.fields.file.url})`,
                          filter: 'brightness(0.7)'
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gray-500" />
                    )}
                    <div className="relative h-full p-6 flex flex-col justify-between z-10 text-white">
                      <div className="flex items-start gap-3">
                        <h3 className="text-xl font-semibold group-hover:text-white/90 transition-colors">
                          {subcategory.fields.title}
                        </h3>
                      </div>
                      {subcategory.fields.description && (
                        <p className="text-white/80 line-clamp-2 text-sm">
                          {subcategory.fields.description}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>

              {containerRef.current && containerRef.current.scrollWidth - containerRef.current.clientWidth > scrollPosition && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (containerRef.current) {
                      const scrollAmount = containerRef.current.offsetWidth;
                      containerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                      setScrollPosition(prev => prev + scrollAmount);
                    }
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-6 h-6 text-gray-600" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Products Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Alle producten
          </h2>
          
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters - Desktop */}
            <aside className="hidden lg:block lg:w-72 flex-shrink-0">
              <SearchFilters
                availableBrands={availableBrands}
                selectedBrands={selectedBrands}
                selectedPriceRanges={selectedPriceRanges}
                onFilterChange={handleFilterChange}
                onClearFilters={clearFilters}
              />
            </aside>

            {/* Main Content */}
            <main className="flex-1">
              <div className="flex items-center justify-end mb-6">
                <button
                  onClick={() => setIsFilterMenuOpen(true)}
                  className="lg:hidden inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                </button>
              </div>

              <ActiveFilterTags
                selectedBrands={selectedBrands}
                selectedPriceRanges={selectedPriceRanges}
                onRemoveFilter={handleRemoveFilter}
              />
              
              {renderProductGrid()}
            </main>
          </div>
        </div>

        {/* Content Section */}
        {pageData?.description && (
          <div className="bg-white rounded-xl p-8 shadow-sm prose prose-blue max-w-none">
            <ContentfulRichText content={pageData.description} />
          </div>
        )}
      </div>

      <MobileFilterMenu
        isOpen={isFilterMenuOpen}
        onClose={() => setIsFilterMenuOpen(false)}
        availableBrands={availableBrands}
        selectedBrands={selectedBrands}
        selectedPriceRanges={selectedPriceRanges}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
      />

      <BackToTop />
    </div>
  );
}