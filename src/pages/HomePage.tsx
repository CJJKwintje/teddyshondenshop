import React from 'react';
import { useQuery } from 'urql';
import { gql } from 'urql';
import { Bone, Cookie, Dog, Dumbbell, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';

const PRODUCTS_QUERY = gql`
  query GetProducts {
    products(first: 20) {
      edges {
        node {
          id
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

const HomePage: React.FC = () => {
  const [result] = useQuery({ query: PRODUCTS_QUERY });
  const { data, fetching, error } = result;

  const getRandomProducts = (products: any[]) => {
    const shuffled = [...products].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4);
  };

  const randomProducts = data?.products?.edges
    ? getRandomProducts(data.products.edges.map(({ node }: any) => node))
    : [];

  return (
    <main className="container mx-auto px-4 py-8">
      <section className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
        {/* Main Banner */}
        <div
          className="col-span-2 lg:col-span-2 rounded-2xl overflow-hidden relative min-h-[200px] md:min-h-[300px] group"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1548199973-03cce0bbc87b)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-sky-500/90 to-sky-500/40 group-hover:to-sky-500/50 transition-colors" />
          <div className="relative z-10 p-6 md:p-8 h-full flex flex-col justify-center">
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">
              PREMIUM HONDENVOEDING
              <br />
              BIJ TEDDY'S
            </h2>
            <Link
              to="/categorie/hondenvoeding"
              className="inline-flex bg-white text-gray-900 px-4 md:px-6 py-2 md:py-3 rounded-full font-medium hover:bg-gray-50 transition-colors w-fit text-sm md:text-base"
            >
              Shop nu
            </Link>
          </div>
        </div>

        {/* Secondary Banner */}
        <div
          className="col-span-2 lg:col-span-1 rounded-2xl overflow-hidden relative min-h-[200px] md:min-h-[300px] group"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1623387641168-d9803ddd3f35)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/90 to-emerald-600/60 group-hover:to-emerald-600/70 transition-colors" />
          <div className="relative z-10 p-6 md:p-8 h-full flex flex-col justify-center">
            <h3 className="text-xl md:text-2xl font-bold text-white mb-2">NIEUW BUDDY</h3>
            <h4 className="text-lg md:text-xl font-bold text-white mb-4">DOGFOOD</h4>
            <ul className="text-white text-xs md:text-sm mb-6">
              <li>- 100% NATUURLIJKE EN</li>
              <li>VERSE INGREDIËNTEN</li>
              <li>- GRAAN- EN GLUTENVRIJ</li>
            </ul>
            <Link
              to="/categorie/hondenvoeding"
              className="inline-flex bg-white text-gray-900 px-4 md:px-6 py-2 md:py-3 rounded-full font-medium hover:bg-gray-50 transition-colors w-fit text-sm md:text-base"
            >
              Shop nu
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
        {/* Category Cards */}
        <Link
          to="/categorie/hondenvoeding"
          className="bg-amber-500 text-white p-4 md:p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow group"
        >
          <div className="flex flex-col items-center text-center">
            <Dog
              size={32}
              className="mb-3 md:mb-4 group-hover:scale-110 transition-transform"
            />
            <h3 className="text-base md:text-xl font-semibold">Voeding</h3>
            <p className="text-xs md:text-sm text-amber-100 mt-1 md:mt-2">
              Premium hondenvoer & snacks
            </p>
          </div>
        </Link>

        <Link
          to="/categorie/hondenspeelgoed"
          className="bg-blue-500 text-white p-4 md:p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow group"
        >
          <div className="flex flex-col items-center text-center">
            <Bone
              size={32}
              className="mb-3 md:mb-4 group-hover:scale-110 transition-transform"
            />
            <h3 className="text-base md:text-xl font-semibold">Speelgoed</h3>
            <p className="text-xs md:text-sm text-blue-100 mt-1 md:mt-2">
              Speeltjes voor urenlang plezier
            </p>
          </div>
        </Link>

        <Link
          to="/categorie/hondensnacks"
          className="bg-green-500 text-white p-4 md:p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow group"
        >
          <div className="flex flex-col items-center text-center">
            <Cookie
              size={32}
              className="mb-3 md:mb-4 group-hover:scale-110 transition-transform"
            />
            <h3 className="text-base md:text-xl font-semibold">Snacks</h3>
            <p className="text-xs md:text-sm text-green-100 mt-1 md:mt-2">
              Gezonde beloningen & treats
            </p>
          </div>
        </Link>

        <Link
          to="/categorie/hondentraining"
          className="bg-purple-500 text-white p-4 md:p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow group"
        >
          <div className="flex flex-col items-center text-center">
            <Dumbbell
              size={32}
              className="mb-3 md:mb-4 group-hover:scale-110 transition-transform"
            />
            <h3 className="text-base md:text-xl font-semibold">Training</h3>
            <p className="text-xs md:text-sm text-purple-100 mt-1 md:mt-2">
              Trainingsmateriaal & hulpmiddelen
            </p>
          </div>
        </Link>
      </section>

      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800">
            Teddy's favorieten
          </h2>
          <Link
            to="/products"
            className="text-blue-500 hover:text-blue-600 font-medium text-sm md:text-base"
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
              const variantId = product.variants.edges[0]?.node?.id;
              
              return (
                <ProductCard
                  key={productId}
                  id={parseInt(productId)}
                  title={product.title}
                  category={product.productType || 'General'}
                  imageUrl={product.images.edges[0]?.node.originalSrc}
                  altText={product.images.edges[0]?.node.altText}
                  price={parseFloat(product.priceRange.minVariantPrice.amount)}
                  variantId={variantId}
                />
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
};

export default HomePage;