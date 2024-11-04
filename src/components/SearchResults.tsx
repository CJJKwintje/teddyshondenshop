import React from 'react';
import { Loader2 } from 'lucide-react';
import ProductCard from './ProductCard';

interface SearchResultsProps {
  isLoading: boolean;
  error?: string;
  products: any[];
  searchQuery: string;
}

export default function SearchResults({
  isLoading,
  error,
  products,
  searchQuery,
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
          Geen producten gevonden voor "{searchQuery}"
        </h3>
        <p className="text-gray-500">
          Probeer een ander zoekwoord of pas de filters aan om te vinden wat je
          zoekt.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          id={parseInt(product.id.split('/').pop())}
          title={product.title}
          category={product.productType || 'General'}
          imageUrl={product.images.edges[0]?.node.originalSrc}
          altText={product.images.edges[0]?.node.altText}
          price={parseFloat(product.priceRange.minVariantPrice.amount)}
          variantId={product.variants.edges[0]?.node.id}
        />
      ))}
    </div>
  );
}