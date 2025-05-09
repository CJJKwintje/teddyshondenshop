import React from 'react';
import { useContentfulBanners, useContentfulBrands } from '../../hooks/useContentfulData';

export const ContentfulDataTest: React.FC = () => {
  const { data: banners, isLoading: bannersLoading } = useContentfulBanners();
  const { data: brands, isLoading: brandsLoading } = useContentfulBrands();

  if (bannersLoading || brandsLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Contentful Data Test</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Banners</h3>
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(banners, null, 2)}
        </pre>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Brands</h3>
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(brands, null, 2)}
        </pre>
      </div>
    </div>
  );
}; 