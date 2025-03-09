export interface ContentBlock {
  id: string;
  type: 'hero' | 'text' | 'image' | 'quote' | 'callToAction';
  content: any;
}

export interface ContentPage {
  id: string;
  slug: string;
  title: string;
  description?: string;
  blocks: ContentBlock[];
  seo: {
    title: string;
    description: string;
    image?: string;
  };
}

export interface HeroBlock {
  title: string;
  subtitle?: string;
  image?: string;
  ctaText?: string;
  ctaLink?: string;
}

export interface TextBlock {
  content: string;
  alignment?: 'left' | 'center' | 'right';
}

export interface ImageBlock {
  url: string;
  alt: string;
  caption?: string;
}

export interface QuoteBlock {
  quote: string;
  author?: string;
  role?: string;
}

export interface CallToActionBlock {
  title: string;
  description?: string;
  buttonText: string;
  buttonLink: string;
  variant?: 'primary' | 'secondary';
}
