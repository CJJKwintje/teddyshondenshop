import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ShoppingCart, Check, ImageOff } from 'lucide-react';

interface ProductCardProps {
  id: number;
  title: string;
  category: string;
  imageUrl: string;
  altText: string;
  price: number;
  variantId?: string; // Make variantId optional
}

function ProductImage({ imageUrl, altText, title }: { imageUrl: string; altText: string; title: string }) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  return (
    <div className="w-full h-full bg-white">
      {!hasError ? (
        <>
          {isLoading && (
            <div className="absolute inset-0 animate-pulse bg-gray-50" />
          )}
          <img
            src={imageUrl}
            alt={altText || title}
            onLoad={() => setIsLoading(false)}
            onError={() => setHasError(true)}
            className={`w-full h-full object-contain transition-transform duration-300 group-hover:scale-105 ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
          />
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <ImageOff className="w-8 h-8 text-gray-400" />
        </div>
      )}
    </div>
  );
}

export default function ProductCard({ 
  id, 
  title, 
  category, 
  imageUrl, 
  altText, 
  price,
  variantId 
}: ProductCardProps) {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = React.useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    // Use the provided variantId or fallback to a default format
    const effectiveVariantId = variantId || `${id}`;
    addToCart({
      id,
      name: title,
      price,
      image: imageUrl,
      category,
      variantId: effectiveVariantId
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <Link 
      to={`/product/${id}`}
      className="block group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
    >
      <div className="relative w-full pt-[100%] bg-white">
        <div className="absolute inset-0 overflow-hidden">
          <ProductImage
            imageUrl={imageUrl}
            altText={altText}
            title={title}
          />
        </div>
      </div>
      
      <div className="p-4">
        <div className="min-h-[2.5rem] mb-3">
          <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
            {title}
          </h3>
        </div>
        
        <div className="flex items-center justify-between gap-4">
          <span className="text-lg font-bold text-gray-900">
            €{price.toFixed(2)}
          </span>
          <button
            onClick={handleAddToCart}
            disabled={isAdded}
            className={`flex-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              isAdded
                ? 'bg-green-500 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-4 h-4" />
              </>
            ) : (
              <ShoppingCart className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </Link>
  );
}