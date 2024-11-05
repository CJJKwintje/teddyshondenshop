import React, { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from 'urql';
import { gql } from 'urql';
import { Search } from 'lucide-react';
import SearchFilters from '../components/SearchFilters';
import SearchResults from '../components/SearchResults';
import SEO from '../components/SEO';

const SEARCH_PRODUCTS_QUERY = gql`
  query SearchProducts($query: String!) {
    products(query: $query, first: 50) {
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

export default function SearchPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const searchQuery = params.get('query') || '';
  
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);

  const buildQuery = useCallback(() => {
    return `title:*${searchQuery}* OR tag:*${searchQuery}*`;
  }, [searchQuery]);

  const [result] = useQuery({
    query: SEARCH_PRODUCTS_QUERY,
    variables: { query: buildQuery() },
  });

  useEffect(() => {
    if (result.data) {
      const products = result.data.products.edges.map(({ node }: any) => node);
      
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
  }, [result.data, selectedPriceRanges, selectedTags]);

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
          <aside className="lg:w-72 flex-shrink-0">
            <div className="sticky top-8">
              <SearchFilters
                availableTags={availableTags}
                selectedTags={selectedTags}
                selectedPriceRanges={selectedPriceRanges}
                onFilterChange={handleFilterChange}
                onClearFilters={clearFilters}
              />
            </div>
          </aside>

          <main className="flex-1">
            <div className="mb-4 text-sm text-gray-500">
              {filteredProducts.length} producten gevonden
            </div>
            
            <SearchResults
              isLoading={result.fetching}
              error={result.error?.message}
              products={filteredProducts}
              searchQuery={searchQuery}
            />
          </main>
        </div>
      </div>
    </div>
  );
}