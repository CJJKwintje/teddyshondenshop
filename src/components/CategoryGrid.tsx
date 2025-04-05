// Component for displaying a grid of category cards
import { Link } from 'react-router-dom';
import { useNavigation } from '../hooks/useNavigation';

export default function CategoryGrid() {
  const { categories: contentfulCategories } = useNavigation();

  // Debug log
  console.log('CategoryGrid - Categories:', contentfulCategories);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {contentfulCategories.map((category, index) => {
        const { categoryPage } = category;
        if (!categoryPage) return null;

        // Debug log for each category
        console.log(`Category ${index}:`, {
          title: categoryPage.title,
          bannerImage: categoryPage.bannerImage,
          bannerBackgroundColor: categoryPage.bannerBackgroundColor
        });

        // Get background color
        const backgroundColor = categoryPage.bannerBackgroundColor ? `#${categoryPage.bannerBackgroundColor}` : '#84D4B4';

        // Get image URLs
        const desktopImageUrl = categoryPage.bannerImage?.fields?.file?.url;
        const mobileImageUrl = categoryPage.bannerImageMobile?.fields?.file?.url;

        return (
          <Link
            key={index}
            to={`/categorie/${category.slug}`}
            className="relative rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden group h-48"
            style={{
              backgroundColor,
            } as React.CSSProperties}
          >
            {/* Background image - always render if available, will be transparent */}
            {(desktopImageUrl || mobileImageUrl) && (
              <>
                {/* Mobile image */}
                {mobileImageUrl && (
                  <div
                    className="absolute inset-0 bg-cover bg-center min-[450px]:hidden"
                    style={{
                      backgroundImage: `url(${mobileImageUrl})`,
                    }}
                  />
                )}
                {/* Desktop image */}
                {desktopImageUrl && (
                  <div
                    className="absolute inset-0 bg-cover bg-center hidden min-[450px]:block"
                    style={{
                      backgroundImage: `url(${desktopImageUrl})`,
                    }}
                  />
                )}
              </>
            )}

            {/* Content */}
            <div className="relative h-full flex flex-col z-10 text-white p-4">
              <h3 className="text-lg min-[450px]:text-xl font-bold group-hover:text-white/90 transition-colors text-left]">
                {categoryPage.bannerTitle || categoryPage.title}
              </h3>
            </div>
          </Link>
        );
      })}
    </div>
  );
}