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

const PRODUCTS_PER_PAGE = 12;

// Category mapping for Shopify queries
const CATEGORY_MAPPING: Record<string, Record<string, string[]>> = {
  'hondenvoeding': {
    'diepvriesvoer': ['productType:"DIEPVRIESVOER"'],
    'droogvoer': ['productType:"DROOGVOER"'],
    'natvoer': ['productType:"NATVOER"'],
    'voer-drinkbakken': ['productType:"VOERBAK"', 'productType:"DRINKBAK"']
  },
  'hondensnacks': {
    'snacks': ['productType:"SNACKS"'],
    'snacks-gedroogd': ['productType:"SNACKS GEDROOGD"'],
    'snacks-gist': ['productType:"SNACKS GIST"'],
    'snacks-hard': ['productType:"SNACKS HARD"'],
    'snacks-kauw': ['productType:"SNACKS KAUW"'],
    'snacks-koek': ['productType:"SNACKS KOEK"'],
    'snacks-zacht': ['productType:"SNACKS ZACHT"']
  },
  'op-pad': {
    'halsbanden-met-lichtjes': ['productType:"HALSBANDEN MET LICHTJES"'],
    'halsbanden-lijnen-kunstleer': ['productType:"HALSBANDEN/LIJNEN KUNSTLEER"'],
    'halsbanden-lijnen-leer': ['productType:"HALSBANDEN/LIJNEN LEER"'],
    'halsbanden-lijnen-nylon': ['productType:"HALSBANDEN/LIJNEN NYLON"'],
    'halsbanden-lijnen-overig': ['productType:"HALSBANDEN/LIJNEN OVERIG"'],
    'hondentas': ['productType:"HONDENTAS"'],
    'outdoor': ['productType:"OUTDOOR"'],
    'vervoerbox': ['productType:"VERVOERBOX"']
  },
  'slapen': {
    'bedden-manden-kussens': ['productType:"BEDDEN/MANDEN/KUSSENS"']
  },
  'hondenkleding': {
    'kleding': ['productType:"KLEDING"']
  },
  'hondenspeelgoed': {
    'speelgoed': ['productType:"SPEELGOED"']
  }
};

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

const PRODUCT_QUERY = gql`
  query GetProducts($query: String!, $first: Int, $after: String) {
    products(first: $first, query: $query, after: $after) {
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
  ${PRODUCT_CARD_FRAGMENT}
`;

const GET_FILTERS_QUERY = gql`
  query GetFiltersAndCounts($query: String!) {
    products(first: 250, query: $query) {
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
`;

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
    const pageParam = searchParams.get('page');
    
    if (brandsParam) {
      setSelectedBrands(brandsParam.split(','));
    }
    
    if (priceParam) {
      setSelectedPriceRanges([priceParam]);
    }
    
    if (pageParam) {
      const page = parseInt(pageParam, 10);
      if (!isNaN(page) && page > 0) {
        setCurrentPage(page);
      }
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
    
    if (currentPage > 1) {
      params.set('page', currentPage.toString());
    }
    
    setSearchParams(params);
  }, [selectedBrands, selectedPriceRanges, currentPage, setSearchParams]);

  // Update URL when filters or page changes
  useEffect(() => {
    updateUrlParams();
  }, [selectedBrands, selectedPriceRanges, currentPage, updateUrlParams]);

  // Find the current category
  const currentCategory = categories.find(cat => cat.slug === category);

  // Get all subcategories for this category
  const getAllSubcategories = () => {
    if (!currentCategory) return [] as ExtendedNavigationLink[];
    return (currentCategory.link || []) as ExtendedNavigationLink[];
  };

  const subcategories = getAllSubcategories();

  // Build query from category mapping
  const buildProductQuery = useCallback(() => {
    if (!category) return '';
    
    console.log('Building query for category:', category);
    
    // Get the mapping for the current main category
    const categoryMap = CATEGORY_MAPPING[category.toLowerCase()];
    if (!categoryMap) {
      console.warn(`No category mapping found for: ${category}`);
      return '';
    }

    // Get all product type queries for this category
    const allQueries = Object.values(categoryMap).flat();
    console.log('All product type queries:', allQueries);
    
    // Create a strict query that only matches exact product types
    const productTypes = allQueries.map(query => query.split(':')[1].replace(/"/g, '')); // Extract just the type names
    const productTypeQuery = productTypes.map(type => `product_type:${type}`).join(' OR ');
    
    // Build the complete query with filters
    const queries: string[] = [];
    
    // Add product type filter
    queries.push(`(${productTypeQuery})`);
    
    // Add brand filter
    if (selectedBrands.length > 0) {
      const brandQuery = selectedBrands
        .map(brand => `(vendor:${brand})`)
        .join(' OR ');
      queries.push(`(${brandQuery})`);
    }
    
    // Add price filter
    if (selectedPriceRanges.length > 0) {
      const priceQueries = selectedPriceRanges.map(range => {
        const [min, max] = range.split('-').map(parseFloat);
        return `(variants.price:>=${min} AND variants.price:<=${max})`;
      });
      queries.push(`(${priceQueries.join(' OR ')})`);
    }
    
    const finalQuery = queries.join(' AND ');
    console.log('Final Shopify query:', finalQuery);
    
    return finalQuery;
  }, [category, selectedBrands, selectedPriceRanges]);

  // Products Query with dynamic query string
  const [result] = useQuery({ 
    query: PRODUCT_QUERY,
    variables: {
      query: buildProductQuery(),
      first: PRODUCTS_PER_PAGE,
      after: cursors[currentPage - 1] || null
    },
    pause: !currentCategory // Pause the query until we have the category data
  });
  const { data, fetching: productsFetching, error: productsError } = result;

  // Fetch filters
  const [filtersResult] = useQuery({
    query: GET_FILTERS_QUERY,
    variables: {
      query: buildProductQuery().split(' AND ')[0] // Only use the product type filter to get all brands and prices
    },
    pause: !currentCategory
  });

  // Store cursor for next page when we get results
  useEffect(() => {
    if (data?.products?.pageInfo?.hasNextPage) {
      setCursors(prev => ({
        ...prev,
        [currentPage]: data.products.pageInfo.endCursor
      }));
    }
  }, [data, currentPage]);

  // Process available filters from initial query
  const processFilters = useCallback(() => {
    if (!filtersResult.data?.products?.edges) return {
      availableBrands: [],
      priceRanges: []
    };

    const products = filtersResult.data.products.edges;
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

  // Log the raw query and response
  React.useEffect(() => {
    if (data) {
      console.group('Shopify Query Details');
      console.log('Raw query sent to Shopify:', buildProductQuery());
      console.log('Raw Shopify response:', data);
      console.log('Product types in response:', data.products.edges.map(({ node }: any) => node.productType));
      console.groupEnd();
    }
  }, [data, buildProductQuery]);

  // Process products
  const processedProducts = useMemo(() => {
    if (!data?.products?.edges) return [];

    console.group('Processed Products');
    console.log('Number of products returned:', data.products.edges.length);
    console.log('Products by type:', data.products.edges.reduce((acc: any, { node }: any) => {
      acc[node.productType] = (acc[node.productType] || 0) + 1;
      return acc;
    }, {}));
    console.groupEnd();

    return data.products.edges.map(({ node }: any) => {
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
  }, [data]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    // Scroll to top of the page smoothly
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  // Filter handlers
  const handleFilterChange = (type: 'price' | 'brand' | 'type', value: string) => {
    setCurrentPage(1);
    setCursors({});

    if (type === 'price') {
      setSelectedPriceRanges(prev =>
        prev.includes(value) ? prev.filter(range => range !== value) : [value]
      );
    } else if (type === 'brand') {
      setSelectedBrands(prev =>
        prev.includes(value) ? prev.filter(brand => brand !== value) : [...prev, value]
      );
    }
  };

  const clearFilters = () => {
    setSelectedPriceRanges([]);
    setSelectedBrands([]);
    setCurrentPage(1);
    setCursors({});
    // Clear URL parameters
    setSearchParams({});
  };

  const handleRemoveFilter = (type: 'price' | 'brand', value: string) => {
    setCurrentPage(1);
    setCursors({});

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
    
    if (currentPage > 1) {
      params.set('page', currentPage.toString());
    }
    
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }, [selectedBrands, selectedPriceRanges, currentPage]);

  if (isLoading || isNavLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

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
              
              {productsFetching ? (
                <div className="flex justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : productsError ? (
                <div className="text-center text-red-600">
                  Er is een fout opgetreden bij het laden van de producten.
                </div>
              ) : (
                <>
                  <SearchResults
                    products={processedProducts}
                    isLoading={false}
                    pageContext={{
                      pageType: 'category',
                      pageName: currentCategory.mainCategory,
                      category: category
                    }}
                  />
                  
                  {data?.products?.pageInfo?.hasNextPage && (
                    <div className="mt-8">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={currentPage + (data.products.pageInfo.hasNextPage ? 1 : 0)}
                        onPageChange={handlePageChange}
                      />
                    </div>
                  )}
                </>
              )}
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