import React from 'react';
import { TextBlock as TextBlockType } from '../../types/content';

interface TextBlockProps {
  content: TextBlockType;
}

export default function ContentTextBlock({ content }: TextBlockProps) {
  const { content: html, alignment = 'left' } = content;

  return (
    <div className="py-12 px-4">
      <div 
        className={`max-w-4xl mx-auto prose prose-lg prose-blue prose-img:rounded-xl prose-headings:font-bold ${
          alignment === 'center' ? 'text-center mx-auto' :
          alignment === 'right' ? 'ml-auto' : ''
        }`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}