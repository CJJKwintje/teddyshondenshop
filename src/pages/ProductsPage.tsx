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

const PRODUCTS_QUERY = gql`
  query GetProducts($cursor: String) {
    products(first: 20, after: $cursor) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          title
          productType
          tags
          vendor
          variants(first: 250) {
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
      }
    }
  }
`;

export default function ProductsPage() {
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = React.useRef<HTMLDivElement>(null);

  // Query products
  const [result, reexecuteQuery] = useQuery({
    query: PRODUCTS_QUERY,
    variables: { cursor }
  });

  // Process query results
  useEffect(() => {
    if (result.data?.products) {
      const newProducts = result.data.products.edges.map(({ node }: any) => {
        const variants = node.variants.edges;
        const firstVariant = variants[0]?.node;
        const hasAvailableVariant = variants.some(
          ({ node: variant }: any) => variant.quantityAvailable > 0
        );
        const compareAtPrice = firstVariant?.compareAtPrice
          ? parseFloat(firstVariant.compareAtPrice.amount)
          : undefined;

        return {
          ...node,
          hasAvailableVariant,
          variantsCount: variants.length,
          firstVariantId: firstVariant?.id,
          compareAtPrice,
          formattedPrice: formatPrice(parseFloat(node.priceRange.minVariantPrice.amount)),
          formattedCompareAtPrice: compareAtPrice ? formatPrice(compareAtPrice) : undefined
        };
      });

      // Filter products based on selected filters
      const filteredProducts = newProducts.filter((product) => {
        const price = parseFloat(product.priceRange.minVariantPrice.amount);
        const matchesPrice =
          selectedPriceRanges.length === 0 ||
          selectedPriceRanges.some((range) => {
            const [min, max] = range.split('-').map(parseFloat);
            return price >= min && price <= max;
          });

        const matchesBrands =
          selectedBrands.length === 0 ||
          selectedBrands.includes(product.vendor);

        return matchesPrice && matchesBrands;
      });

      setProducts(prev => cursor ? [...prev, ...filteredProducts] : filteredProducts);
      setHasNextPage(result.data.products.pageInfo.hasNextPage);
      setCursor(result.data.products.pageInfo.endCursor);
      setIsLoadingMore(false);
    }
  }, [result.data, cursor]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isLoadingMore && !result.fetching) {
          setIsLoadingMore(true);
          reexecuteQuery({ requestPolicy: 'network-only' });
        }
      },
      { threshold: 1.0 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isLoadingMore, result.fetching]);

  // Handle filter changes
  const handleFilterChange = (type: 'price' | 'brand', value: string) => {
    // Reset pagination state
    setProducts([]);
    setCursor(null);
    setHasNextPage(true);

    // Update filters
    if (type === 'price') {
      setSelectedPriceRanges(prev =>
        prev.includes(value) ? prev.filter(range => range !== value) : [value]
      );
    } else if (type === 'brand') {
      setSelectedBrands(prev =>
        prev.includes(value) ? prev.filter(brand => brand !== value) : [...prev, value]
      );
    }

    // Refetch products
    reexecuteQuery({ requestPolicy: 'network-only' });
  };

  const clearFilters = () => {
    setSelectedPriceRanges([]);
    setSelectedBrands([]);
    setProducts([]);
    setCursor(null);
    setHasNextPage(true);
    reexecuteQuery({ requestPolicy: 'network-only' });
  };

  // Get unique brands from products
  const availableBrands = Array.from(new Set(
    products.map(product => product.vendor).filter(Boolean)
  ));

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
                {products.length} producten
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
              isLoading={result.fetching && products.length === 0}
              error={result.error?.message}
              products={products}
              loadMoreRef={loadMoreRef}
              isFetching={isLoadingMore}
            />
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