import React, { useState, useEffect } from 'react';

interface FilterProps {
  availableBrands?: string[];
  selectedBrands?: string[];
  selectedPriceRanges: string[];
  productTypes?: string[];
  selectedTypes?: string[];
  onFilterChange: (type: 'price' | 'brand' | 'type', value: string) => void;
  onClearFilters: () => void;
}

export default function SearchFilters({
  availableBrands = [],
  selectedBrands = [],
  selectedPriceRanges,
  productTypes = [],
  selectedTypes = [],
  onFilterChange,
  onClearFilters,
}: FilterProps) {
  // Get current price from selectedPriceRanges
  const getCurrentPrice = () => {
    if (selectedPriceRanges.length === 0) return 100;
    const [min, max] = selectedPriceRanges[0].split('-').map(Number);
    return max;
  };

  const [currentPrice, setCurrentPrice] = useState(getCurrentPrice());

  // Update currentPrice when selectedPriceRanges changes
  useEffect(() => {
    setCurrentPrice(getCurrentPrice());
  }, [selectedPriceRanges]);

  // Handle slider change
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setCurrentPrice(value);
    onFilterChange('price', '0-' + value);
  };

  const hasActiveFilters = selectedPriceRanges.length > 0 || 
                          selectedBrands.length > 0 || 
                          selectedTypes.length > 0;

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
        {/* Type Filter - Only show for categories with productTypes */}
        {productTypes.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-4">Type</h3>
            <div className="space-y-3">
              {productTypes.map((type) => (
                <label
                  key={type}
                  className="flex items-center cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type)}
                    onChange={() => onFilterChange('type', type)}
                    className="w-4 h-4 text-[#63D7B2] border-gray-300 rounded focus:ring-[#63D7B2]"
                  />
                  <span className="ml-3 text-sm text-gray-600 group-hover:text-gray-900">
                    {type}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Price Filter */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-4">Maximale prijs</h3>
          <div className="space-y-4">
            <div className="flex justify-end items-center">
              <span className="text-sm font-medium text-gray-900">€{currentPrice}</span>
            </div>
            
            {/* Price Slider */}
            <label htmlFor="priceRange" className="sr-only">Maximale prijs</label>
            <input
              id="priceRange"
              type="range"
              min={0}
              max={100}
              value={currentPrice}
              onChange={handleSliderChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#63D7B2]"
            />
            
            <div className="flex justify-between text-xs text-gray-500">
              <span>€0</span>
              <span>€100</span>
            </div>
          </div>
        </div>

        {/* Brand Filter */}
        {availableBrands.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-4">Merk</h3>
            <div className="space-y-3">
              {availableBrands.map((brand) => (
                <label
                  key={brand}
                  className="flex items-center cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand)}
                    onChange={() => onFilterChange('brand', brand)}
                    className="w-4 h-4 text-[#63D7B2] border-gray-300 rounded focus:ring-[#63D7B2]"
                  />
                  <span className="ml-3 text-sm text-gray-600 group-hover:text-gray-900">
                    {brand}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}