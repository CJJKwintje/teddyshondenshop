import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNavigation } from '../hooks/useNavigation';
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';

interface CategorySliderProps {
  categories: {
    icon: React.FC<{ size: number; className: string }>;
    title: string;
    description: string;
    path: string;
    color: string;
    overlay?: string;
  }[];
}

export default function CategorySlider({ categories }: CategorySliderProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { categories: contentfulCategories } = useNavigation();

  // Check scroll position on mount and when content changes
  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      setScrollPosition(container.scrollLeft);
    }
  }, [contentfulCategories]);

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const container = containerRef.current;
      const scrollAmount = direction === 'left' ? -container.offsetWidth : container.offsetWidth;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setScrollPosition(container.scrollLeft + scrollAmount);
    }
  };

  const showLeftArrow = scrollPosition > 0;
  const showRightArrow = containerRef.current
    ? containerRef.current.scrollWidth - containerRef.current.clientWidth > scrollPosition
    : true;

  return (
    <div className="relative">
      {showLeftArrow && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            scroll('left');
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
        {contentfulCategories.map((category, index) => {
          const { categoryPage } = category;
          if (!categoryPage) return null;

          const backgroundImage = categoryPage.bannerImage?.fields.file.url;

          return (
            <Link
              key={index}
              to={`/categorie/${category.slug}`}
              className="flex-none w-[calc(85%-1rem)] sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1rem)] xl:w-[calc(25%-1rem)] snap-start relative rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group h-48 sm:h-48"
            >
              {backgroundImage ? (
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                  style={{ 
                    backgroundImage: `url(${backgroundImage})`,
                    filter: 'brightness(0.7)'
                  }}
                >
                  {category.overlay && (
                    <div className={`${category.overlay} absolute inset-0`} />
                  )}
                </div>
              ) : (
                <div className="absolute inset-0 bg-gray-500" />
              )}
              <div className="relative h-full p-6 flex flex-col justify-between z-10 text-white">
                <div className="flex items-start gap-3">
                  <h3 className="text-xl font-semibold group-hover:text-white/90 transition-colors">
                    {categoryPage.bannerTitle || categoryPage.title}
                  </h3>
                </div>
                <p className="text-white/80 line-clamp-2 text-sm">
                  {categoryPage.bannerSubtitle || (categoryPage.description ? documentToReactComponents(categoryPage.description) : '')}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {showRightArrow && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            scroll('right');
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-6 h-6 text-gray-600" />
        </button>
      )}
    </div>
  );
}