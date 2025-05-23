import React, { useState } from 'react';
import { useQuery } from 'urql';
import { gql } from 'urql';
import { Dog, Bone, Cookie, MapPin, Moon, Scissors, Shirt, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import SEO from '../components/SEO';
import { formatPrice } from '../utils/formatPrice';
import { getHomepageBanners, getBrands } from '../services/contentful';
import type { HomepageBanner, Brand } from '../services/contentful';
import BrandLogos from '../components/BrandLogos';
import CategoryGrid from '../components/CategoryGrid';
import { subscribeToNewsletter } from '../services/shopify';
import BannerSlider from '../components/BannerSlider';
import { useContentfulBanners, useContentfulBrands } from '../hooks/useContentfulData';
import { useNavigation } from '../hooks/useNavigation';

const PRODUCTS_QUERY = gql`
  query GetProducts($collectionId: ID!) {
    collection(id: $collectionId) {
      handle
      products(first: 6) {
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
            variants(first: 250) {
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
        }
      }
    }
  }
`;

const getBackgroundColor = (color?: string) => {
  // Default color if none provided
  if (!color) return 'bg-sky-500';

  // Map color names to Tailwind classes
  const colors: Record<string, string> = {
    sky: 'bg-sky-500',
    blue: 'bg-blue-500',
    green: 'bg-green-600',
    emerald: 'bg-emerald-600',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    indigo: 'bg-indigo-500',
  };

  return colors[color.toLowerCase()] || colors.sky;
};

const BannerSkeleton = ({ isSmall = false }: { isSmall?: boolean }) => (
  <div className={`${isSmall ? 'col-span-2 lg:col-span-1' : 'col-span-2 lg:col-span-2'} rounded-2xl overflow-hidden relative min-h-[200px] md:min-h-[300px] bg-gray-100 animate-pulse`}>
    <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-100" />
    <div className="relative z-10 p-6 md:p-8 h-full flex flex-col justify-center">
      <div className="h-8 md:h-10 bg-gray-200 rounded-lg w-3/4 mb-4" />
      <div className="h-4 md:h-5 bg-gray-200 rounded-lg w-1/2 mb-6" />
      <div className="h-10 md:h-12 bg-gray-200 rounded-full w-32" />
    </div>
  </div>
);

const HomePage: React.FC = () => {
  const [result] = useQuery({ 
    query: PRODUCTS_QUERY,
    variables: {
      collectionId: "gid://shopify/Collection/646804570446"
    }
  });
  const { data: shopifyData, fetching, error } = result;
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ success?: boolean; error?: string } | null>(null);

  // Get data using React Query
  const { categories, isLoading: isCategoriesLoading } = useNavigation();
  const { data: banners, isLoading: isBannersLoading } = useContentfulBanners();
  const { data: brands, isLoading: isBrandsLoading } = useContentfulBrands();

  const bestSellingProducts = React.useMemo(() => {
    if (!shopifyData?.collection?.products?.edges) return [];
    return shopifyData.collection.products.edges.map(({ node }: any) => node);
  }, [shopifyData?.collection?.products?.edges]);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const result = await subscribeToNewsletter(email);
      setSubmitStatus(result);
      if (result.success) {
        setEmail('');
      }
    } catch (error) {
      setSubmitStatus({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Er is een fout opgetreden' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <SEO
          title="Teddy's hondenshop"
          description="De beste producten voor jouw hond, direct bij jou thuisbezorgd. Ontdek ons uitgebreide assortiment van voeding, snacks, speeltjes en training"
          canonical="https://teddyshondenshop.nl"
          type="website"
          image="https://teddyshondenshop.nl/og-image.jpg"
          imageAlt="Teddy's Hondenshop - Premium hondenproducten"
        />

        <section className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
          {isBannersLoading ? (
            <>
              <BannerSkeleton />
              <BannerSkeleton isSmall />
            </>
          ) : banners && banners.length > 0 ? (
            <>
              {/* Main Banner (orderId: 1) */}
              <div className={`col-span-2 lg:col-span-2 order-1 rounded-lg overflow-hidden relative min-h-[200px] md:min-h-[300px] group ${getBackgroundColor(banners.find(b => b.orderId === 1)?.backgroundColor)}`}>
                {banners.find(b => b.orderId === 1)?.backgroundImage?.fields?.file?.url && (
                  <div 
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `url(${banners.find(b => b.orderId === 1)?.backgroundImage.fields.file.url})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                )}
                <div className="relative z-10 p-5 md:p-6 h-full flex flex-col justify-center bg-gradient-to-r from-black/50 to-transparent">
                  <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-4 font-heading">
                    {banners.find(b => b.orderId === 1)?.title || "PREMIUM HONDENVOEDING BIJ TEDDY'S"}
                  </h2>
                  {banners.find(b => b.orderId === 1)?.description && (
                    <p className="text-[17px] md:text-[21px] text-white mb-6 font-sans">{banners.find(b => b.orderId === 1)?.description}</p>
                  )}
                  <Link
                    to={banners.find(b => b.orderId === 1)?.buttonLink || "/categorie/hondenvoeding"}
                    className="inline-flex bg-white text-gray-900 px-4 md:px-6 py-2 md:py-3 rounded-full font-medium hover:bg-gray-50 transition-colors w-fit text-sm md:text-base"
                  >
                    {banners.find(b => b.orderId === 1)?.buttonText || "Ontdek ons assortiment"}
                  </Link>
                </div>
              </div>

              {/* Secondary Banner (orderId: 2) */}
              <div className={`col-span-2 lg:col-span-1 order-3 lg:order-2 rounded-lg overflow-hidden relative min-h-[200px] md:min-h-[300px] group ${getBackgroundColor(banners.find(b => b.orderId === 2)?.backgroundColor)}`}>
                {banners.find(b => b.orderId === 2)?.backgroundImage?.fields?.file?.url && (
                  <div 
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `url(${banners.find(b => b.orderId === 2)?.backgroundImage.fields.file.url})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                )}
                <div className="relative z-10 p-5 md:p-6 h-full flex flex-col justify-center bg-gradient-to-r from-black/50 to-transparent">
                  <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-4 font-heading">
                    {banners.find(b => b.orderId === 2)?.title || "SNACKS & TRAINING"}
                  </h2>
                  {banners.find(b => b.orderId === 2)?.description && (
                    <p className="text-[17px] md:text-[21px] text-white mb-6 font-sans">{banners.find(b => b.orderId === 2)?.description}</p>
                  )}
                  <Link
                    to={banners.find(b => b.orderId === 2)?.buttonLink || "/categorie/hondensnacks"}
                    className="inline-flex bg-white text-gray-900 px-4 md:px-6 py-2 md:py-3 rounded-full font-medium hover:bg-gray-50 transition-colors w-fit text-sm md:text-base"
                  >
                    {banners.find(b => b.orderId === 2)?.buttonText || "Bekijk snacks"}
                  </Link>
                </div>
              </div>

              {/* Additional Banners Slider */}
              {banners.filter(b => b.orderId >= 3).length > 0 && (
                <div className="col-span-2 lg:col-span-3 order-2 lg:order-3">
                  <BannerSlider banners={banners.filter(b => b.orderId >= 3)} />
                </div>
              )}
            </>
          ) : null}
        </section>

        {/* Featured Products */}
        <section className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Is jouw hond klaar voor het mooie weer?
            </h2>
            <Link
              to={`/search?collection=646804570446`}
              className="text-[#63D7B2] hover:text-[#47C09A] font-medium text-sm md:text-base"
            >
              Bekijk alles →
            </Link>
          </div>

          {fetching ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : error ? (
            <div className="text-center text-red-500">
              Er is een fout opgetreden bij het laden van de producten.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
              {bestSellingProducts.map((product: any) => {
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
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* Categories Grid */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Ontdek onze categorieën</h2>
          {isCategoriesLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <CategoryGrid categories={categories} />
          )}
        </section>

        {/* Brand Logos */}
        {!isBrandsLoading && brands && brands.length > 0 && (
          <BrandLogos brands={brands} />
        )}

        {/* Newsletter Signup */}
        <section className="bg-[#47C09A] rounded-2xl p-8 md:p-12 mt-16 mb-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Blijf op de hoogte van de laatste acties!
            </h2>
            <p className="text-white/90 mb-6">
              Ontvang maandelijks de beste aanbiedingen, nieuwe producten en handige tips voor jouw hond
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col md:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Jouw e-mailadres"
                className="flex-1 px-4 py-3 rounded-full border-2 border-white/20 bg-white/10 text-white placeholder-white/60 focus:outline-none focus:border-white/40"
                required
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-white text-[#47C09A] rounded-full font-medium hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Bezig...' : 'Inschrijven'}
              </button>
            </form>
            {submitStatus && (
              <p className={`mt-4 text-sm ${submitStatus.success ? 'text-white' : 'text-red-200'}`}>
                {submitStatus.success 
                  ? 'Bedankt voor je inschrijving!' 
                  : submitStatus.error || 'Er is een fout opgetreden bij het inschrijven.'}
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default HomePage;