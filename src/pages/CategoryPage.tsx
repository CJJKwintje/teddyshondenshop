import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigation } from '../hooks/useNavigation';
import { getCategoryPageBySlug } from '../services/contentful';
import SEO from '../components/SEO';
import ContentfulRichText from '../components/content/ContentfulRichText';
import Breadcrumbs from '../components/Breadcrumbs';

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const { categories, isLoading: isNavLoading, error: navError } = useNavigation();
  const [pageData, setPageData] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Find the current category
  const currentCategory = categories.find(cat => cat.slug === category);

  // Get all subcategories for this category
  const getAllSubcategories = () => {
    if (!currentCategory) return [];

    return [
      ...(currentCategory.link || []),
      ...(currentCategory.link2 || []),
      ...(currentCategory.link3 || [])
    ];
  };

  const subcategories = getAllSubcategories();

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
            <div className="relative z-10 py-24 px-8 text-white text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {pageData.bannerTitle || currentCategory.mainCategory}
              </h1>
              {pageData.bannerSubtitle && (
                <p className="text-xl md:text-2xl">
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

        {/* First Section */}
        {currentCategory.link.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {currentCategory.linkTitle}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentCategory.link.map((subcategory) => (
                <Link
                  key={subcategory.fields.slug}
                  to={`/categorie/${category}/${subcategory.fields.slug}`}
                  className="relative rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group h-48"
                >
                  {subcategory.fields.backgroundImage ? (
                    <div 
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                      style={{ 
                        backgroundImage: `url(${subcategory.fields.backgroundImage.fields.file.url})`
                      }}
                    />
                  ) : (
                    <div 
                      className={`absolute inset-0 ${subcategory.fields.backgroundColor || 'bg-blue-500'}`}
                    />
                  )}
                  <div className="relative h-full p-6 flex flex-col justify-between z-10 text-white">
                    <h3 className="text-xl font-semibold group-hover:text-white/90 transition-colors">
                      {subcategory.fields.title}
                    </h3>
                    {subcategory.fields.description && (
                      <p className="text-white/80 line-clamp-2 text-sm">
                        {subcategory.fields.description}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Second Section */}
        {currentCategory.link2 && currentCategory.link2.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {currentCategory.linkTitle2}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentCategory.link2.map((subcategory) => (
                <Link
                  key={subcategory.fields.slug}
                  to={`/categorie/${category}/${subcategory.fields.slug}`}
                  className="relative rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group h-48"
                >
                  {subcategory.fields.backgroundImage ? (
                    <div 
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                      style={{ 
                        backgroundImage: `url(${subcategory.fields.backgroundImage.fields.file.url})`
                      }}
                    />
                  ) : (
                    <div 
                      className={`absolute inset-0 ${subcategory.fields.backgroundColor || 'bg-blue-500'}`}
                    />
                  )}
                  <div className="relative h-full p-6 flex flex-col justify-between z-10 text-white">
                    <h3 className="text-xl font-semibold group-hover:text-white/90 transition-colors">
                      {subcategory.fields.title}
                    </h3>
                    {subcategory.fields.description && (
                      <p className="text-white/80 line-clamp-2 text-sm">
                        {subcategory.fields.description}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Third Section */}
        {currentCategory.link3 && currentCategory.link3.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {currentCategory.linkTitle3}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentCategory.link3.map((subcategory) => (
                <Link
                  key={subcategory.fields.slug}
                  to={`/categorie/${category}/${subcategory.fields.slug}`}
                  className="relative rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group h-48"
                >
                  {subcategory.fields.backgroundImage ? (
                    <div 
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                      style={{ 
                        backgroundImage: `url(${subcategory.fields.backgroundImage.fields.file.url})`
                      }}
                    />
                  ) : (
                    <div 
                      className={`absolute inset-0 ${subcategory.fields.backgroundColor || 'bg-blue-500'}`}
                    />
                  )}
                  <div className="relative h-full p-6 flex flex-col justify-between z-10 text-white">
                    <h3 className="text-xl font-semibold group-hover:text-white/90 transition-colors">
                      {subcategory.fields.title}
                    </h3>
                    {subcategory.fields.description && (
                      <p className="text-white/80 line-clamp-2 text-sm">
                        {subcategory.fields.description}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

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