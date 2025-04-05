import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
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
  const [isMobile, setIsMobile] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1280);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    }
    if (isRightSwipe) {
      prevSlide();
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  const nextSlide = () => {
    if (!isMobile) return;
    setCurrentIndex((prevIndex) => 
      prevIndex + 1 >= banners.length ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    if (!isMobile) return;
    setCurrentIndex((prevIndex) => 
      prevIndex - 1 < 0 ? banners.length - 1 : prevIndex - 1
    );
  };

  if (banners.length === 0) return null;

  // Only show navigation on mobile
  const needsNavigation = isMobile && banners.length > 2;

  return (
    <div className="relative">
      {/* Navigation Buttons */}
      {needsNavigation && (
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
        className="relative overflow-hidden"
      >
        <div 
          className={`${
            isMobile 
              ? 'flex gap-6 transition-transform duration-300 ease-in-out' 
              : 'grid grid-cols-3 gap-6'
          }`}
          style={isMobile ? { transform: `translateX(-${currentIndex * 50}%)` } : undefined}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {banners.map((banner, index) => (
            <div
              key={banner.orderId}
              className={`${
                isMobile 
                  ? 'w-[calc(50%-12px)] flex-shrink-0' 
                  : 'w-full'
              } ${getBackgroundColor(banner.backgroundColor)} rounded-lg overflow-hidden relative min-h-[200px] md:min-h-[300px] group`}
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
              <div className="relative z-10 p-5 md:p-6 h-full flex flex-col justify-between">
                <div>
                  {banner.orderId < 3 && (
                    <h2 className="text-2xl md:text-4xl font-bold text-white mb-4 font-heading">
                      {banner.title}
                    </h2>
                  )}
                  {banner.description && (
                    <div className="text-[17px] md:text-[21px] text-white prose prose-invert prose-lg md:prose-xl font-sans">
                      <ReactMarkdown>{banner.description}</ReactMarkdown>
                    </div>
                  )}
                </div>
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
      </div>

      {/* Dots Indicator */}
      {needsNavigation && (
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