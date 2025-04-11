import React, { useState, useEffect } from 'react';

// Add helper function to format text display
const formatDisplayText = (text: string): string => {
  // Split by spaces and handle each word
  return text.split(' ').map(word => {
    // Handle special cases like "K9" or other specific brand formatting
    if (word === 'K9') return word;
    
    // Convert to lowercase and capitalize first letter
    return word.toLowerCase().replace(/^\w/, c => c.toUpperCase());
  }).join(' ');
};

interface FilterProps {
  availableBrands?: string[];
  selectedBrands?: string[];
  selectedPriceRanges: string[];
  onFilterChange: (type: 'price' | 'brand' | 'type', value: string) => void;
  onClearFilters: () => void;
}

export default function SearchFilters({
  availableBrands = [],
  selectedBrands = [],
  selectedPriceRanges,
  onFilterChange,
  onClearFilters,
}: FilterProps) {
  const [showAllBrands, setShowAllBrands] = useState(false);

  const hasActiveFilters = selectedPriceRanges.length > 0 || 
                          selectedBrands.length > 0;

  // Get visible brands based on showAllBrands state
  const visibleBrands = showAllBrands ? availableBrands : availableBrands.slice(0, 5);
  const hasMoreBrands = availableBrands.length > 5;

  // Predefined price ranges
  const priceRanges = [
    { label: 'Tot €25', value: '0-25' },
    { label: '€25 - €50', value: '25-50' },
    { label: '€50 - €75', value: '50-75' },
    { label: '€75 - €100', value: '75-100' },
    { label: 'Meer dan €100', value: '100-1000' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Wis filters
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Brand Filter */}
        {availableBrands.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-4">Merk</h3>
            <div className="space-y-3">
              {visibleBrands.map((brand) => (
                <label
                  key={brand}
                  className="flex items-center cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand)}
                    onChange={() => onFilterChange('brand', brand)}
                    className="w-4 h-4 border-gray-300 text-[#63D7B2] focus:ring-[#63D7B2] focus:ring-offset-0 checked:bg-[#63D7B2] checked:border-[#63D7B2] accent-[#63D7B2] border-2"
                    style={{ accentColor: '#63D7B2', borderColor: '#D1FAE5' }}
                  />
                  <span className="ml-3 text-sm text-gray-600 group-hover:text-gray-900">
                    {formatDisplayText(brand)}
                  </span>
                </label>
              ))}
              
              {hasMoreBrands && (
                <button
                  onClick={() => setShowAllBrands(!showAllBrands)}
                  className="flex items-center text-sm text-[#63D7B2] hover:text-[#4CAF8F] mt-2 group"
                >
                  <span>{showAllBrands ? 'Minder tonen' : 'Meer tonen'}</span>
                  <svg
                    className={`ml-1 w-4 h-4 transform transition-transform ${
                      showAllBrands ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Price Filter */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-4">Prijs</h3>
          <div className="space-y-3">
            {priceRanges.map((range) => (
              <label
                key={range.value}
                className="flex items-center cursor-pointer group"
              >
                <input
                  type="radio"
                  name="price-range"
                  checked={selectedPriceRanges.includes(range.value)}
                  onChange={() => onFilterChange('price', range.value)}
                  className="w-4 h-4 border-gray-300 text-[#63D7B2] focus:ring-[#63D7B2] focus:ring-offset-0 checked:bg-[#63D7B2] checked:border-[#63D7B2] accent-[#63D7B2] border-2"
                  style={{ accentColor: '#63D7B2', borderColor: '#D1FAE5' }}
                />
                <span className="ml-3 text-sm text-gray-600 group-hover:text-gray-900">
                  {range.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}