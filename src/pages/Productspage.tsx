import React, { useState, useEffect } from 'react';
import { useQuery } from 'urql';
import { gql } from 'urql';
import { Loader2, SlidersHorizontal } from 'lucide-react';
import SearchFilters from '../components/SearchFilters';
import SearchResults from '../components/SearchResults';
import MobileFilterMenu from '../components/MobileFilterMenu';
import SEO from '../components/SEO';

const PRODUCTS_QUERY = gql`
  query GetAllProducts {
    products(first: 50) {
      edges {
        node {
          id
          title
          productType
          tags
          variants(first: 1) {
            edges {
              node {
                id
                price {
                  amount
                  currencyCode
                }
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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);

  const [result] = useQuery({ query: PRODUCTS_QUERY });
  const { data, fetching, error } = result;

  useEffect(() => {
    if (data?.products?.edges) {
      const products = data.products.edges.map(({ node }: any) => node);

      // Extract unique tags
      const tags = new Set<string>();
      products.forEach((product: any) => {
        product.tags.forEach((tag: string) => tags.add(tag));
      });
      setAvailableTags(Array.from(tags));

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

        return matchesPrice && matchesTags;
      });

      setFilteredProducts(filtered);
    }
  }, [data, selectedPriceRanges, selectedTags]);

  const handleFilterChange = (type: 'price' | 'tags', value: string) => {
    if (type === 'price') {
      setSelectedPriceRanges((prev) =>
        prev.includes(value)
          ? prev.filter((range) => range !== value)
          : [...prev, value]
      );
    } else {
      setSelectedTags((prev) =>
        prev.includes(value)
          ? prev.filter((tag) => tag !== value)
          : [...prev, value]
      );
    }
  };

  const clearFilters = () => {
    setSelectedPriceRanges([]);
    setSelectedTags([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title="Producten"
        description="Ontdek ons complete assortiment hondenproducten. Van voeding tot speelgoed, alles voor jouw trouwe viervoeter."
        canonical="https://teddyshondenshop.nl/producten"
        type="website"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Alle producten</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Filters */}
          <aside className="hidden lg:block lg:w-72 flex-shrink-0">
            <SearchFilters
              availableTags={availableTags}
              selectedTags={selectedTags}
              selectedPriceRanges={selectedPriceRanges}
              onFilterChange={handleFilterChange}
              onClearFilters={clearFilters}
            />
          </aside>

          <main className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm text-gray-500">
                {filteredProducts.length} producten
              </div>
              
              {/* Mobile Filter Button */}
              <button
                onClick={() => setIsFilterMenuOpen(true)}
                className="lg:hidden inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </button>
            </div>

            <SearchResults
              isLoading={fetching}
              error={error?.message}
              products={filteredProducts}
              searchQuery=""
            />
          </main>
        </div>
      </div>

      {/* Mobile Filter Menu */}
      <MobileFilterMenu
        isOpen={isFilterMenuOpen}
        onClose={() => setIsFilterMenuOpen(false)}
        availableTags={availableTags}
        selectedTags={selectedTags}
        selectedPriceRanges={selectedPriceRanges}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
      />
    </div>
  );
}