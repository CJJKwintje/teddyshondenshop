import React from 'react';
import { Tag } from 'lucide-react';

interface ProductBadgeProps {
  category: string;
}

export default function ProductBadge({ category }: ProductBadgeProps) {
  return (
    <div className="absolute top-2 left-2 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full shadow-sm flex items-center gap-1">
      <Tag className="w-3 h-3 text-blue-500" />
      <span className="text-xs font-medium text-gray-700">{category}</span>
    </div>
  );
}