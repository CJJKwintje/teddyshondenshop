import React from 'react';
import { ShoppingCart, Check } from 'lucide-react';

interface AddToCartButtonProps {
  onClick: () => void;
  price: number;
}

export default function AddToCartButton({ onClick, price }: AddToCartButtonProps) {
  const [isAdded, setIsAdded] = React.useState(false);

  const handleClick = () => {
    onClick();
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-lg font-bold text-gray-900">
        €{price.toFixed(2)}
      </span>
      <button
        onClick={handleClick}
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
  );
}