import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import pkg from 'contentful';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const { createClient } = pkg;

const SHOPIFY_STORE_URL = 'https://yvdedm-5e.myshopify.com/api/2024-01/graphql';
const SHOPIFY_STOREFRONT_TOKEN = 'f2891c0e910edc30275cac0cc8e32cff';

// Contentful configuration
const contentfulClient = createClient({
  space: process.env.VITE_CONTENTFUL_SPACE_ID,
  accessToken: process.env.VITE_CONTENTFUL_ACCESS_TOKEN,
});

const GET_PRODUCTS_WITH_PAGINATION = `
  query GetProducts($cursor: String) {
    products(first: 250, after: $cursor) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          handle
          title
          updatedAt
        }
      }
    }
  }
`;

const baseUrl = 'https://teddyshondenshop.nl';

// Define your static routes with their priorities and update frequencies
const staticRoutes = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
];

async function fetchAllProducts() {
  let allProducts = [];
  let hasNextPage = true;
  let cursor = null;
  let batchCount = 0;

  console.log('Fetching products...');

  while (hasNextPage) {
    try {
      const response = await fetch(SHOPIFY_STORE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN,
        },
        body: JSON.stringify({
          query: GET_PRODUCTS_WITH_PAGINATION,
          variables: { cursor },
        }),
      });

      const json = await response.json();
      
      if (!json.data) {
        console.error('Error in batch response:', json);
        throw new Error('Invalid response from Shopify');
      }

      const { products } = json.data;
      allProducts = [...allProducts, ...products.edges];
      
      hasNextPage = products.pageInfo.hasNextPage;
      cursor = products.pageInfo.endCursor;
      
      batchCount++;
      console.log(`Fetched batch ${batchCount}: ${products.edges.length} products (Total: ${allProducts.length})`);

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error fetching batch ${batchCount + 1}:`, error);
      throw error;
    }
  }

  console.log(`Finished fetching all products. Total: ${allProducts.length}`);
  return allProducts;
}

async function fetchNavigation() {
  try {
    const entries = await contentfulClient.getEntries({
      content_type: 'navigation',
      include: 2,
      order: 'fields.order'
    });

    return entries.items.map(entry => {
      const fields = entry.fields;
      const mainCategorySlug = fields.mainCategory.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');

      // Get subcategories from the link array, using the title as the slug
      const subcategories = fields.link?.map(link => ({
        title: link.fields.title,
        slug: link.fields.title.toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
      })) || [];

      return {
        mainCategory: fields.mainCategory,
        slug: mainCategorySlug,
        links: subcategories
      };
    });
  } catch (error) {
    console.error('Error fetching navigation from Contentful:', error);
    throw error;
  }
}

async function fetchLegalPages() {
  try {
    const entries = await contentfulClient.getEntries({
      content_type: 'legalPage',
      include: 2
    });

    return entries.items.map(entry => {
      const fields = entry.fields;
      const slug = fields.slug || fields.title.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');

      return {
        path: `/${slug}`,
        priority: '0.5',
        changefreq: 'monthly',
        lastmod: entry.sys.updatedAt
      };
    });
  } catch (error) {
    console.error('Error fetching legal pages from Contentful:', error);
    throw error;
  }
}

async function generateSitemap() {
  try {
    console.log('Starting sitemap generation...');

    // Fetch all products from Shopify (with pagination)
    const productEdges = await fetchAllProducts();
    const products = productEdges.map(({ node }) => ({
      path: `/product/${node.handle}`,
      lastmod: node.updatedAt,
      priority: '0.7',
      changefreq: 'weekly'
    }));

    // Fetch navigation from Contentful and generate category routes
    const navigationCategories = await fetchNavigation();
    const categoryRoutes = navigationCategories.flatMap(category => {
      const routes = [];
      
      // Main category
      routes.push({
        path: `/categorie/${category.slug}`,
        priority: '0.9',
        changefreq: 'weekly'
      });

      // Subcategories
      category.links.forEach(link => {
        routes.push({
          path: `/categorie/${category.slug}/${link.slug}`,
          priority: '0.8',
          changefreq: 'weekly'
        });
      });

      return routes;
    });

    // Fetch legal pages from Contentful
    const legalPages = await fetchLegalPages();

    // Combine all routes
    const allRoutes = [
      ...staticRoutes,
      ...products,
      ...categoryRoutes,
      ...legalPages
    ];

    // Generate sitemap XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allRoutes.map(route => `
  <url>
    <loc>${baseUrl}${route.path}</loc>
    ${route.lastmod ? `<lastmod>${route.lastmod.split('T')[0]}</lastmod>` : ''}
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('')}
</urlset>`;

    // Write sitemap to public directory
    fs.writeFileSync(
      path.join(process.cwd(), 'public', 'sitemap.xml'),
      sitemap.trim()
    );

    console.log('Sitemap generated successfully!');
    console.log(`Total URLs: ${allRoutes.length}`);
    console.log(`- Static pages: ${staticRoutes.length}`);
    console.log(`- Products: ${products.length}`);
    console.log(`- Categories and subcategories: ${categoryRoutes.length}`);
    console.log(`- Legal pages: ${legalPages.length}`);

  } catch (error) {
    console.error('Error generating sitemap:', error);
    process.exit(1);
  }
}

generateSitemap();