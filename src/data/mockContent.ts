import { ContentPage } from '../types/content';

export const mockPages: ContentPage[] = [
  {
    id: '1',
    slug: 'over-ons',
    title: 'Over Happy Huisdier',
    description: 'Leer meer over onze passie voor huisdieren',
    seo: {
      title: 'Over Ons | Happy Huisdier',
      description: 'Ontdek het verhaal achter Happy Huisdier en onze missie om het beste voor jouw huisdier te bieden.',
    },
    blocks: [
      {
        id: 'hero-1',
        type: 'hero',
        content: {
          title: 'Teddys',
          subtitle: 'Al meer dan 10 jaar de beste zorg voor jouw huisdier',
          image: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&q=80',
          ctaText: 'Ontdek ons verhaal',
          ctaLink: '#ons-verhaal'
        }
      },
      {
        id: 'text-1',
        type: 'text',
        content: {
          content: `
            <h2>Ons Verhaal</h2>
            <p>Happy Huisdier begon in 2012 met een simpele missie: het leveren van de beste producten voor huisdieren tegen eerlijke prijzen. We begrijpen dat huisdieren deel uitmaken van het gezin en verdienen daarom alleen het beste.</p>
            <p>Onze expertise en passie voor dieren zorgt ervoor dat we altijd op zoek zijn naar de beste en meest innovatieve producten voor jouw huisdier.</p>
          `,
          alignment: 'left'
        }
      },
      {
        id: 'quote-1',
        type: 'quote',
        content: {
          quote: "Onze huisdieren verdienen het allerbeste, en dat is precies wat wij bieden.",
          author: "Emma de Vries",
          role: "Oprichter Happy Huisdier"
        }
      },
      {
        id: 'cta-1',
        type: 'callToAction',
        content: {
          title: "Klaar om te beginnen?",
          description: "Ontdek ons uitgebreide assortiment aan premium huisdierproducten.",
          buttonText: "Bekijk onze producten",
          buttonLink: "/products",
          variant: "primary"
        }
      }
    ]
  }
];

export const getPageBySlug = (slug: string): ContentPage | undefined => {
  return mockPages.find(page => page.slug === slug);
};