import React from 'react';
import { useCart } from '../context/CartContext';
import { Product } from '../types';

const products: Product[] = [
  {
    id: 1,
    name: 'Premium Hondenbrok',
    price: 24.99,
    image: 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    category: 'Honden'
  },
  {
    id: 2,
    name: 'Kattenspeeltje Set',
    price: 12.99,
    image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    category: 'Katten'
  },
  {
    id: 3,
    name: 'Vogelkooi Deluxe',
    price: 49.99,
    image: 'https://images.unsplash.com/photo-1520808663317-647b476a81b9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    category: 'Vogels'
  },
  {
    id: 4,
    name: 'Aquarium Filter',
    price: 34.99,
    image: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    category: 'Vissen'
  },
  {
    id: 5,
    name: 'Katten Klimtoren',
    price: 89.99,
    image: 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    category: 'Katten'
  },
  {
    id: 6,
    name: 'Honden Speelgoed Set',
    price: 19.99,
    image: 'https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    category: 'Honden'
  }
];

const ProductGrid: React.FC = () => {
  const { addToCart } = useCart();

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