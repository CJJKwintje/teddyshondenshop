import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ShoppingCart, Check, ImageOff, Layers } from 'lucide-react';

interface ProductCardProps {
  id: number;
  title: string;
  category: string;
  imageUrl: string;
  altText: string;
  price: number;
  compareAtPrice?: number;
  variantId?: string;
  hasAvailableVariant?: boolean;
  variantsCount?: number;
  formattedPrice: string;
  formattedCompareAtPrice?: string;
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
  compareAtPrice,
  variantId,
  hasAvailableVariant = true,
  variantsCount = 1,
  formattedPrice,
  formattedCompareAtPrice
}: ProductCardProps) {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = React.useState(false);
  const isSoldOut = !hasAvailableVariant;
  const hasVariants = variantsCount > 1;
  
  // Ensure price is a valid number
  const validPrice = typeof price === 'number' && !isNaN(price) && price > 0;
  const validCompareAtPrice = typeof compareAtPrice === 'number' && !isNaN(compareAtPrice) && compareAtPrice > 0;
  const isOnSale = validCompareAtPrice && compareAtPrice > price;
  const discount = isOnSale ? Math.round((1 - price / compareAtPrice) * 100) : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();

    if (!variantId || isSoldOut || !validPrice) {
      return;
    }

    // Only stop propagation if we have a valid variantId and are actually adding to cart
    e.stopPropagation();

    addToCart({
      id,
      name: title,
      price,
      image: imageUrl,
      category,
      variantId: variantId
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
        {isSoldOut && (
          <div className="absolute top-2 right-2 bg-gray-900/90 text-white px-2 py-1 rounded text-sm font-medium">
            Uitverkocht
          </div>
        )}
        {isOnSale && validCompareAtPrice && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-medium">
            -{discount}%
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="min-h-[2.5rem] mb-3">
          <h3 className="font-medium text-gray-900 group-hover:text-[#63D7B2] transition-colors line-clamp-2">
            {title}
          </h3>
        </div>
        
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <p className="font-bold text-gray-900">€{formattedPrice}</p>
            {formattedCompareAtPrice && (
              <p className="text-sm text-gray-500 line-through">€{formattedCompareAtPrice}</p>
            )}
          </div>
          {hasVariants ? (
            <button
              className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center text-gray-600 hover:text-gray-900"
              title="Bekijk varianten"
            >
              <Layers className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={isAdded || !variantId || isSoldOut || !validPrice}
              className={`flex-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                isAdded
                  ? 'bg-green-500 text-white'
                  : !variantId || isSoldOut || !validPrice
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-[#63D7B2] hover:bg-[#47C09A] text-white'
              }`}
            >
              {isAdded ? (
                <Check className="w-4 h-4" />
              ) : (
                <ShoppingCart className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}