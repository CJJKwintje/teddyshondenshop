import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from 'urql';
import { gql } from 'urql';
import { Search, SlidersHorizontal, Loader2 } from 'lucide-react';
import SearchFilters from '../components/SearchFilters';
import SearchResults from '../components/SearchResults';
import MobileFilterMenu from '../components/MobileFilterMenu';
import BackToTop from '../components/BackToTop';
import SEO from '../components/SEO';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { formatPrice } from '../utils/formatPrice';

const SEARCH_PRODUCTS_QUERY = gql`
  query SearchProducts($query: String!) {
    products(query: $query, first: 50) {
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

export default function SearchPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const searchQuery = params.get('query') || '';
  
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [displayedProducts, setDisplayedProducts] = useState<any[]>([]);
  const PRODUCTS_PER_PAGE = 16;

  const buildQuery = useCallback(() => {
    return `title:*${searchQuery}* OR tag:*${searchQuery}*`;
  }, [searchQuery]);

  const [result] = useQuery({
    query: SEARCH_PRODUCTS_QUERY,
    variables: { query: buildQuery() },
  });

  const loadMoreProducts = useCallback(() => {
    const currentLength = displayedProducts.length;
    const nextProducts = filteredProducts.slice(
      currentLength,
      currentLength + PRODUCTS_PER_PAGE
    );
    
    if (nextProducts.length > 0) {
      setDisplayedProducts(prev => [...prev, ...nextProducts]);
      setIsFetching(false);
    }
  }, [filteredProducts, displayedProducts.length]);

  const { loadMoreRef, isFetching, setIsFetching } = useInfiniteScroll(loadMoreProducts);

  useEffect(() => {
    if (result.data) {
      const products = result.data.products.edges.map(({ node }: any) => {
        const variants = node.variants.edges;
        const hasAvailableVariant = variants.some(
          ({ node: variant }: any) => variant.quantityAvailable > 0
        );
        const firstVariant = variants[0]?.node;
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
      
      // Extract unique tags and brands
      const tags = new Set<string>();
      const brands = new Set<string>();
      products.forEach((product: any) => {
        product.tags.forEach((tag: string) => tags.add(tag));
        if (product.vendor) brands.add(product.vendor);
      });
      setAvailableTags(Array.from(tags));
      setAvailableBrands(Array.from(brands));

      // Filter products based on selected filters
      const filtered = products.filter((product: any) => {
        const price = parseFloat(product.priceRange.minVariantPrice.amount);

        const matchesPrice =
          selectedPriceRanges.length === 0 ||
          selectedPriceRanges.some((range) => {
            const [min, max] = range.split('-').map(parseFloat);
            return price >= min && price <= max;
          });

        const matchesTags =
          selectedTags.length === 0 ||
          selectedTags.some((tag) => product.tags.includes(tag));

        const matchesBrands =
          selectedBrands.length === 0 ||
          selectedBrands.includes(product.vendor);

        return matchesPrice && matchesTags && matchesBrands;
      });

      setFilteredProducts(filtered);
      setDisplayedProducts(filtered.slice(0, PRODUCTS_PER_PAGE));
    }
  }, [result.data, selectedPriceRanges, selectedTags, selectedBrands]);

  const handleFilterChange = (type: 'price' | 'tags' | 'brand', value: string) => {
    switch (type) {
      case 'price':
        setSelectedPriceRanges((prev) =>
          prev.includes(value)
            ? prev.filter((range) => range !== value)
            : [value]
        );
        break;
      case 'tags':
        setSelectedTags((prev) =>
          prev.includes(value)
            ? prev.filter((tag) => tag !== value)
            : [...prev, value]
        );
        break;
      case 'brand':
        setSelectedBrands((prev) =>
          prev.includes(value)
            ? prev.filter((brand) => brand !== value)
            : [...prev, value]
        );
        break;
    }
  };

  const clearFilters = () => {
    setSelectedPriceRanges([]);
    setSelectedTags([]);
    setSelectedBrands([]);
  };

  const canonicalUrl = `https://teddyshondenshop.nl/search?query=${encodeURIComponent(searchQuery)}`;
  
  const getMetaDescription = () => {
    if (result.fetching) {
      return 'Zoeken naar producten...';
    }
    
    if (result.error) {
      return 'Er is een fout opgetreden bij het zoeken.';
    }
    
    if (filteredProducts.length === 0) {
      return `Geen producten gevonden voor "${searchQuery}". Probeer een andere zoekterm.`;
    }
    
    return `${filteredProducts.length} producten gevonden voor "${searchQuery}". Bekijk ons assortiment en bestel direct.`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title={`Zoekresultaten voor "${searchQuery}"`}
        description={getMetaDescription()}
        canonical={canonicalUrl}
        type="website"
        noindex={true}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 mb-8">
          <Search className="w-6 h-6 text-gray-400" />
          <h1 className="text-2xl font-bold text-gray-900">
            Zoekresultaten voor "{searchQuery}"
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="hidden lg:block lg:w-72 flex-shrink-0">
            <SearchFilters
              availableTags={availableTags}
              availableBrands={availableBrands}
              selectedTags={selectedTags}
              selectedBrands={selectedBrands}
              selectedPriceRanges={selectedPriceRanges}
              onFilterChange={handleFilterChange}
              onClearFilters={clearFilters}
            />
          </aside>

          <main className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm text-gray-500">
                {filteredProducts.length} producten gevonden
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
              isLoading={result.fetching}
              error={result.error?.message}
              products={displayedProducts}
              searchQuery={searchQuery}
            />

            {displayedProducts.length < filteredProducts.length && (
              <div
                ref={loadMoreRef}
                className="flex justify-center items-center py-8"
              >
                {isFetching ? (
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                ) : (
                  <div className="h-8" />
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      <MobileFilterMenu
        isOpen={isFilterMenuOpen}
        onClose={() => setIsFilterMenuOpen(false)}
        availableTags={availableTags}
        availableBrands={availableBrands}
        selectedTags={selectedTags}
        selectedBrands={selectedBrands}
        selectedPriceRanges={selectedPriceRanges}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
      />

      <BackToTop />
    </div>
  );
}