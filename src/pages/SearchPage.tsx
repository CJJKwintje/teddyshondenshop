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
import { formatPrice } from '../utils/formatPrice';
import Pagination from '../components/Pagination';

const SEARCH_PRODUCTS_QUERY = gql`
  query SearchProducts($query: String!, $first: Int!, $after: String) {
    products(query: $query, first: $first, after: $after) {
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

export default function SearchPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const searchQuery = params.get('query') || '';
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const PRODUCTS_PER_PAGE = 25;
  
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  
  // Calculate paginated products
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  const buildQuery = useCallback(() => {
    const terms = searchQuery.toLowerCase().split(' ').filter(Boolean);
    const searchTerm = terms[0];
    
    const knownBrands = ['renske', 'carnibest', 'farmfood', 'prins', 'nordic'];
    
    if (knownBrands.includes(searchTerm)) {
      return `(vendor:*${searchTerm}*)`;
    }
    
    return `(title:*${searchTerm}* OR productType:*${searchTerm}* OR tag:*${searchTerm}*)`;
  }, [searchQuery]);

  const [result] = useQuery({
    query: SEARCH_PRODUCTS_QUERY,
    variables: { 
      query: buildQuery(),
      first: 250,
      after: null
    },
  });

  // Reset pagination when search query or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedPriceRanges, selectedTags, selectedBrands]);

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

      // Extract unique tags and brands from all products
      const tags = new Set<string>();
      const brands = new Set<string>();
      products.forEach((product: any) => {
        product.tags.forEach((tag: string) => tags.add(tag));
        if (product.vendor) brands.add(product.vendor);
      });
      setAvailableTags(Array.from(tags));
      setAvailableBrands(Array.from(brands));

      // Apply filters
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
    }
  }, [result.data, selectedPriceRanges, selectedTags, selectedBrands]);

  const handleFilterChange = (type: 'price' | 'brand' | 'type', value: string) => {
    // Reset pagination when filters change
    setCurrentPage(1);

    switch (type) {
      case 'price':
        setSelectedPriceRanges((prev) =>
          prev.includes(value)
            ? prev.filter((range) => range !== value)
            : [value]
        );
        break;
      case 'brand':
        setSelectedBrands((prev) =>
          prev.includes(value)
            ? prev.filter((brand) => brand !== value)
            : [...prev, value]
        );
        break;
      case 'type':
        // Handle type filter the same as brand for backward compatibility
        setSelectedBrands((prev) =>
          prev.includes(value)
            ? prev.filter((brand) => brand !== value)
            : [...prev, value]
        );
        break;
    }
  };

  const clearFilters = () => {
    setCurrentPage(1);
    setEndCursor(null);
    setSelectedPriceRanges([]);
    setSelectedTags([]);
    setSelectedBrands([]);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
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
              products={paginatedProducts}
              searchQuery={searchQuery}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
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