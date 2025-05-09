import { Document } from '@contentful/rich-text-types';
import { FAQEntry, FAQCategory, FAQPage } from '../types/content';

// Define the structure of our Contentful data store
export interface ContentfulDataStore {
  // Navigation data
  navigation: {
    mainCategory: string;
    slug: string;
    linkTitle: string;
    link: Array<{
      fields: {
        title: string;
        slug: string;
        description?: string;
        seoTitle?: string;
        seoDescription?: string;
        productType?: string[];
      };
    }>;
    linkTitle2?: string;
    link2?: Array<{
      fields: {
        title: string;
        slug: string;
        description?: string;
        seoTitle?: string;
        seoDescription?: string;
        productType?: string[];
      };
    }>;
    linkTitle3?: string;
    link3?: Array<{
      fields: {
        title: string;
        slug: string;
        description?: string;
        seoTitle?: string;
        seoDescription?: string;
        productType?: string[];
      };
    }>;
    order: number;
  }[];

  // Homepage banners
  homepageBanners: {
    title: string;
    description: string;
    backgroundImage: any;
    buttonText: string;
    buttonLink: string;
    backgroundColor?: string;
    orderId: number;
  }[];

  // Brands
  brands: {
    logo: {
      fields: {
        title: string;
        file: {
          url: string;
        };
      };
    };
  }[];

  // FAQ data
  faqPages: FAQPage[];
  faqCategories: FAQCategory[];
  faqEntries: FAQEntry[];

  // Legal pages
  legalPages: {
    title: string;
    link: string;
    content: Document;
  }[];

  // Category pages
  categoryPages: {
    title: string;
    slug: string;
    description: Document;
    seoTitle: string;
    seoDescription: string;
    bannerImage: any;
    bannerImageMobile: any;
    bannerTitle: string;
    bannerSubtitle: string;
    bannerBackgroundColor: string;
  }[];

  footer: {
    col1Title: string;
    col1: Array<{ fields: { title: string; link: string } }>;
    col1Text: Document;
    col2title: string;
    col2: Array<{ fields: { title: string; link: string } }>;
    col3title: string;
    col3: Array<{ fields: { title: string; link: string } }>;
  } | null;
}

// Initialize an empty data store
export const contentfulDataStore: ContentfulDataStore = {
  navigation: [],
  homepageBanners: [],
  brands: [],
  faqPages: [],
  faqCategories: [],
  faqEntries: [],
  legalPages: [],
  categoryPages: [],
  footer: null,
};

// Helper function to load data from a JSON file
export const loadContentfulData = async (): Promise<ContentfulDataStore> => {
  try {
    // Try to load from the root path first (production)
    let response = await fetch('/contentful-data.json');
    
    // If that fails, try the assets path (development)
    if (!response.ok) {
      response = await fetch('/assets/contentful-data.json');
    }
    
    if (!response.ok) {
      throw new Error('Failed to load Contentful data');
    }
    
    const data = await response.json();
    console.log('Successfully loaded Contentful data');
    return data;
  } catch (error) {
    console.error('Error loading Contentful data:', error);
    return contentfulDataStore;
  }
}; 