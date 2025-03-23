import React from 'react';
import { Loader2 } from 'lucide-react';
import ProductCard from './ProductCard';

interface SearchResultsProps {
  isLoading?: boolean;
  error?: string;
  products: any[];
  searchQuery?: string;
  collection?: any;
  filteredProducts?: any[];
  loadMoreRef?: React.RefObject<HTMLDivElement>;
  isFetching?: boolean;
}

export default function SearchResults({
  isLoading,
  error,
  products,
  searchQuery,
  collection,
  filteredProducts = [],
  loadMoreRef,
  isFetching,
}: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {searchQuery
            ? `Geen producten gevonden voor "${searchQuery}"`
            : 'Geen producten gevonden'}
        </h3>
        <p className="text-gray-500">
          Probeer een ander zoekwoord of pas de filters aan om te vinden wat je
          zoekt.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {products.map((product) => {
          const productId = product.id.split('/').pop();
          const firstVariant = product.variants?.edges[0]?.node;
          const compareAtPrice = firstVariant?.compareAtPrice
            ? parseFloat(firstVariant.compareAtPrice.amount)
            : undefined;
          
          return (
            <ProductCard
              key={productId}
              id={parseInt(productId)}
              handle={product.handle}
              title={product.title}
              category={product.productType || (collection?.title ?? 'General')}
              imageUrl={product.images.edges[0]?.node.originalSrc}
              altText={product.images.edges[0]?.node.altText}
              price={parseFloat(product.priceRange.minVariantPrice.amount)}
              compareAtPrice={compareAtPrice}
              variantId={product.firstVariantId}
              hasAvailableVariant={product.hasAvailableVariant}
              variantsCount={product.variantsCount}
              formattedPrice={product.formattedPrice}
              formattedCompareAtPrice={product.formattedCompareAtPrice}
            />
          );
        })}
      </div>

      {products.length < (filteredProducts?.length ?? 0) && (
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
    </>
  );
}