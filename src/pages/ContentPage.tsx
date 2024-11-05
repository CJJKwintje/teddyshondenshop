import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { getPageBySlug } from '../data/mockContent';
import Hero from '../components/content/Hero';
import ContentTextBlock from '../components/content/TextBlock';
import Quote from '../components/content/Quote';
import CallToAction from '../components/content/CallToAction';
import { getContentfulPage, getAllLegalPages, ContentfulPage } from '../services/contentful';
import ContentfulRichText from '../components/content/ContentfulRichText';
import SEO from '../components/SEO';
import { ContentBlock } from '../types/content';
import { Loader2 } from 'lucide-react';

export default function ContentPage() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const [contentfulData, setContentfulData] = useState<ContentfulPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [legalPages, setLegalPages] = useState<ContentfulPage[]>([]);

  const pathSlug = location.pathname.substring(1);
  const pageSlug = slug || pathSlug;
  const mockPage = getPageBySlug(pageSlug);

  useEffect(() => {
    const fetchLegalPages = async () => {
      setLoading(true);
      try {
        const pages = await getAllLegalPages();
        setLegalPages(pages);
        
        // Find matching page by slug or generated slug
        const matchingPage = pages.find(page => 
          page.slug === pageSlug || 
          page.slug.toLowerCase() === pageSlug.toLowerCase()
        );
        
        if (matchingPage) {
          setContentfulData(matchingPage);
        }
      } catch (err) {
        console.error('Error fetching legal pages:', err);
        setError('Er is een fout opgetreden bij het laden van de pagina.');
      } finally {
        setLoading(false);
      }
    };

    fetchLegalPages();
  }, [pageSlug]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <SEO 
          title="Laden..."
          description="Even geduld alstublieft."
          noindex={true}
        />
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <SEO 
          title="Fout"
          description="Er is een fout opgetreden bij het laden van de pagina."
          noindex={true}
        />
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Er is een fout opgetreden
          </h1>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  // Handle Contentful pages (including legal pages)
  if (contentfulData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SEO 
          title={contentfulData.title}
          description={`Lees meer over ${contentfulData.title.toLowerCase()}`}
          canonical={`https://teddyshondenshop.nl/${contentfulData.slug}`}
          type="article"
        />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">{contentfulData.title}</h1>
          <ContentfulRichText content={contentfulData.content} />
        </div>
      </div>
    );
  }

  if (!mockPage) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO 
        title={mockPage.seo.title}
        description={mockPage.seo.description}
        canonical={`https://teddyshondenshop.nl${location.pathname}`}
        type="article"
        image={mockPage.seo.image}
      />
      <div className="flex flex-col">{mockPage.blocks.map(renderBlock)}</div>
    </div>
  );
}