import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

const PRODUCTS_PER_PAGE = 25;

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

const FILTERED_PRODUCTS_QUERY = gql`
  query GetFilteredProducts(
    $query: String!
    $first: Int
    $after: String
  ) {
    products(
      first: $first
      query: $query
      after: $after
    ) {
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
  const { categories } = useNavigation();
  const currentCategory = categories.find(cat => cat.slug === category) as NavigationCategory | undefined;

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

  // Log navigation link data
  React.useEffect(() => {
    if (pageData) {
      console.group('🔗 Navigation Link Data');
      console.log('Has Product Type:', Boolean(pageData.fields.productType));
      if (pageData.fields.productType) {
        console.log('Product Type Values:', pageData.fields.productType);
      }
      console.log('Raw Data:', pageData);
      console.groupEnd();
    }
  }, [pageData]);

  const buildBaseQuery = React.useCallback(() => {
    if (!pageData) return '';

    // Log query building method
    console.group('🔍 Building Product Query');
    
    // Check if we have product types defined in Contentful
    if (pageData.fields.productType && pageData.fields.productType.length > 0) {
      let productTypeQuery = pageData.fields.productType
        .map(type => `(product_type:${type})`)
        .join(' OR ');
      
      // Add keywords filter if available
      if (pageData.fields.keywords && pageData.fields.keywords.length > 0) {
        const keywordQuery = pageData.fields.keywords
          .map(keyword => `title:*${keyword}*`)
          .join(' OR ');
        
        productTypeQuery = `(${productTypeQuery}) AND (${keywordQuery})`;
        
        console.log('Using Contentful Product Types and Keywords:', {
          types: pageData.fields.productType,
          keywords: pageData.fields.keywords,
          query: productTypeQuery
        });
      } else {
        console.log('Using Contentful Product Types:', {
          types: pageData.fields.productType,
          query: productTypeQuery
        });
      }
      
      console.groupEnd();
      return productTypeQuery;
    }

    // Get parent category's product types from navigation data
    const parentCategory = currentCategory?.productTypes || [];
    
    // Build query combining search term with parent category product types
    if (parentCategory.length > 0) {
      let productTypeQuery = parentCategory
        .map(type => `(product_type:${type})`)
        .join(' OR ');

      // Add keywords filter if available
      if (pageData.fields.keywords && pageData.fields.keywords.length > 0) {
        const keywordQuery = pageData.fields.keywords
          .map(keyword => `title:*${keyword}*`)
          .join(' OR ');
        
        productTypeQuery = `(${productTypeQuery}) AND (${keywordQuery})`;

        console.log('Using Fallback Search with Parent Category Types and Keywords:', {
          parentTypes: parentCategory,
          keywords: pageData.fields.keywords,
          query: productTypeQuery
        });
      } else {
        console.log('Using Fallback Search with Parent Category Types:', {
          parentTypes: parentCategory,
          query: productTypeQuery
        });
      }
      
      console.groupEnd();
      return productTypeQuery;
    }

    // Ultimate fallback: just search by title
    console.log('Using Title-Only Search:', {
      warning: 'No product types available'
    });
    console.groupEnd();
    return '';
  }, [pageData, currentCategory]);

  // Build filter query string based on selected filters
  const buildFilterQuery = useCallback(() => {
    console.group('🔧 Building Filter Query');
    const queries: string[] = [];
    const baseQuery = buildBaseQuery();
    
    console.log('Base Query:', {
      query: baseQuery,
      activeFilters: {
        brands: selectedBrands.length,
        priceRanges: selectedPriceRanges.length,
      },
    });
    
    if (baseQuery) queries.push(baseQuery);
    
    if (selectedBrands.length > 0) {
      const brandQuery = selectedBrands
        .map(brand => `(vendor:${brand})`)
        .join(' OR ');
      queries.push(`(${brandQuery})`);
      console.log('Brand Filters:', {
        selectedBrands,
        generatedQuery: brandQuery,
      });
    }
    
    if (selectedPriceRanges.length > 0) {
      const priceQueries = selectedPriceRanges.map(range => {
        const [min, max] = range.split('-').map(parseFloat);
        return `(variants.price:>=${min} AND variants.price:<=${max})`;
      });
      queries.push(`(${priceQueries.join(' OR ')})`);
      console.log('Price Filters:', {
        selectedRanges: selectedPriceRanges,
        generatedQueries: priceQueries,
      });
    }
    
    const finalQuery = queries.length > 0 ? queries.join(' AND ') : baseQuery;
    console.log('Final Combined Query:', finalQuery);
    console.groupEnd();
    return finalQuery;
  }, [selectedBrands, selectedPriceRanges, buildBaseQuery]);

  // Fetch filters
  const [filtersResult] = useQuery({
    query: GET_FILTERS_QUERY,
    variables: { 
      query: buildBaseQuery()
    },
    pause: !category || !subcategory
  });

  // Fetch products with pagination
  const [productsResult] = useQuery({
    query: FILTERED_PRODUCTS_QUERY,
    variables: {
      query: buildFilterQuery(),
      first: PRODUCTS_PER_PAGE,
      after: cursors[currentPage - 1] || null
    },
    pause: !category || !subcategory
  });

  // Store cursor for next page when we get results
  useEffect(() => {
    if (productsResult.data?.products?.pageInfo?.hasNextPage) {
      setCursors(prev => ({
        ...prev,
        [currentPage]: productsResult.data.products.pageInfo.endCursor
      }));
    }
  }, [productsResult.data, currentPage]);

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

  // Process products for display
  const processProducts = useCallback(() => {
    if (!productsResult.data?.products?.edges) return [];

    return productsResult.data.products.edges.map(({ node }: any) => {
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
  }, [productsResult.data]);

  const { availableBrands, priceRanges } = processFilters();
  const products = processProducts();
  const pageInfo = productsResult.data?.products?.pageInfo;

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

    // Track filter usage
    if (type !== 'type') {
      trackFilterUse(type, value, { category, subcategory });
    }
  };

  const clearFilters = () => {
    setSelectedPriceRanges([]);
    setSelectedBrands([]);
    setCurrentPage(1);
    setCursors({});
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

  // Add logging for query results
  React.useEffect(() => {
    if (productsResult.data) {
      const products = productsResult.data.products.edges as ProductEdge[];
      
      console.group('📊 Query Results');
      console.log('Query Configuration:', {
        usedQuery: buildFilterQuery(),
        totalProducts: products.length,
        currentPage,
        productsPerPage: PRODUCTS_PER_PAGE,
      });
      
      // Group products by type
      const productsByType = products.reduce((acc: Record<string, number>, { node }) => {
        const type = node.productType;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});
      
      console.log('Product Type Distribution:', productsByType);
      
      // Check if products match expected types
      if (pageData?.fields?.productType) {
        const expectedTypes = new Set(pageData.fields.productType);
        const actualTypes = new Set(products.map(({ node }) => node.productType));
        
        console.log('Product Type Verification:', {
          expectedTypes: Array.from(expectedTypes),
          actualTypes: Array.from(actualTypes),
          allExpectedTypesFound: Array.from(expectedTypes).every((type: string) => actualTypes.has(type)),
          unexpectedTypesFound: Array.from(actualTypes).filter((type: string) => !expectedTypes.has(type)),
        });
      }
      
      console.log('Raw Response:', productsResult.data);
      console.groupEnd();
    }
  }, [productsResult.data, buildFilterQuery, currentPage, pageData]);

  if (isLoading || productsResult.fetching) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-8" /> {/* Breadcrumb skeleton */}
          <div className="h-10 w-64 bg-gray-200 rounded animate-pulse mb-8" /> {/* Title skeleton */}

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters skeleton - Desktop */}
            <aside className="hidden lg:block lg:w-72 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="h-6 w-24 bg-gray-200 rounded animate-pulse mb-6" />
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-5 bg-gray-200 rounded animate-pulse" />
                  ))}
                </div>
              </div>
            </aside>

            {/* Main Content skeleton */}
            <main className="flex-1">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="aspect-square bg-gray-200 animate-pulse" /> {/* Image skeleton */}
                    <div className="p-4">
                      <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mb-2" /> {/* Title skeleton */}
                      <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse mb-4" /> {/* Price skeleton */}
                      <div className="h-8 bg-gray-200 rounded animate-pulse" /> {/* Button skeleton */}
                    </div>
                  </div>
                ))}
              </div>
            </main>
          </div>
        </div>
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
            
            <SearchResults
              isLoading={productsResult.fetching && products.length === 0}
              error={(productsResult.error as any)?.message || ''}
              products={products}
            />

            {pageInfo?.hasNextPage && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={currentPage + (pageInfo.hasNextPage ? 1 : 0)}
                  onPageChange={handlePageChange}
                />
              </div>
            )}

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
        onClearFilters={clearFilters}
      />

      <BackToTop />
    </div>
  );
}