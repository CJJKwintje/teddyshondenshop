import React, { useState } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import SEO from '../components/SEO';
import OpenAI from 'openai';
import { searchProducts } from '../services/shopify';
import ProductRecommendation from '../components/ProductRecommendation';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hallo! Ik ben Teddy, je persoonlijke assistent voor hondenproducten. Hoe kan ik je vandaag helpen?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const openai = new OpenAI({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true
      });

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content: `Je bent Teddy, een vriendelijke en behulpzame assistent in een hondenshop. Je helpt klanten bij het kiezen van de juiste producten voor hun hond.

            WANNEER PRODUCTEN TONEN:
            1. Als de klant specifiek vraagt om een product (bijv. "Ik zoek diepvriesvoer")
            2. Als je genoeg informatie hebt over:
               - Het type product (voer, speelgoed, etc.)
               - De hond (leeftijd, grootte, etc. indien relevant)
            3. Als de klant aangeeft geen specifieke voorkeuren te hebben

            VOORBEELDEN WANNEER WEL PRODUCTEN TONEN:
            Klant: "Ik zoek diepvriesvoer"
            Jij: "Ik ga diepvriesvoer voor je zoeken. [SHOW_PRODUCTS]"

            Klant: "Mijn hond is 8 jaar en 20 kilo"
            Jij: "Ik ga geschikte voeding zoeken voor je volwassen hond van 20 kilo. [SHOW_PRODUCTS]"

            Klant: "Nee" (als antwoord op vraag over specifieke voorkeuren)
            Jij: "Prima, dan ga ik de beste opties voor je zoeken. [SHOW_PRODUCTS]"

            VOORBEELDEN WANNEER NIET PRODUCTEN TONEN:
            Klant: "Ik zoek voer voor mijn hond"
            Jij: "Ik help je graag. Hoe oud is je hond? Dan kan ik voer zoeken dat past bij de leeftijd."

            BELANGRIJK:
            - Voeg ALTIJD [SHOW_PRODUCTS] toe als je producten wilt tonen
            - Wees direct en to-the-point
            - Vraag alleen relevante informatie als het echt nodig is`
          },
          ...messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          {
            role: 'user',
            content: userMessage
          }
        ]
      });

      const botResponse = completion.choices[0].message.content;
      if (botResponse) {
        const shouldShowProducts = botResponse.includes('[SHOW_PRODUCTS]');
        const cleanResponse = botResponse.replace('[SHOW_PRODUCTS]', '').trim();
        
        if (shouldShowProducts) {
          // Use the entire conversation context for the search
          const searchContext = [...messages, { role: 'user', content: userMessage }]
            .map(msg => msg.content)
            .join(' ');
          
          const products = await searchProducts(searchContext);
          setRecommendedProducts(products);
        }

        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: cleanResponse
        }]);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, er is een fout opgetreden. Probeer het later opnieuw.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <SEO
        title="Chat met Teddy - Je Persoonlijke Hondenproduct Adviseur"
        description="Chat met Teddy, onze AI-assistent die je helpt bij het kiezen van de perfecte producten voor jouw hond."
        noindex={true}
      />

      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chat Window */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Header */}
              <div className="bg-[#63D7B2] p-4 flex items-center gap-3">
                <Bot className="w-6 h-6 text-white" />
                <h1 className="text-lg font-semibold text-white">Chat met Teddy</h1>
              </div>

              {/* Messages */}
              <div className="h-[600px] overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 ${
                      message.role === 'user' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.role === 'user'
                          ? 'bg-blue-100'
                          : 'bg-[#D9FFF3]'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <User className="w-5 h-5 text-blue-500" />
                      ) : (
                        <Bot className="w-5 h-5 text-[#47C09A]" />
                      )}
                    </div>
                    <div
                      className={`rounded-lg p-4 max-w-[80%] ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="whitespace-pre-line">{message.content}</div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#D9FFF3] flex items-center justify-center">
                      <Bot className="w-5 h-5 text-[#47C09A]" />
                    </div>
                    <div className="bg-gray-100 rounded-lg p-4">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSubmit} className="p-4 border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Stel je vraag aan Teddy..."
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#63D7B2]"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="bg-[#63D7B2] text-white px-4 py-2 rounded-lg hover:bg-[#47C09A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Product Recommendations */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Aanbevolen Producten
              </h2>
              {recommendedProducts.length > 0 ? (
                <ProductRecommendation products={recommendedProducts} />
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>Vertel me meer over je hond en wat je zoekt, dan kan ik je de beste producten aanbevelen.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}