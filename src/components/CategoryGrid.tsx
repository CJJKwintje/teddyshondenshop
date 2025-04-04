// Component for displaying a grid of category cards
import { Link } from 'react-router-dom';
import { useNavigation } from '../hooks/useNavigation';

export default function CategoryGrid() {
  const { categories: contentfulCategories } = useNavigation();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {contentfulCategories.map((category, index) => {
        const { categoryPage } = category;
        if (!categoryPage) return null;

        // Check if the category has a banner image
        const hasBannerImage = categoryPage.bannerImage?.fields?.file?.url;

        return (
          <Link
            key={index}
            to={`/categorie/${category.slug}`}
            className={`relative rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden group h-48 ${!hasBannerImage ? 'bg-[#84D4B4] hover:bg-[#6DBD9C]' : ''}`}
          >
            {/* Background image */}
            {hasBannerImage && (
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-105"
                style={{
                  backgroundImage: `url(${categoryPage.bannerImage?.fields?.file?.url})`,
                }}
              />
            )}

            {/* No overlay - showing images directly */}

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