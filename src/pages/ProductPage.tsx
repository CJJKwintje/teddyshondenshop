import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'urql';
import { gql } from 'urql';
import {
  ArrowLeft,
  Tag,
  Truck,
  Shield,
  RefreshCw,
  Loader2,
  ShoppingCart,
  Check,
  ImageOff,
} from 'lucide-react';
import { useCart } from '../context/CartContext';

const PRODUCT_QUERY = gql`
  query GetProduct($id: ID!) {
    product(id: $id) {
      id
      title
      description
      descriptionHtml
      productType
      tags
      variants(first: 1) {
        edges {
          node {
            id
            price {
              amount
              currencyCode
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
      }
    }
  }
`;

const BenefitItem = ({ icon: Icon, title, description }: any) => (
  <div className="flex items-start gap-4">
    <div className="flex-shrink-0">
      <div className="p-2 bg-blue-50 rounded-lg">
        <Icon className="w-5 h-5 text-blue-600" />
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
    <div className="w-full h-full bg-white flex items-center justify-center p-8">
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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [selectedImage, setSelectedImage] = React.useState(0);
  const [isAdded, setIsAdded] = React.useState(false);

  const [result] = useQuery({
    query: PRODUCT_QUERY,
    variables: { id: `gid://shopify/Product/${id}` },
  });

  const { data, fetching, error } = result;

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 max-w-md text-center">
          <p className="font-medium mb-2">Error Loading Product</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!data?.product) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
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

  const { product } = data;
  const images = product.images.edges.map(({ node }: any) => node);
  const price = parseFloat(product.priceRange.minVariantPrice.amount);
  const variantId = product.variants.edges[0]?.node.id;

  const handleAddToCart = () => {
    addToCart({
      id: parseInt(id as string),
      name: product.title,
      price,
      image: images[0].originalSrc,
      category: product.productType,
      variantId: variantId,
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button
          onClick={() => navigate(-1)}
          className="mb-8 text-gray-600 hover:text-gray-900 flex items-center gap-2 group"
        >
          <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          Verder winkelen
        </button>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 p-8">
            {/* Image Gallery */}
            <div className="space-y-6">
              <div className="aspect-square rounded-xl overflow-hidden bg-white border border-gray-100">
                <ProductImage
                  image={images[selectedImage]}
                  alt={images[selectedImage].altText || product.title}
                />
              </div>
              {images.length > 1 && (
                <div className="grid grid-cols-5 gap-3">
                  {images.map((image: any, index: number) => (
                    <button
                      key={image.originalSrc}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square rounded-lg overflow-hidden bg-white border transition-all ${
                        selectedImage === index
                          ? 'ring-2 ring-blue-500 ring-offset-2 border-transparent'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className="w-full h-full p-2">
                        <img
                          src={image.originalSrc}
                          alt={image.altText || `${product.title} ${index + 1}`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Tag className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    {product.productType || 'General'}
                  </span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {product.title}
                </h1>
                {product.description && (
                  <div className="prose prose-sm max-w-none text-gray-600">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: product.descriptionHtml || product.description,
                      }}
                    />
                  </div>
                )}
              </div>

              {product.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full bg-gray-100 text-sm text-gray-600 hover:bg-gray-200 transition-colors"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <BenefitItem
                  icon={Truck}
                  title="Gratis Verzending"
                  description="Gratis verzending vanaf €50"
                />
                <BenefitItem
                  icon={Shield}
                  title="Veilig Betalen"
                  description="100% veilige betaling"
                />
                <BenefitItem
                  icon={RefreshCw}
                  title="Makkelijk Retourneren"
                  description="30 dagen bedenktijd"
                />
              </div>

              <div className="pt-6 border-t space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Prijs</p>
                    <p className="text-3xl font-bold text-gray-900">
                      €{price.toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={handleAddToCart}
                    disabled={isAdded}
                    className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center gap-3 ${
                      isAdded
                        ? 'bg-green-500 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-6 h-6" />
                        Toegevoegd
                      </>
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
          </div>
        </div>
      </div>
    </div>
  );
}