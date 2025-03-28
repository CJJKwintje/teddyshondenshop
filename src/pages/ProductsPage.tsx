import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from 'urql';
import { gql } from 'urql';
import { SlidersHorizontal, Loader2, Dog, Bone, Cookie, MapPin, Moon, Shirt, ChevronLeft, ChevronRight } from 'lucide-react';
import SearchFilters from '../components/SearchFilters';
import SearchResults from '../components/SearchResults';
import MobileFilterMenu from '../components/MobileFilterMenu';
import BackToTop from '../components/BackToTop';
import SEO from '../components/SEO';
import { formatPrice } from '../utils/formatPrice';
import Pagination from '../components/Pagination';
import ActiveFilterTags from '../components/ActiveFilterTags';
import { getCategoryPageBySlug } from '../services/contentful';

const PRODUCTS_PER_PAGE = 25;

// Add type definitions
interface CategoryMapping {
  label: string;
  productTypes: string[];
}

interface CategoryData {
  title: string;
  slug: string;
  bannerSubtitle?: string;
  bannerImage?: {
    fields: {
      file: {
        url: string;
      };
    };
  };
}

type Categories = {
  [key: string]: CategoryMapping;
};

const categoryConfig = {
  'Hondenvoeding': {
    icon: Dog,
    color: 'bg-amber-500',
    description: 'Premium voeding voor jouw hond'
  },
  'Hondensnacks': {
    icon: Cookie,
    color: 'bg-green-500',
    description: 'Gezonde beloningen & treats'
  },
  'Op pad': {
    icon: MapPin,
    color: 'bg-blue-500',
    description: 'Riemen, halsbanden & meer'
  },
  'Slapen': {
    icon: Moon,
    color: 'bg-indigo-500',
    description: 'Comfortabele manden & kussens'
  },
  'Hondenkleding': {
    icon: Shirt,
    color: 'bg-teal-500',
    description: 'Jassen & accessoires voor elk seizoen'
  }
};

const CATEGORY_MAPPING: Categories = {
  'Hondenvoeding': {
    label: 'Hondenvoeding',
    productTypes: ['DIEPVRIESVOER', 'DROOGVOER', 'NATVOER', 'VOER/DRINKBAKKEN']
  },
  'Hondensnacks': {
    label: 'Hondensnacks',
    productTypes: ['SNACKS', 'SNACKS GEDROOGD', 'SNACKS GIST', 'SNACKS HARD', 'SNACKS KAUW', 'SNACKS KOEK', 'SNACKS ZACHT']
  },
  'Op pad': {
    label: 'Op pad',
    productTypes: ['HALSBANDEN MET LICHTJES', 'HALSBANDEN/LIJNEN KUNSTLEER', 'HALSBANDEN/LIJNEN LEER', 'HALSBANDEN/LIJNEN NYLON', 'HALSBANDEN/LIJNEN OVERIG', 'HONDENTAS', 'OUTDOOR', 'VERVOERBOX']
  },
  'Slapen': {
    label: 'Slapen',
    productTypes: ['BEDDEN/MANDEN/KUSSENS']
  },
  'Hondenkleding': {
    label: 'Hondenkleding',
    productTypes: ['KLEDING']
  }
};

const PRODUCT_CARD_FRAGMENT = gql`
  fragment ProductCard on Product {
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
`;

const GET_FILTERS_QUERY = gql`
  query GetFiltersAndCounts {
    products(first: 250) {
      edges {
        node {
          vendor
          priceRange {
            minVariantPrice {
              amount
            }
          }
        }
      }
    }
  }
`;

const FILTERED_PRODUCTS_QUERY = gql`
  query GetFilteredProducts(
    $query: String!
    $first: Int
    $after: String
  ) {
    products(
      first: $first
      query: $query
      after: $after
    ) {
      edges {
        node {
          ...ProductCard
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;

const ALL_PRODUCTS_QUERY = gql`
  query GetAllProducts {
    products(first: 250) {
      edges {
        node {
          id
        }
      }
    }
  }
`;

export default function ProductsPage() {
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [cursors, setCursors] = useState<Record<number, string>>({});
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryData, setCategoryData] = useState<Record<string, CategoryData>>({});
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Fetch all products to get total count
  const [allProductsResult] = useQuery({
    query: ALL_PRODUCTS_QUERY
  });

  // Fetch filters
  const [filtersResult] = useQuery({
    query: GET_FILTERS_QUERY
  });

  // Build query string based on selected filters
  const buildFilterQuery = useCallback(() => {
    const queries: string[] = [];
    
    // Add category filter
    if (selectedCategory && CATEGORY_MAPPING[selectedCategory]) {
      const categoryTypes = CATEGORY_MAPPING[selectedCategory].productTypes;
      const productTypeQuery = categoryTypes
        .map(type => `(product_type:${type})`)
        .join(' OR ');
      queries.push(`(${productTypeQuery})`);
    }
    
    if (selectedBrands.length > 0) {
      const brandQuery = selectedBrands
        .map(brand => `(vendor:${brand})`)
        .join(' OR ');
      queries.push(`(${brandQuery})`);
    }
    
    if (selectedPriceRanges.length > 0) {
      const priceQueries = selectedPriceRanges.map(range => {
        const [min, max] = range.split('-').map(parseFloat);
        return `(variants.price:>=${min} AND variants.price:<=${max})`;
      });
      queries.push(`(${priceQueries.join(' OR ')})`);
    }
    
    return queries.length > 0 ? queries.join(' AND ') : '';
  }, [selectedBrands, selectedPriceRanges, selectedCategory]);

  // Fetch products with pagination
  const [productsResult] = useQuery({
    query: FILTERED_PRODUCTS_QUERY,
    variables: {
      query: buildFilterQuery(),
      first: PRODUCTS_PER_PAGE,
      after: cursors[currentPage - 1] || null
    }
  });

  // Store cursor for next page when we get results
  useEffect(() => {
    if (productsResult.data?.products?.pageInfo?.hasNextPage) {
      setCursors(prev => ({
        ...prev,
        [currentPage]: productsResult.data.products.pageInfo.endCursor
      }));
    }
  }, [productsResult.data, currentPage]);

  // Process available filters from initial query
  const processFilters = useCallback(() => {
    if (!filtersResult.data?.products?.edges) return {
      availableBrands: [],
      priceRanges: []
    };

    const products = filtersResult.data.products.edges;
    const brands = new Set<string>();
    const prices = new Set<number>();

    products.forEach(({ node }: any) => {
      if (node.vendor) brands.add(node.vendor);
      const price = parseFloat(node.priceRange.minVariantPrice.amount);
      prices.add(Math.floor(price / 25) * 25); // Round to nearest 25
    });

    return {
      availableBrands: Array.from(brands),
      priceRanges: Array.from(prices).sort((a, b) => a - b)
    };
  }, [filtersResult.data]);

  // Process products for display
  const processProducts = useCallback(() => {
    if (!productsResult.data?.products?.edges) return [];

    return productsResult.data.products.edges.map(({ node }: any) => {
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
  }, [productsResult.data]);

  const { availableBrands, priceRanges } = processFilters();
  const products = processProducts();
  const pageInfo = productsResult.data?.products?.pageInfo;

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    // Scroll to top of the page smoothly
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  const handleFilterChange = (type: 'price' | 'brand' | 'type', value: string) => {
    setCurrentPage(1);
    setCursors({});

    if (type === 'price') {
      setSelectedPriceRanges(prev =>
        prev.includes(value) ? prev.filter(range => range !== value) : [value]
      );
    } else if (type === 'brand') {
      setSelectedBrands(prev =>
        prev.includes(value) ? prev.filter(brand => brand !== value) : [...prev, value]
      );
    }
  };

  const handleCategoryChange = (category: string) => {
    setCurrentPage(1);
    setCursors({});
    setSelectedCategory(prev => prev === category ? null : category);
  };

  const clearFilters = () => {
    setSelectedPriceRanges([]);
    setSelectedBrands([]);
    setSelectedCategory(null);
    setCurrentPage(1);
    setCursors({});
  };

  const handleRemoveFilter = (type: 'price' | 'brand', value: string) => {
    setCurrentPage(1);
    setCursors({});

    if (type === 'price') {
      setSelectedPriceRanges(prev =>
        prev.filter(range => range !== value)
      );
    } else if (type === 'brand') {
      setSelectedBrands(prev =>
        prev.filter(brand => brand !== value)
      );
    }
  };

  // Fetch category data from Contentful
  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        const categoryPromises = Object.keys(CATEGORY_MAPPING).map(async (category) => {
          const slug = category.toLowerCase().replace(/ /g, '-');
          const data = await getCategoryPageBySlug(slug);
          return [category, data];
        });

        const results = await Promise.all(categoryPromises);
        const categoryDataMap = Object.fromEntries(
          results.filter(([_, data]) => data !== null)
        );

        setCategoryData(categoryDataMap);
      } catch (error) {
        console.error('Error fetching category data:', error);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategoryData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title="Alle Producten"
        description="Bekijk ons complete assortiment hondenproducten. Van voeding tot speelgoed, alles voor jouw hond."
        canonical="https://teddyshondenshop.nl/producten"
        type="website"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">
          Alle Producten
        </h1>

        {/* Category filter cards */}
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
              {Object.entries(CATEGORY_MAPPING).map(([key, { label }]) => {
                const data = categoryData[key];
                const imageUrl = data?.bannerImage?.fields?.file?.url;
                
                return (
                  <button
                    key={key}
                    onClick={() => handleCategoryChange(key)}
                    className="flex-none w-[calc(85%-1rem)] sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1rem)] xl:w-[calc(25%-1rem)] snap-start relative rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group h-48 sm:h-48"
                  >
                    {imageUrl ? (
                      <div 
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                        style={{ 
                          backgroundImage: `url(${imageUrl})`,
                          filter: selectedCategory === key ? 'brightness(0.6)' : 'brightness(0.8)'
                        }}
                      />
                    ) : (
                      <div className={`absolute inset-0 ${selectedCategory === key ? 'bg-gray-700' : 'bg-gray-500'}`} />
                    )}
                    
                    <div className="relative h-full p-6 flex flex-col justify-between z-10 text-white">
                      <h3 className="text-xl font-semibold group-hover:text-white/90 transition-colors text-left">
                        {data?.title || label}
                      </h3>
                      {data?.bannerSubtitle && (
                        <p className="text-white/80 line-clamp-2 text-sm text-left">
                          {data.bannerSubtitle}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
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

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters - Desktop */}
          <aside className="hidden lg:block lg:w-72 flex-shrink-0">
            <SearchFilters
              availableBrands={availableBrands}
              selectedBrands={selectedBrands}
              selectedPriceRanges={selectedPriceRanges}
              onFilterChange={handleFilterChange}
              onClearFilters={clearFilters}
            />
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="flex items-center justify-end mb-6">
              <button
                onClick={() => setIsFilterMenuOpen(true)}
                className="lg:hidden inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </button>
            </div>

            <ActiveFilterTags
              selectedBrands={selectedBrands}
              selectedPriceRanges={selectedPriceRanges}
              onRemoveFilter={handleRemoveFilter}
            />
            
            <SearchResults
              isLoading={productsResult.fetching && products.length === 0}
              error={productsResult.error?.message}
              products={products}
            />

            {pageInfo?.hasNextPage && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={currentPage + (pageInfo.hasNextPage ? 1 : 0)}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </main>
        </div>
      </div>

      <MobileFilterMenu
        isOpen={isFilterMenuOpen}
        onClose={() => setIsFilterMenuOpen(false)}
        availableBrands={availableBrands}
        selectedBrands={selectedBrands}
        selectedPriceRanges={selectedPriceRanges}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
      />

      <BackToTop />
    </div>
  );
}