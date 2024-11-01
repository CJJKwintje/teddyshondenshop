import React from 'react';
import { useQuery } from 'urql';
import { useCart } from '../context/CartContext';
import { PRODUCTS_QUERY } from '../services/shopify';
import { Product } from '../types';

const ProductGrid: React.FC = () => {
  const { addToCart } = useCart();
  const [result] = useQuery({ query: PRODUCTS_QUERY });

  const { data, fetching, error } = result;

  if (fetching) return <div className="text-center py-8">Loading products...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Error loading products: {error.message}</div>;

  const products: Product[] = data.products.edges.map((edge: any) => ({
    id: parseInt(edge.node.id.split('/').pop()),
    name: edge.node.title,
    price: parseFloat(edge.node.priceRange.minVariantPrice.amount),
    image: edge.node.images.edges[0]?.node.url || 'https://via.placeholder.com/400',
    category: edge.node.productType || 'General'
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
          <div className="relative pb-[56.25%]">
            <img
              src={product.image}
              alt={product.name}
              className="absolute top-0 left-0 w-full h-full object-cover"
            />
          </div>
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
            <p className="text-gray-600 mb-2">{product.category}</p>
            <div className="flex justify-between items-center mt-4">
              <span className="text-xl font-bold text-gray-900">€{product.price.toFixed(2)}</span>
              <button
                onClick={() => addToCart(product)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                In winkelwagen
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductGrid;