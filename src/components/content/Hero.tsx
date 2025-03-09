import React from 'react';
import { HeroBlock } from '../../types/content';
import { Link } from 'react-router-dom';

interface HeroProps {
  content: HeroBlock;
}

export default function Hero({ content }: HeroProps) {
  const { 
    title, 
    subtitle, 
    image, 
    ctaText, 
    ctaLink,
    overlayOpacity = 60,
    height = 'default'
  } = content;

  return (
    <div 
      className={`relative overflow-hidden ${
        height === 'full' ? 'min-h-screen' : 'py-24'
      }`}
    >
      {image && (
        <>
          <div
            className="absolute inset-0 z-0 transform scale-105"
            style={{
              backgroundImage: `url(${image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div 
            className="absolute inset-0" 
            style={{ 
              backgroundColor: `rgba(17, 24, 39, ${overlayOpacity / 100})`
            }} 
          />
        </>
      )}
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center flex flex-col items-center justify-center h-full">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xl md:text-2xl text-gray-100 mb-8 max-w-2xl">
            {subtitle}
          </p>
        )}
        {ctaText && ctaLink && (
          <Link
            to={ctaLink}
            className="inline-flex bg-blue-500 text-white px-8 py-3 rounded-full font-medium text-lg hover:bg-blue-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            {ctaText}
          </Link>
        )}
      </div>
    </div>
  );
}