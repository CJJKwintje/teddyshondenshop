import React from 'react';
import { Link } from 'react-router-dom';
import { CallToActionBlock } from '../../types/content';

interface CallToActionProps {
  content: CallToActionBlock;
}

export default function CallToAction({ content }: CallToActionProps) {
  const { 
    title, 
    description, 
    buttonText, 
    buttonLink, 
    variant = 'primary',
    background = 'white'
  } = content;

  return (
    <div className={`py-16 px-4 ${background === 'gray' ? 'bg-gray-50' : ''}`}>
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          {title}
        </h2>
        {description && (
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {description}
          </p>
        )}
        <Link
          to={buttonLink}
          className={`inline-flex px-8 py-3 rounded-full font-medium text-lg transition-all shadow-sm hover:shadow-md ${
            variant === 'primary'
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          {buttonText}
        </Link>
      </div>
    </div>
  );
}