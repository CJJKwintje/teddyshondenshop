import React from 'react';
import { X } from 'lucide-react';
import SearchFilters from './SearchFilters';

interface MobileFilterMenuProps {
  isOpen: boolean;
  onClose: () => void;
  availableBrands: string[];
  selectedBrands: string[];
  selectedPriceRanges: string[];
  productTypes?: string[];
  selectedTypes?: string[];
  onFilterChange: (type: 'price' | 'brand' | 'type', value: string) => void;
  onClearFilters: () => void;
}

export default function MobileFilterMenu({
  isOpen,
  onClose,
  availableBrands,
  selectedBrands,
  selectedPriceRanges,
  productTypes,
  selectedTypes,
  onFilterChange,
  onClearFilters,
}: MobileFilterMenuProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 lg:hidden">
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="pointer-events-auto w-screen max-w-md">
              <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                <div className="flex items-center justify-between px-4 py-6 border-b">
                  <h2 className="text-lg font-medium text-gray-900">Filters</h2>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <X className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="p-4">
                  <SearchFilters
                    availableBrands={availableBrands}
                    selectedBrands={selectedBrands}
                    selectedPriceRanges={selectedPriceRanges}
                    productTypes={productTypes}
                    selectedTypes={selectedTypes}
                    onFilterChange={onFilterChange}
                    onClearFilters={onClearFilters}
                  />
                </div>
                <div className="border-t border-gray-200 px-4 py-6">
                  <button
                    type="button"
                    className="w-full rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
                    onClick={onClose}
                  >
                    Toon resultaten
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}