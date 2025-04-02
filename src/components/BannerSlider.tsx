import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { HomepageBanner } from '../services/contentful';

interface BannerSliderProps {
  banners: HomepageBanner[];
}

const getBackgroundColor = (color?: string) => {
  if (!color) return 'bg-sky-500';

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

export default function BannerSlider({ banners }: BannerSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex + 1 >= banners.length ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex - 1 < 0 ? banners.length - 1 : prevIndex - 1
    );
  };

  if (banners.length === 0) return null;

  return (
    <div className="relative">
      {/* Navigation Buttons */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>
        </>
      )}

      {/* Slider Container */}
      <div 
        ref={sliderRef}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 overflow-hidden"
      >
        {banners.map((banner, index) => (
          <div
            key={banner.orderId}
            className={`rounded-2xl overflow-hidden relative min-h-[200px] md:min-h-[300px] group transition-transform duration-300 ${
              index === currentIndex
                ? 'translate-x-0'
                : 'translate-x-full'
            } ${getBackgroundColor(banner.backgroundColor)}`}
          >
            {banner.backgroundImage?.fields?.file?.url && (
              <div 
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${banner.backgroundImage.fields.file.url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            )}
            <div className="relative z-10 p-6 md:p-8 h-full flex flex-col justify-center">
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">
                {banner.title}
              </h2>
              {banner.description && (
                <p className="text-lg text-white mb-6">{banner.description}</p>
              )}
              <Link
                to={banner.buttonLink}
                className="inline-flex bg-white text-gray-900 px-4 md:px-6 py-2 md:py-3 rounded-full font-medium hover:bg-gray-50 transition-colors w-fit text-sm md:text-base"
              >
                {banner.buttonText}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Dots Indicator */}
      {banners.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-gray-900' : 'bg-gray-300'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
} 