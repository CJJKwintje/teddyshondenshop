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
import ActiveFilterTags from '../components/ActiveFilterTags';

const PRODUCTS_PER_PAGE = 12;
const PRODUCTS_PREFETCH_COUNT = 24;

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
          handle
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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [cursors, setCursors] = useState<Record<number, string>>({});
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Filter state
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  
  // Product state
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [displayedProducts, setDisplayedProducts] = useState<any[]>([]);
  
  // Determine if we're in filtered mode
  const isFiltered = selectedPriceRanges.length > 0 || selectedTags.length > 0 || selectedBrands.length > 0;

  const buildQuery = useCallback(() => {
    const terms = searchQuery.toLowerCase().split(' ').filter(Boolean);
    const knownBrands = ['renske', 'carnibest', 'farmfood', 'prins', 'nordic'];
    
    // If it's a known brand, search by vendor
    if (terms.some(term => knownBrands.includes(term))) {
      const brandTerm = terms.find(term => knownBrands.includes(term));
      return `vendor:${brandTerm}`;
    }
    
    // Build a more precise search query using all terms
    const searchConditions = terms.map(term => {
      // For single words, search in title, productType, and tags
      if (!term.includes('-')) {
        return `(title:*${term}* OR productType:*${term}* OR tag:*${term}*)`;
      }
      // For hyphenated terms or phrases, search more exactly
      return `(title:"${term}" OR productType:"${term}" OR tag:"${term}")`;
    });
    
    // Combine all conditions with AND to make search more specific
    return searchConditions.join(' AND');
  }, [searchQuery]);

  const [result] = useQuery({
    query: SEARCH_PRODUCTS_QUERY,
    variables: { 
      query: buildQuery(),
      first: isFiltered ? 250 : PRODUCTS_PREFETCH_COUNT,
      after: isFiltered ? null : (cursors[currentPage - 1] || null)
    },
    pause: false,
  });

  // Reset pagination when search query changes
  useEffect(() => {
    setCurrentPage(1);
    setCursors({});
    setHasMore(true);
    setAllProducts([]);
    setIsLoadingMore(false);
  }, [searchQuery]);

  // Store cursor and accumulate products when we get results
  useEffect(() => {
    if (!result.data?.products?.edges) return;
  
    const fetchedProducts = result.data.products.edges;
    
    // Store cursor for pagination
    setCursors(prev => ({
      ...prev,
      [currentPage]: result.data.products.pageInfo.endCursor
    }));
    
    // Handle product accumulation based on whether we're in filtered mode
    if (isFiltered) {
      // In filtered mode, we get all products at once
      setAllProducts(fetchedProducts);
    } else {
      // In unfiltered mode, we accumulate products
      if (currentPage === 1) {
        setAllProducts(fetchedProducts);
        setHasMore(result.data.products.pageInfo.hasNextPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setAllProducts(prev => {
          // When loading more, only add products that aren't already in the list
          const existingIds = new Set(prev.map(p => p.node.id));
          const newProducts = fetchedProducts.filter((p: { node: { id: string } }) => !existingIds.has(p.node.id));
          return [...prev, ...newProducts];
        });
      }
      
      setHasMore(result.data.products.pageInfo.hasNextPage);
    }
    
    setIsLoadingMore(false);
  }, [result.data, currentPage, isFiltered]);

  // Process products and apply filters
  useEffect(() => {
    if (!allProducts.length) {
      setFilteredProducts([]);
      setDisplayedProducts([]);
      return;
    }

    // Process products
    const processedProducts = allProducts.map(({ node }: any) => {
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
    processedProducts.forEach((product: any) => {
      product.tags.forEach((tag: string) => tags.add(tag));
      if (product.vendor) brands.add(product.vendor);
    });
    setAvailableTags(Array.from(tags));
    setAvailableBrands(Array.from(brands));

    // Apply filters
    const filtered = processedProducts.filter((product: any) => {
      const price = parseFloat(product.priceRange.minVariantPrice.amount);

      // Check if the product matches the selected price range
      const matchesPrice = selectedPriceRanges.length === 0 || 
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
    
    // Set displayed products based on pagination
    if (isFiltered) {
      // In filtered mode, show paginated products initially
      setDisplayedProducts(filtered.slice(0, PRODUCTS_PER_PAGE));
      // Set hasMore based on whether there are more products to show
      setHasMore(filtered.length > PRODUCTS_PER_PAGE);
    } else {
      // In unfiltered mode, show paginated products
      setDisplayedProducts(filtered.slice(0, PRODUCTS_PER_PAGE * currentPage));
    }
  }, [allProducts, selectedPriceRanges, selectedTags, selectedBrands, currentPage, isFiltered]);

  const handleFilterChange = (type: 'price' | 'brand' | 'type', value: string) => {
    // First update the filter state
    if (type === 'price') {
      // For price filters, we want to replace the current selection with the new one
      setSelectedPriceRanges([value]);
    } else if (type === 'brand') {
      setSelectedBrands(prev => {
        const newBrands = prev.includes(value) 
          ? prev.filter(brand => brand !== value)
          : [...prev, value];
        return newBrands;
      });
    } else if (type === 'type') {
      // Handle type filter the same as brand for backward compatibility
      setSelectedBrands(prev => {
        const newBrands = prev.includes(value) 
          ? prev.filter(brand => brand !== value)
          : [...prev, value];
        return newBrands;
      });
    }

    // Then reset pagination state
    setCurrentPage(1);
    setCursors({});
    setHasMore(true);
    setIsLoadingMore(false);
  };

  const clearFilters = () => {
    setCurrentPage(1);
    setCursors({});
    setHasMore(true);
    setAllProducts([]);
    setIsLoadingMore(false);
    setSelectedPriceRanges([]);
    setSelectedTags([]);
    setSelectedBrands([]);
  };

  const handleRemoveFilter = (type: 'price' | 'brand', value: string) => {
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

  // Handle loading more products
  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    
    if (isFiltered) {
      // In filtered mode, load more from the filtered products
      setDisplayedProducts(prev => {
        const currentCount = prev.length;
        const nextProducts = filteredProducts.slice(currentCount, currentCount + PRODUCTS_PER_PAGE);
        const newProducts = [...prev, ...nextProducts];
        
        // Update hasMore based on whether there are more products to show
        setHasMore(newProducts.length < filteredProducts.length);
        
        return newProducts;
      });
    } else {
      // In unfiltered mode, fetch more from the server
      if (!result.data?.products?.pageInfo?.hasNextPage) {
        setHasMore(false);
        return;
      }
      
      setIsLoadingMore(true);
      setCurrentPage(prev => prev + 1);
    }
  }, [isLoadingMore, hasMore, result.data, isFiltered, filteredProducts]);

  // Product grid skeleton loading (when fetching products)
  const renderProductGrid = () => {
    if (result.fetching) {
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
          products={displayedProducts}
          isLoading={false}
          searchQuery={searchQuery}
          pageContext={{
            pageType: 'search',
            pageName: 'Search Results',
            searchQuery
          }}
        />
        
        {hasMore && (
          <div className="mt-8">
            <Pagination
              hasMore={hasMore}
              onLoadMore={handleLoadMore}
              isLoading={isLoadingMore || result.fetching}
            />
          </div>
        )}
      </>
    );
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