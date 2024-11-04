import React from 'react';
import { ImageOff } from 'lucide-react';

interface ProductImageProps {
  imageUrl: string;
  altText: string;
  title: string;
}

export default function ProductImage({ imageUrl, altText, title }: ProductImageProps) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  return (
    <div className="relative pb-[100%] bg-gray-100 overflow-hidden group">
      {!hasError ? (
        <>
          {isLoading && (
            <div className="absolute inset-0 animate-pulse bg-gray-200" />
          )}
          <img
            src={imageUrl}
            alt={altText || title}
            onLoad={() => setIsLoading(false)}
            onError={() => setHasError(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
          />
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <ImageOff className="w-8 h-8 text-gray-400" />
        </div>
      )}
    </div>
  );
}