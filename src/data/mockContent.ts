import { ContentPage } from '../types/content';

export const mockPages: ContentPage[] = [
  {
    id: '1',
    slug: 'over-ons',
    title: 'Over Happy Huisdier',
    description: 'Leer meer over onze passie voor huisdieren',
    seo: {
      title: 'Over Ons | Happy Huisdier',
      description:
        'Ontdek het verhaal achter Happy Huisdier en onze missie om het beste voor jouw huisdier te bieden.',
    },
    blocks: [
      {
        id: 'hero-1',
        type: 'hero',
        content: {
          title: 'Teddys',
          subtitle: 'Al meer dan 10 jaar de beste zorg voor jouw huisdier',
          image:
            'https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&q=80',
          ctaText: 'Ontdek ons verhaal',
          ctaLink: '#ons-verhaal',
        },
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
          alignment: 'left',
        },
      },
      {
        id: 'quote-1',
        type: 'quote',
        content: {
          quote:
            'Onze huisdieren verdienen het allerbeste, en dat is precies wat wij bieden.',
          author: 'Emma de Vries',
          role: 'Oprichter Happy Huisdier',
        },
      },
      {
        id: 'cta-1',
        type: 'callToAction',
        content: {
          title: 'Klaar om te beginnen?',
          description:
            'Ontdek ons uitgebreide assortiment aan premium huisdierproducten.',
          buttonText: 'Bekijk onze producten',
          buttonLink: '/products',
          variant: 'primary',
        },
      },
    ],
  },
  {
    id: '2',
    slug: 'algemene-voorwaarden',
    title: 'Algemene Voorwaarden',
    description: 'Algemene voorwaarden van Teddy\'s Hondenshop',
    seo: {
      title: 'Algemene Voorwaarden | Teddy\'s Hondenshop',
      description: 'Lees onze algemene voorwaarden voor het gebruik van onze webshop en diensten.',
    },
    blocks: [
      {
        id: 'hero-2',
        type: 'hero',
        content: {
          title: 'Algemene Voorwaarden',
          subtitle: 'Laatste update: Maart 2024',
          image: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&q=80',
        },
      },
      {
        id: 'text-2',
        type: 'text',
        content: {
          content: `
            <h2>1. Algemeen</h2>
            <p>Deze algemene voorwaarden zijn van toepassing op alle aanbiedingen en overeenkomsten tussen Teddy's Hondenshop en de klant.</p>
            
            <h2>2. Definities</h2>
            <p><strong>Webshop:</strong> De online winkel van Teddy's Hondenshop, bereikbaar via www.teddyshondenshop.nl</p>
            <p><strong>Klant:</strong> De natuurlijke persoon of rechtspersoon die een overeenkomst aangaat met Teddy's Hondenshop</p>
            
            <h2>3. Prijzen en Betalingen</h2>
            <p>3.1. Alle prijzen zijn in euro's en inclusief BTW.</p>
            <p>3.2. Betaling dient te geschieden voor levering van de producten.</p>
            <p>3.3. Bij betalingen worden de algemeen bekende betaalmethoden aangeboden.</p>
            
            <h2>4. Levering</h2>
            <p>4.1. Wij streven ernaar om bestellingen binnen 1-3 werkdagen te leveren.</p>
            <p>4.2. Verzendkosten worden berekend op basis van het afleveradres en het gewicht van de bestelling.</p>
            <p>4.3. Bij bestellingen boven €50 worden geen verzendkosten in rekening gebracht.</p>
            
            <h2>5. Retourneren</h2>
            <p>5.1. U heeft het recht om binnen 14 dagen na ontvangst van uw bestelling deze te retourneren.</p>
            <p>5.2. Retourzendingen dienen vooraf aangemeld te worden via ons retourformulier.</p>
            <p>5.3. De kosten voor retourzending zijn voor rekening van de klant.</p>
            
            <h2>6. Garantie</h2>
            <p>6.1. Wij geven om de kwaliteit van onze producten en bieden daarom garantie volgens de wettelijke bepalingen.</p>
            <p>6.2. De garantie vervalt bij oneigenlijk gebruik van het product.</p>
            
            <h2>7. Privacy</h2>
            <p>7.1. Wij gaan zorgvuldig om met uw persoonsgegevens volgens onze privacyverklaring.</p>
            <p>7.2. Uw gegevens worden niet aan derden verstrekt zonder uw toestemming.</p>
            
            <h2>8. Contact</h2>
            <p>Voor vragen over deze algemene voorwaarden kunt u contact opnemen via:</p>
            <p>Email: info@teddyshondenshop.nl</p>
            <p>Telefoon: +31 (0)6 411 32 964</p>
          `,
          alignment: 'left',
        },
      },
      {
        id: 'cta-2',
        type: 'callToAction',
        content: {
          title: 'Heeft u nog vragen?',
          description: 'Neem gerust contact met ons op voor meer informatie.',
          buttonText: 'Contact opnemen',
          buttonLink: '/contact',
          variant: 'secondary',
        },
      },
    ],
  },
];

export const getPageBySlug = (slug: string): ContentPage | undefined => {
  return mockPages.find((page) => page.slug === slug);
};