import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFooterContent } from '../hooks/useFooterContent';
import { Loader2 } from 'lucide-react';
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import { FooterLink } from '../services/contentful';
import { BLOCKS } from '@contentful/rich-text-types';

const richTextOptions = {
  renderNode: {
    [BLOCKS.PARAGRAPH]: (node: any, children: any) => (
      <p className="text-gray-400 mb-4 whitespace-pre-line leading-relaxed">{children}</p>
    )
  }
};

export default function Footer() {
  const { 
    col1Title, 
    col1, 
    col1Text,
    col2title, 
    col2,
    col3title, 
    col3,
    isLoading, 
    error 
  } = useFooterContent();
  const navigate = useNavigate();

  const handleLinkClick = (link: any) => (e: React.MouseEvent) => {
    e.preventDefault();
    
    // For legal pages, use the link field directly
    if (link.fields.contentModel === 'legalPage') {
      navigate(`/${link.fields.link}`);
    } 
    // For category pages, use the slug field
    else if (link.fields.slug) {
      navigate(`/categorie/${link.fields.slug}`);
    }
    // For regular links
    else {
      navigate(link.fields.link);
    }
  };

  if (isLoading) {
    return (
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        </div>
      </footer>
    );
  }

  if (error) {
    return null;
  }

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1 */}
          <div>
            <h3 className="text-xl font-semibold mb-4">{col1Title}</h3>
            <div className="mb-4">
              {documentToReactComponents(col1Text, richTextOptions)}
            </div>
            <div className="flex flex-col space-y-2">
              {col1?.map((item, index) => (
                <a
                  key={index}
                  href={item.fields.slug ? `/categorie/${item.fields.slug}` : item.fields.link}
                  onClick={handleLinkClick(item)}
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  {item.fields.title}
                </a>
              ))}
            </div>
          </div>

          {/* Column 2 */}
          <div>
            <h3 className="text-xl font-semibold mb-4">{col2title}</h3>
            <div className="flex flex-col space-y-2">
              {col2?.map((item, index) => (
                <a
                  key={index}
                  href={item.fields.slug ? `/categorie/${item.fields.slug}` : item.fields.link}
                  onClick={handleLinkClick(item)}
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  {item.fields.title}
                </a>
              ))}
            </div>
          </div>

          {/* Column 3 */}
          <div>
            <h3 className="text-xl font-semibold mb-4">{col3title}</h3>
            <div className="flex flex-col space-y-2">
              {col3?.map((item, index) => (
                <a
                  key={index}
                  href={item.fields.slug ? `/categorie/${item.fields.slug}` : item.fields.link}
                  onClick={handleLinkClick(item)}
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  {item.fields.title}
                </a>
              ))}
            </div>
          </div>

          {/* Webwinkelkeur Widget */}
          <div className="flex justify-end">
            <valued-widget layout="reviews" size="small" align="center" theme="dark" amount="3"></valued-widget>
          </div>
        </div>
      </div>
    </footer>
  );
}