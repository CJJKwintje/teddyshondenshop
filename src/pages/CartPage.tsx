import React, { useState, useRef, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { Trash2, MinusCircle, PlusCircle, ArrowLeft, AlertCircle, Wifi, RefreshCcw, Plus, Minus, Truck, Timer, MessageCircleHeart } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { useQuery } from 'urql';
import { gql } from 'urql';
import ProductCard from '../components/ProductCard';
import { formatPrice } from '../utils/formatPrice';

const CartPage: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, createShopifyCheckout } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const originalCheckoutRef = useRef<HTMLDivElement>(null);
  
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = subtotal >= 59 ? 0 : 6.95;
  const total = subtotal + shippingCost;
  const MINIMUM_ORDER_AMOUNT = 10;
  const isBelowMinimum = subtotal < MINIMUM_ORDER_AMOUNT;
  const remainingAmount = MINIMUM_ORDER_AMOUNT - subtotal;
  const FREE_SHIPPING_THRESHOLD = 59;
  const progressPercentage = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const remainingForFreeShipping = FREE_SHIPPING_THRESHOLD - subtotal;

  const maxPrice = FREE_SHIPPING_THRESHOLD;
  const [page, setPage] = useState(1);
  const [cursors, setCursors] = useState<string[]>([]);
  const COLLECTION_HANDLE = 'cartproducts'; // Collection handle for recommended products

  const [recommendedProductsResult] = useQuery({
    query: gql`
      query GetRecommendedProducts($collectionHandle: String!, $first: Int!, $after: String) {
        collection(handle: $collectionHandle) {
          products(first: $first, after: $after) {
            edges {
              node {
                id
                handle
                title
                productType
                images(first: 1) {
                  edges {
                    node {
                      originalSrc
                      altText
                    }
                  }
                }
                variants(first: 1) {
                  edges {
                    node {
                      id
                      price {
                        amount
                        currencyCode
                      }
                      compareAtPrice {
                        amount
                        currencyCode
                      }
                      quantityAvailable
                    }
                  }
                }
                priceRange {
                  minVariantPrice {
                    amount
                    currencyCode
                  }
                }
              }
              cursor
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }
    `,
    variables: {
      collectionHandle: COLLECTION_HANDLE,
      first: 4,
      after: page > 1 ? cursors[page - 2] : null
    },
    pause: shippingCost === 0, // Don't fetch if free shipping is already achieved
    requestPolicy: 'network-only'
  });

  // Update cursors when data is loaded
  React.useEffect(() => {
    if (recommendedProductsResult.data?.collection?.products?.pageInfo?.endCursor) {
      const newCursor = recommendedProductsResult.data.collection.products.pageInfo.endCursor;
      
      // Only add the cursor if it's not already in the array
      if (!cursors.includes(newCursor)) {
        setCursors(prev => [...prev, newCursor]);
      }
    }
  }, [recommendedProductsResult.data]);

  // Function to get the next page
  const getNextPage = () => {
    if (recommendedProductsResult.data?.collection?.products?.pageInfo?.hasNextPage) {
      setPage(prev => prev + 1);
    } else {
      // If we've reached the end, go back to the first page
      setPage(1);
    }
  };

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

  // Set up intersection observer for the original checkout section
  useEffect(() => {
    // Check if element is in viewport on initial render
    const checkInitialVisibility = () => {
      if (originalCheckoutRef.current) {
        const rect = originalCheckoutRef.current.getBoundingClientRect();
        const isInViewport = rect.top >= 0 && rect.bottom <= window.innerHeight;
        setShowStickyBar(!isInViewport);
      }
    };

    // Run initial check after a small delay to ensure DOM is fully rendered
    const timeoutId = setTimeout(checkInitialVisibility, 100);

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyBar(!entry.isIntersecting);
      },
      { threshold: 1.0 }
    );

    if (originalCheckoutRef.current) {
      observer.observe(originalCheckoutRef.current);
    }

    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, []);

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center min-h-[60vh] flex flex-col items-center justify-center">
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
      
      <div className="flex items-center mb-4">
        <Link
          to="/"
          className="text-gray-600 hover:text-gray-900 flex items-center gap-2 group"
        >
          <ArrowLeft className="mr-2" size={20} />
          Verder winkelen
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Free Shipping Progress Bar */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                <span className="font-medium">Gratis verzending</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  progressPercentage <= 33
                    ? 'bg-red-500'
                    : progressPercentage <= 66
                    ? 'bg-orange-500'
                    : 'bg-[#63D7B2]'
                }`}
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
            {progressPercentage < 100 ? (
              <p className="text-sm text-gray-600 mt-2">
                Voeg nog {formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)} toe voor gratis verzending
              </p>
            ) : (
              <p className="text-sm text-green-600 mt-2">
                Je hebt gratis verzending! 🎉
              </p>
            )}
          </div>

          <h1 className="text-2xl font-bold mb-6">Winkelwagen</h1>
          <div className="space-y-4">
            {cart.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow p-4 flex flex-col sm:flex-row gap-4"
              >
                <Link 
                  to={`/product/${item.name.toLowerCase().replace(/\s+/g, '-')}?id=${item.id}`}
                  className="flex items-start gap-4 flex-1 hover:opacity-80 transition-opacity"
                >
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
                </Link>
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
          
          {/* Add space below cart products */}
          <div className="mb-16"></div>

          {/* Recommended Products Section */}
          {shippingCost > 0 && (
            <div className="mt-12">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold">Voeg nog iets lekkers toe en ontvang GRATIS verzending!</h2>
                <button 
                  onClick={getNextPage}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors group"
                  aria-label="Ververs aanbevolen producten"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-5 w-5 text-gray-600 transition-transform duration-300 ${recommendedProductsResult.fetching ? 'animate-spin' : 'group-hover:rotate-180'}`}
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
              
              {recommendedProductsResult.fetching ? (
                <div className="text-center py-8">
                  <p>Producten laden...</p>
                </div>
              ) : recommendedProductsResult.error ? (
                <div className="text-center py-8 text-red-600">
                  <p>Er is een fout opgetreden bij het laden van de aanbevolen producten.</p>
                  <p className="text-sm mt-2">{recommendedProductsResult.error.message}</p>
                </div>
              ) : recommendedProductsResult.data?.collection?.products?.edges?.length ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {recommendedProductsResult.data.collection.products.edges.map(({ node: product }: any) => {
                    const productId = product.id.split('/').pop();
                    const variants = product.variants.edges;
                    const firstVariant = variants[0]?.node;
                    const hasAvailableVariant = variants.some(
                      ({ node }: any) => node.quantityAvailable > 0
                    );
                    const compareAtPrice = firstVariant?.compareAtPrice
                      ? parseFloat(firstVariant.compareAtPrice.amount)
                      : undefined;
                    
                    return (
                      <ProductCard
                        key={productId}
                        id={parseInt(productId)}
                        handle={product.handle}
                        title={product.title}
                        category={product.productType || 'General'}
                        imageUrl={product.images.edges[0]?.node.originalSrc}
                        altText={product.images.edges[0]?.node.altText}
                        price={parseFloat(product.priceRange.minVariantPrice.amount)}
                        compareAtPrice={compareAtPrice}
                        variantId={firstVariant?.id}
                        hasAvailableVariant={hasAvailableVariant}
                        variantsCount={variants.length}
                        formattedPrice={formatPrice(parseFloat(product.priceRange.minVariantPrice.amount))}
                        formattedCompareAtPrice={compareAtPrice ? formatPrice(compareAtPrice) : undefined}
                        pageContext={{
                          pageType: 'recommendation',
                          pageName: 'Cart Page - Free Shipping Recommendations'
                        }}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-600">
                  <p>Geen aanbevolen producten gevonden in deze prijsklasse.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-24" ref={originalCheckoutRef}>
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
            
            <div className="space-y-4 mt-6">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-[#D9FFF3] rounded-lg">
                    <Truck className="w-5 h-5 text-[#47C09A]" />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Gratis Verzending</h4>
                  <p className="text-sm text-gray-500">Gratis verzending vanaf €59</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-[#D9FFF3] rounded-lg">
                    <Timer className="w-5 h-5 text-[#47C09A]" />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Snelle bezorging</h4>
                  <p className="text-sm text-gray-500">Op werkdagen voor 17:30 besteld, dezelfde dag verzonden</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-[#D9FFF3] rounded-lg">
                    <MessageCircleHeart className="w-5 h-5 text-[#47C09A]" />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Vragen? Wij helpen graag!!</h4>
                  <p className="text-sm text-gray-500">Makkelijk en snel contact via e-mail of chat</p>
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
              className={`w-full bg-[#63D7B2] text-white py-3 rounded-lg transition-colors mt-8 ${
                isLoading || isBelowMinimum
                  ? 'opacity-75 cursor-not-allowed'
                  : 'hover:bg-[#47C09A]'
              }`}
            >
              {isLoading ? 'Bezig met laden...' : isBelowMinimum ? `Minimaal €${MINIMUM_ORDER_AMOUNT} nodig` : 'Afrekenen'}
            </button>
            <p className="text-sm text-gray-600 mt-4 text-center">
            *Verzendkosten worden berekend op de volgende pagina
            </p>
          </div>
        </div>
      </div>

      {/* Sticky checkout bar for mobile */}
      <div className={`lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 transition-transform duration-300 ${
        showStickyBar ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Totaal</p>
              <p className="text-xl font-bold">€{formatPrice(total)}</p>
            </div>
            <div>
              {shippingCost === 0 ? (
                <p className="text-sm text-green-600">Gratis verzending</p>
              ) : (
                <p className="text-sm text-gray-600">
                  Nog €{formatPrice(59 - subtotal)} tot gratis verzending
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => handleCheckout(false)}
            disabled={isLoading || isBelowMinimum}
            className={`w-full bg-[#63D7B2] text-white py-4 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-3 ${
              isLoading || isBelowMinimum
                ? 'opacity-75 cursor-not-allowed'
                : 'hover:bg-[#47C09A]'
            }`}
          >
            {isLoading ? 'Bezig met laden...' : isBelowMinimum ? `Minimaal €${MINIMUM_ORDER_AMOUNT} nodig` : 'Afrekenen'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;