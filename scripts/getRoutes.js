const fs = require('fs');
const path = require('path');
const { fetchCategories } = require('./getContentfulRoutes');

// Routes that should be skipped during prerendering
const SKIP_ROUTES = [
  '/cart',
  '/search',
  '/chat',
  '/account',
  '/login',
  '/register',
  '/forgot-password',
  '/product/:handle',
  '/producten',
  '/:slug'
];

async function getStaticRoutes() {
  // Read App.tsx
  const appPath = path.join(__dirname, '..', 'src', 'App.tsx');
  const appContent = fs.readFileSync(appPath, 'utf8');

  // Extract routes from App.tsx
  const routeMatches = appContent.match(/<Route\s+path="([^"]+)"\s+element={<[^>]+>}\s*\/>/g);
  const routes = routeMatches
    .map(match => {
      const pathMatch = match.match(/path="([^"]+)"/);
      return pathMatch ? pathMatch[1] : null;
    })
    .filter(route => route && !SKIP_ROUTES.includes(route));

  return routes;
}

async function getDynamicRoutes() {
  try {
    // Fetch categories from Contentful
    const categoryRoutes = await fetchCategories();
    return categoryRoutes;
  } catch (error) {
    console.error('[Routes] Error fetching dynamic routes:', error);
    return [];
  }
}

async function getAllRoutes() {
  const staticRoutes = await getStaticRoutes();
  const dynamicRoutes = await getDynamicRoutes();
  
  // Combine and deduplicate all routes
  return [...new Set([...staticRoutes, ...dynamicRoutes])];
}

// Export the routes
module.exports = {
  getAllRoutes,
  getStaticRoutes,
  getDynamicRoutes
}; 