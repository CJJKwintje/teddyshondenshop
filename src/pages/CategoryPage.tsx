import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'urql';
import { gql } from 'urql';
import { Loader2 } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import SearchFilters from '../components/SearchFilters';

const COLLECTION_QUERY = gql`
  query GetCollection($handle: String!) {
    collection(handle: $handle) {
      id
      title
      description
      descriptionHtml
      products(first: 50) {
        edges {
          node {
            id
            title
            productType
            tags
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
  }
`;

const categoryConfig = {
  hondenvoeding: {
    collectionHandle: 'Hondenvoeding',
  },
  hondenspeelgoed: {
    collectionHandle: 'hondenspeelgoed',
  },
  hondensnacks: {
    collectionHandle: 'hondensnacks',
  },
  hondentraining: {
    collectionHandle: 'hondentraining',
  }
};

const CategoryPage: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const categoryData = category ? categoryConfig[category as keyof typeof categoryConfig] : null;

  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);

  const [result] = useQuery({
    query: COLLECTION_QUERY,
    variables: { handle: categoryData?.collectionHandle },
    pause: !categoryData?.collectionHandle,
  });

  const { data, fetching, error } = result;

  useEffect(() => {
    if (data?.collection?.products?.edges) {
      const products = data.collection.products.edges.map(({ node }: any) => node);
      
      // Extract unique tags
      const tags = new Set<string>();
      products.forEach((product: any) => {
        product.tags.forEach((tag: string) => tags.add(tag));
      });
      setAvailableTags(Array.from(tags));

      // Filter products based on selected filters
      const filtered = products.filter((product: any) => {
        const price = parseFloat(product.priceRange.minVariantPrice.amount);
        
        const matchesPrice = selectedPriceRanges.length === 0 || selectedPriceRanges.some(range => {
          const [min, max] = range.split('-').map(parseFloat);
          return price >= min && price <= max;
        });

        const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => 
          product.tags.includes(tag)
        );

        return matchesPrice && matchesTags;
      });

      setFilteredProducts(filtered);
    }
  }, [data, selectedPriceRanges, selectedTags]);

  const handleFilterChange = (type: 'price' | 'tags', value: string) => {
    if (type === 'price') {
      setSelectedPriceRanges(prev =>
        prev.includes(value)
          ? prev.filter(range => range !== value)
          : [...prev, value]
      );
    } else {
      setSelectedTags(prev =>
        prev.includes(value)
          ? prev.filter(tag => tag !== value)
          : [...prev, value]
      );
    }
  };

  const clearFilters = () => {
    setSelectedPriceRanges([]);
    setSelectedTags([]);
  };

  if (!categoryData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Categorie niet gevonden
          </h1>
          <p className="text-gray-500">
            De opgevraagde categorie bestaat niet.
          </p>
        </div>
      </div>
    );
  }

  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Er is een fout opgetreden bij het laden van de categorie.
        </div>
      </div>
    );
  }

  const collection = data?.collection;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {collection?.title}
          </h1>
          {collection?.descriptionHtml ? (
            <div 
              className="prose prose-blue max-w-3xl text-gray-600"
              dangerouslySetInnerHTML={{ __html: collection.descriptionHtml }}
            />
          ) : collection?.description ? (
            <p className="text-gray-600 max-w-3xl">
              {collection.description}
            </p>
          ) : null}
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
            <div className="mb-6 text-sm text-gray-500">
              {filteredProducts.length} producten gevonden
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product: any) => (
                <ProductCard
                  key={product.id}
                  id={parseInt(product.id.split('/').pop())}
                  title={product.title}
                  category={product.productType || collection?.title}
                  imageUrl={product.images.edges[0]?.node.originalSrc}
                  altText={product.images.edges[0]?.node.altText}
                  price={parseFloat(product.priceRange.minVariantPrice.amount)}
                />
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Geen producten gevonden
                </h3>
                <p className="text-gray-500">
                  Probeer andere filters te gebruiken om producten te vinden.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;