import React from 'react';
import { X } from 'lucide-react';

interface ActiveFilterTagsProps {
  selectedBrands: string[];
  selectedPriceRanges: string[];
  onRemoveFilter: (type: 'price' | 'brand', value: string) => void;
}

export default function ActiveFilterTags({
  selectedBrands,
  selectedPriceRanges,
  onRemoveFilter,
}: ActiveFilterTagsProps) {
  if (selectedBrands.length === 0 && selectedPriceRanges.length === 0) {
    return null;
  }

  const formatPriceRange = (range: string) => {
    const [min, max] = range.split('-').map(Number);
    return `Tot €${max}`;
  };

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {selectedBrands.map((brand) => (
        <button
          key={brand}
          onClick={() => onRemoveFilter('brand', brand)}
          className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
        >
          {brand}
          <X className="w-4 h-4" />
        </button>
      ))}
      {selectedPriceRanges.map((range) => (
        <button
          key={range}
          onClick={() => onRemoveFilter('price', range)}
          className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
        >
          {formatPriceRange(range)}
          <X className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
} 