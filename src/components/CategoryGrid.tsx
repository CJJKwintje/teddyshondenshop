import React from 'react';
import { Link } from 'react-router-dom';
import { useNavigation } from '../hooks/useNavigation';
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';

export default function CategoryGrid() {
  const { categories: contentfulCategories } = useNavigation();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {contentfulCategories.map((category, index) => {
        const { categoryPage } = category;
        if (!categoryPage) return null;

        const backgroundImage = categoryPage.bannerImage?.fields.file.url;

        return (
          <Link
            key={index}
            to={`/categorie/${category.slug}`}
            className="relative rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group h-48"
          >
            {backgroundImage ? (
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                style={{ 
                  backgroundImage: `url(${backgroundImage})`,
                  filter: 'brightness(0.8)'
                }}
              />
            ) : (
              <div className="absolute inset-0 bg-gray-500" />
            )}
            <div className="relative h-full p-3 min-[450px]:p-6 flex flex-col justify-between z-10 text-white">
              <div className="flex items-start gap-3">
                <h3 className="text-lg min-[450px]:text-xl font-semibold group-hover:text-white/90 transition-colors">
                  {categoryPage.bannerTitle || categoryPage.title}
                </h3>
              </div>
              <p className="text-white line-clamp-2 text-xs min-[450px]:text-sm">
                {categoryPage.bannerSubtitle || (categoryPage.description ? documentToReactComponents(categoryPage.description) : '')}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
} 