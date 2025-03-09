import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from 'urql';
import { gql } from 'urql';
import { SlidersHorizontal, Loader2 } from 'lucide-react';
import SearchFilters from '../components/SearchFilters';
import SearchResults from '../components/SearchResults';
import MobileFilterMenu from '../components/MobileFilterMenu';
import BackToTop from '../components/BackToTop';
import SEO from '../components/SEO';
import { formatPrice } from '../utils/formatPrice';
import Pagination from '../components/Pagination';

const PRODUCTS_PER_PAGE = 25;

const PRODUCT_CARD_FRAGMENT = gql`
  fragment ProductCard on Product {
    id
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
  query GetFiltersAndCounts {
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

const ALL_PRODUCTS_QUERY = gql`
  query GetAllProducts {
    products(first: 250) {
      edges {
        node {
          id
        }
      }
    }
  }
`;

export default function ProductsPage() {
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [cursors, setCursors] = useState<Record<number, string>>({});
  
  // Fetch all products to get total count
  const [allProductsResult] = useQuery({
    query: ALL_PRODUCTS_QUERY
  });

  // Fetch filters
  const [filtersResult] = useQuery({
    query: GET_FILTERS_QUERY
  });

  // Build query string based on selected filters
  const buildFilterQuery = useCallback(() => {
    const queries: string[] = [];
    
    if (selectedBrands.length > 0) {
      const brandQuery = selectedBrands
        .map(brand => `(vendor:${brand})`)
        .join(' OR ');
      queries.push(`(${brandQuery})`);
    }
    
    if (selectedPriceRanges.length > 0) {
      const priceQueries = selectedPriceRanges.map(range => {
        const [min, max] = range.split('-').map(parseFloat);
        return `(variants.price:>=${min} AND variants.price:<=${max})`;
      });
      queries.push(`(${priceQueries.join(' OR ')})`);
    }
    
    const finalQuery = queries.length > 0 ? queries.join(' AND ') : '';
    console.log('Filter Query:', finalQuery); // Debug log
    return finalQuery;
  }, [selectedBrands, selectedPriceRanges]);

  // Fetch products with pagination
  const [productsResult] = useQuery({
    query: FILTERED_PRODUCTS_QUERY,
    variables: {
      query: buildFilterQuery(),
      first: PRODUCTS_PER_PAGE,
      after: cursors[currentPage - 1] || null
    }
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

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    // Scroll to top of the page smoothly
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

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
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title="Alle Producten"
        description="Bekijk ons complete assortiment hondenproducten. Van voeding tot speelgoed, alles voor jouw hond."
        canonical="https://teddyshondenshop.nl/producten"
        type="website"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">
          Alle Producten
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="hidden lg:block lg:w-72 flex-shrink-0">
            <SearchFilters
              availableBrands={availableBrands}
              selectedBrands={selectedBrands}
              selectedPriceRanges={selectedPriceRanges}
              onFilterChange={handleFilterChange}
              onClearFilters={clearFilters}
            />
          </aside>

          <main className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm text-gray-500">
                {products.length} producten op deze pagina
              </div>
              
              <button
                onClick={() => setIsFilterMenuOpen(true)}
                className="lg:hidden inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </button>
            </div>
            
            <SearchResults
              isLoading={productsResult.fetching && products.length === 0}
              error={productsResult.error?.message}
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
          </main>
        </div>
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