import React from 'react';
import { QuoteBlock } from '../../types/content';

interface QuoteProps {
  content: QuoteBlock;
}

export default function Quote({ content }: QuoteProps) {
  const { quote = 'No quote provided', author = 'Unknown author', role = 'Unknown role' } = content;

  return (
    <div className="py-12 px-4">
      <blockquote className="max-w-4xl mx-auto relative pl-4 border-l-4 border-blue-500">
        <p className="text-xl md:text-2xl font-medium text-gray-900 mb-4">
          "{quote}"
        </p>
        <footer className="text-gray-600">
          <span className="font-medium text-gray-900">{author}</span>
          {role && (
            <>, <cite className="not-italic text-gray-600">{role}</cite></>
          )}
        </footer>
      </blockquote>
    </div>
  );
}