import React from 'react';

// QuoteBlock represents the structure of the quote content, including the quote text, author, and their role.
import { QuoteBlock } from '../../types/content';

interface QuoteProps {
  content: QuoteBlock;
}

export default function Quote({ content }: QuoteProps) {
  const { quote = 'No quote provided', author = 'Unknown author', role = 'Unknown role' } = content;

  return (
    <blockquote>
      <p>{quote}</p>
      <footer>
        - {author}, <cite>{role}</cite>
      </footer>
    </blockquote>
  );
}
