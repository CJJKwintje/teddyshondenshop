import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFooterContent } from '../hooks/useFooterContent';
import { Loader2 } from 'lucide-react';
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import { FooterLink } from '../services/contentful';

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

  const handleLinkClick = (link: FooterLink) => (e: React.MouseEvent) => {
    e.preventDefault();
    
    // For legal pages, use the link field directly
    if (link.fields.contentModel === 'legalPage') {
      navigate(`/${link.fields.link}`);
    } else {
      // For regular links
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
            <div className="prose prose-invert max-w-none mb-4">
              {documentToReactComponents(col1Text)}
            </div>
            <div className="flex flex-col space-y-2">
              {col1?.map((item, index) => (
                <a
                  key={index}
                  href={item.fields.link}
                  onClick={handleLinkClick(item)}
                  className="text-gray-400 hover:text-white transition-colors"
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
                  href={item.fields.link}
                  onClick={handleLinkClick(item)}
                  className="text-gray-400 hover:text-white transition-colors"
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
                  href={item.fields.link}
                  onClick={handleLinkClick(item)}
                  className="text-gray-400 hover:text-white transition-colors"
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