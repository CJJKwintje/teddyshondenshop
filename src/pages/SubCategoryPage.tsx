import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, ArrowLeft, SlidersHorizontal } from 'lucide-react';
import { useQuery } from 'urql';
import { gql } from 'urql';
import { getCategoryPage } from '../services/contentful';
import { useNavigation } from '../hooks/useNavigation';
import SEO from '../components/SEO';
import SearchResults from '../components/SearchResults';
import SearchFilters from '../components/SearchFilters';
import MobileFilterMenu from '../components/MobileFilterMenu';
import BackToTop from '../components/BackToTop';
import Pagination from '../components/Pagination';
import Breadcrumbs from '../components/Breadcrumbs';
import { formatPrice } from '../utils/formatPrice';
import ActiveFilterTags from '../components/ActiveFilterTags';
import { trackPageView, trackFilterUse, trackPaginationClick, trackProductListView } from '../utils/analytics';

const PRODUCTS_PER_PAGE = 12;
const PRODUCTS_PREFETCH_COUNT = 24;

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

// New query to fetch products by collection handle
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

interface NavigationCategory {
  mainCategory: string;
  slug: string;
  productTypes: string[];
  categoryPage: CategoryPage | null;
}

interface CategoryPage {
  fields: {
    title: string;
    slug: string;
    description?: string;
    seoTitle?: string;
    seoDescription?: string;
    productType?: string[];
    keywords?: string[];
  };
}

interface PageData {
  fields: {
    title: string;
    slug: string;
    description?: string;
    seoTitle?: string;
    seoDescription?: string;
    productType?: string[];
    keywords?: string[];
  };
}

interface ProductNode {
  productType: string;
  // ... other product fields if needed
}

interface ProductEdge {
  node: ProductNode;
}

interface ProcessedProduct {
  id: string;
  title: string;
  productType: string;
  vendor: string;
  priceRange: {
    minVariantPrice: {
      amount: string;
    };
  };
}

export default function SubCategoryPage() {
  const { category, subcategory } = useParams<{ category: string; subcategory: string }>();
  const navigate = useNavigate();
  const [pageData, setPageData] = React.useState<PageData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [cursors, setCursors] = useState<Record<number, string>>({});
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [totalProductsCount, setTotalProductsCount] = useState(0);
  const { categories } = useNavigation();
  const currentCategory = categories.find(cat => cat.slug === category) as NavigationCategory | undefined;
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFiltering, setIsFiltering] = useState(false);
  const [isLoadingWithDelay, setIsLoadingWithDelay] = useState(false);
  const [filterTimeoutId, setFilterTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // Fetch category page data from Contentful
  React.useEffect(() => {
    const fetchPageData = async () => {
      try {
        if (!category || !subcategory) {
          throw new Error('Invalid category or subcategory');
        }

        const data = await getCategoryPage(category, subcategory);
        if (!data) {
          throw new Error('Category page not found');
        }

        console.group('📦 Contentful Navigation Link Data');
        console.log('Category:', category);
        console.log('Subcategory:', subcategory);
        console.log('Title:', data.fields.title);
        console.log('Product Types:', {
          defined: Boolean(data.fields?.productType?.length),
          values: data.fields?.productType || [],
        });
        console.log('Raw Data:', data);
        console.groupEnd();

        setPageData(data);
      } catch (err) {
        console.error('Error fetching category page:', err);
        setError(err instanceof Error ? err.message : 'Failed to load category page');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPageData();
  }, [category, subcategory]);

  // Get collection handle from subcategory
  const getCollectionHandle = useCallback(() => {
    if (!pageData) return '';
    
    // Use the subcategory title as the collection handle
    // Convert to lowercase and replace spaces with hyphens
    return pageData.fields.title.toLowerCase().replace(/\s+/g, '-');
  }, [pageData]);

  // Products Query with collection handle
  const hasActiveFilters = selectedBrands.length > 0 || selectedPriceRanges.length > 0;
  
  // Fetch filters
  const [filtersResult] = useQuery({
    query: GET_COLLECTION_FILTERS_QUERY,
    variables: { 
      handle: getCollectionHandle()
    },
    pause: !pageData
  });

  // Fetch products with pagination
  const [productsResult] = useQuery({
    query: COLLECTION_PRODUCTS_QUERY,
    variables: {
      handle: getCollectionHandle(),
    first: hasActiveFilters ? 250 : PRODUCTS_PREFETCH_COUNT,
      after: hasActiveFilters ? null : (cursors[currentPage - 1] || null),
      filtersKey: `${selectedBrands.join(',')}-${selectedPriceRanges.join(',')}`
    },
    pause: !pageData
  });

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

  // Store cursor and accumulate products when we get results
  useEffect(() => {
    if (!productsResult.data?.collection?.products?.edges) return;
  
    const fetchedProducts = productsResult.data.collection.products.edges;
    
    setCursors(prev => ({
      ...prev,
      [currentPage]: productsResult.data.collection.products.pageInfo.endCursor
    }));
    
    if (currentPage === 1) {
      setAllProducts(fetchedProducts);
      setHasMore(productsResult.data.collection.products.pageInfo.hasNextPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setAllProducts(prev => {
        // When loading more, only add products that aren't already in the list
        const existingIds = new Set(prev.map(p => p.node.id));
        const newProducts = fetchedProducts.filter((p: { node: { id: string } }) => !existingIds.has(p.node.id));
        return [...prev, ...newProducts];
      });
    }
    
    setHasMore(productsResult.data.collection.products.pageInfo.hasNextPage);
    setIsLoadingMore(false);
  }, [productsResult.data, currentPage]);

  const { availableBrands, priceRanges } = processFilters();
  const products = processedProducts;
  const pageInfo = productsResult.data?.collection?.products?.pageInfo;

  // Add page view tracking
  React.useEffect(() => {
    if (pageData && !isLoading) {
      trackPageView({
        pageType: 'subcategory',
        category,
        subcategory,
        title: pageData.fields.title
      });
    }
  }, [pageData, isLoading, category, subcategory]);

  // Add product list view tracking
  React.useEffect(() => {
    if (products.length > 0) {
      trackProductListView(
        products.map((product: ProcessedProduct) => ({
          id: product.id,
          title: product.title,
          price: parseFloat(product.priceRange.minVariantPrice.amount),
          brand: product.vendor,
          category: product.productType
        })),
        `${category}/${subcategory}`
      );
    }
  }, [products, category, subcategory]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    // Scroll to top of the page smoothly
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    // Track pagination click
    trackPaginationClick(page, { category, subcategory });
  }, [category, subcategory]);

  // Handle filter changes
  const handleFilterChange = (type: 'price' | 'brand' | 'type', value: string) => {
    // Clear any existing timeout
    if (filterTimeoutId) {
      clearTimeout(filterTimeoutId);
    }

    // Reset states
    setCurrentPage(1);
    setCursors({});
    setHasMore(true);
    setAllProducts([]);
    setIsLoadingMore(false);
    setIsFiltering(true);
    setIsLoadingWithDelay(true);

    // Set new timeout
    const timeout = setTimeout(() => {
      setIsLoadingWithDelay(false);
    }, 1000);
    setFilterTimeoutId(timeout);

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
      trackFilterUse(type, value, { category, subcategory });
    }
  };

  // Handle loading more products
  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    
    if (!productsResult.data?.collection?.products?.pageInfo?.hasNextPage) {
      setHasMore(false);
      return;
    }
    
    setIsLoadingMore(true);
    setIsLoadingWithDelay(true);
    setCurrentPage(prev => prev + 1);

    // Set a minimum loading duration of 1 second
    const timeout = setTimeout(() => {
      setIsLoadingWithDelay(false);
    }, 1000);
    setFilterTimeoutId(timeout);
  }, [isLoadingMore, hasMore, productsResult.data]);

  // Combined effect for managing loading states
  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (filterTimeoutId) {
        clearTimeout(filterTimeoutId);
      }
    };
  }, [filterTimeoutId]);

  // Reset loading states when products are fetched
  useEffect(() => {
    if (!productsResult.fetching) {
      if (isFiltering) {
        setIsFiltering(false);
        // Ensure loading delay is reset if products are fetched before timeout
        if (filterTimeoutId) {
          clearTimeout(filterTimeoutId);
          setIsLoadingWithDelay(false);
        }
      }
      if (isLoadingMore) {
        setIsLoadingMore(false);
        // Don't reset isLoadingWithDelay here - let the timeout handle it
      }
    }
  }, [productsResult.fetching, isFiltering, isLoadingMore, filterTimeoutId]);

  const renderProductGrid = () => {
    const isLoading = isLoadingWithDelay;
    const currentProducts = processedProducts.slice(0, PRODUCTS_PER_PAGE * currentPage);
    const previousProducts = processedProducts.slice(0, PRODUCTS_PER_PAGE * (currentPage - 1));

    // If we're on the first page and have no products yet, show loading skeleton
    if (currentPage === 1 && currentProducts.length === 0) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {[...Array(PRODUCTS_PER_PAGE)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden h-[400px]">
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
      <div className="min-h-[800px]">
        {/* Show all current products when not loading */}
        {!isLoading && (
          <SearchResults
            products={currentProducts}
            isLoading={false}
            pageContext={{
              pageType: 'subcategory',
              pageName: pageData?.fields.title || '',
              category: category,
              subcategory: subcategory
            }}
          />
        )}

        {/* When loading, show previous products and skeleton for new ones */}
        {isLoading && (
          <>
            <SearchResults
              products={previousProducts}
              isLoading={false}
              pageContext={{
                pageType: 'subcategory',
                pageName: pageData?.fields.title || '',
                category: category,
                subcategory: subcategory
              }}
            />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mt-8">
              {[...Array(PRODUCTS_PER_PAGE)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden h-[400px]">
                  <div className="aspect-square bg-gray-200 animate-pulse" />
                  <div className="p-4">
                    <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse mb-4" />
                    <div className="h-8 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        
        {(hasMore && processedProducts.length > PRODUCTS_PER_PAGE * currentPage) && (
          <div className="mt-8">
            <Pagination
              hasMore={hasMore}
              onLoadMore={handleLoadMore}
              isLoading={isLoading}
            />
          </div>
        )}
      </div>
    );
  };

  if (isLoading || productsResult.fetching) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Breadcrumbs
              items={[
                {
                  label: currentCategory?.mainCategory || '',
                  href: `/categorie/${category}`
                },
                {
                  label: pageData?.fields.title || ''
                }
              ]}
            />
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {pageData?.fields.title || ''}
            </h1>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters - Desktop */}
            <aside className="hidden lg:block lg:w-72 flex-shrink-0">
              <SearchFilters
                availableBrands={availableBrands}
                selectedBrands={selectedBrands}
                selectedPriceRanges={selectedPriceRanges}
                onFilterChange={handleFilterChange}
                onClearFilters={() => {
                  setSelectedPriceRanges([]);
                  setSelectedBrands([]);
                  setCurrentPage(1);
                  setCursors({});
                  setHasMore(true);
                  setAllProducts([]);
                  setIsLoadingMore(false);
                  setSearchParams(new URLSearchParams());
                }}
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
                onRemoveFilter={(type, value) => {
                  handleFilterChange(type, value);
                }}
              />
              
              {renderProductGrid()}
            </main>
          </div>
        </div>

        {/* Mobile Filter Menu */}
        <MobileFilterMenu
          isOpen={isFilterMenuOpen}
          onClose={() => setIsFilterMenuOpen(false)}
          availableBrands={availableBrands}
          selectedBrands={selectedBrands}
          selectedPriceRanges={selectedPriceRanges}
          onFilterChange={handleFilterChange}
          onClearFilters={() => {
            setSelectedPriceRanges([]);
            setSelectedBrands([]);
            setCurrentPage(1);
            setCursors({});
            setHasMore(true);
            setAllProducts([]);
            setIsLoadingMore(false);
            setSearchParams(new URLSearchParams());
          }}
        />

        <BackToTop />
      </div>
    );
  }

  if (error || productsResult.error || !pageData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Pagina niet gevonden
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

  const canonicalUrl = `https://teddyshondenshop.nl/categorie/${category}/${subcategory}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title={pageData.fields.seoTitle || pageData.fields.title}
        description={pageData.fields.seoDescription || pageData.fields.description || `${pageData.fields.title} voor honden bij Teddy's Hondenshop`}
        canonical={canonicalUrl}
        type="website"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Breadcrumbs
            items={[
              {
                label: currentCategory?.mainCategory || '',
                href: `/categorie/${category}`
              },
              {
                label: pageData.fields.title
              }
            ]}
          />
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {pageData.fields.title}
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters - Desktop */}
          <aside className="hidden lg:block lg:w-72 flex-shrink-0">
            <SearchFilters
              availableBrands={availableBrands}
              selectedBrands={selectedBrands}
              selectedPriceRanges={selectedPriceRanges}
              onFilterChange={handleFilterChange}
              onClearFilters={() => {
                setSelectedPriceRanges([]);
                setSelectedBrands([]);
                setCurrentPage(1);
                setCursors({});
                setHasMore(true);
                setAllProducts([]);
                setIsLoadingMore(false);
                setSearchParams(new URLSearchParams());
              }}
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
              onRemoveFilter={(type, value) => {
                handleFilterChange(type, value);
              }}
            />
            
            {renderProductGrid()}

            {/* Description Section */}
            {pageData.fields.seoDescription && (
              <div className="mt-16 bg-white rounded-xl p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {pageData.fields.seoTitle || pageData.fields.title}
                </h2>
                <div className="prose prose-blue max-w-none">
                  <p className="text-gray-600">{pageData.fields.seoDescription}</p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Filters - Mobile */}
      <MobileFilterMenu
        isOpen={isFilterMenuOpen}
        onClose={() => setIsFilterMenuOpen(false)}
        availableBrands={availableBrands}
        selectedBrands={selectedBrands}
        selectedPriceRanges={selectedPriceRanges}
        onFilterChange={handleFilterChange}
        onClearFilters={() => {
          setSelectedPriceRanges([]);
          setSelectedBrands([]);
          setCurrentPage(1);
          setCursors({});
          setHasMore(true);
          setAllProducts([]);
          setIsLoadingMore(false);
          setSearchParams(new URLSearchParams());
        }}
      />

      <BackToTop />
    </div>
  );
}