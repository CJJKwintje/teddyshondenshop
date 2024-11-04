import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { Trash2, MinusCircle, PlusCircle, ArrowLeft, AlertCircle, Wifi, RefreshCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

const CartPage: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, createShopifyCheckout } =
    useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shippingCost = subtotal >= 50 ? 0 : 4.95;
  const total = subtotal + shippingCost;

  const handleCheckout = async (retry = false) => {
    if (retry) {
      setRetrying(true);
    }
    setIsLoading(true);
    setError(null);
    
    try {
      const checkout = await createShopifyCheckout();
      window.location.href = checkout.webUrl;
    } catch (error) {
      console.error('Checkout error:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Er is een fout opgetreden bij het afrekenen. Probeer het opnieuw.'
      );
    } finally {
      setIsLoading(false);
      setRetrying(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-8">Je winkelwagen is leeg</h1>
        <p className="text-gray-600 mb-8">
          Ontdek onze producten en voeg ze toe aan je winkelwagen.
        </p>
        <Link
          to="/"
          className="inline-flex items-center text-blue-500 hover:text-blue-600"
        >
          <ArrowLeft className="mr-2" size={20} />
          Terug naar de winkel
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <Link
          to="/"
          className="text-blue-500 hover:text-blue-600 flex items-center"
        >
          <ArrowLeft className="mr-2" size={20} />
          Verder winkelen
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h1 className="text-2xl font-bold mb-6">Winkelwagen</h1>
          <div className="space-y-4">
            {cart.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow p-4 flex items-center gap-4"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-24 h-24 object-cover rounded"
                />
                <div className="flex-grow">
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-gray-600">{item.category}</p>
                  <p className="font-bold mt-2">€{item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      updateQuantity(item.id, Math.max(1, item.quantity - 1))
                    }
                    className="text-gray-500 hover:text-gray-700"
                    aria-label="Decrease quantity"
                  >
                    <MinusCircle size={20} />
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="text-gray-500 hover:text-gray-700"
                    aria-label="Increase quantity"
                  >
                    <PlusCircle size={20} />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="ml-4 text-red-500 hover:text-red-600"
                    aria-label="Remove item"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-24">
            <h2 className="text-xl font-bold mb-4">Overzicht</h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span>Subtotaal</span>
                <span>€{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Verzendkosten</span>
                <span>
                  {shippingCost === 0
                    ? 'Gratis'
                    : `€${shippingCost.toFixed(2)}`}
                </span>
              </div>
              {shippingCost > 0 && (
                <p className="text-sm text-gray-600">
                  Nog €{(50 - subtotal).toFixed(2)} tot gratis verzending
                </p>
              )}
              <div className="border-t pt-3">
                <div className="flex justify-between font-bold">
                  <span>Totaal</span>
                  <span>€{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  {error.includes('internetverbinding') ? (
                    <Wifi className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm text-red-700">{error}</p>
                    {error.includes('internetverbinding') && (
                      <button
                        onClick={() => handleCheckout(true)}
                        disabled={retrying}
                        className="mt-2 text-sm text-red-700 hover:text-red-800 font-medium inline-flex items-center gap-1"
                      >
                        <RefreshCcw size={14} className={retrying ? 'animate-spin' : ''} />
                        {retrying ? 'Opnieuw proberen...' : 'Opnieuw proberen'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <button
              onClick={() => handleCheckout(false)}
              disabled={isLoading}
              className={`w-full bg-blue-500 text-white py-3 rounded-lg transition-colors ${
                isLoading
                  ? 'opacity-75 cursor-not-allowed'
                  : 'hover:bg-blue-600'
              }`}
            >
              {isLoading ? 'Bezig met laden...' : 'Afrekenen'}
            </button>
            <p className="text-sm text-gray-600 mt-4 text-center">
              Veilig betalen met iDEAL, creditcard of PayPal
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;