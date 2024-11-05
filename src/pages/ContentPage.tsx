import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { getPageBySlug } from '../data/mockContent';
import Hero from '../components/content/Hero';
import ContentTextBlock from '../components/content/TextBlock';
import Quote from '../components/content/Quote';
import CallToAction from '../components/content/CallToAction';
import SEO from '../components/SEO';
import { ContentBlock } from '../types/content';

export default function ContentPage() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  
  // Extract slug from pathname for direct routes
  const pathSlug = location.pathname.substring(1); // Remove leading slash
  const pageSlug = slug || pathSlug;
  
  const page = getPageBySlug(pageSlug);

  if (!page) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <SEO 
          title="Pagina niet gevonden"
          description="De opgevraagde pagina bestaat niet of is verwijderd."
          noindex={true}
        />
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Pagina niet gevonden
          </h1>
          <p className="text-gray-500">
            De opgevraagde pagina bestaat niet of is verwijderd.
          </p>
        </div>
      </div>
    );
  }

  const renderBlock = (block: ContentBlock) => {
    switch (block.type) {
      case 'hero':
        return <Hero key={block.id} content={block.content} />;
      case 'text':
        return <ContentTextBlock key={block.id} content={block.content} />;
      case 'quote':
        return <Quote key={block.id} content={block.content} />;
      case 'callToAction':
        return <CallToAction key={block.id} content={block.content} />;
      default:
        return null;
    }
  };

  const canonicalUrl = `https://teddyshondenshop.nl${location.pathname}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO 
        title={page.seo.title}
        description={page.seo.description}
        canonical={canonicalUrl}
        type="article"
        image={page.seo.image}
      />

      {/* Content Blocks */}
      <div className="flex flex-col">{page.blocks.map(renderBlock)}</div>
    </div>
  );
}