// NODE/SSR ONLY: Do not import this file in browser code.
import { createClient } from 'contentful';
import { Document } from '@contentful/rich-text-types';
import { FAQPage, FAQCategory, FAQEntry } from '../types/content';
import { loadContentfulData } from '../data/contentfulData';

// Helper to get env vars in both browser and Node.js
function getEnvVar(name: string) {
  if (typeof import.meta !== 'undefined' && import.meta.env && name in import.meta.env) {
    return import.meta.env[name];
  }
  if (typeof process !== 'undefined' && process.env && name in process.env) {
    return process.env[name];
  }
  return undefined;
}

const SPACE_ID = getEnvVar('VITE_CONTENTFUL_SPACE_ID');
const ACCESS_TOKEN = getEnvVar('VITE_CONTENTFUL_ACCESS_TOKEN');

// Add debugging
console.log('Contentful Config:', {
  spaceId: SPACE_ID ? 'Present' : 'Missing',
  accessToken: ACCESS_TOKEN ? 'Present' : 'Missing'
});

export const contentfulClient = SPACE_ID && ACCESS_TOKEN
  ? createClient({
      space: SPACE_ID,
      accessToken: ACCESS_TOKEN,
    })
  : null;

// Add debugging
if (!contentfulClient) {
  console.error('Contentful client failed to initialize - check your environment variables');
}

export interface ContentfulPage {
  title: string;
  content: any;
  slug: string;
}

export interface LegalPage {
  title: string;
  link: string;
  content: any;
}

export interface HomepageBanner {
  title: string;
  description?: string;
  buttonText: string;
  buttonLink: string;
  backgroundImage: {
    fields: {
      file: {
        url: string;
      };
    };
  };
  backgroundColor?: string;
  orderId: number;
}

export interface Brand {
  logo: {
    fields: {
      title: string;
      file: {
        url: string;
      };
    };
  };
}

export interface NavigationLink {
  fields: {
    title: string;
    slug: string;
    description?: string;
    seoTitle?: string;
    seoDescription?: string;
    productType?: string[];
  };
}

export interface NavigationCategory {
  mainCategory: string;
  slug: string;
  linkTitle: string;
  link: NavigationLink[];
  linkTitle2?: string;
  link2?: NavigationLink[];
  linkTitle3?: string;
  link3?: NavigationLink[];
  order: number;
}

export interface CategoryPage {
  title: string;
  slug: string;
  description?: Document;
  seoTitle?: string;
  seoDescription?: string;
  bannerImage?: {
    fields: {
      file: {
        url: string;
      };
    };
  };
  bannerImageMobile?: {
    fields: {
      file: {
        url: string;
      };
    };
  };
  bannerTitle?: string;
  bannerSubtitle?: string;
  bannerBackgroundColor?: string;
}

const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
};

export const getContentfulPage = async (entryId: string): Promise<ContentfulPage | null> => {
  if (!contentfulClient) {
    console.warn('Contentful client not initialized - missing environment variables');
    return null;
  }

  try {
    const entry = await contentfulClient.getEntry(entryId);
    const title = entry.fields.title as string;
    return {
      title,
      content: entry.fields.content,
      slug: entry.fields.slug as string || generateSlug(title),
    };
  } catch (error) {
    console.error('Error fetching Contentful page:', error);
    return null;
  }
};

export const getCategoryPageBySlug = async (slug: string): Promise<CategoryPage | null> => {
  const data = await loadContentfulData();
  const page = data.categoryPages.find((cat) => cat.slug === slug);
  return page || null;
};

export const getAllLegalPages = async (): Promise<LegalPage[]> => {
  if (!contentfulClient) {
    console.warn('Contentful client not initialized - missing environment variables');
    return [];
  }

  try {
    const entries = await contentfulClient.getEntries({
      content_type: 'legalPage',
    });

    return entries.items.map(entry => ({
      title: entry.fields.title as string,
      link: entry.fields.link as string,
      content: entry.fields.content,
    }));
  } catch (error) {
    console.error('Error fetching legal pages:', error);
    return [];
  }
};

export const getLegalPageByLink = async (link: string): Promise<LegalPage | null> => {
  if (!contentfulClient) {
    console.warn('Contentful client not initialized - missing environment variables');
    return null;
  }

  try {
    const entries = await contentfulClient.getEntries({
      content_type: 'legalPage',
      'fields.link': link,
      limit: 1,
    });

    if (entries.items.length === 0) {
      return null;
    }

    const entry = entries.items[0];
    return {
      title: entry.fields.title as string,
      link: entry.fields.link as string,
      content: entry.fields.content,
    };
  } catch (error) {
    console.error('Error fetching legal page:', error);
    return null;
  }
};

export const getHomepageBanners = async (): Promise<HomepageBanner[]> => {
  if (!contentfulClient) {
    console.warn('Contentful client not initialized - missing environment variables');
    return [];
  }

  try {
    const entries = await contentfulClient.getEntries({
      content_type: 'homepageBanner',
      order: ['sys.createdAt'],
    });

    return entries.items.map(entry => ({
      title: entry.fields.title as string,
      description: entry.fields.description as string,
      backgroundImage: entry.fields.backgroundImage as any,
      buttonText: entry.fields.buttonText as string,
      buttonLink: entry.fields.buttonLink as string,
      backgroundColor: entry.fields.backgroundColor as string || undefined,
      orderId: entry.fields.orderId as number,
    }));
  } catch (error) {
    console.error('Error fetching homepage banners:', error);
    return [];
  }
};

export const getBrands = async (): Promise<Brand[]> => {
  if (!contentfulClient) {
    console.warn('Contentful client not initialized - missing environment variables');
    return [];
  }

  try {
    const entries = await contentfulClient.getEntries({
      content_type: 'brands',
    });

    return entries.items.map(entry => ({
      logo: entry.fields.logo as any,
    }));
  } catch (error) {
    console.error('Error fetching brands:', error);
    return [];
  }
};

export const getNavigation = async (): Promise<NavigationCategory[]> => {
  const data = await loadContentfulData();
  // The navigation data is already in the correct format
  return data.navigation;
};

export const getCategoryPage = async (categorySlug: string, subCategorySlug: string): Promise<NavigationLink | null> => {
  if (!contentfulClient) {
    console.warn('Contentful client not initialized - missing environment variables');
    return null;
  }

  try {
    const navigation = await getNavigation();
    const category = navigation.find(cat => cat.slug === categorySlug);
    
    if (!category) return null;

    // Search in all link groups
    const allLinks = [
      ...(category.link || []),
      ...(category.link2 || []),
      ...(category.link3 || [])
    ];

    return allLinks.find(link => link.fields.slug === subCategorySlug) || null;
  } catch (error) {
    console.error('Error fetching category page:', error);
    return null;
  }
};

export const getFAQEntry = async (id: string): Promise<FAQEntry | null> => {
  if (!contentfulClient) {
    console.warn('Contentful client not initialized - missing environment variables');
    return null;
  }

  try {
    const entry = await contentfulClient.getEntry(id);
    return {
      question: entry.fields.question as string,
      answer: entry.fields.answer as Document,
      anchorId: entry.fields.anchorId as string,
    };
  } catch (error) {
    console.error('Error fetching FAQ entry:', error);
    return null;
  }
};

export const getFAQCategory = async (slug: string): Promise<FAQCategory | null> => {
  if (!contentfulClient) {
    console.warn('Contentful client not initialized - missing environment variables');
    return null;
  }

  try {
    const entries = await contentfulClient.getEntries({
      content_type: 'faqCategory',
      'fields.slug': slug,
      include: 2, // Include 2 levels of linked entries
      limit: 1,
    });

    if (entries.items.length === 0) {
      return null;
    }

    const entry = entries.items[0];
    const questions = await Promise.all(
      (entry.fields.questions as any[]).map(async (question) => {
        const questionEntry = await contentfulClient.getEntry(question.sys.id);
        return {
          question: questionEntry.fields.question as string,
          answer: questionEntry.fields.answer as Document,
          anchorId: questionEntry.fields.anchorId as string,
        };
      })
    );

    return {
      title: entry.fields.title as string,
      slug: entry.fields.slug as string,
      questions,
    };
  } catch (error) {
    console.error('Error fetching FAQ category:', error);
    return null;
  }
};

export const getFAQPage = async (slug: string): Promise<FAQPage | null> => {
  if (!contentfulClient) {
    console.warn('Contentful client not initialized - missing environment variables');
    return null;
  }

  try {
    const entries = await contentfulClient.getEntries({
      content_type: 'faqPage',
      'fields.slug': slug,
      include: 2, // Include 2 levels of linked entries
      limit: 1,
    });

    if (entries.items.length === 0) {
      return null;
    }

    const entry = entries.items[0];
    const categories = await Promise.all(
      (entry.fields.categories as any[]).map(async (category) => {
        const categoryEntry = await contentfulClient.getEntry(category.sys.id);
        const questions = await Promise.all(
          (categoryEntry.fields.questions as any[]).map(async (question) => {
            const questionEntry = await contentfulClient.getEntry(question.sys.id);
            return {
              question: questionEntry.fields.question as string,
              answer: questionEntry.fields.answer as Document,
              anchorId: questionEntry.fields.anchorId as string,
            };
          })
        );

        return {
          title: categoryEntry.fields.title as string,
          slug: categoryEntry.fields.slug as string,
          questions,
        };
      })
    );

    return {
      title: entry.fields.title as string,
      slug: entry.fields.slug as string,
      categories,
    };
  } catch (error) {
    console.error('Error fetching FAQ page:', error);
    return null;
  }
};

export const getCategories = async (): Promise<CategoryPage[]> => {
  if (!contentfulClient) {
    console.warn('Contentful client not initialized - missing environment variables');
    return [];
  }

  try {
    const entries = await contentfulClient.getEntries({
      content_type: 'categoryPage',
    });

    return entries.items.map(entry => ({
      title: entry.fields.title as string,
      slug: entry.fields.slug as string,
      description: entry.fields.description as Document,
      seoTitle: entry.fields.seoTitle as string,
      seoDescription: entry.fields.seoDescription as string,
      bannerImage: entry.fields.bannerImage as any,
      bannerImageMobile: entry.fields.bannerImageMobile as any,
      bannerTitle: entry.fields.bannerTitle as string,
      bannerSubtitle: entry.fields.bannerSubtitle as string,
      bannerBackgroundColor: entry.fields.bannerBackgroundColor as string,
    }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};