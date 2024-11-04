import React from 'react';
import { HeroBlock } from '../../types/content';
import { Link } from 'react-router-dom';

interface HeroProps {
  content: HeroBlock;
}

export default function Hero({ content }: HeroProps) {
  const { title, subtitle, image, ctaText, ctaLink } = content;

  return (
    <div className="relative py-24 overflow-hidden">
      {image && (
        <>
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: `url(${image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute inset-0 bg-gray-900/60" />
        </>
      )}
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xl text-gray-100 mb-8">
            {subtitle}
          </p>
        )}
        {ctaText && ctaLink && (
          <Link
            to={ctaLink}
            className="inline-flex bg-blue-500 text-white px-8 py-3 rounded-full font-medium hover:bg-blue-600 transition-colors"
          >
            {ctaText}
          </Link>
        )}
      </div>
    </div>
  );
}