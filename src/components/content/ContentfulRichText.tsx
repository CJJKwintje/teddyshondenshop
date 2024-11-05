import React from 'react';
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import { Document, BLOCKS, MARKS } from '@contentful/rich-text-types';

interface ContentfulRichTextProps {
  content: Document;
}

export default function ContentfulRichText({ content }: ContentfulRichTextProps) {
  const options = {
    renderNode: {
      [BLOCKS.PARAGRAPH]: (node: any, children: React.ReactNode) => (
        <p className="mb-6 leading-relaxed">{children}</p>
      ),
      [BLOCKS.HEADING_1]: (node: any, children: React.ReactNode) => (
        <h1 className="text-3xl font-bold mb-6">{children}</h1>
      ),
      [BLOCKS.HEADING_2]: (node: any, children: React.ReactNode) => (
        <h2 className="text-2xl font-bold mb-4 mt-8">{children}</h2>
      ),
      [BLOCKS.HEADING_3]: (node: any, children: React.ReactNode) => (
        <h3 className="text-xl font-bold mb-4 mt-6">{children}</h3>
      ),
      [BLOCKS.UL_LIST]: (node: any, children: React.ReactNode) => (
        <ul className="list-disc pl-6 mb-6 space-y-2">{children}</ul>
      ),
      [BLOCKS.OL_LIST]: (node: any, children: React.ReactNode) => (
        <ol className="list-decimal pl-6 mb-6 space-y-2">{children}</ol>
      ),
      [BLOCKS.LIST_ITEM]: (node: any, children: React.ReactNode) => (
        <li className="leading-relaxed">{children}</li>
      ),
    },
    renderMark: {
      [MARKS.BOLD]: (text: React.ReactNode) => (
        <strong className="font-bold">{text}</strong>
      ),
      [MARKS.ITALIC]: (text: React.ReactNode) => (
        <em className="italic">{text}</em>
      ),
      [MARKS.UNDERLINE]: (text: React.ReactNode) => (
        <span className="underline">{text}</span>
      ),
    },
  };

  return (
    <div className="prose prose-lg prose-blue max-w-none space-y-4">
      {documentToReactComponents(content, options)}
    </div>
  );
}