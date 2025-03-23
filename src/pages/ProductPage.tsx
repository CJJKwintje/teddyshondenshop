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
import { formatPrice } from '../utils/formatPrice';
import { Helmet } from 'react-helmet-async';

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
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <SEO
          title="Product laden..."
          description="Even geduld alstublieft terwijl we het product laden."
          noindex={true}
        />
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <SEO
          title="Fout bij laden product"
          description="Er is een fout opgetreden bij het laden van het product."
          noindex={true}
        />
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 max-w-md text-center">
          <p className="font-medium mb-2">Error Loading Product</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!data?.productByHandle) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <SEO
          title="Product niet gevonden"
          description="Het opgevraagde product bestaat niet of is verwijderd."
          noindex={true}
        />
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Product Not Found
          </h2>
          <p className="text-gray-500 mb-6">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Go back to shopping
          </button>
        </div>
      </div>
    );
  }

  const canonicalUrl = `https://teddyshondenshop.nl/product/${handle}`;
  
  // Prepare structured data for the product
  const getStructuredData = () => {
    if (!data?.productByHandle) return null;

    const structuredData = {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: data.productByHandle.title,
      description: data.productByHandle.description,
      image: data.productByHandle.images.edges[0]?.node.originalSrc,
      sku: data.productByHandle.id.split('/').pop(),
      brand: {
        '@type': 'Brand',
        name: data.productByHandle.vendor
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
        title={data.productByHandle.title}
        description={data.productByHandle.description || `Koop ${data.productByHandle.title} bij Teddy's hondenshop. ${data.productByHandle.vendor} ${data.productByHandle.productType}. ${selectedVariant?.quantityAvailable > 0 ? 'Nu op voorraad en snel leverbaar!' : 'Tijdelijk uitverkocht.'}`}
        canonical={canonicalUrl}
        type="product"
        image={data.productByHandle.images.edges[0]?.node.originalSrc}
        imageAlt={data.productByHandle.images.edges[0]?.node.altText || data.productByHandle.title}
      />
      <Helmet>
        <script type="application/ld+json">
          {getStructuredData()}
        </script>
        {/* Add meta tags for price */}
        {isOnSale && (
          <>
            <meta property="product:price:amount" content={price.toString()} />
            <meta property="product:price:currency" content="EUR" />
            <meta property="product:sale_price:amount" content={price.toString()} />
            <meta property="product:sale_price:currency" content="EUR" />
            <meta property="product:original_price:amount" content={compareAtPrice?.toString() || ''} />
            <meta property="product:original_price:currency" content="EUR" />
          </>
        )}
        {/* Add meta tags for availability */}
        <meta property="product:availability" content={selectedVariant?.quantityAvailable > 0 ? 'in stock' : 'out of stock'} />
        {/* Add meta tags for condition */}
        <meta property="product:condition" content="new" />
        {/* Add meta tags for brand */}
        <meta property="product:brand" content={data.productByHandle.vendor} />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button
          onClick={() => navigate(-1)}
          className="mb-8 text-gray-600 hover:text-gray-900 flex items-center gap-2 group"
        >
          <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          Verder winkelen
        </button>

        {/* MOBILE LAYOUT */}
        <div className="lg:hidden p-8 bg-white">
          {/* 1. Title (Brand & Product Title) */}
          <div className="mb-4">
            <h2 className="text-sm font-medium text-gray-500">{data.productByHandle.vendor}</h2>
            <h1 className="text-3xl font-bold text-gray-900">{data.productByHandle.title}</h1>
          </div>

          {/* 2. Images */}
          <div className="mb-4">
            <div className="aspect-square rounded-xl overflow-hidden bg-white border border-gray-100">
              <ProductImage
                image={data.productByHandle.images.edges[selectedImage].node}
                alt={data.productByHandle.images.edges[selectedImage].node.altText || data.productByHandle.title}
              />
            </div>
            {data.productByHandle.images.edges.length > 1 && (
              <div className="grid grid-cols-5 gap-3 mt-4">
                {data.productByHandle.images.edges.map((image: any, index: number) => (
                  <button
                    key={image.node.originalSrc}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-lg overflow-hidden bg-white border transition-all ${
                      selectedImage === index
                        ? 'ring-2 ring-blue-500 ring-offset-2 border-transparent'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="w-full h-full p-2">
                      <img
                        src={image.node.originalSrc}
                        alt={image.node.altText || `${data.productByHandle.title} ${index + 1}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3. Price */}
          <div className="border-t pt-4 mb-4">
            <div>
              <p className={`text-3xl font-bold ${isOnSale ? 'text-red-500' : 'text-gray-900'}`}>
                €{formatPrice(price)}
              </p>
              {isOnSale && compareAtPrice && (
                <div className="flex items-center gap-2">
                  <p className="text-lg text-gray-500 line-through">€{formatPrice(compareAtPrice)}</p>
                  <span className="px-2 py-1 text-sm font-medium text-red-500 bg-red-50 rounded">
                    -{discount}%
                  </span>
                </div>
              )}
            </div>

            {/* 4. In Stock Information */}
            <div className="mt-4">
              {selectedVariant?.quantityAvailable > 0 ? (
                <p className="text-green-600 text-sm">
                  {selectedVariant.quantityAvailable} op voorraad
                </p>
              ) : (
                <p className="text-red-500 text-sm">Niet op voorraad</p>
              )}
            </div>

            {/* Add Variant Picker here */}
            {data.productByHandle.options.some((option: any) => option.values.length > 1) &&
              data.productByHandle.options.map((option: any) => (
                <div key={option.id} className="mt-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    {option.name}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {option.values.map((value: string) => (
                      <button
                        key={value}
                        onClick={() => handleOptionChange(option.name, value)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedOptions[option.name] === value
                            ? 'bg-[#63D7B2] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

            {/* 5. Quantity Input & Add To Cart */}
            <div className="mt-4 flex items-center gap-4">
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
                disabled={isAdded || !selectedVariant || selectedVariant.quantityAvailable === 0}
                className={`flex-1 px-3 py-3 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-3 ${
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

          {/* 6. Benefits */}
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
              title="Vragen? Wij helpen graag!"
              description="Makkelijk en snel contact via e-mail of chat"
            />
          </div>

          {/* Add Description below benefits */}
          {data.productByHandle.description && (
            <div className="prose prose-sm max-w-none text-gray-600 pt-6 mt-6 border-t">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Productomschrijving
              </h3>
              <div
                dangerouslySetInnerHTML={{
                  __html: data.productByHandle.descriptionHtml || data.productByHandle.description,
                }}
              />
            </div>
          )}
        </div>

        {/* DESKTOP LAYOUT */}
        <div className="hidden lg:block bg-white">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 p-8">
            {/* Left Column - Image Gallery & Description */}
            <div className="space-y-6">
              <div className="aspect-square rounded-xl overflow-hidden bg-white border border-gray-100">
                <ProductImage
                  image={data.productByHandle.images.edges[selectedImage].node}
                  alt={data.productByHandle.images.edges[selectedImage].node.altText || data.productByHandle.title}
                />
              </div>
              {data.productByHandle.images.edges.length > 1 && (
                <div className="grid grid-cols-5 gap-3">
                  {data.productByHandle.images.edges.map((image: any, index: number) => (
                    <button
                      key={image.node.originalSrc}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square rounded-lg overflow-hidden bg-white border transition-all ${
                        selectedImage === index
                          ? 'ring-2 ring-blue-500 ring-offset-2 border-transparent'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className="w-full h-full p-2">
                        <img
                          src={image.node.originalSrc}
                          alt={image.node.altText || `${data.productByHandle.title} ${index + 1}`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {data.productByHandle.description && (
                <div className="prose prose-sm max-w-none text-gray-600 pt-6 border-t">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Productomschrijving
                  </h3>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: data.productByHandle.descriptionHtml || data.productByHandle.description,
                    }}
                  />
                </div>
              )}
            </div>
  
            {/* Right Column - Product Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-sm font-medium text-gray-500 mb-1">
                  {data.productByHandle.vendor}
                </h2>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {data.productByHandle.title}
                </h1>
              </div>
  
              {data.productByHandle.options.some((option: any) => option.values.length > 1) &&
                data.productByHandle.options.map((option: any) => (
                  <div key={option.id}>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">
                      {option.name}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {option.values.map((value: string) => (
                        <button
                          key={value}
                          onClick={() => handleOptionChange(option.name, value)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedOptions[option.name] === value
                              ? 'bg-[#63D7B2] text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {value}
                        </button>
                      ))}
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
          </div>
        </div>
      </div>
    </div>
  );
}