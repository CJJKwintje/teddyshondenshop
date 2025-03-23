import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/formatPrice';

interface Product {
  id: string;
  handle: string;
  title: string;
  description: string;
  price: string;
  image: string;
  url: string;
  productType: string;
}

interface ProductRecommendationProps {
  products: Product[];
}

export default function ProductRecommendation({ products }: ProductRecommendationProps) {
  const { addToCart } = useCart();
  const [addedProducts, setAddedProducts] = React.useState<Record<string, boolean>>({});

  const handleAddToCart = (product: Product) => {
    const productId = parseInt(product.id.split('/').pop() || '0');
    addToCart({
      id: productId,
      name: product.title,
      price: parseFloat(product.price),
      image: product.image,
      category: product.productType,
      variantId: product.id
    });
    
    setAddedProducts(prev => ({
      ...prev,
      [product.id]: true
    }));

    setTimeout(() => {
      setAddedProducts(prev => ({
        ...prev,
        [product.id]: false
      }));
    }, 2000);
  };

  if (!products || products.length === 0) return null;

  return (
    <div className="space-y-4">
      {products.map((product) => (
        <Link 
          key={product.id}
          to={`/product/${product.handle}`}
          className="block group bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200 overflow-hidden"
        >
          <div className="flex items-center gap-4 p-3">
            <div className="w-20 h-20 bg-white rounded-lg overflow-hidden flex-shrink-0">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 rounded-lg" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 group-hover:text-[#63D7B2] transition-colors line-clamp-2 mb-1">
                {product.title}
              </h3>
              <div className="flex items-center justify-between gap-4">
                <p className="font-bold text-gray-900">€{formatPrice(parseFloat(product.price))}</p>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAddToCart(product);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-1.5 ${
                    addedProducts[product.id]
                      ? 'bg-green-500 text-white'
                      : 'bg-[#63D7B2] hover:bg-[#47C09A] text-white'
                  }`}
                >
                  {addedProducts[product.id] ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <ShoppingCart className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}