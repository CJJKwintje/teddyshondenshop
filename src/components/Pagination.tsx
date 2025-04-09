import React from 'react';

interface LoadMoreProps {
  hasMore: boolean;
  onLoadMore: () => void;
  isLoading?: boolean;
  itemsPerPage?: number; // Nieuwe prop toegevoegd
}

export default function PaginationButton({ hasMore, onLoadMore, isLoading = false }: LoadMoreProps) { // Naam van het component gewijzigd
  if (!hasMore) return null;

  return (
    <div className="flex items-center justify-center mt-8">
      <button
        onClick={onLoadMore}
        disabled={isLoading}
        className={`px-6 py-3 rounded-lg transition-colors ${
          isLoading
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-black text-white hover:bg-gray-800'
        }`}
      >
        {isLoading ? 'Laden...' : 'Laad meer'}
      </button>
    </div>
  );
}