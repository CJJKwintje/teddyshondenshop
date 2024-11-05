import fs from 'fs';
import path from 'path';

const baseUrl = 'https://teddyshondenshop.nl';

// Define your static routes
const routes = [
  '/',
  '/over-ons',
  '/algemene-voorwaarden',
  '/categorie/hondenvoeding',
  '/categorie/hondenspeelgoed',
  '/categorie/hondensnacks',
  '/categorie/hondentraining'
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${routes.map(route => `
    <url>
      <loc>${baseUrl}${route}</loc>
      <changefreq>${route === '/' ? 'daily' : 'weekly'}</changefreq>
      <priority>${route === '/' ? '1.0' : '0.8'}</priority>
    </url>
  `).join('')}
</urlset>`;

// Write sitemap to public directory
fs.writeFileSync(
  path.join(process.cwd(), 'public', 'sitemap.xml'),
  sitemap.trim()
);

console.log('Sitemap generated successfully!');