import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { Trash2, MinusCircle, PlusCircle, ArrowLeft, AlertCircle, Wifi, RefreshCcw, Plus, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const formatPrice = (price: number): string => {
  return price.toFixed(2).replace('.', ',');
};

const CartPage: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, createShopifyCheckout } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = subtotal >= 59 ? 0 : 6.95;
  const total = subtotal + shippingCost;
  const MINIMUM_ORDER_AMOUNT = 15;
  const isBelowMinimum = subtotal < MINIMUM_ORDER_AMOUNT;
  const remainingAmount = MINIMUM_ORDER_AMOUNT - subtotal;

  const handleCheckout = async (retry = false) => {
    if (isBelowMinimum) {
      setError(`Je bestelling moet minimaal €${MINIMUM_ORDER_AMOUNT} bedragen om af te kunnen rekenen.`);
      return;
    }

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

  const getMetaDescription = () => {
    if (cart.length === 0) {
      return 'Je winkelwagen is leeg. Ontdek ons assortiment hondenproducten en voeg items toe aan je winkelwagen.';
    }
    return `Je winkelwagen bevat ${cart.length} ${cart.length === 1 ? 'product' : 'producten'}. Ga verder met afrekenen of shop verder in onze webshop.`;
  };

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <SEO
          title="Winkelwagen"
          description={getMetaDescription()}
          canonical="https://teddyshondenshop.nl/cart"
          noindex={true}
        />
        <h1 className="text-2xl font-bold mb-8">Je winkelwagen is leeg</h1>
        <p className="text-gray-600 mb-8">
          Ontdek onze producten en voeg ze toe aan je winkelwagen.
        </p>
        <Link
          to="/"
          className="inline-flex items-center text-[#63D7B2] hover:text-[#47C09A]"
        >
          <ArrowLeft className="mr-2" size={20} />
          Terug naar de winkel
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO
        title="Winkelwagen"
        description={getMetaDescription()}
        canonical="https://teddyshondenshop.nl/cart"
        noindex={true}
      />
      
      <div className="flex items-center mb-8">
        <Link
          to="/"
          className="mb-8 text-gray-600 hover:text-gray-900 flex items-center gap-2 group"
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
                className="bg-white rounded-lg shadow p-4 flex flex-col sm:flex-row gap-4"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-20 h-20 flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-contain rounded"
                    />
                  </div>
                  <div className="flex-grow min-w-0">
                    <h3 className="font-semibold text-base leading-tight line-clamp-2 mb-2">
                      {item.name}
                    </h3>
                    <p>€{formatPrice(item.price)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="flex items-center border rounded-lg">
                    <button
                      onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      disabled={item.quantity <= 1}
                      className="p-2 text-gray-600 hover:text-gray-900 disabled:text-gray-400"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                      className="w-16 text-center border-x py-2 focus:outline-none no-spinner"
                      aria-label="Product quantity"
                    />
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-2 text-gray-600 hover:text-gray-900"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:text-red-600"
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
                <span>€{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Verzendkosten</span>
                <span>
                  {shippingCost === 0
                    ? 'Gratis'
                    : `€${formatPrice(shippingCost)}`}
                </span>
              </div>
              {shippingCost > 0 && (
                <p className="text-sm text-gray-600">
                  Nog €{formatPrice(59 - subtotal)} tot gratis verzending
                </p>
              )}
              {isBelowMinimum && (
                <p className="text-sm text-red-600">
                  Nog €{formatPrice(remainingAmount)} nodig voor minimale bestelling
                </p>
              )}
              <div className="border-t pt-3">
                <div className="flex justify-between font-bold">
                  <span>Totaal</span>
                  <span>€{formatPrice(total)}</span>
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
              disabled={isLoading || isBelowMinimum}
              className={`w-full bg-[#63D7B2] text-white py-3 rounded-lg transition-colors ${
                isLoading || isBelowMinimum
                  ? 'opacity-75 cursor-not-allowed'
                  : 'hover:bg-[#47C09A]'
              }`}
            >
              {isLoading ? 'Bezig met laden...' : isBelowMinimum ? `Minimaal €${MINIMUM_ORDER_AMOUNT} nodig` : 'Afrekenen'}
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