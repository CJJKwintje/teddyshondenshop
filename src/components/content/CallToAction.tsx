import React from 'react';
import { Link } from 'react-router-dom';
import { CallToActionBlock } from '../../types/content';

interface CallToActionProps {
  content: CallToActionBlock;
}

export default function CallToAction({ content }: CallToActionProps) {
  const { title, description, buttonText, buttonLink, variant = 'primary' } = content;

  return (
    <div className="py-16 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">{title}</h2>
        {description && (
          <p className="text-lg text-gray-600 mb-8">{description}</p>
        )}
        <Link
          to={buttonLink}
          className={`inline-flex px-8 py-3 rounded-full font-medium text-lg transition-colors ${
            variant === 'primary'
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
          }`}
        >
          {buttonText}
        </Link>
      </div>
    </div>
  );
}