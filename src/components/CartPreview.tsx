import React, { useRef, useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { ShoppingCart, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useClickOutside } from '../hooks/useClickOutside';

const CartPreview: React.FC = () => {
  const { cart, removeFromCart, updateQuantity } = useCart();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Show preview when cart changes (item added)
  useEffect(() => {
    if (cart.length > 0) {
      setIsVisible(true);
    }
  }, [cart.length]);

  // Hide preview when clicking outside
  useClickOutside(previewRef, () => {
    setIsVisible(false);
  }, isVisible);

  // Hide preview on cart page
  if (location.pathname === '/cart' || cart.length === 0 || !isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity">
      <div
        ref={previewRef}
        className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 w-80 transition-transform"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <ShoppingCart size={20} className="mr-2" />
            <h3 className="font-semibold">Winkelwagen</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600">{cart.length} items</span>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close cart preview"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="max-h-60 overflow-y-auto">
          {cart.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-12 h-12 object-cover rounded"
                />
                <div className="ml-2">
                  <h4 className="text-sm font-medium">{item.name}</h4>
                  <p className="text-sm text-gray-600">€{item.price.toFixed(2)}</p>
                </div>
              </div>
              <div className="flex items-center">
                <select
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                  className="w-16 p-1 text-sm border rounded mr-2"
                >
                  {[1, 2, 3, 4, 5].map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-gray-400 hover:text-red-500"
                  aria-label="Remove item"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between mb-4">
            <span className="font-semibold">Totaal:</span>
            <span className="font-semibold">€{total.toFixed(2)}</span>
          </div>
          <Link
            to="/cart"
            className="block w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors text-center"
            onClick={() => setIsVisible(false)}
          >
            Naar winkelwagen
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CartPreview;