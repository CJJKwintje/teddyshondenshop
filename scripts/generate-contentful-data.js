import fs from 'fs';
import path from 'path';
import { createClient } from 'contentful';
import dotenv from 'dotenv';

dotenv.config();

const contentfulClient = createClient({
  space: process.env.VITE_CONTENTFUL_SPACE_ID,
  accessToken: process.env.VITE_CONTENTFUL_ACCESS_TOKEN,
});

async function generateContentfulData() {
  console.log('\nFetching all Contentful data for static data store...');
  // Navigation
  const navigationEntries = await contentfulClient.getEntries({ content_type: 'navigation', include: 2, order: 'fields.order' });
  // Homepage banners
  const homepageBannersEntries = await contentfulClient.getEntries({ content_type: 'homepageBanner', order: ['sys.createdAt'] });
  // Brands
  const brandsEntries = await contentfulClient.getEntries({ content_type: 'brands' });
  // FAQ Pages
  const faqPagesEntries = await contentfulClient.getEntries({ content_type: 'faqPage', include: 2 });
  // FAQ Categories
  const faqCategoriesEntries = await contentfulClient.getEntries({ content_type: 'faqCategory', include: 2 });
  // FAQ Entries (all entries, not just linked)
  const faqEntriesEntries = await contentfulClient.getEntries({ content_type: 'faqEntry' });
  // Legal Pages
  const legalPagesEntries = await contentfulClient.getEntries({ content_type: 'legalPage' });
  // Category Pages
  const categoryPagesEntries = await contentfulClient.getEntries({ content_type: 'categoryPage' });
  // Footer
  const footerEntries = await contentfulClient.getEntries({ content_type: 'footer', limit: 1 });
  let footer = null;
  if (footerEntries.items.length > 0) {
    const fields = footerEntries.items[0].fields;
    footer = {
      col1Title: fields.col1Title || '',
      col1: fields.col1 || [],
      col1Text: fields.col1text || { nodeType: 'document', data: {}, content: [] },
      col2title: fields.col2title || '',
      col2: fields.col2 || [],
      col3title: fields.col3title || '',
      col3: fields.col3 || []
    };
  }

  // Format data to match ContentfulDataStore
  const data = {
    navigation: navigationEntries.items.map(entry => {
      const fields = entry.fields;
      const mainCategorySlug = fields.mainCategory.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      const formatLinks = (links) => (links || []).map(link => ({ fields: { ...link.fields, slug: link.fields.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') } }));
      return {
        mainCategory: fields.mainCategory,
        slug: mainCategorySlug,
        linkTitle: fields.linkTitle,
        link: formatLinks(fields.link),
        linkTitle2: fields.linkTitle2,
        link2: formatLinks(fields.link2),
        linkTitle3: fields.linkTitle3,
        link3: formatLinks(fields.link3),
        order: fields.order
      };
    }),
    homepageBanners: homepageBannersEntries.items.map(entry => ({
      title: entry.fields.title,
      description: entry.fields.description,
      backgroundImage: entry.fields.backgroundImage,
      buttonText: entry.fields.buttonText,
      buttonLink: entry.fields.buttonLink,
      backgroundColor: entry.fields.backgroundColor,
      orderId: entry.fields.orderId
    })),
    brands: brandsEntries.items.map(entry => ({
      logo: entry.fields.logo
    })),
    faqPages: faqPagesEntries.items.map(entry => ({
      title: entry.fields.title,
      slug: entry.fields.slug,
      categories: (entry.fields.categories || []).map(category => {
        const cat = category.fields;
        return {
          title: cat.title,
          slug: cat.slug,
          questions: (cat.questions || []).map(q => {
            const qf = q.fields;
            return {
              question: qf.question,
              answer: qf.answer,
              anchorId: qf.anchorId
            };
          })
        };
      })
    })),
    faqCategories: faqCategoriesEntries.items.map(entry => ({
      title: entry.fields.title,
      slug: entry.fields.slug,
      questions: (entry.fields.questions || []).map(q => {
        const qf = q.fields;
        return {
          question: qf.question,
          answer: qf.answer,
          anchorId: qf.anchorId
        };
      })
    })),
    faqEntries: faqEntriesEntries.items.map(entry => ({
      question: entry.fields.question,
      answer: entry.fields.answer,
      anchorId: entry.fields.anchorId
    })),
    legalPages: legalPagesEntries.items.map(entry => ({
      title: entry.fields.title,
      link: entry.fields.link,
      content: entry.fields.content
    })),
    categoryPages: categoryPagesEntries.items.map(entry => ({
      title: entry.fields.title,
      slug: entry.fields.slug,
      description: entry.fields.description,
      seoTitle: entry.fields.seoTitle,
      seoDescription: entry.fields.seoDescription,
      bannerImage: entry.fields.bannerImage,
      bannerImageMobile: entry.fields.bannerImageMobile,
      bannerTitle: entry.fields.bannerTitle,
      bannerSubtitle: entry.fields.bannerSubtitle,
      bannerBackgroundColor: entry.fields.bannerBackgroundColor
    })),
    footer,
  };

  // Write to public/contentful-data.json
  const outputPath = path.join(process.cwd(), 'public', 'contentful-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log('✓ Wrote Contentful data to public/contentful-data.json');
}

generateContentfulData().catch((err) => {
  console.error('Error generating Contentful data:', err);
  process.exit(1);
}); 