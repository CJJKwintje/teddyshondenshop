import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from 'urql';
import { gql } from 'urql';
import {
  ArrowLeft,
  Truck,
  MessageCircleHeart,
  Timer,
  Loader2,
  ShoppingCart,
  Check,
  ImageOff,
  Plus,
  Minus
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import SEO from '../components/SEO';
import Breadcrumbs from '../components/Breadcrumbs';
import { formatPrice } from '../utils/formatPrice';
import { Helmet } from 'react-helmet-async';
import { trackAddToCart, trackViewItem } from '../utils/analytics';

const PRODUCT_QUERY = gql`
  query GetProduct($handle: String!) {
    productByHandle(handle: $handle) {
      id
      title
      handle
      description
      descriptionHtml
      productType
      tags
      vendor
      options {
        id
        name
        values
      }
      variants(first: 100) {
        edges {
          node {
            id
            title
            selectedOptions {
              name
              value
            }
            price {
              amount
              currencyCode
            }
            compareAtPrice {
              amount
              currencyCode
            }
            quantityAvailable
            image {
              originalSrc
              altText
            }
          }
        }
      }
      images(first: 5) {
        edges {
          node {
            originalSrc
            altText
          }
        }
      }
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
        maxVariantPrice {
          amount
          currencyCode
        }
      }
    }
  }
`;

const BenefitItem = ({ icon: Icon, title, description }: any) => (
  <div className="flex items-start gap-4">
    <div className="flex-shrink-0">
      <div className="p-2 bg-[#D9FFF3] rounded-lg">
        <Icon className="w-5 h-5 text-[#47C09A]" />
      </div>
    </div>
    <div>
      <h4 className="text-sm font-medium text-gray-900">{title}</h4>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  </div>
);

const ProductImage = ({ image, alt }: { image: any; alt: string }) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  return (
    <div className="w-full h-full bg-white flex items-center justify-center p-8 relative">
      {!hasError ? (
        <>
          {isLoading && (
            <div className="absolute inset-0 animate-pulse bg-gray-50" />
          )}
          <img
            src={image.originalSrc}
            alt={alt}
            onLoad={() => setIsLoading(false)}
            onError={() => setHasError(true)}
            className={`max-w-full max-h-full object-contain transition-opacity ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
          />
        </>
      ) : (
        <div className="flex items-center justify-center">
          <ImageOff className="w-12 h-12 text-gray-400" />
        </div>
      )}
    </div>
  );
};

const cleanVariantTitle = (title: string | undefined) => {
  if (!title) return '';
  // Remove anything in parentheses and trim whitespace
  return title.replace(/\([^)]*\)/g, '').trim();
};

export default function ProductPage() {
  const { handle } = useParams<{ handle: string }>();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [selectedImage, setSelectedImage] = React.useState(0);
  const [isAdded, setIsAdded] = React.useState(false);
  const [selectedOptions, setSelectedOptions] = React.useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [displayedImages, setDisplayedImages] = useState<any[]>([]);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const originalControlsRef = React.useRef<HTMLDivElement>(null);

  const [result] = useQuery({
    query: PRODUCT_QUERY,
    variables: { handle },
  });

  const { data, fetching, error } = result;

  // Redirect if the handle doesn't match the product's handle
  React.useEffect(() => {
    if (data?.productByHandle && handle !== data.productByHandle.handle) {
      navigate(`/product/${data.productByHandle.handle}?id=${id}`, { replace: true });
    }
  }, [data, handle, id, navigate]);

  const findSelectedVariant = React.useCallback(() => {
    if (!data?.productByHandle?.variants?.edges) return null;
    return data.productByHandle.variants.edges.find(({ node }: any) => {
      return node.selectedOptions.every(
        (option: any) => selectedOptions[option.name] === option.value
      );
    })?.node;
  }, [data, selectedOptions]);

  const findVariantPrice = React.useCallback((optionName: string, value: string) => {
    if (!data?.productByHandle?.variants?.edges) return null;
    
    // Create a temporary options object with the current selection
    const tempOptions = { ...selectedOptions, [optionName]: value };
    
    // Find the variant that matches these options
    const variant = data.productByHandle.variants.edges.find(({ node }: any) => {
      return node.selectedOptions.every(
        (option: any) => tempOptions[option.name] === option.value
      );
    })?.node;

    return variant ? parseFloat(variant.price.amount) : null;
  }, [data, selectedOptions]);

  React.useEffect(() => {
    if (data?.productByHandle?.options) {
      const initialOptions: Record<string, string> = {};
      data.productByHandle.options.forEach((option: any) => {
        initialOptions[option.name] = option.values[0];
      });
      setSelectedOptions(initialOptions);
    }
  }, [data]);

  const handleOptionChange = (optionName: string, value: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionName]: value
    }));
  };

  const selectedVariant = findSelectedVariant();
  const price = selectedVariant
    ? parseFloat(selectedVariant.price.amount)
    : data?.productByHandle?.priceRange?.minVariantPrice
    ? parseFloat(data.productByHandle.priceRange.minVariantPrice.amount)
    : 0;

  const compareAtPrice =
    selectedVariant?.compareAtPrice && parseFloat(selectedVariant.compareAtPrice.amount) > 0
      ? parseFloat(selectedVariant.compareAtPrice.amount)
      : null;

  const isOnSale = compareAtPrice && compareAtPrice > price;
  const discount = isOnSale
    ? Math.round((1 - price / compareAtPrice) * 100)
    : null;

  const handleQuantityChange = (value: number) => {
    const newQuantity = Math.max(1, Math.min(value, selectedVariant?.quantityAvailable || 99));
    setQuantity(newQuantity);
  };

  const handleAddToCart = () => {
    if (!selectedVariant || !data?.productByHandle) return;
    
    const product = {
      id: parseInt(data.productByHandle.id.split('/').pop() as string),
      name: data.productByHandle.title,
      price,
      image: data.productByHandle.images.edges[0].node.originalSrc,
      category: data.productByHandle.productType,
      variantId: selectedVariant.id,
      variantTitle: selectedVariant.title,
      quantity
    } as const;
    
    addToCart(product);
    // Track the add to cart event
    trackAddToCart({
      id: product.id.toString(),
      title: product.name,
      price: product.price,
      category: product.category,
      brand: data.productByHandle.vendor
    }, quantity, {
      pageType: 'product',
      pageName: data.productByHandle.title
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  // Add view_item tracking when product data is loaded
  React.useEffect(() => {
    if (data?.productByHandle && !fetching) {
      const price = selectedVariant
        ? parseFloat(selectedVariant.price.amount)
        : data.productByHandle.priceRange.minVariantPrice
        ? parseFloat(data.productByHandle.priceRange.minVariantPrice.amount)
        : 0;

      trackViewItem({
        id: data.productByHandle.id.split('/').pop() as string,
        title: data.productByHandle.title,
        price,
        brand: data.productByHandle.vendor,
        category: data.productByHandle.productType,
        variant: selectedVariant?.title
      });
    }
  }, [data, fetching]);

  // Update displayed images when product data or selected variant changes
  React.useEffect(() => {
    if (data?.productByHandle) {
      // Always show all product images
      setDisplayedImages(data.productByHandle.images.edges);
      
      // If a variant is selected and has an image, find its index in the array
      if (selectedVariant?.image) {
        const variantImageIndex = data.productByHandle.images.edges.findIndex(
          (edge: any) => edge.node.originalSrc === selectedVariant.image.originalSrc
        );
        // If found, set it as the selected image
        if (variantImageIndex !== -1) {
          setSelectedImage(variantImageIndex);
        }
      }
    }
  }, [data, selectedVariant]);

  // Set up intersection observer for the original controls
  React.useEffect(() => {
    // Check if element is in viewport on initial render
    const checkInitialVisibility = () => {
      if (originalControlsRef.current) {
        const rect = originalControlsRef.current.getBoundingClientRect();
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

    if (originalControlsRef.current) {
      observer.observe(originalControlsRef.current);
    }

    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, []);

  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-8" /> {/* Breadcrumb skeleton */}
          <div className="h-10 w-64 bg-gray-200 rounded animate-pulse mb-8" /> {/* Title skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image skeleton */}
            <div className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
            {/* Content skeleton */}
            <div className="space-y-4">
              <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 w-1/2 bg-gray-200 rounded animate-pulse" />
              <div className="h-32 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Er is iets misgegaan</h1>
            <p className="text-gray-600 mb-4">We konden het product niet laden. Probeer het later opnieuw.</p>
            <button
              onClick={() => navigate('/')}
              className="text-[#47C09A] hover:text-[#3BA888] font-medium"
            >
              Terug naar home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const product = data?.productByHandle;
  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Product niet gevonden</h1>
            <p className="text-gray-600 mb-4">Het product dat je zoekt bestaat niet of is niet meer beschikbaar.</p>
            <button
              onClick={() => navigate('/')}
              className="text-[#47C09A] hover:text-[#3BA888] font-medium"
            >
              Terug naar home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const canonicalUrl = `https://teddyshondenshop.nl/product/${product.handle}`;
  
  // Prepare structured data for the product
  const getStructuredData = () => {
    if (!product) return null;

    const structuredData = {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: product.title,
      description: product.description,
      image: product.images.edges[0]?.node.originalSrc,
      sku: product.id.split('/').pop(),
      brand: {
        '@type': 'Brand',
        name: product.vendor
      },
      offers: {
        '@type': 'Offer',
        url: canonicalUrl,
        priceCurrency: 'EUR',
        price: price,
        availability: selectedVariant?.quantityAvailable > 0 
          ? 'https://schema.org/InStock' 
          : 'https://schema.org/OutOfStock',
        seller: {
          '@type': 'Organization',
          name: "Teddy's hondenshop"
        }
      }
    };

    return JSON.stringify(structuredData);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title={product.title}
        description={product.description}
        canonical={canonicalUrl}
        type="product"
      />
      <Helmet>
        <script type="application/ld+json">
          {getStructuredData()}
        </script>
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16 lg:pb-24">
        <div className="mb-8">
          <Breadcrumbs
            items={[
              {
                label: product.title
              }
            ]}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Title - Always on top on mobile */}
          <div className="order-1 lg:hidden">
            <h2 className="text-sm font-medium text-gray-500 mb-1">
              {product.vendor}
            </h2>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {product.title}
            </h1>
          </div>

          {/* Image Gallery */}
          <div className="order-2 lg:order-1 space-y-6">
            <div className="aspect-square rounded-xl overflow-hidden bg-white border border-gray-100">
              <ProductImage
                image={displayedImages[selectedImage]?.node || product.images.edges[0].node}
                alt={displayedImages[selectedImage]?.node?.altText || product.title}
              />
            </div>
            {displayedImages.length > 1 && (
              <div className="grid grid-cols-5 gap-3">
                {displayedImages.map((image: any, index: number) => (
                  <button
                    key={image.node.originalSrc}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-lg overflow-hidden bg-white border transition-all ${
                      selectedImage === index
                        ? 'ring-2 ring-[#63D7B2] ring-offset-2 border-transparent'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="w-full h-full p-2">
                      <img
                        src={image.node.originalSrc}
                        alt={image.node.altText || `${product.title} ${index + 1}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}
            {/* Description - Below image on desktop */}
            {product.description && (
              <div className="hidden lg:block">
                <div className="prose prose-sm max-w-none text-gray-600 pt-6 border-t">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Productomschrijving
                  </h3>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: product.descriptionHtml || product.description,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="order-3 lg:order-2 space-y-8">
            {/* Title - Only visible on desktop */}
            <div className="hidden lg:block">
              <h2 className="text-sm font-medium text-gray-500 mb-1">
                {product.vendor}
              </h2>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {product.title}
              </h1>
            </div>

            {product.options.some((option: any) => option.values.length > 1) &&
              product.options.map((option: any) => (
                <div key={option.id}>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    {option.name}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {option.values.map((value: string) => {
                      const variantPrice = findVariantPrice(option.name, value);
                      const isSelected = selectedOptions[option.name] === value;
                      const cleanValue = cleanVariantTitle(value);
                      
                      return (
                        <button
                          key={value}
                          onClick={() => handleOptionChange(option.name, value)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                            isSelected
                              ? 'bg-[#63D7B2] text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <span>{cleanValue}</span>
                          {variantPrice && (
                            <span className={`text-xs ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                              €{formatPrice(variantPrice)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

            <div className="pt-6 border-t space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Prijs</p>
                <div className="flex items-center gap-2">
                  <p className={`text-3xl font-bold ${isOnSale ? 'text-red-500' : 'text-gray-900'}`}>
                    €{formatPrice(price)}
                  </p>
                  {isOnSale && compareAtPrice && (
                    <>
                      <p className="text-lg text-gray-500 line-through">
                        €{formatPrice(compareAtPrice)}
                      </p>
                      <span className="px-2 py-1 text-sm font-medium text-red-500 bg-red-50 rounded">
                        -{discount}%
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="text-sm">
                {selectedVariant?.quantityAvailable > 0 ? (
                  <p className="text-green-600">
                    {selectedVariant.quantityAvailable} op voorraad
                  </p>
                ) : (
                  <p className="text-red-500">Niet op voorraad</p>
                )}
              </div>

              <div className="flex items-center gap-4" ref={originalControlsRef}>
                <div className="flex items-center border rounded-lg">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                    className="p-2 text-gray-600 hover:text-gray-900 disabled:text-gray-400"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={selectedVariant?.quantityAvailable || 99}
                    value={quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                    className="w-16 text-center border-x py-2 focus:outline-none no-spinner"
                    aria-label="Product quantity"
                  />
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= (selectedVariant?.quantityAvailable || 99)}
                    className="p-2 text-gray-600 hover:text-gray-900 disabled:text-gray-400"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={
                    isAdded ||
                    !selectedVariant ||
                    selectedVariant.quantityAvailable === 0
                  }
                  className={`flex-1 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-3 ${
                    isAdded
                      ? 'bg-green-500 text-white'
                      : selectedVariant?.quantityAvailable === 0
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-[#63D7B2] hover:bg-[#47C09A] text-white'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-6 h-6" />
                      Toegevoegd
                    </>
                  ) : selectedVariant?.quantityAvailable === 0 ? (
                    'Uitverkocht'
                  ) : (
                    <>
                      <ShoppingCart className="w-6 h-6" />
                      Voeg toe
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <BenefitItem
                icon={Truck}
                title="Gratis Verzending"
                description="Gratis verzending vanaf €59"
              />
              <BenefitItem
                icon={Timer}
                title="Snelle bezorging"
                description="Op werkdagen voor 17:30 besteld, dezelfde dag verzonden"
              />
              <BenefitItem
                icon={MessageCircleHeart}
                title="Vragen? Wij helpen graag!!"
                description="Makkelijk en snel contact via e-mail of chat"
              />
            </div>
          </div>

          {/* Description - Only visible on mobile */}
          {product.description && (
            <div className="order-4 lg:hidden">
              <div className="prose prose-sm max-w-none text-gray-600 pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Productomschrijving
                </h3>
                <div
                  dangerouslySetInnerHTML={{
                    __html: product.descriptionHtml || product.description,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky bar for mobile */}
      <div className={`lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 transition-transform duration-300 ${
        showStickyBar ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Variant selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            {product.options.map((option: any) => {
              const variantPrice = findVariantPrice(option.name, selectedOptions[option.name]);
              return (
                <button
                  key={option.id}
                  onClick={() => setShowVariantModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm whitespace-nowrap"
                >
                  <span className="text-gray-500">{option.name}:</span>
                  <span className="font-medium">{cleanVariantTitle(selectedOptions[option.name])}</span>
                  {variantPrice && (
                    <span className="text-gray-500">€{formatPrice(variantPrice)}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quantity and Add to Cart */}
          <div className="flex items-center gap-4">
            <div className="flex items-center border rounded-lg">
              <button
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
                className="p-2 text-gray-600 hover:text-gray-900 disabled:text-gray-400"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                min="1"
                max={selectedVariant?.quantityAvailable || 99}
                value={quantity}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                className="w-16 text-center border-x py-2 focus:outline-none no-spinner"
                aria-label="Product quantity"
              />
              <button
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={quantity >= (selectedVariant?.quantityAvailable || 99)}
                className="p-2 text-gray-600 hover:text-gray-900 disabled:text-gray-400"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={
                isAdded ||
                !selectedVariant ||
                selectedVariant.quantityAvailable === 0
              }
              className={`flex-1 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-3 ${
                isAdded
                  ? 'bg-green-500 text-white'
                  : selectedVariant?.quantityAvailable === 0
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-[#63D7B2] hover:bg-[#47C09A] text-white'
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-6 h-6" />
                  Toegevoegd
                </>
              ) : selectedVariant?.quantityAvailable === 0 ? (
                'Uitverkocht'
              ) : (
                <>
                  <ShoppingCart className="w-6 h-6" />
                  Voeg toe
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Variant Selection Modal */}
      {showVariantModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden">
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Kies variant</h3>
              <button
                onClick={() => setShowVariantModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                Sluiten
              </button>
            </div>
            <div className="space-y-6">
              {product.options.map((option: any) => (
                <div key={option.id}>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    {option.name}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {option.values.map((value: string) => {
                      const variantPrice = findVariantPrice(option.name, value);
                      const isSelected = selectedOptions[option.name] === value;
                      const cleanValue = cleanVariantTitle(value);
                      
                      return (
                        <button
                          key={value}
                          onClick={() => {
                            handleOptionChange(option.name, value);
                            setShowVariantModal(false);
                          }}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                            isSelected
                              ? 'bg-[#63D7B2] text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <span>{cleanValue}</span>
                          {variantPrice && (
                            <span className={`text-xs ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                              €{formatPrice(variantPrice)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}