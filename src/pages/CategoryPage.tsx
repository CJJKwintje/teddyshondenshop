import React, { useState, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigation } from '../hooks/useNavigation';
import { getCategoryPageBySlug, NavigationCategory, NavigationLink } from '../services/contentful';
import { useQuery } from 'urql';
import { gql } from 'urql';
import SEO from '../components/SEO';
import ContentfulRichText from '../components/content/ContentfulRichText';
import Breadcrumbs from '../components/Breadcrumbs';
import SearchResults from '../components/SearchResults';
import Pagination from '../components/Pagination';
import { formatPrice } from '../utils/formatPrice';

const PRODUCTS_PER_PAGE = 12;

// Category mapping for Shopify queries
const CATEGORY_MAPPING: Record<string, Record<string, string[]>> = {
  'hondenvoeding': {
    'diepvriesvoer': ['productType:"DIEPVRIESVOER"'],
    'droogvoer': ['productType:"DROOGVOER"'],
    'natvoer': ['productType:"NATVOER"'],
    'voer-drinkbakken': ['productType:"VOERBAK"', 'productType:"DRINKBAK"']
  },
  'hondensnacks': {
    'snacks': ['productType:"SNACKS"'],
    'snacks-gedroogd': ['productType:"SNACKS GEDROOGD"'],
    'snacks-gist': ['productType:"SNACKS GIST"'],
    'snacks-hard': ['productType:"SNACKS HARD"'],
    'snacks-kauw': ['productType:"SNACKS KAUW"'],
    'snacks-koek': ['productType:"SNACKS KOEK"'],
    'snacks-zacht': ['productType:"SNACKS ZACHT"']
  },
  'op-pad': {
    'halsbanden-met-lichtjes': ['productType:"HALSBANDEN MET LICHTJES"'],
    'halsbanden-lijnen-kunstleer': ['productType:"HALSBANDEN/LIJNEN KUNSTLEER"'],
    'halsbanden-lijnen-leer': ['productType:"HALSBANDEN/LIJNEN LEER"'],
    'halsbanden-lijnen-nylon': ['productType:"HALSBANDEN/LIJNEN NYLON"'],
    'halsbanden-lijnen-overig': ['productType:"HALSBANDEN/LIJNEN OVERIG"'],
    'hondentas': ['productType:"HONDENTAS"'],
    'outdoor': ['productType:"OUTDOOR"'],
    'vervoerbox': ['productType:"VERVOERBOX"']
  },
  'slapen': {
    'bedden-manden-kussens': ['productType:"BEDDEN/MANDEN/KUSSENS"']
  },
  'hondenkleding': {
    'kleding': ['productType:"KLEDING"']
  }
};

const PRODUCT_QUERY = gql`
  query GetProducts($query: String!) {
    products(first: 250, query: $query) {
      edges {
        node {
          id
          handle
          title
          productType
          tags
          vendor
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
          images(first: 1) {
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
    }
  }
`;

// Extend the NavigationLink fields type to include backgroundImage and backgroundColor
interface ExtendedNavigationLink extends NavigationLink {
  fields: NavigationLink['fields'] & {
    backgroundImage?: {
      fields: {
        file: {
          url: string;
        };
      };
    };
    backgroundColor?: string;
  };
}

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const { categories, isLoading: isNavLoading, error: navError } = useNavigation();
  const [pageData, setPageData] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Find the current category
  const currentCategory = categories.find(cat => cat.slug === category);

  // Get all subcategories for this category
  const getAllSubcategories = () => {
    if (!currentCategory) return [] as ExtendedNavigationLink[];
    return (currentCategory.link || []) as ExtendedNavigationLink[];
  };

  const subcategories = getAllSubcategories();

  // Build query from category mapping
  const buildProductQuery = useCallback(() => {
    if (!category) return '';
    
    console.log('Building query for category:', category);
    
    // Get the mapping for the current main category
    const categoryMap = CATEGORY_MAPPING[category.toLowerCase()];
    if (!categoryMap) {
      console.warn(`No category mapping found for: ${category}`);
      return '';
    }

    // Get all product type queries for this category
    const allQueries = Object.values(categoryMap).flat();
    console.log('All product type queries:', allQueries);
    
    // Create a strict query that only matches exact product types
    const productTypes = allQueries.map(query => query.split(':')[1].replace(/"/g, '')); // Extract just the type names
    const finalQuery = productTypes.map(type => `product_type:${type}`).join(' OR ');
    console.log('Final Shopify query:', finalQuery);
    
    return finalQuery;
  }, [category]);

  // Products Query with dynamic query string
  const [result] = useQuery({ 
    query: PRODUCT_QUERY,
    variables: {
      query: buildProductQuery()
    },
    pause: !currentCategory // Pause the query until we have the category data
  });
  const { data, fetching: productsFetching, error: productsError } = result;

  // Log the raw query and response
  React.useEffect(() => {
    if (data) {
      console.group('Shopify Query Details');
      console.log('Raw query sent to Shopify:', buildProductQuery());
      console.log('Raw Shopify response:', data);
      console.log('Product types in response:', data.products.edges.map(({ node }: any) => node.productType));
      console.groupEnd();
    }
  }, [data, buildProductQuery]);

  // Process products
  const processedProducts = useMemo(() => {
    if (!data?.products?.edges) return [];

    console.group('Processed Products');
    console.log('Number of products returned:', data.products.edges.length);
    console.log('Products by type:', data.products.edges.reduce((acc: any, { node }: any) => {
      acc[node.productType] = (acc[node.productType] || 0) + 1;
      return acc;
    }, {}));
    console.groupEnd();

    return data.products.edges.map(({ node }: any) => {
      const variant = node.variants.edges[0]?.node;
      const compareAtPrice = variant?.compareAtPrice
        ? parseFloat(variant.compareAtPrice.amount)
        : undefined;

      return {
        ...node,
        hasAvailableVariant: variant?.quantityAvailable > 0,
        variantsCount: node.variants.edges.length,
        firstVariantId: variant?.id,
        compareAtPrice,
        formattedPrice: formatPrice(parseFloat(node.priceRange.minVariantPrice.amount)),
        formattedCompareAtPrice: compareAtPrice ? formatPrice(compareAtPrice) : undefined,
        image: {
          src: node.images.edges[0]?.node?.originalSrc,
          alt: node.images.edges[0]?.node?.altText
        }
      };
    });
  }, [data]);

  // Client-side pagination
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return processedProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);
  }, [processedProducts, currentPage]);

  const totalPages = Math.ceil(processedProducts.length / PRODUCTS_PER_PAGE);

  // Fetch category page data from Contentful
  React.useEffect(() => {
    const fetchPageData = async () => {
      try {
        if (!category) {
          throw new Error('Invalid category');
        }

        const data = await getCategoryPageBySlug(category);
        setPageData(data);
      } catch (err) {
        console.error('Error fetching category page:', err);
        setError(err instanceof Error ? err.message : 'Failed to load category page');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPageData();
  }, [category]);

  if (isLoading || isNavLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || navError || !currentCategory) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Categorie niet gevonden
          </h1>
          <p className="text-gray-500 mb-6">
            De opgevraagde categorie bestaat niet of is verwijderd.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Ga terug
          </button>
        </div>
      </div>
    );
  }

  const canonicalUrl = `https://teddyshondenshop.nl/categorie/${category}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title={pageData?.seoTitle || `${currentCategory.mainCategory} voor honden`}
        description={pageData?.seoDescription || `Ontdek ons uitgebreide assortiment ${currentCategory.mainCategory.toLowerCase()} voor honden. De beste kwaliteit, direct bij jou thuisbezorgd.`}
        canonical={canonicalUrl}
        type="website"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Breadcrumbs
            items={[
              {
                label: currentCategory.mainCategory
              }
            ]}
          />
        </div>

        {/* Banner Section */}
        {pageData?.bannerImage && (
          <div className="relative rounded-xl overflow-hidden mb-12">
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ 
                backgroundImage: `url(${pageData.bannerImage.fields.file.url})`,
                filter: 'brightness(0.7)'
              }}
            />
            <div className="relative z-10 py-12 md:py-24 px-8 text-white text-center">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-4">
                {pageData.bannerTitle || currentCategory.mainCategory}
              </h1>
              {pageData.bannerSubtitle && (
                <p className="text-lg md:text-xl lg:text-2xl">
                  {pageData.bannerSubtitle}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Title Section (if no banner) */}
        {!pageData?.bannerImage && (
          <div className="mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {pageData?.title || currentCategory.mainCategory}
            </h1>
          </div>
        )}

        {/* Links Section */}
        {currentCategory.link.length > 0 && (
          <div className="mb-16">
            <div className="relative">
              {scrollPosition > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (containerRef.current) {
                      const scrollAmount = -containerRef.current.offsetWidth;
                      containerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                      setScrollPosition(prev => Math.max(0, prev + scrollAmount));
                    }
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-600" />
                </button>
              )}

              <div
                ref={containerRef}
                className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory gap-4 md:gap-6 pb-4"
                onScroll={(e) => setScrollPosition(e.currentTarget.scrollLeft)}
              >
                {(currentCategory.link as ExtendedNavigationLink[]).map((subcategory) => (
                  <Link
                    key={subcategory.fields.slug}
                    to={`/categorie/${category}/${subcategory.fields.slug}`}
                    className="flex-none w-[calc(85%-1rem)] sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1rem)] xl:w-[calc(25%-1rem)] snap-start relative rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group h-48 sm:h-48"
                  >
                    {subcategory.fields.backgroundImage ? (
                      <div 
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                        style={{ 
                          backgroundImage: `url(${subcategory.fields.backgroundImage.fields.file.url})`,
                          filter: 'brightness(0.7)'
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gray-500" />
                    )}
                    <div className="relative h-full p-6 flex flex-col justify-between z-10 text-white">
                      <div className="flex items-start gap-3">
                        <h3 className="text-xl font-semibold group-hover:text-white/90 transition-colors">
                          {subcategory.fields.title}
                        </h3>
                      </div>
                      {subcategory.fields.description && (
                        <p className="text-white/80 line-clamp-2 text-sm">
                          {subcategory.fields.description}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>

              {containerRef.current && containerRef.current.scrollWidth - containerRef.current.clientWidth > scrollPosition && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (containerRef.current) {
                      const scrollAmount = containerRef.current.offsetWidth;
                      containerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                      setScrollPosition(prev => prev + scrollAmount);
                    }
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-6 h-6 text-gray-600" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Products Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Alle producten
          </h2>
          
          {productsFetching ? (
            <div className="flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : productsError ? (
            <div className="text-center text-red-600">
              Er is een fout opgetreden bij het laden van de producten.
            </div>
          ) : (
            <>
              <SearchResults
                products={paginatedProducts}
                isLoading={false}
              />
              
              {totalPages > 1 && (
                <div className="mt-8">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => {
                      setCurrentPage(page);
                      window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                      });
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Content Section */}
        {pageData?.description && (
          <div className="bg-white rounded-xl p-8 shadow-sm prose prose-blue max-w-none">
            <ContentfulRichText content={pageData.description} />
          </div>
        )}
      </div>
    </div>
  );
}