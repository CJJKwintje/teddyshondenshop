const contentful = require('contentful');
require('dotenv').config();

// Initialize Contentful client
const client = contentful.createClient({
  space: process.env.VITE_CONTENTFUL_SPACE_ID,
  accessToken: process.env.VITE_CONTENTFUL_ACCESS_TOKEN,
  environment: process.env.VITE_CONTENTFUL_ENVIRONMENT || 'master'
});

async function fetchCategories() {
  try {
    console.log('[Contentful] Fetching categories...');
    
    // Fetch all categories with their subcategories
    const response = await client.getEntries({
      content_type: 'category',
      include: 2, // Include nested entries
      select: 'fields.slug,fields.subcategories'
    });

    console.log(`[Contentful] Found ${response.items.length} categories`);

    const routes = [];
    
    // Process each category
    for (const category of response.items) {
      const categorySlug = category.fields.slug;
      const mainCategoryRoute = `/categorie/${categorySlug}`;
      routes.push(mainCategoryRoute);

      // Process subcategories if they exist
      if (category.fields.subcategories) {
        for (const subcategory of category.fields.subcategories) {
          const subcategorySlug = subcategory.fields.slug;
          const subcategoryRoute = `${mainCategoryRoute}/${subcategorySlug}`;
          routes.push(subcategoryRoute);
        }
      }
    }

    console.log(`[Contentful] Generated ${routes.length} routes`);
    return routes;

  } catch (error) {
    console.error('[Contentful] Error fetching categories:', error);
    throw error;
  }
}

module.exports = {
  fetchCategories
}; 