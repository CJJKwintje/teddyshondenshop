import React, { useState, useEffect, useMemo } from 'react';
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
import CategorySlider from '../components/CategorySlider';
import { subscribeToNewsletter } from '../services/shopify';

const PRODUCTS_QUERY = gql`
  query GetProducts {
    products(first: 20) {
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
`;

const categories = [
  {
    icon: Dog as React.FC<{ size: number; className: string }>,
    title: 'Voeding',
    description: 'Premium voeding voor jouw hond',
    path: '/categorie/hondenvoeding',
    color: 'bg-amber-500'
  },
  {
    icon: Cookie as React.FC<{ size: number; className: string }>,
    title: 'Snacks',
    description: 'Gezonde beloningen & treats',
    path: '/categorie/hondensnacks',
    color: 'bg-green-500'
  },
  {
    icon: MapPin as React.FC<{ size: number; className: string }>,
    title: 'Op stap',
    description: 'Riemen, halsbanden & meer',
    path: '/categorie/hondenriemen',
    color: 'bg-blue-500'
  },
  {
    icon: Moon as React.FC<{ size: number; className: string }>,
    title: 'Slapen',
    description: 'Comfortabele manden & kussens',
    path: '/categorie/hondenmanden',
    color: 'bg-indigo-500'
  },
  {
    icon: Scissors as React.FC<{ size: number; className: string }>,
    title: 'Verzorging',
    description: 'Complete vacht- & gezondheidsproducten',
    path: '/categorie/vachtverzorging',
    color: 'bg-purple-500'
  },
  {
    icon: Bone as React.FC<{ size: number; className: string }>,
    title: 'Spelen',
    description: 'Speelgoed & training voor urenlang plezier',
    path: '/categorie/hondenspeelgoed',
    color: 'bg-rose-500'
  },
  {
    icon: Shirt as React.FC<{ size: number; className: string }>,
    title: 'Kleding',
    description: 'Jassen & accessoires voor elk seizoen',
    path: '/categorie/hondenjassen',
    color: 'bg-teal-500'
  }
];

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
  const [result] = useQuery({ query: PRODUCTS_QUERY });
  const { data, fetching, error } = result;
  const [banners, setBanners] = useState<HomepageBanner[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [bannersLoading, setBannersLoading] = useState(true);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ success?: boolean; error?: string } | null>(null);

  useEffect(() => {
    const loadBanners = async () => {
      try {
        const bannerData = await getHomepageBanners();
        console.log('Loaded banners:', bannerData);
        setBanners(bannerData);
      } catch (error) {
        console.error('Error loading banners:', error);
      } finally {
        setBannersLoading(false);
      }
    };

    const loadBrands = async () => {
      try {
        const brandData = await getBrands();
        setBrands(brandData);
      } catch (error) {
        console.error('Error loading brands:', error);
      } finally {
        setBrandsLoading(false);
      }
    };

    loadBanners();
    loadBrands();
  }, []);

  const randomProducts = useMemo(() => {
    if (!data?.products?.edges) return [];
    const products = data.products.edges.map(({ node }: any) => node);
    const shuffled = [...products].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 8);
  }, [data?.products?.edges]);

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
          {bannersLoading ? (
            <>
              <BannerSkeleton />
              <BannerSkeleton isSmall />
            </>
          ) : (
            <>
              {/* Main Banner */}
              <div className={`col-span-2 lg:col-span-2 rounded-2xl overflow-hidden relative min-h-[200px] md:min-h-[300px] group ${getBackgroundColor(banners[0]?.backgroundColor)}`}>
                {banners[0]?.backgroundImage?.fields?.file?.url && (
                  <div 
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `url(${banners[0].backgroundImage.fields.file.url})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                )}
                <div className="relative z-10 p-6 md:p-8 h-full flex flex-col justify-center bg-gradient-to-r from-black/50 to-transparent">
                  <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">
                    {banners[0]?.title || "PREMIUM HONDENVOEDING BIJ TEDDY'S"}
                  </h2>
                  {banners[0]?.description && (
                    <p className="text-lg text-white mb-6">{banners[0].description}</p>
                  )}
                  <Link
                    to={banners[0]?.buttonLink || "/categorie/hondenvoeding"}
                    className="inline-flex bg-white text-gray-900 px-4 md:px-6 py-2 md:py-3 rounded-full font-medium hover:bg-gray-50 transition-colors w-fit text-sm md:text-base"
                  >
                    {banners[0]?.buttonText || "Shop nu"}
                  </Link>
                </div>
              </div>

              {/* Secondary Banner */}
              <div className={`col-span-2 lg:col-span-1 rounded-2xl overflow-hidden relative min-h-[200px] md:min-h-[300px] group ${getBackgroundColor(banners[1]?.backgroundColor)}`}>
                {banners[1]?.backgroundImage?.fields?.file?.url && (
                  <div 
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `url(${banners[1].backgroundImage.fields.file.url})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                )}
                <div className="relative z-10 p-6 md:p-8 h-full flex flex-col justify-center bg-gradient-to-r from-black/50 to-transparent">
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-4">
                    {banners[1]?.title || "NIEUW BUDDY"}
                  </h2>
                  {banners[1]?.description && (
                    <p className="text-lg text-white mb-6">{banners[1].description}</p>
                  )}
                  <Link
                    to={banners[1]?.buttonLink || "/categorie/hondenvoeding"}
                    className="inline-flex bg-white text-gray-900 px-4 md:px-6 py-2 md:py-3 rounded-full font-medium hover:bg-gray-50 transition-colors w-fit text-sm md:text-base"
                  >
                    {banners[1]?.buttonText || "Shop nu"}
                  </Link>
                </div>
              </div>
            </>
          )}
        </section>

        {/* Category Slider - All Screen Sizes */}
        <div className="mb-12">
          <CategorySlider categories={categories.map(category => ({
            ...category,
            overlay: 'bg-black/30'
          }))} />
        </div>

        {/* Brand Logos */}
        {!brandsLoading && brands.length > 0 && (
          <BrandLogos brands={brands} />
        )}

        {/* Featured Products */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800">
              Teddy's favorieten
            </h2>
            <Link
              to="/producten"
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {randomProducts.map((product: any) => {
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