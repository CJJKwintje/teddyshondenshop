import React from 'react';
import { X } from 'lucide-react';

interface FilterProps {
  availableTags: string[];
  selectedTags: string[];
  selectedPriceRanges: string[];
  onFilterChange: (type: 'price' | 'tags', value: string) => void;
  onClearFilters: () => void;
}

const priceRanges = [
  { label: 'Onder €10', value: '0-10' },
  { label: '€10 - €20', value: '10-20' },
  { label: '€20 - €30', value: '20-30' },
  { label: '€30 - €40', value: '30-40' },
  { label: '€40 - €50', value: '40-50' },
  { label: 'Boven €50', value: '50-999' },
];

export default function SearchFilters({
  availableTags,
  selectedTags,
  selectedPriceRanges,
  onFilterChange,
  onClearFilters,
}: FilterProps) {
  const hasActiveFilters = selectedTags.length > 0 || selectedPriceRanges.length > 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <X size={16} />
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-4">Prijs</h3>
          <div className="space-y-3">
            {priceRanges.map(({ label, value }) => (
              <label
                key={value}
                className="flex items-center cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={selectedPriceRanges.includes(value)}
                  onChange={() => onFilterChange('price', value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-600 group-hover:text-gray-900">
                  {label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {availableTags.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-4">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => onFilterChange('tags', tag)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}