import React, { useEffect, useState } from 'react';
import { getFAQPage } from '../services/contentful';
import { FAQPage as FAQPageType } from '../types/content';
import ContentfulRichText from '../components/content/ContentfulRichText';
import SEO from '../components/SEO';
import { Loader2, ChevronDown } from 'lucide-react';

export default function FAQPage() {
  const [faqPage, setFaqPage] = useState<FAQPageType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchFAQPage = async () => {
      try {
        const page = await getFAQPage('veelgestelde-vragen');
        if (page) {
          setFaqPage(page);
        } else {
          setError('FAQ pagina niet gevonden');
        }
      } catch (err) {
        console.error('Error fetching FAQ page:', err);
        setError('Er is een fout opgetreden bij het laden van de FAQ pagina.');
      } finally {
        setLoading(false);
      }
    };

    fetchFAQPage();
  }, []);

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  // Create FAQ structured data
  const faqStructuredData = faqPage ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqPage.categories.flatMap(category => 
      category.questions.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer.content.map((node: any) => 
            node.content?.map((content: any) => content.value).join(' ') || ''
          ).join(' ')
        }
      }))
    )
  } : null;

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
          description="Er is een fout opgetreden bij het laden van de FAQ pagina."
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

  if (!faqPage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <SEO 
          title="Pagina niet gevonden"
          description="De opgevraagde FAQ pagina bestaat niet of is verwijderd."
          noindex={true}
        />
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Pagina niet gevonden
          </h1>
          <p className="text-gray-500">
            De opgevraagde FAQ pagina bestaat niet of is verwijderd.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO 
        title={faqPage.title}
        description={`${faqPage.title} - Teddy's Hondenshop`}
        canonical={`https://teddyshondenshop.nl/veelgestelde-vragen`}
        type="article"
      />
      {faqStructuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
        />
      )}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{faqPage.title}</h1>
        
        {faqPage.categories.map((category) => (
          <div key={category.slug} className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">{category.title}</h2>
            <div className="space-y-4">
              {category.questions.map((faq, index) => {
                const questionId = `${category.slug}-${faq.anchorId || index}`;
                const isExpanded = expandedQuestions.has(questionId);
                
                return (
                  <div key={questionId} className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <button
                      onClick={() => toggleQuestion(questionId)}
                      className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 focus:outline-none"
                      aria-expanded={isExpanded ? 'true' : 'false'}
                      aria-controls={`answer-${questionId}`}
                    >
                      <h3 className="text-lg font-medium text-gray-900">{faq.question}</h3>
                      <ChevronDown 
                        className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                    <div
                      id={`answer-${questionId}`}
                      className={`px-6 transition-all duration-200 ease-in-out ${
                        isExpanded ? 'max-h-[2000px] opacity-100 py-4' : 'max-h-0 opacity-0'
                      } overflow-hidden`}
                      role="region"
                      aria-labelledby={`question-${questionId}`}
                    >
                      <div className="prose prose-sm max-w-none">
                        <ContentfulRichText content={faq.answer} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 