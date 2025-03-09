import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, SlidersHorizontal } from 'lucide-react';
import { useQuery } from 'urql';
import { gql } from 'urql';
import { getCategoryPage } from '../services/contentful';
import { useNavigation } from '../hooks/useNavigation';
import SEO from '../components/SEO';
import SearchResults from '../components/SearchResults';
import SearchFilters from '../components/SearchFilters';
import MobileFilterMenu from '../components/MobileFilterMenu';
import BackToTop from '../components/BackToTop';
import Pagination from '../components/Pagination';
import Breadcrumbs from '../components/Breadcrumbs';

const PRODUCTS_QUERY = gql`
  query GetCategoryProducts($query: String!) {
    products(first: 250, query: $query) {
      edges {
        node {
          id
          title
          productType
          tags
          vendor
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

const PRODUCTS_PER_PAGE = 20;

export default function SubCategoryPage() {
  const { category, subcategory } = useParams<{ category: string; subcategory: string }>();
  const navigate = useNavigate();
  const [pageData, setPageData] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const { categories } = useNavigation();
  const currentCategory = categories.find(cat => cat.slug === category);

  // Fetch category page data from Contentful
  React.useEffect(() => {
    const fetchPageData = async () => {
      try {
        if (!category || !subcategory) {
          throw new Error('Invalid category or subcategory');
        }

        const data = await getCategoryPage(category, subcategory);
        if (!data) {
          throw new Error('Category page not found');
        }

        setPageData(data);
      } catch (err) {
        console.error('Error fetching category page:', err);
        setError(err instanceof Error ? err.message : 'Failed to load category page');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPageData();
  }, [category, subcategory]);

  // Fetch products from Shopify
  const [result] = useQuery({
    query: PRODUCTS_QUERY,
    variables: { 
      query: `${category} ${subcategory}`.replace(/-/g, ' ')
    },
    pause: !category || !subcategory
  });

  // Process and filter products
  const processProducts = () => {
    if (!result.data?.products?.edges) return [];

    const allProducts = result.data.products.edges.map(({ node }: any) => {
      const variants = node.variants.edges;
      const hasAvailableVariant = variants.some(
        ({ node: variant }: any) => variant.quantityAvailable > 0
      );
      const firstVariant = variants[0]?.node;
      const compareAtPrice = firstVariant?.compareAtPrice
        ? parseFloat(firstVariant.compareAtPrice.amount)
        : undefined;

      return {
        ...node,
        hasAvailableVariant,
        variantsCount: variants.length,
        firstVariantId: firstVariant?.id,
        compareAtPrice,
        formattedPrice: parseFloat(node.priceRange.minVariantPrice.amount).toFixed(2).replace('.', ','),
        formattedCompareAtPrice: compareAtPrice ? compareAtPrice.toFixed(2).replace('.', ',') : undefined
      };
    });

    // Apply filters
    return allProducts.filter((product: any) => {
      const price = parseFloat(product.priceRange.minVariantPrice.amount);
      
      const matchesPrice =
        selectedPriceRanges.length === 0 ||
        selectedPriceRanges.some((range) => {
          const [min, max] = range.split('-').map(parseFloat);
          return price >= min && price <= max;
        });

      const matchesBrands =
        selectedBrands.length === 0 ||
        selectedBrands.includes(product.vendor);

      return matchesPrice && matchesBrands;
    });
  };

  const filteredProducts = processProducts();
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  // Get unique brands
  const availableBrands = Array.from(
    new Set(filteredProducts.map((product: any) => product.vendor).filter(Boolean))
  );

  const handleFilterChange = (type: 'price' | 'brand', value: string) => {
    setCurrentPage(1); // Reset to first page when filters change
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

  const clearFilters = () => {
    setSelectedPriceRanges([]);
    setSelectedBrands([]);
    setCurrentPage(1);
  };

  if (isLoading || result.fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || result.error || !pageData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Pagina niet gevonden
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

  const canonicalUrl = `https://teddyshondenshop.nl/categorie/${category}/${subcategory}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title={pageData.fields.seoTitle || pageData.fields.title}
        description={pageData.fields.seoDescription || pageData.fields.description || `${pageData.fields.title} voor honden bij Teddy's Hondenshop`}
        canonical={canonicalUrl}
        type="website"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Breadcrumbs
            items={[
              {
                label: currentCategory?.mainCategory || '',
                href: `/categorie/${category}`
              },
              {
                label: pageData.fields.title
              }
            ]}
          />
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {pageData.fields.title}
          </h1>
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
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm text-gray-500">
                {filteredProducts.length} producten
              </div>
              
              <button
                onClick={() => setIsFilterMenuOpen(true)}
                className="lg:hidden inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </button>
            </div>

            <SearchResults
              products={paginatedProducts}
              loadMoreRef={null}
              isFetching={false}
            />

            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}

            {/* Description Section */}
            {pageData.fields.description && (
              <div className="mt-16 bg-white rounded-xl p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {pageData.fields.title}
                </h2>
                <div className="prose prose-blue max-w-none">
                  <p className="text-gray-600">{pageData.fields.description}</p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Filters - Mobile */}
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